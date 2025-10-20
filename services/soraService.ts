import type { GenerationState, ModelType, AspectRatio, VideoDuration } from '../types';

type ProgressUpdater = (update: Partial<GenerationState> & { messageKey?: string }) => void;

const API_BASE_URL = 'https://api.openai.com/v1';

// Helper function to handle API requests
const fetchSoraAPI = async (endpoint: string, apiKey: string, options: RequestInit = {}) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(`Sora API Error: ${errorData.error?.message || response.statusText}`);
  }
  return response;
};

export const generateSoraVideo = async (
  prompt: string,
  apiKey: string,
  model: ModelType,
  aspectRatio: AspectRatio,
  setProgress: ProgressUpdater,
  duration: VideoDuration // Parameter is accepted for consistency but not used as Sora API doesn't support it yet
): Promise<string> => {
  if (!apiKey) {
    throw new Error("Sora API Key is required. Please set it in the settings.");
  }

  // 1. Start the render job
  setProgress({ status: 'generating', messageKey: 'status.generating', progress: 5 });
  
  const size = aspectRatio === '16:9' ? '1280x720' : '720x1280';

  const createResponse = await fetchSoraAPI('/videos', apiKey, {
    method: 'POST',
    body: JSON.stringify({
      model: model,
      prompt: prompt,
      size: size,
    }),
  });
  const videoJob = await createResponse.json();
  const videoId = videoJob.id;

  // 2. Poll for status
  setProgress({ status: 'polling', messageKey: 'status.polling', progress: 20 });
  let isComplete = false;
  let pollCount = 0;

  while (!isComplete && pollCount < 60) { // Timeout after 10 minutes (60 polls * 10s)
    await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10 seconds
    
    const statusResponse = await fetchSoraAPI(`/videos/${videoId}`, apiKey);
    const statusData = await statusResponse.json();

    switch (statusData.status) {
      case 'completed':
        isComplete = true;
        setProgress({ progress: 95, messageKey: 'status.fetching' });
        break;
      case 'failed':
        throw new Error(statusData.error?.message || "Video generation failed without a specific error.");
      case 'in_progress':
        setProgress({ progress: 20 + (statusData.progress || 0) * 0.75 }); // Scale progress to 20-95 range
        break;
      case 'queued':
        // Keep polling, progress is static
        break;
    }
    pollCount++;
  }

  if (!isComplete) {
    throw new Error("Video generation timed out after 10 minutes.");
  }

  // 3. Download the video content
  const contentResponse = await fetchSoraAPI(`/videos/${videoId}/content`, apiKey, {
      headers: {} // override Content-Type for binary download
  });
  
  const videoBlob = await contentResponse.blob();
  const videoUrl = URL.createObjectURL(videoBlob);
  
  return videoUrl;
};