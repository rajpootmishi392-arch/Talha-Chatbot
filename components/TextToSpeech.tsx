
import React, { useState, useRef } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { Spinner } from './Spinner';

// Audio decoding helper
function decode(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}


const TextToSpeech: React.FC = () => {
    const [text, setText] = useState('Hello! I am an AI assistant powered by Gemini. How can I help you today?');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

    const handleGenerateSpeech = async () => {
        if (!text.trim()) {
            setError('Please enter some text to synthesize.');
            return;
        }
        setLoading(true);
        setError(null);

        // Stop any currently playing audio
        if (audioSourceRef.current) {
            audioSourceRef.current.stop();
        }

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash-preview-tts",
                contents: [{ parts: [{ text: `Say: ${text}` }] }],
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: { voiceName: 'Kore' },
                        },
                    },
                },
            });

            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
                if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
                    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                }
                const audioContext = audioContextRef.current;
                const audioBuffer = await decodeAudioData(decode(base64Audio), audioContext, 24000, 1);
                const source = audioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(audioContext.destination);
                source.start();
                audioSourceRef.current = source;
            } else {
                throw new Error("No audio data received from API.");
            }

        } catch (err) {
            console.error('TTS error:', err);
            setError('Failed to generate speech. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="p-6 bg-gray-800/50 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-4">Text-to-Speech</h2>
                <div className="space-y-4">
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Enter text to convert to speech..."
                        className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-40"
                        disabled={loading}
                    />
                    <button
                        onClick={handleGenerateSpeech}
                        disabled={loading || !text.trim()}
                        className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? <Spinner /> : 'Generate & Play Audio'}
                    </button>
                </div>
            </div>

            {error && <div className="mt-4 text-red-400 p-3 bg-red-900/50 rounded-lg">{error}</div>}

             <div className="mt-8 p-6 bg-gray-800/50 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">How it works</h3>
                <p className="text-gray-400">This feature uses the `gemini-2.5-flash-preview-tts` model to convert text into raw PCM audio data. The browser then decodes this raw data and plays it using the Web Audio API. This allows for real-time, high-quality speech synthesis directly in the application.</p>
            </div>
        </div>
    );
};

export default TextToSpeech;
