import os
import subprocess
import tempfile
import logging
from typing import Optional

from fastapi  import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from faster_whisper import WhisperModel

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("whisper-stt")

app = FastAPI(title="Whisper STT")

# Environment-configurable settings
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")
MODEL_SIZE = os.getenv("MODEL_SIZE", "small")      # tiny, base, small, medium, large-v2
DEVICE = os.getenv("DEVICE", "cpu")                # cpu or cuda
COMPUTE_TYPE = os.getenv("COMPUTE_TYPE", "int8")   # int8 / float16 etc - depends on device

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

log.info(f"Loading Whisper model: size={MODEL_SIZE} device={DEVICE} compute_type={COMPUTE_TYPE}")
# Load model once
model = WhisperModel(MODEL_SIZE, device=DEVICE, compute_type=COMPUTE_TYPE)
log.info("Model loaded successfully")

@app.get("/")
def root():
    return {"ok": True, "model": MODEL_SIZE, "device": DEVICE}



@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...), language: Optional[str] = None):
    """
    Uploads an audio file (webm/mp3/wav/m4a...) and returns the transcription.
    """
    # Save uploaded file to temp
    suffix = "." + (file.filename.split(".")[-1] if file.filename and "." in file.filename else "webm")
    tmp_in = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    try:
        content = await file.read()
        tmp_in.write(content)
        tmp_in.flush()
        tmp_in.close()
        in_path = tmp_in.name

        # Convert to 16k mono wav with ffmpeg for consistent input
        out_path = in_path + ".wav"
        cmd = [
            "ffmpeg", "-y", "-i", in_path,
            "-ac", "1",        # mono
            "-ar", "16000",    # 16 kHz
            out_path
        ]
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)

        # Transcribe (beam_size small for speed; adjust for accuracy)
        segments, info = model.transcribe(out_path, language=language, beam_size=1)
        text = " ".join(seg.text.strip() for seg in segments).strip()

        # Return helpful metadata
        return {
            "text": text,
            "language": getattr(info, "language", None),
            "language_probability": getattr(info, "language_probability", None),
            "duration": getattr(info, "duration", None),
        }
    except subprocess.CalledProcessError as e:
        log.exception("ffmpeg conversion failed")
        raise HTTPException(status_code=500, detail="audio conversion failed")
    except Exception as e:
        log.exception("transcription failed")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # cleanup files
        try:
            if 'in_path' in locals() and os.path.exists(in_path):
                os.remove(in_path)
            if 'out_path' in locals() and os.path.exists(out_path):
                os.remove(out_path)
        except OSError:
            pass
