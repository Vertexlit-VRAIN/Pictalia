import React from 'react';
import { BrainCircuitIcon, FileTextIcon, FolderOpenIcon, ScanTextIcon, SlidersHorizontalIcon } from './Icons';

interface HeaderProps {
  activeView: 'generate' | 'adapt' | 'profile' | 'library';
  setActiveView: (view: 'generate' | 'adapt' | 'profile' | 'library') => void;
}

export const Header: React.FC<HeaderProps> = ({ activeView, setActiveView }) => {
  const getButtonClasses = (view: 'generate' | 'adapt' | 'profile' | 'library') => {
    const baseClasses = "group flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-600";
    if (activeView === view) {
      return `${baseClasses} bg-sky-100 text-sky-900 shadow-sm ring-1 ring-sky-200`;
    }
    return `${baseClasses} bg-white/70 text-slate-700 hover:bg-white hover:text-slate-900`;
  };

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto max-w-[1400px] px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-cyan-400 to-emerald-300 text-white shadow-lg shadow-sky-500/25">
              <BrainCircuitIcon className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                Adaptador TEA
              </h1>
              <p className="text-sm text-slate-600">
                Genera, adapta y edita fichas visuales con una navegación más clara y usable.
              </p>
            </div>
          </div>
          <nav aria-label="Navegación principal" className="flex flex-wrap items-center gap-2 rounded-3xl border border-slate-200 bg-slate-100/80 p-2 shadow-inner">
            <button
              onClick={() => setActiveView('generate')}
              className={getButtonClasses('generate')}
              aria-current={activeView === 'generate' ? 'page' : undefined}
            >
              <FileTextIcon className="h-5 w-5" />
              <span>Generar Ficha</span>
            </button>
            <button
              onClick={() => setActiveView('adapt')}
              className={getButtonClasses('adapt')}
              aria-current={activeView === 'adapt' ? 'page' : undefined}
            >
              <ScanTextIcon className="h-5 w-5" />
              <span>Adaptar Ficha</span>
            </button>
            <button
              onClick={() => setActiveView('library')}
              className={getButtonClasses('library')}
              aria-current={activeView === 'library' ? 'page' : undefined}
            >
              <FolderOpenIcon className="h-5 w-5" />
              <span>Biblioteca</span>
            </button>
            <button
              onClick={() => setActiveView('profile')}
              className={getButtonClasses('profile')}
              aria-current={activeView === 'profile' ? 'page' : undefined}
            >
              <SlidersHorizontalIcon className="h-5 w-5" />
              <span>Perfil</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
