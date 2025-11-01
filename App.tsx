
import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
// Fix: FeatureID is exported from 'types.ts', not 'constants.tsx'.
import { FEATURES } from './constants';
import { FeatureID } from './types';
import Chatbot from './components/Chatbot';
import ImageGenerator from './components/ImageGenerator';
import ImageEditor from './components/ImageEditor';
import ImageAnalyzer from './components/ImageAnalyzer';
import VideoGenerator from './components/VideoGenerator';
import VideoAnalyzer from './components/VideoAnalyzer';
import LiveConversation from './components/LiveConversation';
import AudioTranscriber from './components/AudioTranscriber';
import TextToSpeech from './components/TextToSpeech';
import GroundedSearch from './components/GroundedSearch';
import ComplexTaskSolver from './components/ComplexTaskSolver';
import QuickResponder from './components/QuickResponder';
import { MenuIcon } from './constants';

const App: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState<FeatureID>(FeatureID.CHATBOT);
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const renderFeatureComponent = () => {
    switch (activeFeature) {
      case FeatureID.CHATBOT:
        return <Chatbot />;
      case FeatureID.IMAGE_GENERATION:
        return <ImageGenerator />;
      case FeatureID.IMAGE_EDITING:
        return <ImageEditor />;
      case FeatureID.IMAGE_ANALYSIS:
        return <ImageAnalyzer />;
      case FeatureID.VIDEO_GENERATION:
        return <VideoGenerator />;
      case FeatureID.VIDEO_ANALYSIS:
        return <VideoAnalyzer />;
      case FeatureID.LIVE_CONVERSATION:
        return <LiveConversation />;
      case FeatureID.AUDIO_TRANSCRIPTION:
        return <AudioTranscriber />;
      case FeatureID.TEXT_TO_SPEECH:
        return <TextToSpeech />;
      case FeatureID.GROUNDED_SEARCH:
        return <GroundedSearch />;
      case FeatureID.COMPLEX_TASKS:
        return <ComplexTaskSolver />;
      case FeatureID.QUICK_RESPONSE:
        return <QuickResponder />;
      default:
        return <Chatbot />;
    }
  };
  
  const activeFeatureDetails = FEATURES.find(f => f.id === activeFeature);

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 font-sans">
      <Sidebar
        activeFeature={activeFeature}
        setActiveFeature={setActiveFeature}
        isOpen={isSidebarOpen}
        setIsOpen={setSidebarOpen}
      />
      <main className="flex-1 flex flex-col transition-all duration-300">
        <header className="bg-gray-800/50 backdrop-blur-sm p-4 flex items-center border-b border-gray-700/50 sticky top-0 z-10">
          <button
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="p-2 mr-4 text-gray-400 hover:text-white lg:hidden"
          >
            <MenuIcon className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">{activeFeatureDetails?.name}</h1>
            <p className="text-sm text-gray-400">{activeFeatureDetails?.description}</p>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {renderFeatureComponent()}
        </div>
      </main>
    </div>
  );
};

export default App;