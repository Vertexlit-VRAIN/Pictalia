import React, { useState, useEffect } from 'react';
import { SearchIcon } from '../Icons';
import { Spinner } from '../Spinner';
import { searchPictograms } from '../../services/pictogramService';
import type { TextToken } from '../../types';

interface TokenEditModalProps {
  selectedToken: TextToken;
  onClose: () => void;
  onUpdateToken: (updatedToken: TextToken, applyToAll: boolean) => void;
  activeLang: 'es' | 'val' | 'en';
  searchLanguage: 'es' | 'val' | 'en';
  onSearchLanguageChange: (lang: 'es' | 'val' | 'en') => void;
}

export const TokenEditModal: React.FC<TokenEditModalProps> = ({
  selectedToken,
  onClose,
  onUpdateToken,
  activeLang,
  searchLanguage,
  onSearchLanguageChange,
}) => {
  const [applyToAll, setApplyToAll] = useState(false);
  const [customSearchTerm, setCustomSearchTerm] = useState('');
  const [localSearchLanguage, setLocalSearchLanguage] = useState<'es' | 'val' | 'en'>(searchLanguage);
  const [customSearchResults, setCustomSearchResults] = useState<any[]>([]);
  const [isCustomSearching, setIsCustomSearching] = useState(false);

  useEffect(() => {
    setLocalSearchLanguage(searchLanguage);
  }, [searchLanguage]);

  const handleLanguageChange = (lang: 'es' | 'val' | 'en') => {
    setLocalSearchLanguage(lang);
    onSearchLanguageChange(lang);
  };

  const handleCustomSearch = async () => {
    if (!customSearchTerm.trim()) return;
    setIsCustomSearching(true);
    try {
      const results = await searchPictograms(customSearchTerm.trim(), localSearchLanguage);
      setCustomSearchResults(results);
    } catch (err) {
      console.error('Custom pictogram search error:', err);
    } finally {
      setIsCustomSearching(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm no-print">
      <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-xl max-h-[85vh] overflow-y-auto" role="dialog" aria-modal="true">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-black text-slate-900">
              Editar palabra: <span className="text-sky-700">"{selectedToken.text}"</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Concepto base: <span className="font-semibold">{selectedToken.concept || 'Ninguno'}</span> | Categoría: <span className="font-semibold">{selectedToken.pos}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 p-1"
            aria-label="Cerrar modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Checkbox to apply to all instances */}
        <div className="mb-4 flex items-center gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100">
          <input
            type="checkbox"
            id="apply-to-all-checkbox"
            checked={applyToAll}
            onChange={(e) => setApplyToAll(e.target.checked)}
            className="w-4.5 h-4.5 text-sky-600 border-slate-300 rounded focus:ring-sky-500 cursor-pointer"
          />
          <label htmlFor="apply-to-all-checkbox" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
            Aplicar cambios a todas las instancias de esta palabra ("{selectedToken.text}")
          </label>
        </div>

        {/* Visibility checkbox override */}
        <div className="bg-slate-50 p-4 rounded-2xl mb-5 flex items-center justify-between border border-slate-100">
          <div>
            <span className="block text-sm font-bold text-slate-800">
              Forzar apoyo visual
            </span>
            <span className="block text-xs text-slate-500">
              Muestra u oculta el pictograma de forma manual independientemente de los sliders.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onUpdateToken({ ...selectedToken, manualOverride: 'show' }, applyToAll)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedToken.manualOverride === 'show'
                  ? 'bg-sky-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Mostrar siempre
            </button>
            <button
              onClick={() => onUpdateToken({ ...selectedToken, manualOverride: 'hide' }, applyToAll)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedToken.manualOverride === 'hide'
                  ? 'bg-rose-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Ocultar siempre
            </button>
            <button
              onClick={() => onUpdateToken({ ...selectedToken, manualOverride: undefined }, applyToAll)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedToken.manualOverride === undefined
                  ? 'bg-slate-700 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Usar Sliders
            </button>
          </div>
        </div>

        {/* Alternatives Grid (already retrieved from ARASAAC) */}
        <div className="mb-5">
          <h4 className="text-sm font-extrabold text-slate-800 mb-2">
            Alternativas de ARASAAC para "{selectedToken.concept}"
          </h4>
          {selectedToken.pictoOptions && selectedToken.pictoOptions.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 max-h-[150px] overflow-y-auto pr-1">
              {selectedToken.pictoOptions.map(option => (
                <button
                  key={option.id}
                  onClick={() => onUpdateToken({ 
                    ...selectedToken, 
                    pictoUrl: option.url, 
                    pictoId: option.id 
                  }, applyToAll)}
                  className={`flex flex-col items-center rounded-xl p-1 border transition hover:border-sky-500 hover:bg-sky-50/50 ${
                    selectedToken.pictoId === option.id 
                      ? 'border-sky-600 bg-sky-50 ring-2 ring-sky-100' 
                      : 'border-slate-100 bg-slate-50/50'
                  }`}
                >
                  <img src={option.url} alt={option.label} className="h-10 w-10 object-contain" />
                  <span className="text-[9px] text-slate-500 text-center truncate w-full mt-1">
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No se cargaron alternativas automáticas.</p>
          )}
        </div>

        {/* Custom Search form */}
        <div className="border-t border-slate-100 pt-4">
          <h4 className="text-sm font-extrabold text-slate-800 mb-2">
            Buscar un concepto diferente
          </h4>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={customSearchTerm}
              onChange={(e) => setCustomSearchTerm(e.target.value)}
              placeholder="Ej: cabaña, saltar, contento..."
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              onKeyDown={(e) => e.key === 'Enter' && handleCustomSearch()}
            />
            <select
              value={localSearchLanguage}
              onChange={(e: any) => handleLanguageChange(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="es">Castellano (es)</option>
              <option value="val">Valenciano (val)</option>
              <option value="en">Inglés (en)</option>
            </select>
            <button
              onClick={handleCustomSearch}
              disabled={isCustomSearching || !customSearchTerm.trim()}
              className="inline-flex items-center gap-1 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white rounded-xl px-4 py-2 text-sm font-semibold transition"
            >
              {isCustomSearching ? <Spinner className="h-3 w-3 text-white animate-spin" /> : <SearchIcon className="h-3.5 w-3.5" />}
              <span>Buscar</span>
            </button>
          </div>

          {/* Custom Search Results grid */}
          {customSearchResults.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 max-h-[160px] overflow-y-auto pr-1 border border-slate-100 rounded-xl p-2 bg-slate-50/30">
              {customSearchResults.map(option => (
                <button
                  key={option.id}
                  onClick={() => onUpdateToken({ 
                    ...selectedToken, 
                    pictoUrl: option.url, 
                    pictoId: option.id,
                    concept: customSearchTerm.trim() 
                  }, applyToAll)}
                  className="flex flex-col items-center rounded-xl p-1 border border-slate-200 bg-white hover:border-sky-500 hover:bg-sky-50/50 transition"
                >
                  <img src={option.url} alt={option.keywords?.[0]} className="h-10 w-10 object-contain" />
                  <span className="text-[9px] text-slate-500 text-center truncate w-full mt-1">
                    {option.keywords?.[0] || customSearchTerm}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
