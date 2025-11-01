
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Spinner } from './Spinner';

const ComplexTaskSolver: React.FC = () => {
  const [prompt, setPrompt] = useState('Write Python code for a web application that visualizes real-time stock market data using Flask and Plotly.');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSolve = async () => {
    if (!prompt.trim()) {
      setError('Please enter a complex prompt.');
      return;
    }
    setLoading(true);
    setError(null);
    setResponse('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const result = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: prompt,
        config: {
          thinkingConfig: { thinkingBudget: 32768 }
        }
      });
      setResponse(result.text);
    } catch (err) {
      console.error('Complex task error:', err);
      setError('Failed to solve the task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="p-6 bg-gray-800/50 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-2">Complex Task Solver</h2>
        <p className="text-gray-400 mb-4">Uses `gemini-2.5-pro` with max thinking budget for advanced reasoning.</p>
        <div className="space-y-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter a complex task, coding problem, or reasoning challenge..."
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
            disabled={loading}
          />
          <button
            onClick={handleSolve}
            disabled={loading || !prompt.trim()}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? <Spinner /> : 'Solve'}
          </button>
        </div>
      </div>

      {error && <div className="mt-4 text-red-400 p-3 bg-red-900/50 rounded-lg">{error}</div>}

      <div className="mt-8">
        {loading ? (
          <div className="p-4 bg-gray-800/50 rounded-lg min-h-[10rem] flex justify-center items-center">
            <Spinner />
          </div>
        ) : response && (
          <div className="p-4 bg-gray-800/50 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Solution</h3>
            <pre className="whitespace-pre-wrap font-sans text-gray-300">{response}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComplexTaskSolver;
