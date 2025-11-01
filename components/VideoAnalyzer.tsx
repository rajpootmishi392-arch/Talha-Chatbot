
import React, { useState, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Spinner } from './Spinner';

// Helper function to convert blob to base64
const blobToBase64 = (blob: Blob) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
});


const VideoAnalyzer: React.FC = () => {
    const [prompt, setPrompt] = useState('Describe what is happening in this video. What are the key objects and actions?');
    const [videoSrc, setVideoSrc] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setVideoSrc(url);
            setAnalysis('');
            setProgress(0);
        }
    };
    
    const analyzeVideo = async (videoFile: File) => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

        const video = document.createElement('video');
        video.src = URL.createObjectURL(videoFile);
        
        await new Promise(resolve => {
            video.onloadedmetadata = resolve;
        });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const duration = video.duration;
        const frameInterval = 1; // Process one frame per second of video
        const frames = [];

        for (let time = 0; time < duration; time += frameInterval) {
            video.currentTime = time;
            await new Promise(resolve => video.onseeked = resolve);
            context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg'));
            if (blob) {
                const base64Data = await blobToBase64(blob);
                frames.push({ inlineData: { data: base64Data, mimeType: 'image/jpeg' } });
            }
            setProgress(Math.round((time / duration) * 100));
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: { parts: [{ text: prompt }, ...frames] },
        });

        return response.text;
    };


    const handleAnalyze = async () => {
        const file = fileInputRef.current?.files?.[0];
        if (!file) {
            setError('Please upload a video file.');
            return;
        }
        setLoading(true);
        setError(null);
        setAnalysis('');
        setProgress(0);

        try {
            const result = await analyzeVideo(file);
            setAnalysis(result);
        } catch (err) {
            console.error('Video analysis error:', err);
            setError('Failed to analyze video. Please try again.');
        } finally {
            setLoading(false);
            setProgress(100);
        }
    };

    return (
        <div className="max-w-6xl mx-auto">
            <div className="p-6 bg-gray-800/50 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-4">Video Analysis</h2>
                <div className="space-y-4">
                    <input
                        type="file"
                        accept="video/*"
                        onChange={handleVideoUpload}
                        ref={fileInputRef}
                        className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        disabled={loading}
                    />
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Enter your analysis prompt here..."
                        className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
                        disabled={loading}
                    />
                    <button
                        onClick={handleAnalyze}
                        disabled={loading || !videoSrc}
                        className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? 'Analyzing...' : 'Analyze Video'}
                    </button>
                </div>
            </div>

            {error && <div className="mt-4 text-red-400 p-3 bg-red-900/50 rounded-lg">{error}</div>}

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h3 className="text-lg font-semibold mb-2">Uploaded Video</h3>
                    {videoSrc ? (
                        <video src={videoSrc} controls className="w-full h-auto rounded-lg shadow-lg"></video>
                    ) : (
                        <div className="flex justify-center items-center h-64 bg-gray-800/50 rounded-lg text-gray-400">
                            Upload a video to begin analysis.
                        </div>
                    )}
                </div>
                <div>
                    <h3 className="text-lg font-semibold mb-2">Analysis Result</h3>
                     {loading && (
                        <div className="w-full bg-gray-700 rounded-full h-2.5 mb-4">
                          <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                        </div>
                    )}
                    <div className="p-4 bg-gray-800/50 rounded-lg min-h-[16rem]">
                        {loading && !analysis ? <Spinner/> : 
                         analysis ? <pre className="whitespace-pre-wrap font-sans text-gray-300">{analysis}</pre> : 
                         <p className="text-gray-400">Analysis will appear here.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VideoAnalyzer;
