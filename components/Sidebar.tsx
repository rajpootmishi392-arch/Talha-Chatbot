
import React from 'react';
import { FEATURES } from '../constants';
import type { FeatureID } from '../types';

interface SidebarProps {
  activeFeature: FeatureID;
  setActiveFeature: (feature: FeatureID) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeFeature, setActiveFeature, isOpen, setIsOpen }) => {
  const handleFeatureClick = (featureId: FeatureID) => {
    setActiveFeature(featureId);
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  return (
    <>
      <div className={`fixed inset-0 bg-black/60 z-20 lg:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsOpen(false)}></div>
      <aside className={`absolute lg:relative flex flex-col w-64 bg-gray-800/80 backdrop-blur-md border-r border-gray-700/50 h-full transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out z-30`}>
        <div className="p-4 border-b border-gray-700/50">
          <h2 className="text-2xl font-bold text-white">Gemini Showcase</h2>
          <p className="text-sm text-gray-400">All-in-One AI Suite</p>
        </div>
        <nav className="flex-1 overflow-y-auto p-2">
          <ul>
            {FEATURES.map((feature) => (
              <li key={feature.id}>
                <button
                  onClick={() => handleFeatureClick(feature.id)}
                  className={`flex items-center w-full text-left px-4 py-3 my-1 rounded-lg transition-colors duration-200 ${
                    activeFeature === feature.id
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                  }`}
                >
                  <feature.icon className="w-6 h-6 mr-3" />
                  <span className="font-medium">{feature.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
};
