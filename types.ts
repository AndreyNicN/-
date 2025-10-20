

export type AspectRatio = '16:9' | '9:16';
export type VideoDuration = 'short' | 'medium' | 'long';

export enum ModelType {
  NONE = 'none',
  VEO_2 = 'veo-2.0-generate-001',
  VEO_3 = 'veo-3.0-generate-001', // Hypothetical future model
  SORA_2 = 'sora-2',
  SORA_2_PRO = 'sora-2-pro',
}

export interface VideoResult {
  id: string;
  url: string;
  model: ModelType;
}

export type GenerationStatus = 'idle' | 'queued' | 'generating' | 'polling' | 'completed' | 'failed';

export interface GenerationState {
  status: GenerationStatus;
  progress: number;
  message: string;
  result: VideoResult | null;
  error: string | null;
}

export interface Rating {
  id?: number;
  resultId: string;
  model: ModelType;
  rating: number;
  prompt: string;
  timestamp: number;
}

export interface CustomPrompt {
  id?: number;
  title: string;
  prompt: string;
}