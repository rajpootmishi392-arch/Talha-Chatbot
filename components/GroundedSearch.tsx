
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Spinner } from './Spinner';

interface GroundingChunk {
  web?: { uri: string; title: string };
  maps?: { uri: string; title: string };
}

const GroundedSearch: React.FC = () => {
  const [prompt, setPrompt] = useState('Who won the latest Super Bowl?');
  const [response, setResponse] = useState('');
  const [sources, setSources] = useState<GroundingChunk[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useMaps, setUseMaps] = useState(false);
  const [location, setLocation] = useState<{latitude: number; longitude: number} | null>(null);

  useEffect(() => {
    if (useMaps && !location) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (geoError) => {
          console.error("Geolocation error:", geoError);
          setError("Could not get your location. Maps grounding may be less accurate.");
        }
      );
    }
  }, [useMaps, location]);
  

  const handleSearch = async () => {
    if (!prompt.trim()) {
      setError('Please enter a search query.');
      return;
    }
    setLoading(true);
    setError(null);
    setResponse('');
    setSources([]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      
      const tools: any[] = useMaps ? [{googleMaps: {}}] : [{googleSearch: {}}];
      const toolConfig: any = {};
      
      if(useMaps && location) {
          toolConfig.retrievalConfig = { latLng: location };
      }

      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { tools, toolConfig },
      });

      setResponse(result.text);
      
      const groundingMetadata = result.candidates?.[0]?.groundingMetadata;
      if (groundingMetadata?.groundingChunks) {
        setSources(groundingMetadata.groundingChunks as GroundingChunk[]);
      }
      
    } catch (err) {
      console.error('Grounded search error:', err);
      setError('Failed to perform grounded search. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="p-6 bg-gray-800/50 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Grounded Search</h2>
        <div className="space-y-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask a question requiring recent information..."
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
            disabled={loading}
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center">
                <input
                    type="checkbox"
                    id="use-maps"
                    checked={useMaps}
                    onChange={(e) => setUseMaps(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="use-maps" className="ml-2 block text-sm text-gray-300">
                    Use Google Maps (for local queries like "good restaurants nearby")
                </label>
            </div>
            <button
              onClick={handleSearch}
              disabled={loading || !prompt.trim()}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? <Spinner /> : 'Search'}
            </button>
          </div>
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
            {sources.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <h4 className="font-semibold text-gray-200 mb-2">Sources:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {sources.map((source, index) => (
                    <li key={index}>
                      <a 
                        href={(source.web || source.maps)?.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline"
                      >
                        {(source.web || source.maps)?.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GroundedSearch;
