import React from 'react';
import { useI18n } from '../i18n/I18nContext';
import { ExternalLinkIcon } from './Icons';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  soraApiKey: string;
  onSoraApiKeyChange: (key: string) => void;
  googleApiKey: string;
  onGoogleApiKeyChange: (key: string) => void;
}

const ApiInstruction: React.FC<{ title: string; steps: string; link: string }> = ({ title, steps, link }) => (
    <div className="bg-surface-light p-4 rounded-lg">
        <h4 className="font-semibold text-primary">{title}</h4>
        <ol className="list-decimal list-inside text-sm text-text-main mt-2 space-y-1">
            {steps.split('\n').map((step, index) => <li key={index}>{step.replace(/^\d+\.\s*/, '')}</li>)}
        </ol>
        <a href={link} target="_blank" rel="noopener noreferrer" className="text-sm text-accent-green hover:text-accent-green-hover mt-3 inline-flex items-center gap-1.5">
            <span>Go to website</span>
            <ExternalLinkIcon className="w-4 h-4" />
        </a>
    </div>
);


const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, soraApiKey, onSoraApiKeyChange, googleApiKey, onGoogleApiKeyChange }) => {
  const { t } = useI18n();

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-surface rounded-xl p-6 w-full max-w-3xl border border-surface-light shadow-2xl flex flex-col gap-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
            <h2 className="text-2xl font-bold text-text-main">{t('settings.title')}</h2>
            <p className="text-text-secondary text-sm mt-1">{t('settings.subtitle')}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
                <label htmlFor="google-api-key" className="text-sm font-medium text-text-secondary">{t('settings.google_api_key')}</label>
                <input
                    id="google-api-key"
                    type="password"
                    placeholder={t('settings.google_api_key.placeholder')}
                    value={googleApiKey}
                    onChange={(e) => onGoogleApiKeyChange(e.target.value)}
                    className="w-full bg-surface-light border border-gray-600 rounded-md px-4 py-2 text-text-main placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                />
            </div>
            <div className="flex flex-col gap-2">
                <label htmlFor="sora-api-key" className="text-sm font-medium text-text-secondary">{t('settings.sora_api_key')}</label>
                <input
                    id="sora-api-key"
                    type="password"
                    placeholder={t('settings.sora_api_key.placeholder')}
                    value={soraApiKey}
                    onChange={(e) => onSoraApiKeyChange(e.target.value)}
                    className="w-full bg-surface-light border border-gray-600 rounded-md px-4 py-2 text-text-main placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                />
            </div>
        </div>

        <div>
            <h3 className="text-lg font-bold mb-3">{t('about.api_keys_intro')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <ApiInstruction 
                    title={t('about.google_api_key.title')} 
                    steps={t('about.google_api_key.steps')}
                    link="https://aistudio.google.com/app/apikey"
                />
                <ApiInstruction 
                    title={t('about.openai_api_key.title')} 
                    steps={t('about.openai_api_key.steps')}
                    link="https://platform.openai.com/api-keys"
                />
            </div>
        </div>


        <div className="flex justify-end gap-4 mt-2 pt-4 border-t border-surface-light">
            <button
                onClick={onClose}
                className="px-6 py-2 rounded-md font-semibold bg-primary hover:bg-primary-hover text-white transition-colors"
            >
                {t('settings.close')}
            </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;