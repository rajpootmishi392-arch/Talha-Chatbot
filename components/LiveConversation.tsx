
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob, LiveSession } from '@google/genai';
import { MicIcon } from '../constants';

// Audio Encoding/Decoding Helpers
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

function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

const LiveConversation: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState('Idle. Press the button to start.');
  const [transcription, setTranscription] = useState<{user: string, model: string}[]>([]);

  const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const currentInputTranscriptionRef = useRef('');
  const currentOutputTranscriptionRef = useRef('');

  useEffect(() => {
    return () => {
        stopConversation();
    };
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startConversation = async () => {
    if (isListening) return;

    try {
      setStatus('Initializing...');
      setIsListening(true);
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      
      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
            systemInstruction: 'You are a friendly and helpful AI assistant.',
            inputAudioTranscription: {},
            outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setStatus('Connected. Listening...');
            const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
            mediaStreamSourceRef.current = source;
            const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = scriptProcessor;

            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromiseRef.current?.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current) {
                const outputAudioContext = outputAudioContextRef.current;
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContext.currentTime);
                const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
                const source = outputAudioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputAudioContext.destination);
                source.addEventListener('ended', () => sourcesRef.current.delete(source));
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                sourcesRef.current.add(source);
            }
            if (message.serverContent?.interrupted) {
                for (const source of sourcesRef.current.values()) source.stop();
                sourcesRef.current.clear();
                nextStartTimeRef.current = 0;
            }

            if (message.serverContent?.inputTranscription) {
              currentInputTranscriptionRef.current += message.serverContent.inputTranscription.text;
            }
            if (message.serverContent?.outputTranscription) {
              currentOutputTranscriptionRef.current += message.serverContent.outputTranscription.text;
            }
            if(message.serverContent?.turnComplete) {
              setTranscription(prev => [...prev, {user: currentInputTranscriptionRef.current, model: currentOutputTranscriptionRef.current}]);
              currentInputTranscriptionRef.current = "";
              currentOutputTranscriptionRef.current = "";
            }
          },
          onerror: (e: ErrorEvent) => {
            setStatus(`Error: ${e.message}`);
            stopConversation();
          },
          onclose: () => {
            setStatus('Connection closed. Press to restart.');
            setIsListening(false);
          },
        },
      });

    } catch (error) {
      console.error('Failed to start conversation:', error);
      setStatus('Error: Could not get microphone access.');
      setIsListening(false);
    }
  };

  const stopConversation = async () => {
    if (!isListening) return;

    if (sessionPromiseRef.current) {
      const session = await sessionPromiseRef.current;
      session.close();
      sessionPromiseRef.current = null;
    }

    mediaStreamRef.current?.getTracks().forEach(track => track.stop());
    mediaStreamRef.current = null;
    
    scriptProcessorRef.current?.disconnect();
    mediaStreamSourceRef.current?.disconnect();
    scriptProcessorRef.current = null;
    mediaStreamSourceRef.current = null;

    inputAudioContextRef.current?.close();
    outputAudioContextRef.current?.close();
    inputAudioContextRef.current = null;
    outputAudioContextRef.current = null;
    
    setIsListening(false);
    setStatus('Idle. Press the button to start.');
  };

  const toggleConversation = () => {
    if (isListening) {
      stopConversation();
    } else {
      startConversation();
    }
  };

  return (
    <div className="max-w-4xl mx-auto text-center">
      <div className="p-6 bg-gray-800/50 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Live Conversation</h2>
        <p className="text-gray-400 mb-6">{status}</p>
        <button
          onClick={toggleConversation}
          className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto transition-all duration-300 ${isListening ? 'bg-red-600 hover:bg-red-700 animate-pulse' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          <MicIcon className="w-12 h-12 text-white" />
        </button>
      </div>

      <div className="mt-8 text-left bg-gray-800/50 rounded-lg p-4 h-96 overflow-y-auto">
        <h3 className="text-lg font-semibold mb-2">Conversation Transcript</h3>
        <div className="space-y-4">
          {transcription.map((turn, index) => (
            <div key={index}>
              <p><strong className="text-blue-400">You:</strong> {turn.user}</p>
              <p><strong className="text-green-400">AI:</strong> {turn.model}</p>
            </div>
          ))}
           {(currentInputTranscriptionRef.current || currentOutputTranscriptionRef.current) && (
              <div>
                  <p><strong className="text-blue-400">You:</strong> {currentInputTranscriptionRef.current}...</p>
                  <p><strong className="text-green-400">AI:</strong> {currentOutputTranscriptionRef.current}...</p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default LiveConversation;
