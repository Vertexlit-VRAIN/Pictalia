import React, { useRef, useEffect } from 'react';
import { SparklesIcon } from '../Icons';
import { Spinner } from '../Spinner';
import type { TextToken, Profile } from '../../types';

// Auto-resizing textarea with a set minimum height
const AutoResizeTextarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ className, ...props }) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const element = textareaRef.current;
    if (!element) return;
    element.style.height = 'auto';
    element.style.height = `${element.scrollHeight}px`;
  }, [props.value]);

  return (
    <textarea
      {...props}
      ref={textareaRef}
      className={className}
    />
  );
};

interface TranslatorWorkspaceProps {
  activeProfile: Profile | null;
  text: string;
  setText: (val: string) => void;
  language: 'auto' | 'es' | 'val' | 'en';
  setLanguage: (lang: 'auto' | 'es' | 'val' | 'en') => void;
  detectedLang: 'es' | 'val' | 'en' | null;
  isAnalyzing: boolean;
  isSearchingPictos: boolean;
  error: string | null;
  tokens: TextToken[];
  shouldShowPicto: (token: TextToken) => boolean;
  hideTextUnderPicto: boolean;
  onTranslate: () => void;
  onTokenClick: (token: TextToken) => void;
}

export const TranslatorWorkspace: React.FC<TranslatorWorkspaceProps> = ({
  activeProfile,
  text,
  setText,
  language,
  setLanguage,
  detectedLang,
  isAnalyzing,
  isSearchingPictos,
  error,
  tokens,
  shouldShowPicto,
  hideTextUnderPicto,
  onTranslate,
  onTokenClick,
}) => {
  return (
    <main className="min-w-0 space-y-5">
      <section className="no-print relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/50">
        <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-sky-400 via-cyan-400 to-emerald-400" />
        
        <h2 className="text-2xl font-black text-slate-900 mb-2">Traductor de Texto a Pictogramas</h2>
        <p className="text-sm text-slate-500 mb-4">
          Escribe un texto en valenciano, castellano o inglés. El sistema detectará el idioma y creará una aproximación visual según el perfil pedagógico de <strong>{activeProfile?.name}</strong>.
        </p>

        <div className="space-y-4">
          <div>
            <label htmlFor="translator-text-input" className="sr-only">Texto a traducir</label>
            <AutoResizeTextarea
              id="translator-text-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Escribe o pega aquí el texto que quieres adaptar... (Ej: El xiquet viu en una casa gran.)"
              className="w-full min-h-[150px] resize-none overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100 shadow-inner transition"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl">
            <div className="flex items-center gap-2">
              <label htmlFor="lang-select" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Idioma:
              </label>
              <select
                id="lang-select"
                value={language}
                onChange={(e: any) => setLanguage(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="auto">Detectar automáticamente</option>
                <option value="es">Castellano (es)</option>
                <option value="val">Valenciano (val)</option>
                <option value="en">Inglés (en)</option>
              </select>
              {detectedLang && language === 'auto' && (
                <span className="text-xs font-semibold bg-sky-100 text-sky-800 px-2 py-1 rounded-lg">
                  Detectado: {detectedLang.toUpperCase()}
                </span>
              )}
            </div>

            <button
              onClick={onTranslate}
              disabled={isAnalyzing || isSearchingPictos || !text.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 font-semibold text-white transition hover:bg-sky-700 disabled:bg-slate-200 disabled:text-slate-400"
            >
              {isAnalyzing ? (
                <>
                  <Spinner className="h-4 w-4 text-white animate-spin" />
                  <span>Analizando texto...</span>
                </>
              ) : isSearchingPictos ? (
                <>
                  <Spinner className="h-4 w-4 text-white animate-spin" />
                  <span>Buscando pictos...</span>
                </>
              ) : (
                <>
                  <SparklesIcon className="h-4 w-4" />
                  <span>Traducir texto</span>
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-sm text-rose-700" role="alert">
              {error}
            </div>
          )}
        </div>
      </section>

      {/* Live mixed-text preview */}
      {tokens.length > 0 && (
        <section 
          id="print-area" 
          className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 print:border-none print:shadow-none print:p-0 print:bg-white"
        >
          <div className="no-print flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <h3 className="text-lg font-black text-slate-900">Resultado mixto</h3>
            <span className="text-xs text-slate-400 font-semibold italic">
              Haz clic en una palabra para editar su pictograma individualmente.
            </span>
          </div>

          {/* Visual adaptive rendering of text and pictograms */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-6 leading-relaxed p-6 bg-slate-50/50 rounded-2xl border border-slate-100 min-h-[160px] print:bg-transparent print:border-none print:p-0">
            {tokens.map((token) => {
              if (token.type === 'whitespace') {
                return <span key={token.id} className="w-2" />;
              }
              if (token.type === 'punctuation') {
                return (
                  <span 
                    key={token.id} 
                    className="text-slate-800 print:text-black text-lg font-extrabold h-[96px] flex items-center justify-center px-1 self-center"
                  >
                    {token.text}
                  </span>
                );
              }

              // Word / Concept token rendering
              const showingPicto = shouldShowPicto(token);
              const showText = !showingPicto || !hideTextUnderPicto;

              return (
                <div
                  key={token.id}
                  onClick={() => onTokenClick(token)}
                  className={`group relative flex flex-col items-center select-none pb-1 h-[96px] print:cursor-default print:select-text print:pb-0 ${
                    showingPicto ? (showText ? 'justify-between' : 'justify-center') : 'justify-center'
                  } ${token.manualOverride ? 'no-print' : ''}`}
                  style={{ minWidth: showingPicto ? '64px' : 'auto' }}
                  title={`Haga clic para editar: ${token.concept} (${token.pos})`}
                >
                  {showingPicto ? (
                    token.pictoUrl ? (
                      <div className="h-14 w-14 border border-slate-200 print:border-black rounded-xl overflow-hidden bg-white flex items-center justify-center p-1 transition group-hover:border-sky-500 group-hover:ring-2 group-hover:ring-sky-100 print:h-16 print:w-16 print:rounded-lg print:shadow-none">
                        <img 
                          src={token.pictoUrl} 
                          alt={token.text} 
                          className="h-full w-full object-contain" 
                        />
                      </div>
                    ) : (
                      <div className="h-14 w-14 border border-dashed border-slate-300 print:border-gray-400 rounded-xl bg-white flex items-center justify-center p-1 text-[9px] text-slate-400 text-center leading-none print:h-16 print:w-16">
                        No picto
                      </div>
                    )
                  ) : null}
                  
                  {showText && (
                    <span 
                      className={`px-1.5 py-0.5 rounded border border-transparent transition duration-150 print:text-black print:bg-transparent print:border-transparent print:shadow-none ${
                        showingPicto 
                          ? 'text-slate-900 bg-white shadow-sm border-slate-100 text-xs font-bold print:text-xs print:font-bold' 
                          : 'text-slate-800 hover:bg-slate-100 hover:border-slate-200 text-lg font-bold print:text-lg'
                      }`}
                    >
                      {token.text}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
};
