'use client';
import { useRef, useState } from 'react';

type Props = {
  onTranscription: (text: string) => void; // parent will append/insert this
};

export default function SpeechToTextInput({ onTranscription }: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Pick a MIME type that the browser supports
  function pickMime(): string {
    const candidates = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',         // Safari fallback (no MediaRecorder in some older Safari)
      'audio/ogg;codecs=opus'
    ];
    return candidates.find((m) => MediaRecorder.isTypeSupported(m)) || '';
  }

  async function startRecording() {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mimeType = pickMime();
      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      // Auto-upload once recording stops
      mr.onstop = async () => {
        try {
          const type = mr.mimeType || 'audio/webm';
          const blob = new Blob(chunksRef.current, { type });
          // Name by extension so Whisper can infer format
          const ext = type.includes('mp4') ? 'm4a' : type.includes('ogg') ? 'ogg' : 'webm';
          const file = new File([blob], `recording.${ext}`, { type });

          setIsTranscribing(true);
          const formData = new FormData();
          formData.append('audio', file); // <-- new


          const res = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
          });

          if (!res.ok) {
            const r = await res.json().catch(() => ({}));
            throw new Error(r.error || 'Transcription failed');
          }

          const { text } = (await res.json()) as { text: string };
          if (text) onTranscription(text);
        } catch (err: any) {
          console.error(err);
          setError(err.message || 'Transcription failed');
        } finally {
          setIsTranscribing(false);
          // stop all tracks to release mic
          stream.getTracks().forEach((t) => t.stop());
        }
      };

      mr.start();
      setIsRecording(true);
    } catch (err) {
      console.error(err);
      setError('Microphone access denied or not available.');
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={isRecording ? stopRecording : startRecording}
        className={`px-4 py-2 rounded text-white ${
          isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
        }`}
      >
        {isRecording ? 'Stop & Transcribe' : 'Record Symptoms'}
      </button>

      {isTranscribing && <span className="text-sm text-gray-600">Transcribing…</span>}
      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  );
}
