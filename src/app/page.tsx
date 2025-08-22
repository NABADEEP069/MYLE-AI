'use client';
import { useHotkeys } from "react-hotkeys-hook";
import { useRef, useState, FormEvent } from 'react';
import SpeechToTextInput from "./components/SpeechToTextInput";
import { PrimaryButton } from "./components/Button";
import Header from "./components/Header";
import Soild from "./components/Soild";
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
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen  [background:radial-gradient(125%_100%_at_50%_0%,_#FFF_6.32%,_#E0F0FF_29.28%,_#E7EFFD_68.68%,_#FFF_100%)] font-mono">
      <Header/>
      <main className="max-w-4xl mx-auto px-8 py-16 text-center">
      <Soild/>

        {/* AI Diagnostic Section */}
        <div className=" rounded-lg p-8 shadow-2xl shadow-amber-300/60 max-w-4xl mx-auto mb-16 text-left">
          <div className="w-full flex flex-col lg:flex-row gap-8">
            {/* Left Column: Input */}
            <div className="flex-1 lg:w-1/4">
              <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-green-500 resize-y"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="e.g., high fever, body aches, runny nose..."
                  rows={5}
                  required
                />
                <SpeechToTextInput
                  onTranscription={(text) => setSymptoms(prev => prev ? prev + ' ' + text : text)}
                />

                <PrimaryButton disabled={isLoading}>
                  {isLoading ? 'Analyzing...' : 'Get Diagnosis'}
                </PrimaryButton>
              </form>
              {isLoading && (
                <div className="mx-auto my-8 border-4 border-gray-200 border-t-green-600 rounded-full w-10 h-10 animate-spin"></div>
              )}
              {error && <p className="text-red-600 text-center mt-4">{error}</p>}
            </div>

            {/* Right Column: Response */}
            <div className="flex-3 lg:w-3/4">
              {result && (
                <div className="p-6 bg-gray-50 border border-gray-300 rounded-lg">
                  {result.critical_warning ? (
                    <div className="bg-red-50 border border-red-500 text-red-600 p-4 rounded-lg">
                      <h2 className="text-xl font-bold"> Critical Warning!</h2>
                      <p>{result.critical_warning}</p>
                      <p className="mt-2">
                        <strong>Please seek immediate medical attention.</strong>
                      </p>
                    </div>
                  ) : (
                    <>
                      <h2 className="text-2xl text-green-600 border-b-2 border-green-600 pb-2 mb-6">
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
                                <a href={ref.url} target="_blank" rel="noopener noreferrer" className="text-green-700 underline">
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
    </div>
  );
}
