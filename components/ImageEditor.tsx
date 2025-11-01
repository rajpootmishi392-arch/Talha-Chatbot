
import React, { useState, useRef } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { Spinner } from './Spinner';

const ImageEditor: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('');
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
      setMimeType(file.type);
      const reader = new FileReader();
      reader.onloadend = () => {
        setOriginalImage(reader.result as string);
        setEditedImage(null);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleEdit = async () => {
    if (!prompt.trim() || !fileInputRef.current?.files?.[0]) {
      setError('Please upload an image and enter an editing prompt.');
      return;
    }
    setLoading(true);
    setError(null);
    setEditedImage(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const imagePart = await fileToGenerativePart(fileInputRef.current.files[0]);

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [imagePart, { text: prompt }],
        },
        config: {
          responseModalities: [Modality.IMAGE],
        },
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64ImageBytes = part.inlineData.data;
          setEditedImage(`data:${part.inlineData.mimeType};base64,${base64ImageBytes}`);
        }
      }
    } catch (err) {
      console.error('Image editing error:', err);
      setError('Failed to edit image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="p-6 bg-gray-800/50 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Image Editing</h2>
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
            placeholder="e.g., Add a retro filter, or Remove the person in the background"
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
            disabled={loading}
          />
          <button
            onClick={handleEdit}
            disabled={loading || !prompt.trim() || !originalImage}
            className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? <Spinner /> : 'Apply Edit'}
          </button>
        </div>
      </div>

      {error && <div className="mt-4 text-red-400 p-3 bg-red-900/50 rounded-lg">{error}</div>}

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-semibold mb-2">Original Image</h3>
          {originalImage ? (
            <img src={originalImage} alt="Original" className="w-full h-auto rounded-lg shadow-lg" />
          ) : (
            <div className="flex justify-center items-center h-64 bg-gray-800/50 rounded-lg text-gray-400">
              Upload an image to begin.
            </div>
          )}
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Edited Image</h3>
          {loading ? (
             <div className="flex justify-center items-center h-64 bg-gray-800/50 rounded-lg">
               <Spinner />
             </div>
          ) : editedImage ? (
            <img src={editedImage} alt="Edited" className="w-full h-auto rounded-lg shadow-lg" />
          ) : (
            <div className="flex justify-center items-center h-64 bg-gray-800/50 rounded-lg text-gray-400">
              Your edited image will appear here.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageEditor;
