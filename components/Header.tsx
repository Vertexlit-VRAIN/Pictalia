import React from 'react';
import { BrainCircuitIcon, FilePlus2Icon, UserCogIcon, Library } from './Icons';

interface HeaderProps {
  activeView: 'generate' | 'adapt' | 'profile' | 'library';
  setActiveView: (view: 'generate' | 'adapt' | 'profile' | 'library') => void;
}

export const Header: React.FC<HeaderProps> = ({ activeView, setActiveView }) => {
  const getButtonClasses = (view: 'generate' | 'adapt' | 'profile' | 'library') => {
    const baseClasses = "flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500";
    if (activeView === view) {
      return `${baseClasses} bg-indigo-600 text-white shadow-md`;
    }
    return `${baseClasses} bg-white text-gray-700 hover:bg-indigo-50`;
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between py-4 gap-4">
          <div className="flex items-center gap-3">
            <BrainCircuitIcon className="h-8 w-8 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
              Generador de Fichas Adaptadas
            </h1>
          </div>
          <nav className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => setActiveView('generate')}
              className={getButtonClasses('generate')}
            >
              <FilePlus2Icon className="h-5 w-5" />
              <span>Generar Ficha</span>
            </button>
            <button
              onClick={() => setActiveView('adapt')}
              className={getButtonClasses('adapt')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-cog"><path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v3"/><path d="M14 2v6h6"/><circle cx="12" cy="15" r="2"/><path d="M12 12v1"/><path d="M12 17v1"/><path d="m14.6 13.5-.87.5"/><path d="m10.27 16-.87.5"/><path d="m14.6 16.5-.87-.5"/><path d="m10.27 14-.87-.5"/><path d="M7 18a2 2 0 0 0 2 2h1"/><path d="M17 18a2 2 0 0 1-2 2h-1"/></svg>
              <span>Adaptar Ficha</span>
            </button>
             <button
              onClick={() => setActiveView('library')}
              className={getButtonClasses('library')}
            >
              <Library className="h-5 w-5" />
              <span>Biblioteca</span>
            </button>
            <button
              onClick={() => setActiveView('profile')}
              className={getButtonClasses('profile')}
            >
              <UserCogIcon className="h-5 w-5" />
              <span>Perfil</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
