
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Spinner } from './Spinner';

const QuickResponder: React.FC = () => {
  const [prompt, setPrompt] = useState('What are three fun facts about the ocean?');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequest = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt.');
      return;
    }
    setLoading(true);
    setError(null);
    setResponse('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const result = await ai.models.generateContent({
        model: "gemini-flash-lite-latest",
        contents: prompt,
      });
      setResponse(result.text);
    } catch (err) {
      console.error('Quick response error:', err);
      setError('Failed to get a response. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="p-6 bg-gray-800/50 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-2">Quick Responder</h2>
        <p className="text-gray-400 mb-4">Uses `gemini-2.5-flash-lite` for low-latency answers.</p>
        <div className="space-y-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter a simple question or request..."
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
            disabled={loading}
          />
          <button
            onClick={handleRequest}
            disabled={loading || !prompt.trim()}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? <Spinner /> : 'Get Fast Answer'}
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
            <h3 className="text-lg font-semibold mb-2">Response</h3>
            <pre className="whitespace-pre-wrap font-sans text-gray-300">{response}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickResponder;
