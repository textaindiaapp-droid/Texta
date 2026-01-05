
export type ToneLabel = 
  | 'Neutral' 
  | 'Assertive' 
  | 'Questioning' 
  | 'Concerned' 
  | 'Positive' 
  | 'Urgent' 
  | 'Hesitant';

export type Priority = 'Low' | 'Medium' | 'High';

export type TaskProgress = 'Not Started' | 'In Progress' | 'Completed';

export type InteractionType = 
  | 'Question-Answer' 
  | 'Clarification' 
  | 'Interruption' 
  | 'Agreement' 
  | 'Concern-Reassurance' 
  | 'Unresolved' 
  | 'Brief Exchange';

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

export interface TranscriptLine {
  speaker: string;
  text: string;
}

export interface ActionItem {
  task: string;
  priority: Priority;
  location?: string;
  startDate?: string;
  dueDate?: string;
}

export interface InteractionPattern {
  speakers: string[];
  type: InteractionType;
  description: string; 
  toneDynamic: string; 
}

export interface TopicCluster {
  label: string;
  relevance: number; // 0-100
  summary: string;
}

export interface RecallCard {
  fact: string;
  source: string;
  category: 'Commitment' | 'Technical' | 'Financial' | 'Deadline' | 'Concept';
}

export interface SpeakerInsight {
  speaker: string; 
  tone: ToneLabel;
  interestLevel: 'Dominant' | 'Collaborative' | 'Detached' | 'Inquisitive' | 'Passive Observer';
  metrics: {
    intensity: number;
    confidence: number;
    stability: number;
    transparency: number;
    engagement: number;
  };
  keyObservation: string;
}

export interface ConversationAnalysis {
  id: string;
  timestamp: number;
  summary: string;
  meetingPulse: 'High Energy' | 'Steady Flow' | 'Tense' | 'Quiet';
  actionItems: ActionItem[];
  interactionPatterns: InteractionPattern[];
  topicClusters: TopicCluster[];
  recallCards: RecallCard[];
  suggestions: string[];
  transcript: TranscriptLine[];
  overallTones: SpeakerInsight[];
  chatHistory?: ChatMessage[];
}

export interface Reminder {
  id: string;
  conversationId: string;
  text: string;
  subtitle?: string;
  priority: Priority;
  location?: string;
  startDate?: string;
  dueDate?: string;
  documentUrl?: string;
  progress: TaskProgress;
  createdAt: number;
}

export enum ViewState {
  HOME = 'HOME',
  HISTORY = 'HISTORY',
  REMINDERS = 'REMINDERS',
  ACCOUNT = 'ACCOUNT',
  DETAIL = 'DETAIL',
  PROCESSING = 'PROCESSING'
}

export enum AppState {
  IDLE = 'IDLE',
  RECORDING = 'RECORDING',
  PROCESSING = 'PROCESSING',
  RESULT = 'RESULT'
}
