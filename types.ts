
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

export interface DeceptionMarker {
  type: 'Falsehood' | 'Hiding' | 'Inconsistency';
  reason: string;
  confidence: number;
}

export interface TranscriptLine {
  speaker: string;
  text: string;
  integrityFlag?: DeceptionMarker;
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
  vibe: string;
  cognitiveStyle: string; 
  linguisticStyle: string; 
  metrics: {
    intensity: number;
    confidence: number;
    stability: number;
    transparency: number; // Structural honesty
    shielding: number; // Level of hiding something
    engagement: number;
    stress: number;
  };
  keyObservation: string;
  honestyAlerts: string[]; // Specific notes on hiding/lying
}

export interface Reminder {
  id: string;
  conversationId: string;
  text: string;
  priority: Priority;
  progress: TaskProgress;
  createdAt: number;
}

export interface ConversationAnalysis {
  id: string;
  timestamp: number;
  archivedAt?: number; // Timestamp when item was moved to archive
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
  audioUrl?: string; // New field for the stored audio recording
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
