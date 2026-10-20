export type AspectRatio = '16:9' | '9:16';

export type VeoModel = 'veo-3.1-fast-generate-preview' | 'veo-3.1-lite-generate-preview' | 'veo-3.1-generate-preview';

export type Resolution = '720p' | '1080p';

export interface StoryScene {
  id: string;
  chapterNumber: number;
  titleBn: string;
  titleEn: string;
  descriptionBn: string;
  descriptionEn: string;
  dialogue?: {
    speaker: 'Shafin' | 'Nafis' | 'Narrator';
    textBn: string;
    textEn: string;
  };
  imagePath: string;
  defaultPrompt: string;
  suggestedAspectRatio: AspectRatio;
  actionTag: string;
}

export interface GeneratedVideoItem {
  id: string;
  timestamp: number;
  operationName: string;
  prompt: string;
  aspectRatio: AspectRatio;
  model: string;
  sourceImage?: string;
  sourceImageName?: string;
  videoBlobUrl?: string;
  downloadUrl?: string;
  duration?: number;
  status: 'generating' | 'ready' | 'error';
  progressPercent?: number;
  errorMessage?: string;
  sceneTitle?: string;
}

export interface CharacterStats {
  name: string;
  title: string;
  titleBn: string;
  color: 'red' | 'blue';
  avatar: string;
  carName: string;
  topSpeed: number; // 0-100
  acceleration: number;
  handling: number;
  nitro: number;
  specialMoveBn: string;
  specialMoveEn: string;
  bioBn: string;
  bioEn: string;
}
