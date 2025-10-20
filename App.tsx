

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { ModelType, GenerationState, Rating, AspectRatio, VideoResult, CustomPrompt, VideoDuration } from './types';
import { generateVeoVideo, QuotaExceededError } from './services/geminiService';
import { generateSoraVideo } from './services/soraService';
import { initDB, addRating, getAllRatings, getAllPrompts, addPrompt, deletePrompt } from './services/dbService';
import GenerationPanel from './components/GenerationPanel';
import { ZapIcon, SettingsIcon, GlobeIcon, InfoIcon, GiftIcon, LandscapeIcon, PortraitIcon, AbstractBackground, UploadIcon } from './components/Icons';
import { useI18n } from './i18n/I18nContext';
import SettingsModal from './components/SettingsModal';
import AboutModal from './components/AboutModal';
import RatingsLeaderboard from './components/RatingsLeaderboard';
import { Language, translations } from './i18n/locales';
import HistoryCarousel from './components/HistoryCarousel';
import ToggleSwitch from './components/ToggleSwitch';
import PromptLibrary from './components/PromptLibrary';

const initialGenerationState: GenerationState = {
  status: 'idle',
  progress: 0,
  message: '',
  result: null,
  error: null,
};

const getModelOptions = (t: (key: string) => string) => [
  { value: ModelType.NONE, label: t('model.none'), apiKeyRequired: false },
  { value: ModelType.VEO_2, label: t('model.veo_2'), apiKeyRequired: true },
  { value: ModelType.VEO_3, label: t('model.veo_3'), apiKeyRequired: true },
  { value: ModelType.SORA_2, label: t('model.sora_2'), apiKeyRequired: true },
  { value: ModelType.SORA_2_PRO, label: t('model.sora_2_pro'), apiKeyRequired: true },
];

type GenerationMode = 'comparison' | 'single';

