'use client';
import { useHotkeys } from "react-hotkeys-hook";
import { useRef, useState, FormEvent } from 'react';
import SpeechToTextInput from "./components/SpeechToTextInput";

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

export default function Home() {
  const [symptoms, setSymptoms] = useState<string>('');
  const [result, setResult] = useState<ResultData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const buttonRef = useRef<HTMLButtonElement>(null);

  useHotkeys("enter", () => {
    if (buttonRef.current) {
      buttonRef.current.click();
    }
  }, { enableOnFormTags: true });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/diagnose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symptoms }),
      });

      if (!response.ok) {
        throw new Error('An error occurred while fetching the diagnosis.');
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
    <main className="flex flex-col items-center min-h-screen p-8 lg:p-20">
      <div className="w-full p-8 rounded-xl shadow-2xl border border-gray-200">
        <h1 className="text-4xl font-semibold text-blue-800 text-center mb-2">
          AI Diagnostic Assistant 
        </h1>
        <p className="text-center mb-8 text-lg text-gray-600">
          Enter your symptoms below. This tool is for informational purposes only.
          <strong className="block mt-2">
            Always consult a healthcare professional for medical advice.
          </strong>
        </p>
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column: Input */}
          <div className="flex-1/4">
            <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
              <textarea
                className="w-full p-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="e.g., high fever, body aches, runny nose..."
                rows={5}
                required
              />
              <SpeechToTextInput 
                onTranscription={(text) => setSymptoms(prev => prev ? prev + ' ' + text : text)}
              />
              <button
                ref={buttonRef}
                type="submit"
                className="px-5 py-3 bg-blue-600 text-white rounded-lg font-medium cursor-pointer transition-colors duration-200 enabled:hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? 'Analyzing...' : 'Get Diagnosis'}
              </button>
            </form>
            {isLoading && (
              <div className="mx-auto my-8 border-4 border-gray-200 border-t-blue-600 rounded-full w-10 h-10 animate-spin"></div>
            )}
            {error && <p className="text-red-600 text-center mt-4">{error}</p>}
          </div>

          {/* Right Column: Response */}
          <div className="flex-3/4">
            {result && (
              <div className="p-6 bg-gray-50 border border-gray-300 rounded-lg">
                {result.critical_warning ? (
                  <div className="bg-red-50 border border-red-500 text-red-600 p-4 rounded-lg">
                    <h2 className="text-xl font-bold">🚨 Critical Warning!</h2>
                    <p>{result.critical_warning}</p>
                    <p className="mt-2">
                      <strong>Please seek immediate medical attention.</strong>
                    </p>
                  </div>
                ) : (
                  <>
                    <h2 className="text-2xl text-blue-600 border-b-2 border-blue-600 pb-2 mb-6">
                      Analysis Result
                    </h2>
                    {result.patient_summary && (
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold mb-1 text-gray-700">Patient Summary</h3>
                        <p>{result.patient_summary}</p>
                      </div>
                    )}
                    {result.differential && (
                      <div className="mb-6">
                        <h3 className="text-xl font-semibold mb-2 text-gray-700">Differential Diagnosis</h3>
                        <ul className="list-none pl-0">
                          {result.differential.map((item, idx) => (
                            <li key={idx} className="bg-gray-200 p-2 rounded-md mb-2">
                              <strong>{item.disease}</strong> - Confidence: {item.confidence}%<br />
                              <span className="text-sm text-gray-700">{item.rationale}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {result.primary_treatment && (
                      <div className="mb-6">
                        <h3 className="text-xl font-semibold mb-2 text-gray-700">
                          Primary Treatment for {result.primary_treatment.disease}
                        </h3>
                        <p><strong>Medication:</strong> {result.primary_treatment.first_line_medication}</p>
                        <p><strong>Dosage:</strong> {result.primary_treatment.typical_adult_dosage}</p>
                        <p><strong>Precautions:</strong> {result.primary_treatment.common_precautions?.join(', ')}</p>
                        <p><strong>Monitoring/Follow-up:</strong> {result.primary_treatment.monitoring_or_followup}</p>
                      </div>
                    )}
                    {result.recommended_tests && result.recommended_tests.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-xl font-semibold mb-2 text-gray-700">Recommended Tests</h3>
                        <ul className="list-disc pl-6">
                          {result.recommended_tests.map((test, idx) => (
                            <li key={idx}>{test}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {result.when_to_seek_emergency && (
                      <div className="mb-6">
                        <h3 className="text-xl font-semibold mb-2 text-gray-700">When to Seek Emergency Care</h3>
                        <p>{result.when_to_seek_emergency}</p>
                      </div>
                    )}
                    {result.notes && (
                      <p className="text-sm text-gray-500 border-t border-dashed border-gray-400 pt-4 mt-4">
                        <strong>Disclaimer:</strong> {result.notes}
                      </p>
                    )}
                    {result.references && result.references.length > 0 && (
                      <div className="mt-4">
                        <h3 className="text-lg font-semibold mb-1 text-gray-700">References</h3>
                        <ul className="list-disc pl-6">
                          {result.references.map((ref, idx) => (
                            <li key={idx}>
                              <a href={ref.url} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">
                                {ref.title}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
