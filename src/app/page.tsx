'use client';

import { useState, FormEvent } from 'react';
import styles from './page.module.css';


interface ResultData {
  analysis_summary: string;
  probable_conditions: {
    disease: string;
    confidence_score: string;
  }[];
  recommendation: {
    disease: string;
    medication: string;
    dosage: string;
    precautions: string;
  };
  disclaimer: string;
  critical_warning?: string; 
}

export default function Home() {
  const [symptoms, setSymptoms] = useState<string>('');
  const [result, setResult] = useState<ResultData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

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
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.title}>AI Diagnostic Assistant 🩺</h1>
        <p className={styles.description}>
          Enter your symptoms below. This tool is for informational purposes only.
          <strong>Always consult a healthcare professional for medical advice.</strong>
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <textarea
            className={styles.textarea}
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="e.g., high fever, body aches, runny nose..."
            rows={5}
            required
          />
          <button type="submit" className={styles.button} disabled={isLoading}>
            {isLoading ? 'Analyzing...' : 'Get Diagnosis'}
          </button>
        </form>

        {isLoading && <div className={styles.loader}></div>}
        {error && <p className={styles.error}>{error}</p>}
        {result && (
          <div className={styles.resultCard}>
            {result.critical_warning ? (
              <div className={styles.criticalWarning}>
                <h2>🚨 Critical Warning!</h2>
                <p>{result.critical_warning}</p>
                <p><strong>Please seek immediate medical attention.</strong></p>
              </div>
            ) : (
              <>
                <h2 className={styles.resultTitle}>Analysis Result</h2>
                <div className={styles.section}>
                  <h3>Analysis Summary</h3>
                  <p>{result.analysis_summary}</p>
                </div>
                <div className={styles.section}>
                  <h3>Probable Conditions</h3>
                  <ul>
                    {result.probable_conditions?.map((condition, index) => (
                      <li key={index}>
                        <strong>{condition.disease}</strong> - Confidence: {condition.confidence_score}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={styles.section}>
                  <h3>Recommendation for {result.recommendation?.disease}</h3>
                  <p><strong>Medication:</strong> {result.recommendation?.medication}</p>
                  <p><strong>Dosage:</strong> {result.recommendation?.dosage}</p>
                  <p><strong>Precautions:</strong> {result.recommendation?.precautions}</p>
                </div>
                <p className={styles.disclaimer}>
                  <strong>Disclaimer:</strong> {result.disclaimer}
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}