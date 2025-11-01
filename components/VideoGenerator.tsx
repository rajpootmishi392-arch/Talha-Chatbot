
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Spinner } from './Spinner';
import type { VideoAspectRatio } from '../types';

const loadingMessages = [
    "Warming up the digital director's chair...",
    "Choreographing pixels into motion...",
    "Rendering your cinematic masterpiece...",
    "Adjusting the lighting on the virtual set...",
    "This can take a few minutes. Your patience is appreciated!",
    "Finalizing the special effects...",
    "Almost ready for the premiere...",
];

const VideoGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
  const [apiKeySelected, setApiKeySelected] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>('16:9');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkApiKey();
  }, []);

  useEffect(() => {
    let interval: number;
    if (loading) {
      interval = window.setInterval(() => {
        setLoadingMessage(prev => {
          const currentIndex = loadingMessages.indexOf(prev);
          return loadingMessages[(currentIndex + 1) % loadingMessages.length];
        });
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const checkApiKey = async () => {
    if (window.aistudio && await window.aistudio.hasSelectedApiKey()) {
      setApiKeySelected(true);
    } else {
      setApiKeySelected(false);
    }
  };

  const handleSelectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      // Assume success to avoid race condition and allow immediate generation attempt
      setApiKeySelected(true);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };
  
  const handleGenerate = async () => {
    if (!prompt.trim() && !image) {
      setError('Please enter a prompt or upload an image.');
      return;
    }
    setLoading(true);
    setError(null);
    setVideoUrl(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      
      let imagePayload;
      if (image) {
        imagePayload = {
          imageBytes: image.split(',')[1],
          mimeType: fileInputRef.current?.files?.[0].type || 'image/png'
        };
      }
      
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt,
        image: imagePayload,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio,
        }
      });
      
      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      if (operation.response?.generatedVideos?.[0]?.video?.uri) {
        const downloadLink = operation.response.generatedVideos[0].video.uri;
        const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        const videoBlob = await videoResponse.blob();
        setVideoUrl(URL.createObjectURL(videoBlob));
      } else {
        throw new Error('Video generation completed, but no video URI was found.');
      }
    } catch (err: any) {
      console.error('Video generation error:', err);
      if (err.message?.includes("Requested entity was not found.")) {
        setError("API Key validation failed. Please select a valid API key and try again.");
        setApiKeySelected(false);
      } else {
        setError('Failed to generate video. Please check the console for details.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  if (!apiKeySelected) {
    return (
      <div className="max-w-xl mx-auto text-center p-8 bg-gray-800/50 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">API Key Required for Veo</h2>
        <p className="mb-6 text-gray-300">
          Video generation with Veo requires you to select your own API key. This ensures proper billing and usage tracking for this powerful feature.
        </p>
        <p className="mb-6 text-sm text-gray-400">For more information, please see the <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">billing documentation</a>.</p>
        <button
          onClick={handleSelectKey}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Select API Key
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="p-6 bg-gray-800/50 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Video Generation with Veo</h2>
        <div className="space-y-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., A neon hologram of a cat driving at top speed"
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
            disabled={loading}
          />
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            ref={fileInputRef}
            className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            disabled={loading}
          />
          {image && <img src={image} alt="Uploaded preview" className="max-w-xs rounded-lg mt-2"/>}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-full sm:w-auto">
              <label htmlFor="video-aspect-ratio" className="block text-sm font-medium text-gray-300 mb-1">Aspect Ratio</label>
              <select
                  id="video-aspect-ratio"
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value as VideoAspectRatio)}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
              >
                  <option value="16:9">16:9 (Landscape)</option>
                  <option value="9:16">9:16 (Portrait)</option>
              </select>
            </div>
            <button
              onClick={handleGenerate}
              disabled={loading || (!prompt.trim() && !image)}
              className="w-full sm:w-auto mt-auto px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Generating...' : 'Generate Video'}
            </button>
          </div>
        </div>
      </div>

      {error && <div className="mt-4 text-red-400 p-3 bg-red-900/50 rounded-lg">{error}</div>}

      <div className="mt-8">
        {loading && (
          <div className="flex flex-col justify-center items-center h-64 bg-gray-800/50 rounded-lg p-4 text-center">
            <Spinner />
            <p className="mt-4 text-lg text-gray-300">{loadingMessage}</p>
          </div>
        )}
        {videoUrl && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Generated Video</h3>
            <video src={videoUrl} controls autoPlay loop className="w-full rounded-lg shadow-lg"></video>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoGenerator;
