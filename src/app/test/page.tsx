"use client";

import { useHotkeys } from "react-hotkeys-hook";
import { useRef, useState, FormEvent } from "react";

interface Reference {
  title: string;
  url: string;
}

interface Differential {
  disease: string;
  confidence: number;
  rationale: string;
}

interface PrimaryTreatment {
  disease: string;
  first_line_medication: string;
  typical_adult_dosage: string;
  common_precautions: string[];
  monitoring_or_followup: string;
}

interface ResultData {
  patient_summary?: string;
  differential?: Differential[];
  primary_treatment?: PrimaryTreatment;
  recommended_tests?: string[];
  when_to_seek_emergency?: string;
  notes?: string;
  references?: Reference[];
  critical_warning?: string;
}

// 👇 Reusable Whisper Speech-to-Text Recorder
function SpeechToTextRecorder({ onTranscription }: { onTranscription: (text: string) => void }) {
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Change this to your backend/ngrok URL
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.start();
      setRecording(true);
    } catch (err) {
      console.error("Microphone access denied:", err);
      alert("Please allow microphone access.");
    }
  };

  const stopRecording = async () => {
    setRecording(false);
    if (!mediaRecorderRef.current) return;

    mediaRecorderRef.current.stop();
    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      const formData = new FormData();
      formData.append("file", audioBlob, "recording.webm");

      setLoading(true);
      try {
        const res = await fetch(`${BACKEND_URL}/transcribe/`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          throw new Error(`Error: ${res.status}`);
        }

        const data = await res.json();
        if (data.text) {
          onTranscription(data.text); // send transcript back to parent
        }
      } catch (err) {
        console.error("Upload failed:", err);
        onTranscription("Error transcribing audio.");
      } finally {
        setLoading(false);
      }
    };
  };

  return (
    <div className="mt-4">
      {!recording ? (
        <button
          onClick={startRecording}
          className="px-3 py-1 bg-green-600 text-white rounded"
          disabled={loading}
        >
          🎤 Start Recording
        </button>
      ) : (
        <button
          onClick={stopRecording}
          className="px-3 py-1 bg-red-600 text-white rounded"
        >
          ⏹ Stop Recording
        </button>
      )}
      {loading && <p className="text-sm mt-2">⏳ Transcribing...</p>}
    </div>
  );
}

// 👇 Main Diagnosis Page
export default function Home() {
  const [symptoms, setSymptoms] = useState<string>("");
  const [result, setResult] = useState<ResultData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const buttonRef = useRef<HTMLButtonElement>(null);

  useHotkeys(
    "enter",
    () => {
      if (buttonRef.current) {
        buttonRef.current.click();
      }
    },
    { enableOnFormTags: true }
  );

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/diagnose", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ symptoms }),
      });

      if (!response.ok) {
        throw new Error("An error occurred while fetching the diagnosis.");
      }

      const data: ResultData = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-100 font-mono">
      <main className="max-w-4xl mx-auto px-8 py-16 text-center">
        <h1 className="text-4xl font-bold mb-6">AI Diagnosis Assistant</h1>
        <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
          <textarea
            className="w-full p-3 border border-gray-300 rounded-lg"
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="Describe your symptoms..."
            rows={5}
            required
          />

          {/* 🎤 Integrated Whisper Recorder */}
          <SpeechToTextRecorder
            onTranscription={(text) =>
              setSymptoms((prev) => (prev ? prev + " " + text : text))
            }
          />

          <button
            ref={buttonRef}
            type="submit"
            className="bg-black text-white px-4 py-2 rounded-full mt-4"
            disabled={isLoading}
          >
            {isLoading ? "Analyzing..." : "Get Diagnosis"}
          </button>
        </form>

        {error && <p className="text-red-600 mt-4">{error}</p>}

        {result && (
          <div className="mt-8 p-6 bg-gray-50 border border-gray-300 rounded-lg text-left">
            {/* Display results like in your original page */}
            {result.patient_summary && (
              <p>
                <strong>Summary:</strong> {result.patient_summary}
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
