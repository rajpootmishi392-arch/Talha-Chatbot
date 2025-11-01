
import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';
import { GoogleGenAI, Chat } from '@google/genai';
import { Spinner } from './Spinner';

const Chatbot: React.FC = () => {
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chat, setChat] = useState<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const newChat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: 'You are a helpful and friendly AI assistant. You can help with a wide variety of tasks, including answering questions, providing explanations, generating code, and more.',
      },
    });
    setChat(newChat);
  }, []);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleSendMessage = async () => {
    if (!input.trim() || !chat) return;

    const userMessage: ChatMessage = { role: 'user', parts: [{ text: input }] };
    setHistory(prev => [...prev, userMessage]);
    setLoading(true);

    const modelResponse: ChatMessage = { role: 'model', parts: [{ text: '' }] };
    setHistory(prev => [...prev, modelResponse]);
    
    setInput('');

    try {
        const result = await chat.sendMessageStream({ message: input });
        
        for await (const chunk of result) {
            const chunkText = chunk.text;
            setHistory(prev => {
                const newHistory = [...prev];
                const lastMessage = newHistory[newHistory.length - 1];
                if (lastMessage.role === 'model') {
                    lastMessage.parts[0].text += chunkText;
                }
                return newHistory;
            });
        }
    } catch (error) {
        console.error('Error sending message:', error);
        setHistory(prev => {
            const newHistory = [...prev];
            const lastMessage = newHistory[newHistory.length - 1];
            if (lastMessage.role === 'model') {
                lastMessage.parts[0].text = 'Sorry, I encountered an error. Please try again.';
            }
            return newHistory;
        });
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-800/50 rounded-lg">
        {history.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-lg p-3 rounded-2xl ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
              <pre className="whitespace-pre-wrap font-sans">{msg.parts[0].text}</pre>
            </div>
          </div>
        ))}
        {loading && history[history.length - 1]?.role === 'user' && (
           <div className="flex justify-start">
             <div className="max-w-lg p-3 rounded-2xl bg-gray-700 text-gray-200">
                <Spinner />
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="mt-4 flex items-center">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && !loading && handleSendMessage()}
          placeholder="Ask me anything..."
          className="flex-1 p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />
        <button
          onClick={handleSendMessage}
          disabled={loading || !input.trim()}
          className="ml-3 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chatbot;
