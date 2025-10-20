import React, { useState, useEffect } from 'react';
import { ModelType, GenerationState } from '../types';
import { SpinnerIcon, VideoIcon, ZapIcon, ClockIcon, SpeakerOnIcon, SpeakerOffIcon, LandscapeIcon, PortraitIcon, InfoIcon } from './Icons';
import { useI18n } from '../i18n/I18nContext';
import StarRating from './StarRating';

interface GenerationPanelProps {
  panelId: string;
  title: string;
  selectedModel: ModelType;
  onModelChange: (model: ModelType) => void;
  state: GenerationState;
  modelOptions: { value: ModelType; label: string; apiKeyRequired: boolean }[];
  onRate: (rating: number) => void;
  isRated: boolean;
  onGenerateHere?: () => void;
  imageFile: File | null;
}

interface VideoMetadata {
    duration: number;
    width: number;
    height: number;
    hasAudio: boolean;
}

const ProgressBar: React.FC<{ progress: number }> = ({ progress }) => (
  <div className="w-full bg-surface-light rounded-full h-2.5">
    <div
      className="bg-accent-green h-2.5 rounded-full transition-all duration-300"
      style={{ width: `${progress}%` }}
    ></div>
  </div>
);

const VideoMetadataDisplay: React.FC<{ metadata: VideoMetadata }> = ({ metadata }) => {
    const { t } = useI18n();
    return (
        <div className="flex items-center justify-center gap-4 text-xs text-text-secondary mt-2">
            <div className="flex items-center gap-1.5" title={t('video_stats.duration')}>
                <ClockIcon className="w-4 h-4" />
                <span>{metadata.duration.toFixed(1)} {t('video_stats.seconds_unit_short')}</span>
            </div>
            <div className="flex items-center gap-1.5" title={t('video_stats.resolution')}>
                {metadata.width > metadata.height ? <LandscapeIcon className="w-4 h-4" /> : <PortraitIcon className="w-4 h-4" />}
                <span>{metadata.width}x{metadata.height}</span>
            </div>
            <div className="flex items-center gap-1.5" title={metadata.hasAudio ? t('video_stats.audio_on') : t('video_stats.audio_off')}>
                {metadata.hasAudio ? <SpeakerOnIcon className="w-4 h-4" /> : <SpeakerOffIcon className="w-4 h-4" />}
                <span>{metadata.hasAudio ? t('video_stats.audio_on') : t('video_stats.audio_off')}</span>
            </div>
        </div>
    );
};


const GenerationPanel: React.FC<GenerationPanelProps> = ({
  panelId,
  title,
  selectedModel,
  onModelChange,
  state,
  modelOptions,
  onRate,
  isRated,
  onGenerateHere,
  imageFile,
}) => {
  const { t } = useI18n();
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const modelSupportsImage = selectedModel === ModelType.VEO_2 || selectedModel === ModelType.VEO_3;

  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setImagePreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setImagePreviewUrl(null);
    }
  }, [imageFile]);


  const handleMetadataLoad = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
      const video = e.currentTarget;
      setMetadata({
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
          hasAudio: (video as any).mozHasAudio || Boolean(video.volume) || !(video.muted),
      });
  };

  return (
    <div className="bg-surface rounded-xl p-6 flex flex-col gap-4 border border-surface-light shadow-lg h-full">
      <h2 className="text-xl font-bold text-text-main">{title}</h2>
      
      <div className="relative">
        <select
          id={`${panelId}-model-select`}
          value={selectedModel}
          onChange={(e) => onModelChange(e.target.value as ModelType)}
          className="w-full bg-surface-light border border-gray-600 rounded-md px-4 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
        >
          {modelOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
        </div>
      </div>

      <div className="relative flex-grow bg-brand-bg rounded-lg flex flex-col items-center justify-center p-4 min-h-[300px] border-2 border-dashed border-surface-light">
        {state.status === 'idle' && (
          <>
            {imagePreviewUrl && (
              <div className="absolute inset-0 w-full h-full p-2">
                  <img src={imagePreviewUrl} alt="Image preview" className="w-full h-full object-contain rounded-md" />
                   {!modelSupportsImage && (
                    <div 
                        className="absolute top-3 right-3 p-1.5 bg-accent-orange/80 rounded-full text-white" 
                        title={t('panel.warning.image_not_supported')}
                    >
                        <InfoIcon className="w-4 h-4" />
                    </div>
                )}
              </div>
            )}
            {onGenerateHere ? (
              <button
                onClick={onGenerateHere}
                className="relative z-10 flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-md font-semibold transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                <ZapIcon className="w-5 h-5" />
                <span>{t('button.generate_here')}</span>
              </button>
            ) : !imagePreviewUrl && (
              <div className="text-center text-text-secondary">
                <VideoIcon className="w-16 h-16 mx-auto mb-4" />
                <p>{t('panel.placeholder.title')}</p>
              </div>
            )}
          </>
        )}

        {(state.status === 'queued' || state.status === 'generating' || state.status === 'polling') && (
          <div className="w-full max-w-sm text-center flex flex-col items-center gap-4">
            <SpinnerIcon className="w-12 h-12 text-accent-green" />
            <p className="text-lg font-semibold">{state.message}</p>
            <ProgressBar progress={state.progress} />
          </div>
        )}

        {state.status === 'completed' && state.result?.url && (
          <div className="w-full h-full flex flex-col justify-center items-center gap-2">
            <video 
                controls 
                autoPlay 
                muted 
                loop 
                className="max-w-full max-h-[320px] rounded-md object-contain"
                onLoadedMetadata={handleMetadataLoad}
                key={state.result.id} // Re-mount video element for new results
            >
              <source src={state.result.url} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            {metadata && <VideoMetadataDisplay metadata={metadata} />}
            <div className="mt-2 text-center">
              <h3 className="text-sm text-text-secondary mb-2">{t('rating.title')}</h3>
              <StarRating onRate={onRate} disabled={isRated} />
            </div>
          </div>
        )}

        {state.status === 'failed' && (
          <div className="text-center text-red-400">
            <p className="font-bold">{t('error.generation_failed')}</p>
            <p className="text-sm mt-2">{state.error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GenerationPanel;