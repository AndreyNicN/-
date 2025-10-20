import { GoogleGenAI } from "@google/genai";
import type { GenerationState, AspectRatio, ModelType, VideoDuration } from '../types';

export class QuotaExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QuotaExceededError';
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

type ProgressUpdater = (update: Partial<GenerationState> & { messageKey?: string }) => void;

export const generateVeoVideo = async (
  prompt: string,
  image: File | null,
  aspectRatio: AspectRatio,
  setProgress: ProgressUpdater,
  apiKey: string,
  model: ModelType,
  duration: VideoDuration
): Promise<string> => {
  if (!apiKey) {
    throw new Error("API Key is missing for VEO generation.");
  }
  const ai = new GoogleGenAI({ apiKey: apiKey });

  setProgress({ status: 'generating', messageKey: 'status.generating', progress: 10 });

  let durationSecs = 5; // Default to shortest
  if (duration === 'medium') {
    durationSecs = 8;
  } else if (duration === 'long') {
    durationSecs = 8; // Max supported by current models
  }

  const generationPayload: any = {
    model: model,
    prompt,
    config: {
      numberOfVideos: 1,
      aspectRatio: aspectRatio, // Correctly pass aspect ratio
      durationSecs: durationSecs, // Pass duration
    }
  };
  
  if (image) {
      const base64Image = await fileToBase64(image);
      generationPayload.image = {
          imageBytes: base64Image,
          mimeType: image.type,
      };
  }
  try {
    let operation = await ai.models.generateVideos(generationPayload);
    
    setProgress({ status: 'polling', messageKey: 'status.polling', progress: 30 });

    let currentProgress = 30;
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10 seconds
      try {
          operation = await ai.operations.getVideosOperation({ operation: operation });
          currentProgress = Math.min(90, currentProgress + 5);
          setProgress({ progress: currentProgress });
      } catch (e) {
          console.error("Polling failed:", e);
          throw new Error("Failed to poll for video status.");
      }
    }

    if (operation.error) {
      throw new Error(`Video generation failed: ${operation.error.message}`);
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    
    if (!downloadLink) {
      throw new Error("Video generation completed, but no download link was found.");
    }

    setProgress({ status: 'generating', messageKey: 'status.fetching', progress: 95 });

    const response = await fetch(`${downloadLink}&key=${apiKey}`);
    if (!response.ok) {
      throw new Error(`Failed to download video: ${response.statusText}`);
    }
    
    const videoBlob = await response.blob();
    const videoUrl = URL.createObjectURL(videoBlob);
    
    return videoUrl;
  } catch(e: any) {
    const errorMessage = e?.message || '';
    if (errorMessage.includes('RESOURCE_EXHAUSTED') || errorMessage.includes('quota exceeded')) {
        throw new QuotaExceededError('Free tier quota likely exceeded.');
    }
    throw e;
  }
};