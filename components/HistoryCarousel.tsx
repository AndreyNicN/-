import React from 'react';
import { VideoResult } from '../types';
import { DownloadIcon } from './Icons';
import { useI18n } from '../i18n/I18nContext';

interface HistoryCarouselProps {
  history: VideoResult[];
  modelOptions: { value: string; label: string }[];
}

const HistoryCarousel: React.FC<HistoryCarouselProps> = ({ history, modelOptions }) => {
  const { t } = useI18n();

  const getModelLabel = (modelValue: string) => {
    return modelOptions.find(opt => opt.value === modelValue)?.label || modelValue;
  }

  const handleDownload = (url: string, filenamePrefix: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filenamePrefix.replace(/ /g, '_')}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  
  const handleDownloadAll = async () => {
    for (const item of history) {
      handleDownload(item.url, `${getModelLabel(item.model)}_${item.id}`);
      await new Promise(resolve => setTimeout(resolve, 300)); // Stagger downloads
    }
  };
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-surface/80 backdrop-blur-sm border-t border-surface-light z-20 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="flex justify-between items-center pt-2">
            <h3 className="text-sm font-bold text-text-secondary">{t('history.title')}</h3>
            {history.length > 0 && (
                <button 
                    onClick={handleDownloadAll}
                    className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-primary transition-colors px-2 py-1 rounded-md hover:bg-selection"
                    title={t('history.download_all')}
                >
                    <DownloadIcon className="w-4 h-4" />
                    <span>{t('history.download_all')}</span>
                </button>
            )}
        </div>
        <div className="flex gap-4 overflow-x-auto py-3 min-h-[9rem]">
          {history.length === 0 ? (
            <div className="w-full flex items-center justify-center text-center">
              <p className="text-text-secondary">{t('history.empty_placeholder')}</p>
            </div>
          ) : (
            history.map((item) => (
              <div key={item.id} className="group relative flex-shrink-0 w-48 h-28 bg-brand-bg rounded-md overflow-hidden border border-surface-light">
                <video
                  src={item.url}
                  muted
                  loop
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between items-center p-2 text-center">
                  <span className="text-xs font-semibold text-white bg-black/50 px-2 py-1 rounded">{getModelLabel(item.model)}</span>
                  <button
                    onClick={() => handleDownload(item.url, `${getModelLabel(item.model)}_${item.id}`)}
                    className="p-2 bg-primary/80 hover:bg-primary rounded-full text-white transition-colors"
                    title={t('history.download')}
                  >
                    <DownloadIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryCarousel;