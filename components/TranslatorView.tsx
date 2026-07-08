import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppDataManager } from '../hooks/useProfileManager';
import { translateTextToMixed } from '../services/aiService';
import { searchPictograms } from '../services/pictogramService';
import type { TextToken, SavedTranslation } from '../types';

// Import subcomponents
import { TranslatorHistory } from './translator/TranslatorHistory';
import { TranslatorWorkspace } from './translator/TranslatorWorkspace';
import { TranslatorVisualSettings } from './translator/TranslatorVisualSettings';
import { TranslatorActions } from './translator/TranslatorActions';
import { TokenEditModal } from './translator/TokenEditModal';

import type { Sliders } from './translator/TranslatorVisualSettings';

export const TranslatorView: React.FC = () => {
  const { 
    profiles, 
    activeProfile, 
    selectProfile,
    savedTranslations, 
    saveTranslation, 
    deleteTranslation,
    pictogramSettings,
    updatePictogramSettings
  } = useAppDataManager();

  const [text, setText] = useState<string>('');
  const [language, setLanguage] = useState<'auto' | 'es' | 'val' | 'en'>('auto');
  const [detectedLang, setDetectedLang] = useState<'es' | 'val' | 'en' | null>(null);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSearchingPictos, setIsSearchingPictos] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [tokens, setTokens] = useState<TextToken[]>([]);
  const [sliders, setSliders] = useState<Sliders>({
    noun: 100,
    verb: 50,
    adjective: 30,
    adverb: 10,
    determiner: 0,
    preposition: 0,
    conjunction: 0,
    pronoun: 0,
    other: 0
  });

  const [hideTextUnderPicto, setHideTextUnderPicto] = useState(false);

  // Modal State for editing a specific token
  const [selectedToken, setSelectedToken] = useState<TextToken | null>(null);

  // Active translation tracking
  const [loadedTranslationId, setLoadedTranslationId] = useState<string | null>(null);
  const [saveTitle, setSaveTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Calculate language code to use for queries
  const activeLang = useMemo(() => {
    if (language !== 'auto') return language;
    return detectedLang || 'es';
  }, [language, detectedLang]);

  // Reset tool state when profile switches
  useEffect(() => {
    setText('');
    setTokens([]);
    setDetectedLang(null);
    setLoadedTranslationId(null);
  }, [activeProfile?.id]);

  // Compute which tokens should have pictograms shown according to the POS sliders
  const visibleTokenIds = useMemo(() => {
    const visibleIds = new Set<string>();
    
    // Group words by their grammatical category
    const categories: Record<keyof Sliders, TextToken[]> = {
      noun: [],
      verb: [],
      adjective: [],
      adverb: [],
      determiner: [],
      preposition: [],
      conjunction: [],
      pronoun: [],
      other: []
    };

    tokens.forEach(token => {
      if (token.type === 'word') {
        const pos = token.pos || 'other';
        if (pos === 'noun') categories.noun.push(token);
        else if (pos === 'verb') categories.verb.push(token);
        else if (pos === 'adjective') categories.adjective.push(token);
        else if (pos === 'adverb') categories.adverb.push(token);
        else if (pos === 'determiner') categories.determiner.push(token);
        else if (pos === 'preposition') categories.preposition.push(token);
        else if (pos === 'conjunction') categories.conjunction.push(token);
        else if (pos === 'pronoun') categories.pronoun.push(token);
        else categories.other.push(token);
      }
    });

    // For each POS category, sort tokens by importance descending and select top S%
    (Object.keys(categories) as Array<keyof Sliders>).forEach(key => {
      const list = categories[key];
      const sliderVal = sliders[key];
      
      const sorted = [...list].sort((a, b) => {
        const impA = typeof a.importance === 'number' ? a.importance : parseFloat(a.importance as any) || 0;
        const impB = typeof b.importance === 'number' ? b.importance : parseFloat(b.importance as any) || 0;
        return impB - impA;
      });
      const countToShow = Math.round(sorted.length * (sliderVal / 100));
      
      for (let i = 0; i < countToShow; i++) {
        if (sorted[i]) {
          visibleIds.add(sorted[i].id);
        }
      }
    });

    return visibleIds;
  }, [tokens, sliders]);

  // Helper to determine if a token should show its pictogram
  const shouldShowPicto = useCallback((token: TextToken) => {
    if (token.manualOverride === 'show') return true;
    if (token.manualOverride === 'hide') return false;
    return visibleTokenIds.has(token.id);
  }, [visibleTokenIds]);

  // Process and translate text using the AI service and load pictograms
  const handleTranslate = async () => {
    if (!text.trim()) {
      setError('Por favor, escribe o pega un texto para traducir.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setTokens([]);
    setDetectedLang(null);
    setLoadedTranslationId(null);

    try {
      // Step 1: AI analysis (tokenization, pos tagging, importance rating, sliders recommendation)
      const result = await translateTextToMixed(text, language);
      setDetectedLang(result.language);
      
      // Setup initial sliders from AI recommendation (based on student profile)
      if (result.recommendedSliders) {
        setSliders({
          noun: result.recommendedSliders.noun ?? 100,
          verb: result.recommendedSliders.verb ?? 50,
          adjective: result.recommendedSliders.adjective ?? 30,
          adverb: result.recommendedSliders.adverb ?? 10,
          determiner: result.recommendedSliders.determiner ?? 0,
          preposition: result.recommendedSliders.preposition ?? 0,
          conjunction: result.recommendedSliders.conjunction ?? 0,
          pronoun: result.recommendedSliders.pronoun ?? 0,
          other: result.recommendedSliders.other ?? 0
        });
      }

      const rawTokens: TextToken[] = result.tokens.map((t, idx) => ({
        ...t,
        id: `t_${idx}_${Date.now()}`
      }));

      setTokens(rawTokens);
      setIsAnalyzing(false);
      setIsSearchingPictos(true);

      // Step 2: Fetch ARASAAC pictograms for concepts in parallel
      const searchLanguage = result.language;
      const updatedTokens = await Promise.all(
        rawTokens.map(async (token) => {
          if (token.type !== 'word' || !token.concept) {
            return token;
          }
          try {
            const results = await searchPictograms(token.concept, searchLanguage);
            if (results && results.length > 0) {
              return {
                ...token,
                pictoUrl: results[0].url,
                pictoId: results[0].id,
                pictoOptions: results.map(r => ({
                  id: r.id,
                  url: r.url,
                  label: r.keywords?.[0] || token.concept || ''
                }))
              };
            }
          } catch (e) {
            console.error(`Error loading pictogram for concept "${token.concept}":`, e);
          }
          return token;
        })
      );

      setTokens(updatedTokens);
    } catch (err: any) {
      console.error('Translation process error:', err);
      setError(err.message || 'Ocurrió un error inesperado al procesar la traducción.');
    } finally {
      setIsAnalyzing(false);
      setIsSearchingPictos(false);
    }
  };

  // Open Edit Modal for a token
  const handleTokenClick = (token: TextToken) => {
    setSelectedToken(token);
  };

  // Save changes from Edit Modal (handles single or cascading updates)
  const handleUpdateToken = (updatedToken: TextToken, applyToAllInstances: boolean = false) => {
    setTokens(prev => prev.map(t => {
      if (t.id === updatedToken.id) {
        return updatedToken;
      }
      if (applyToAllInstances && t.type === 'word' && selectedToken) {
        const cleanTText = t.text.trim().toLowerCase();
        const cleanSelText = selectedToken.text.trim().toLowerCase();
        const cleanTConcept = t.concept?.trim().toLowerCase();
        const cleanSelConcept = selectedToken.concept?.trim().toLowerCase();
        
        const isWordMatch = cleanTText === cleanSelText;
        const isConceptMatch = cleanTConcept && cleanSelConcept && cleanTConcept === cleanSelConcept;
        
        if (isWordMatch || isConceptMatch) {
          return {
            ...t,
            pictoUrl: updatedToken.pictoUrl,
            pictoId: updatedToken.pictoId,
            concept: updatedToken.concept,
            pictoOptions: updatedToken.pictoOptions || t.pictoOptions,
            manualOverride: updatedToken.manualOverride
          };
        }
      }
      return t;
    }));
    setSelectedToken(null);
  };

  // Load a saved translation from history
  const handleLoadTranslation = (translation: SavedTranslation) => {
    setLoadedTranslationId(translation.id);
    setText(translation.originalText);
    setLanguage(translation.language);
    setDetectedLang(translation.language);
    
    // For backwards compatibility, default to 0 for missing categories
    const loadedSliders = (translation.sliders || {}) as any;
    setSliders({
      noun: loadedSliders.noun ?? 100,
      verb: loadedSliders.verb ?? 50,
      adjective: loadedSliders.adjective ?? 30,
      adverb: loadedSliders.adverb ?? 10,
      determiner: loadedSliders.determiner ?? 0,
      preposition: loadedSliders.preposition ?? 0,
      conjunction: loadedSliders.conjunction ?? 0,
      pronoun: loadedSliders.pronoun ?? 0,
      other: loadedSliders.other ?? 0
    });
    setTokens(translation.tokens);
    setError(null);
  };

  // Delete translation from history and reset state if it is currently loaded
  const handleDeleteTranslation = (id: string) => {
    deleteTranslation(id);
    if (loadedTranslationId === id) {
      setLoadedTranslationId(null);
      setTokens([]);
    }
  };

  // Save the current translation
  const handleSaveTranslation = () => {
    if (tokens.length === 0) return;
    setIsSaving(true);

    const titleToUse = saveTitle.trim() || text.slice(0, 30).trim() + (text.length > 30 ? '...' : '');

    try {
      saveTranslation({
        title: titleToUse,
        originalText: text,
        tokens,
        language: activeLang,
        sliders
      });
      setSaveTitle('');
      setIsSaving(false);
    } catch (err) {
      console.error('Error saving translation:', err);
      setIsSaving(false);
    }
  };

  // Trigger browser print dialog
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)_320px] gap-5 relative">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}} />

      {/* LEFT COLUMN: History / Saved Translations */}
      <TranslatorHistory
        profiles={profiles}
        activeProfile={activeProfile}
        selectProfile={selectProfile}
        savedTranslations={savedTranslations || []}
        onLoadTranslation={handleLoadTranslation}
        onDeleteTranslation={handleDeleteTranslation}
        loadedTranslationId={loadedTranslationId}
      />

      {/* CENTER COLUMN: Text Editor & Render Area */}
      <TranslatorWorkspace
        activeProfile={activeProfile}
        text={text}
        setText={setText}
        language={language}
        setLanguage={setLanguage}
        detectedLang={detectedLang}
        isAnalyzing={isAnalyzing}
        isSearchingPictos={isSearchingPictos}
        error={error}
        tokens={tokens}
        shouldShowPicto={shouldShowPicto}
        hideTextUnderPicto={hideTextUnderPicto}
        onTranslate={handleTranslate}
        onTokenClick={handleTokenClick}
      />

      {/* RIGHT COLUMN: Controls & Sliders */}
      <aside className="no-print space-y-4">
        <TranslatorVisualSettings
          sliders={sliders}
          setSliders={setSliders}
          hideTextUnderPicto={hideTextUnderPicto}
          setHideTextUnderPicto={setHideTextUnderPicto}
        />
        <TranslatorActions
          tokens={tokens}
          saveTitle={saveTitle}
          setSaveTitle={setSaveTitle}
          isSaving={isSaving}
          onSave={handleSaveTranslation}
          onPrint={handlePrint}
        />
      </aside>

      {/* MODAL: Edit individual token pictograms */}
      {selectedToken && (
        <TokenEditModal
          selectedToken={selectedToken}
          onClose={() => setSelectedToken(null)}
          onUpdateToken={handleUpdateToken}
          activeLang={activeLang}
          searchLanguage={pictogramSettings.searchLanguage || 'es'}
          onSearchLanguageChange={(lang) => updatePictogramSettings({ searchLanguage: lang })}
        />
      )}
    </div>
  );
};
