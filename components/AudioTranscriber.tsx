
import React, { useState, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Spinner } from './Spinner';
import { MicIcon } from '../constants';

const AudioTranscriber: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      mediaRecorderRef.current.onstop = handleTranscription;
      audioChunksRef.current = [];
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setTranscription('');
      setError(null);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Could not access microphone. Please grant permission and try again.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setLoading(true);
    }
  };

  const fileToGenerativePart = async (file: Blob) => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(file);
    });
    return {
      inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
  };

  const handleTranscription = async () => {
    const audioBlob = new Blob(audioChunksRef.current);
    if (audioBlob.size === 0) {
      setLoading(false);
      return;
    }
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const audioPart = await fileToGenerativePart(audioBlob);

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [audioPart, { text: 'Transcribe this audio.' }] },
      });
      
      setTranscription(response.text);
    } catch (err) {
      console.error('Transcription error:', err);
      setError('Failed to transcribe audio. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="p-6 bg-gray-800/50 rounded-lg shadow-lg text-center">
        <h2 className="text-2xl font-bold mb-4">Audio Transcription</h2>
        <p className="text-gray-400 mb-6">
          {isRecording ? "Click the button to stop recording." : "Click the button and speak to start transcription."}
        </p>
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={loading}
          className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto transition-all duration-300 ${isRecording ? 'bg-red-600 hover:bg-red-700 animate-pulse' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          <MicIcon className="w-12 h-12 text-white" />
        </button>
      </div>
      
      {error && <div className="mt-4 text-red-400 p-3 bg-red-900/50 rounded-lg">{error}</div>}

      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-2">Transcription Result</h3>
        <div className="p-4 bg-gray-800/50 rounded-lg min-h-[10rem]">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <Spinner />
            </div>
          ) : transcription ? (
            <p className="text-gray-300">{transcription}</p>
          ) : (
            <p className="text-gray-400">Your transcription will appear here.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AudioTranscriber;
