
// Fix: Add React import to use React.FC type.
import React from 'react';

export enum FeatureID {
  CHATBOT = 'chatbot',
  IMAGE_GENERATION = 'image_generation',
  IMAGE_EDITING = 'image_editing',
  IMAGE_ANALYSIS = 'image_analysis',
  VIDEO_GENERATION = 'video_generation',
  VIDEO_ANALYSIS = 'video_analysis',
  LIVE_CONVERSATION = 'live_conversation',
  AUDIO_TRANSCRIPTION = 'audio_transcription',
  TEXT_TO_SPEECH = 'text_to_speech',
  GROUNDED_SEARCH = 'grounded_search',
  COMPLEX_TASKS = 'complex_tasks',
  QUICK_RESPONSE = 'quick_response',
}

export interface Feature {
  id: FeatureID;
  name: string;
  description: string;
  icon: React.FC<{ className?: string }>;
}

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";

export type VideoAspectRatio = "16:9" | "9:16";