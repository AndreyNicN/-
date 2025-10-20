import React, { useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { SaveIcon, TrashIcon } from './Icons';
import { presetPrompts } from '../prompts/presets';
import { CustomPrompt } from '../types';

interface PromptLibraryProps {
  onSelectPrompt: (prompt: string) => void;
  onSavePrompt: (title: string, prompt: string) => Promise<void>;
  onDeletePrompt: (id: number) => Promise<void>;
  customPrompts: CustomPrompt[];
  currentPrompt: string;
}

const PromptLibrary: React.FC<PromptLibraryProps> = ({ onSelectPrompt, onSavePrompt, onDeletePrompt, customPrompts, currentPrompt }) => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [newPromptTitle, setNewPromptTitle] = useState('');

  const handleSaveClick = () => {
    if (!currentPrompt.trim()) return;
    setIsSaveModalOpen(true);
  };

  const handleConfirmSave = async () => {
    if (newPromptTitle.trim() && currentPrompt.trim()) {
      await onSavePrompt(newPromptTitle, currentPrompt);
      setNewPromptTitle('');
      setIsSaveModalOpen(false);
      setActiveTab('custom');
    }
  };

  const TabButton: React.FC<{ tab: 'presets' | 'custom'; children: React.ReactNode }> = ({ tab, children }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`w-1/2 py-2 text-sm font-semibold rounded-t-md transition-colors ${activeTab === tab ? 'bg-surface-light text-primary' : 'bg-brand-bg text-text-secondary hover:bg-selection'}`}
    >
      {children}
    </button>
  );

  return (
    <div className="w-full h-full flex-shrink-0 bg-surface rounded-md border border-surface-light flex flex-col">
      <div className="flex-shrink-0 p-2">
        <h3 className="text-sm font-bold text-center text-text-secondary">{t('prompts.title')}</h3>
      </div>
      <div className="flex-shrink-0 flex border-b border-surface-light">
        <TabButton tab="presets">{t('prompts.presets')}</TabButton>
        <TabButton tab="custom">{t('prompts.my_prompts')}</TabButton>
      </div>
      <div className="flex-grow overflow-y-auto p-2 space-y-2">
        {activeTab === 'presets' && presetPrompts.map(p => (
          <button key={p.title} onClick={() => onSelectPrompt(p.prompt)} className="w-full text-left text-sm p-2 bg-selection rounded hover:bg-primary hover:text-white transition-colors truncate">
            {p.title}
          </button>
        ))}
        {activeTab === 'custom' && (
          <>
            {customPrompts.length === 0 && <p className="text-xs text-text-secondary text-center p-4">{t('chart.no_data')}</p>}
            {customPrompts.map(p => (
              <div key={p.id} className="group flex items-center justify-between text-sm p-2 bg-selection rounded hover:bg-surface-light transition-colors">
                <button onClick={() => onSelectPrompt(p.prompt)} className="flex-grow text-left truncate pr-2">
                  {p.title}
                </button>
                <button onClick={() => onDeletePrompt(p.id!)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-500 transition-opacity">
                    <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
          </>
        )}
      </div>
      <div className="flex-shrink-0 p-2 border-t border-surface-light">
        <button 
          onClick={handleSaveClick}
          disabled={!currentPrompt.trim()}
          className="w-full flex items-center justify-center gap-2 text-sm p-2 bg-accent-orange hover:bg-accent-orange-hover text-white rounded font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <SaveIcon className="w-4 h-4" />
          <span>{t('prompts.save_current')}</span>
        </button>
      </div>

      {isSaveModalOpen && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setIsSaveModalOpen(false)}>
            <div className="bg-surface p-6 rounded-lg shadow-xl w-96" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold mb-4">{t('prompts.save_prompt_title')}</h3>
                <input
                    type="text"
                    value={newPromptTitle}
                    onChange={e => setNewPromptTitle(e.target.value)}
                    placeholder={t('prompts.enter_title_placeholder')}
                    className="w-full bg-surface-light border border-gray-600 rounded-md p-2 text-text-main placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                    autoFocus
                />
                <div className="flex justify-end gap-3 mt-4">
                    <button onClick={() => setIsSaveModalOpen(false)} className="px-4 py-2 text-sm rounded bg-surface-light hover:bg-selection">{t('prompts.cancel')}</button>
                    <button onClick={handleConfirmSave} className="px-4 py-2 text-sm rounded bg-primary hover:bg-primary-hover text-white">{t('prompts.save')}</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default PromptLibrary;