function App() {
  const { t, setLanguage, language } = useI18n();
  const modelOptions = useMemo(() => getModelOptions(t), [t]);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [prompt, setPrompt] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [duration, setDuration] = useState<VideoDuration>('short');
  const [generationMode, setGenerationMode] = useState<GenerationMode>('comparison');

  const [leftPanelModel, setLeftPanelModel] = useState<ModelType>(ModelType.VEO_2);
  const [rightPanelModel, setRightPanelModel] = useState<ModelType>(ModelType.SORA_2);

  const [leftPanelState, setLeftPanelState] = useState<GenerationState>(initialGenerationState);
  const [rightPanelState, setRightPanelState] = useState<GenerationState>(initialGenerationState);
  
  const [sessionHistory, setSessionHistory] = useState<VideoResult[]>([]);

  const [soraApiKey, setSoraApiKey] = useState<string>('');
  const [googleApiKey, setGoogleApiKey] = useState<string>('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [customPrompts, setCustomPrompts] = useState<CustomPrompt[]>([]);
  const [hasGeneratedOnce, setHasGeneratedOnce] = useState(false);

  useEffect(() => {
    // This allows the default prompt to change with the language,
    // but only if the user hasn't modified it.
    const allDefaultPrompts = Object.values(translations).map(lang => lang['prompt.default']);
    if (prompt === '' || allDefaultPrompts.includes(prompt)) {
        setPrompt(t('prompt.default'));
    }
  }, [language, t]);

  const loadPrompts = useCallback(async () => {
    const prompts = await getAllPrompts();
    setCustomPrompts(prompts);
  }, []);

  useEffect(() => {
    const initializeApp = async () => {
      await initDB();
      const allRatings = await getAllRatings();
      setRatings(allRatings);
      await loadPrompts();
      const hasGenerated = localStorage.getItem('hasGeneratedOnce') === 'true';
      if (hasGenerated) {
        setHasGeneratedOnce(true);
      }
    };
    initializeApp();
  }, [loadPrompts]);

  const handleRate = async (panelState: GenerationState, rating: number) => {
    if (!panelState.result) return;
    
    const newRating: Rating = {
      resultId: panelState.result.id,
      model: panelState.result.model,
      rating,
      prompt,
      timestamp: Date.now(),
    };
    
    await addRating(newRating);
    const allRatings = await getAllRatings();
    setRatings(allRatings);
  };
  
  const isGenerating = (leftPanelState.status !== 'idle' && leftPanelState.status !== 'completed' && leftPanelState.status !== 'failed') ||
                       (rightPanelState.status !== 'idle' && rightPanelState.status !== 'completed' && rightPanelState.status !== 'failed');

  const runGenerationForPanel = async (model: ModelType, setState: React.Dispatch<React.SetStateAction<GenerationState>>, genDuration: VideoDuration) => {
      const setProgress = (update: Partial<GenerationState> & { messageKey?: string }) => {
        setState(prevState => ({ 
          ...prevState, 
          ...update,
          message: update.messageKey ? t(update.messageKey) : prevState.message 
        }));
      };

      try {
        let videoUrl: string | null = null;
        if (model === ModelType.VEO_2 || model === ModelType.VEO_3) {
            try {
                videoUrl = await generateVeoVideo(prompt, imageFile, aspectRatio, setProgress, process.env.API_KEY || '', model, genDuration);
            } catch (error) {
                if (error instanceof QuotaExceededError) {
                    if (!googleApiKey) {
                        setProgress({ status: 'failed', error: t('error.quota_exceeded_no_key') });
                        return;
                    }
                    if (window.confirm(t('confirm.use_paid_key'))) {
                        setProgress({ status: 'generating', messageKey: 'status.retrying_with_key', progress: 5 });
                        try {
                            videoUrl = await generateVeoVideo(prompt, imageFile, aspectRatio, setProgress, googleApiKey, model, genDuration);
                        } catch (paidError) {
                            console.error(`Error generating with user key ${model}:`, paidError);
                            setProgress({ status: 'failed', error: paidError instanceof Error ? paidError.message : String(paidError) });
                            return;
                        }
                    } else {
                        setProgress({ status: 'failed', error: t('error.generation_cancelled') });
                        return;
                    }
                } else {
                    throw error; // Re-throw non-quota errors to be caught by the outer block
                }
            }
        } else if (model === ModelType.SORA_2 || model === ModelType.SORA_2_PRO) {
            videoUrl = await generateSoraVideo(prompt, soraApiKey, model, aspectRatio, setProgress, genDuration);
        }

        if (videoUrl) {
            const result: VideoResult = { id: crypto.randomUUID(), url: videoUrl, model: model };
            setProgress({
                status: 'completed',
                message: t('status.complete'),
                progress: 100,
                result: result
            });
            setSessionHistory(prev => [result, ...prev]);
            if (!hasGeneratedOnce) {
              setHasGeneratedOnce(true);
              localStorage.setItem('hasGeneratedOnce', 'true');
            }
        }
      } catch (error) {
        console.error(`Error generating with ${model}:`, error);
        setProgress({
            status: 'failed',
            error: error instanceof Error ? error.message : String(error)
        });
      }
  };

  const handleGeneration = useCallback(async () => {
    setLeftPanelState(initialGenerationState);
    setRightPanelState(initialGenerationState);

    const panelsToGenerate = [];
    if (generationMode === 'comparison') {
        if (leftPanelModel !== ModelType.NONE) panelsToGenerate.push({ model: leftPanelModel, setState: setLeftPanelState });
        if (rightPanelModel !== ModelType.NONE) panelsToGenerate.push({ model: rightPanelModel, setState: setRightPanelState });
    } else {
        if (leftPanelModel !== ModelType.NONE) panelsToGenerate.push({ model: leftPanelModel, setState: setLeftPanelState });
    }

    if (panelsToGenerate.length === 0 || !prompt.trim()) return;

    panelsToGenerate.forEach(p => p.setState({ ...initialGenerationState, status: 'queued', message: t('status.queued')}));
    
    await Promise.all(panelsToGenerate.map(p => runGenerationForPanel(p.model, p.setState, duration)));
  }, [prompt, imageFile, leftPanelModel, rightPanelModel, soraApiKey, googleApiKey, t, hasGeneratedOnce, aspectRatio, generationMode, duration]);
  
  const handleSingleGeneration = useCallback(async (model: ModelType, setState: React.Dispatch<React.SetStateAction<GenerationState>>) => {
    if (model === ModelType.NONE || !prompt.trim()) return;
    setState({ ...initialGenerationState, status: 'queued', message: t('status.queued')});
    await runGenerationForPanel(model, setState, duration);
  }, [prompt, imageFile, soraApiKey, googleApiKey, t, hasGeneratedOnce, aspectRatio, duration]);

  const handleSavePrompt = async (title: string, promptToSave: string) => {
    await addPrompt({ title, prompt: promptToSave });
    await loadPrompts();
  };

  const handleDeletePrompt = async (id: number) => {
    if (window.confirm(t('prompts.delete_confirm'))) {
      await deletePrompt(id);
      await loadPrompts();
    }
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        setImageFile(file);
    }
  };

  const clearImage = () => {
    setImageFile(null);
    if (imageInputRef.current) {
        imageInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg text-text-main p-4 lg:p-8 font-sans relative overflow-hidden">
      <AbstractBackground className="absolute top-0 left-0 w-full h-full text-primary opacity-50 filter blur-xl pointer-events-none" />
      <div className="max-w-7xl mx-auto relative z-10">
        <header className="mb-8">
            <div className="flex justify-between items-center">
                <div>
                    <div className="flex items-baseline gap-3">
                        <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent-orange to-primary animate-gradient-x">{t('app.title')}</h1>
                        <span className="text-lg font-medium text-text-secondary">v2.10</span>
                    </div>
                    <p className="text-text-secondary mt-1 text-base">{t('app.subtitle')}</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <GlobeIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value as Language)}
                            className="bg-surface border border-surface-light rounded-md pl-10 pr-8 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
                        >
                            <option value="ru">Русский</option>
                            <option value="en">English</option>
                            <option value="uk">Українська</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                    </div>
                     <button onClick={() => setIsAboutOpen(true)} className="p-2 rounded-md hover:bg-surface-light transition-colors" title={t('about.title')}>
                        <InfoIcon className="w-6 h-6" />
                    </button>
                    <button onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-md hover:bg-surface-light transition-colors" title={t('settings.title')}>
                        <SettingsIcon className="w-6 h-6" />
                    </button>
                </div>
            </div>
        </header>

        <main className="flex flex-col gap-8 pb-40">
          <div className="bg-surface p-6 rounded-xl border border-surface-light flex flex-col gap-4">
            <div className="flex flex-col lg:flex-row gap-4 items-stretch h-[240px]">
              {/* Col 1: Library */}
              <div className="lg:flex-[2] min-w-[280px] h-full">
                <PromptLibrary 
                  onSelectPrompt={setPrompt}
                  onSavePrompt={handleSavePrompt}
                  onDeletePrompt={handleDeletePrompt}
                  customPrompts={customPrompts}
                  currentPrompt={prompt}
                />
              </div>

              {/* Col 2: Prompt */}
              <div className="lg:flex-[3] min-w-0 h-full">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={t('prompt.placeholder')}
                  className="w-full h-full bg-surface-light border border-gray-600 rounded-md p-4 text-text-main placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary transition-shadow resize-y"
                />
              </div>

              {/* Col 3: Controls */}
              <div className="flex-1 flex flex-col justify-between h-full min-w-[200px]">
                  <div className="flex flex-col gap-4">
                      <div className="bg-brand-bg rounded-lg p-1 flex text-sm font-medium w-full">
                          <button
                              onClick={() => setAspectRatio('16:9')}
                              className={`w-1/2 py-2.5 rounded-l-md flex justify-center items-center transition-colors ${aspectRatio === '16:9' ? 'bg-primary text-white shadow' : 'text-text-secondary hover:bg-selection'}`}
                              title={t('aspect_ratio.horizontal')}
                          >
                              <LandscapeIcon className="w-6 h-6" />
                          </button>
                          <button
                              onClick={() => setAspectRatio('9:16')}
                              className={`w-1/2 py-2.5 rounded-r-md flex justify-center items-center transition-colors ${aspectRatio === '9:16' ? 'bg-primary text-white shadow' : 'text-text-secondary hover:bg-selection'}`}
                              title={t('aspect_ratio.vertical')}
                          >
                              <PortraitIcon className="w-6 h-6" />
                          </button>
                      </div>

                      <div className="relative">
                        <select
                            id="duration-select"
                            value={duration}
                            onChange={(e) => setDuration(e.target.value as VideoDuration)}
                            className="w-full bg-surface-light border border-gray-600 rounded-md px-3 py-2 text-text-main text-sm focus:outline-none focus:ring-2 focus:ring-primary appearance-none text-center"
                        >
                            <option value="short">{t('duration.short')}</option>
                            <option value="medium">{t('duration.medium')}</option>
                            <option value="long">{t('duration.long')}</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                      </div>

                       <div className="flex flex-col gap-1">
                          <input
                              type="file"
                              ref={imageInputRef}
                              onChange={handleImageChange}
                              accept="image/png, image/jpeg"
                              className="hidden"
                              id="image-upload"
                          />
                          <label
                              htmlFor="image-upload"
                              className="w-full text-center cursor-pointer text-sm bg-surface-light border border-gray-600 rounded-md px-3 py-2 text-text-main hover:bg-selection transition-colors flex items-center justify-center gap-2"
                          >
                              <UploadIcon className="w-4 h-4" />
                              <span>{t('button.image_reference')}</span>
                          </label>
                          {imageFile && (
                              <div className="text-xs text-center text-text-secondary flex items-center justify-center gap-2">
                                  <span className="truncate max-w-[150px]">{imageFile.name}</span>
                                  <button onClick={clearImage} className="text-red-400 hover:text-red-500 font-bold">&times;</button>
                              </div>
                          )}
                      </div>

                      <div className="flex justify-center w-full py-1">
                          <ToggleSwitch
                              id="generation-mode-toggle"
                              checked={generationMode === 'comparison'}
                              onChange={(isChecked) => setGenerationMode(isChecked ? 'comparison' : 'single')}
                              labelLeft={t('mode.single')}
                              labelRight={t('mode.comparison')}
                          />
                      </div>
                  </div>
                  
                  <button
                      onClick={handleGeneration}
                      disabled={isGenerating || !prompt.trim()}
                      className="w-full flex items-center justify-center gap-3 bg-accent-green hover:bg-accent-green-hover text-gray-800 px-8 py-4 rounded-md font-bold text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-surface-light disabled:text-text-secondary shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                      <ZapIcon className="w-6 h-6" />
                      <span>{isGenerating ? t('button.generating') : t('button.generate')}</span>
                  </button>
              </div>
            </div>
          </div>
          
          <div className={`grid ${generationMode === 'comparison' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'} gap-8`}>
              <GenerationPanel
                panelId="left"
                title={generationMode === 'comparison' ? t('generator.1.title') : (modelOptions.find(m => m.value === leftPanelModel)?.label || t('generator.1.title'))}
                selectedModel={leftPanelModel}
                onModelChange={setLeftPanelModel}
                state={leftPanelState}
                modelOptions={modelOptions}
                onRate={(rating) => handleRate(leftPanelState, rating)}
                isRated={!!leftPanelState.result && ratings.some(r => r.resultId === leftPanelState.result?.id)}
                imageFile={imageFile}
                onGenerateHere={
                  generationMode === 'comparison' && leftPanelState.status === 'idle' && rightPanelState.status === 'completed' && leftPanelModel !== ModelType.NONE
                  ? () => handleSingleGeneration(leftPanelModel, setLeftPanelState)
                  : undefined
                }
              />
              {generationMode === 'comparison' && (
                <GenerationPanel
                  panelId="right"
                  title={t('generator.2.title')}
                  selectedModel={rightPanelModel}
                  onModelChange={setRightPanelModel}
                  state={rightPanelState}
                  modelOptions={modelOptions}
                  onRate={(rating) => handleRate(rightPanelState, rating)}
                  isRated={!!rightPanelState.result && ratings.some(r => r.resultId === rightPanelState.result?.id)}
                  imageFile={imageFile}
                  onGenerateHere={
                    rightPanelState.status === 'idle' && leftPanelState.status === 'completed' && rightPanelModel !== ModelType.NONE
                    ? () => handleSingleGeneration(rightPanelModel, setRightPanelState)
                    : undefined
                  }
                />
              )}
          </div>

          {hasGeneratedOnce ? (
            <RatingsLeaderboard ratings={ratings} modelOptions={modelOptions} />
          ) : (
            <div className="relative bg-surface p-8 rounded-xl border border-surface-light shadow-lg text-center overflow-hidden">
                <div className="absolute top-0 left-0 w-64 h-64 bg-primary/10 rounded-full filter blur-3xl opacity-50 -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-accent-orange/10 rounded-full filter blur-3xl opacity-50 translate-x-1/2 translate-y-1/2"></div>
                
                <div className="relative z-10">
                    <GiftIcon className="w-16 h-16 mx-auto mb-4 text-primary" />
                    <h2 className="text-2xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent-orange">{t('chart.unlock_message_title')}</h2>
                    <p className="text-text-secondary max-w-md mx-auto">{t('chart.unlock_message_body')}</p>
                </div>
            </div>
          )}

        </main>
      </div>
       <HistoryCarousel history={sessionHistory} modelOptions={modelOptions} />
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        soraApiKey={soraApiKey}
        onSoraApiKeyChange={setSoraApiKey}
        googleApiKey={googleApiKey}
        onGoogleApiKeyChange={setGoogleApiKey}
      />
       <AboutModal 
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />
    </div>
  );
}

export default App;