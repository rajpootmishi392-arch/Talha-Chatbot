
import React, { useState, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Spinner } from './Spinner';

const ImageAnalyzer: React.FC = () => {
  const [prompt, setPrompt] = useState('What do you see in this image?');
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(file);
    });
    return {
      inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setAnalysis('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!fileInputRef.current?.files?.[0]) {
      setError('Please upload an image to analyze.');
      return;
    }
    setLoading(true);
    setError(null);
    setAnalysis('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const imagePart = await fileToGenerativePart(fileInputRef.current.files[0]);
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, { text: prompt }] },
      });
      
      setAnalysis(response.text);
    } catch (err) {
      console.error('Image analysis error:', err);
      setError('Failed to analyze image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="p-6 bg-gray-800/50 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Image Analysis</h2>
        <div className="space-y-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            ref={fileInputRef}
            className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            disabled={loading}
          />
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., What is the breed of this dog?"
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
            disabled={loading}
          />
          <button
            onClick={handleAnalyze}
            disabled={loading || !image}
            className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? <Spinner /> : 'Analyze Image'}
          </button>
        </div>
      </div>

      {error && <div className="mt-4 text-red-400 p-3 bg-red-900/50 rounded-lg">{error}</div>}

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-semibold mb-2">Uploaded Image</h3>
          {image ? (
            <img src={image} alt="Uploaded for analysis" className="w-full h-auto rounded-lg shadow-lg" />
          ) : (
            <div className="flex justify-center items-center h-64 bg-gray-800/50 rounded-lg text-gray-400">
              Upload an image to begin analysis.
            </div>
          )}
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Analysis Result</h3>
          <div className="p-4 bg-gray-800/50 rounded-lg min-h-[16rem]">
            {loading ? <Spinner /> : 
             analysis ? <pre className="whitespace-pre-wrap font-sans text-gray-300">{analysis}</pre> : 
             <p className="text-gray-400">Analysis will appear here.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageAnalyzer;
