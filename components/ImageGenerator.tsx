import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Spinner } from './Spinner';
import type { AspectRatio } from '../types';

const ImageGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [upscale, setUpscale] = useState(false);
  const [faceCorrection, setFaceCorrection] = useState(false);

  const aspectRatios: AspectRatio[] = ['1:1', '16:9', '9:16', '4:3', '3:4'];

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt.');
      return;
    }
    setLoading(true);
    setError(null);
    setImages([]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

      const config: any = {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: aspectRatio,
      };

      if (upscale) {
        config.highResolutionUpscaleConfig = { enabled: true };
      }

      if (faceCorrection) {
        config.faceCorrectionConfig = { enabled: true };
      }

      const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt,
        config,
      });
      
      const generatedImages = response.generatedImages.map(
        (img) => `data:image/jpeg;base64,${img.image.imageBytes}`
      );
      setImages(generatedImages);
    } catch (err) {
      console.error('Image generation error:', err);
      setError('Failed to generate image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="p-6 bg-gray-800/50 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Image Generation with Imagen</h2>
        <div className="space-y-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., A futuristic cityscape at sunset, with flying cars and neon lights."
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
            disabled={loading}
          />
          <div className="flex flex-col sm:flex-row items-end gap-4">
             <div className="w-full sm:w-auto flex-grow">
                <label htmlFor="aspect-ratio" className="block text-sm font-medium text-gray-300 mb-1">Aspect Ratio</label>
                <select
                    id="aspect-ratio"
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                >
                    {aspectRatios.map(ar => <option key={ar} value={ar}>{ar}</option>)}
                </select>
             </div>
             <div className="flex gap-4">
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="upscale"
                        checked={upscale}
                        onChange={(e) => setUpscale(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        disabled={loading}
                    />
                    <label htmlFor="upscale" className="ml-2 block text-sm font-medium text-gray-300 whitespace-nowrap">
                        Upscale
                    </label>
                </div>
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="face-correction"
                        checked={faceCorrection}
                        onChange={(e) => setFaceCorrection(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        disabled={loading}
                    />
                    <label htmlFor="face-correction" className="ml-2 block text-sm font-medium text-gray-300 whitespace-nowrap">
                        Fix Faces
                    </label>
                </div>
             </div>
             <button
                onClick={handleGenerate}
                disabled={loading || !prompt.trim()}
                className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed transition-colors"
             >
                {loading ? <Spinner /> : 'Generate'}
              </button>
          </div>
        </div>
      </div>

      {error && <div className="mt-4 text-red-400 p-3 bg-red-900/50 rounded-lg">{error}</div>}

      <div className="mt-8">
        {loading && (
          <div className="flex justify-center items-center h-64 bg-gray-800/50 rounded-lg">
            <Spinner />
          </div>
        )}
        {images.length > 0 && (
          <div className="grid grid-cols-1 gap-4">
            {images.map((src, index) => (
              <img key={index} src={src} alt={`Generated image ${index + 1}`} className="w-full h-auto rounded-lg shadow-lg" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageGenerator;