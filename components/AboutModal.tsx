import React from 'react';
import { useI18n } from '../i18n/I18nContext';
import { YouTubeIcon } from './Icons';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  const { t } = useI18n();

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-surface rounded-xl p-6 w-full max-w-2xl border border-surface-light shadow-2xl flex flex-col gap-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
            <h2 className="text-2xl font-bold text-text-main">{t('about.title')}</h2>
            <p className="text-sm text-text-secondary mt-2">{t('about.author_intro')}</p>
        </div>

        <div>
            <h3 className="text-lg font-bold mb-2">{t('about.video_tutorial')}</h3>
            <div className="aspect-video">
                <iframe 
                    className="w-full h-full rounded-lg"
                    src="https://www.youtube.com/embed/uw-BTOQrOI4?si=vjWfc8h-HoPUzuF4" 
                    title="YouTube video player" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                    allowFullScreen>
                </iframe>
            </div>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-surface-light">
             <a 
                href="https://www.youtube.com/@ATDIGIT" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-accent-green hover:bg-accent-green-hover text-gray-800 px-6 py-3 rounded-md font-semibold transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
             >
                <YouTubeIcon className="w-5 h-5" />
                <span>{t('about.go_to_youtube')}</span>
            </a>
            <button
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2 rounded-md font-semibold bg-primary hover:bg-primary-hover text-white transition-colors"
            >
                {t('settings.close')}
            </button>
        </div>
      </div>
    </div>
  );
};

export default AboutModal;