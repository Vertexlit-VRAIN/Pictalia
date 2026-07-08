import React from 'react';
import { FileTextIcon, Trash2 } from '../Icons';
import type { Profile, SavedTranslation } from '../../types';

interface TranslatorHistoryProps {
  profiles: Profile[];
  activeProfile: Profile | null;
  selectProfile: (id: string) => void;
  savedTranslations: SavedTranslation[];
  onLoadTranslation: (translation: SavedTranslation) => void;
  onDeleteTranslation: (id: string) => void;
  loadedTranslationId: string | null;
}

export const TranslatorHistory: React.FC<TranslatorHistoryProps> = ({
  profiles,
  activeProfile,
  selectProfile,
  savedTranslations,
  onLoadTranslation,
  onDeleteTranslation,
  loadedTranslationId,
}) => {
  return (
    <aside className="no-print lg:sticky lg:top-24 lg:self-start space-y-4">
      <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/50">
        <div className="mb-4 flex items-center gap-3 px-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
            <FileTextIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">Traductor</h3>
            <p className="text-sm text-slate-500">Historial de textos</p>
          </div>
        </div>

        <div className="mb-4 px-2">
          <label htmlFor="profile-select-left" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
            Perfil Activo
          </label>
          <select
            id="profile-select-left"
            value={activeProfile?.id || ''}
            onChange={(e) => selectProfile(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            {profiles.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <hr className="my-3 border-slate-100" />

        <h4 className="px-2 mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
          Textos Guardados ({savedTranslations.length})
        </h4>
        
        {savedTranslations.length > 0 ? (
          <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
            {savedTranslations.map(item => (
              <div
                key={item.id}
                className={`group flex items-start justify-between rounded-2xl p-2 transition-all duration-200 ${
                  loadedTranslationId === item.id
                    ? 'bg-sky-100 text-sky-900 ring-1 ring-sky-200'
                    : 'bg-slate-50 text-slate-700 hover:bg-sky-50'
                }`}
              >
                <button
                  onClick={() => onLoadTranslation(item)}
                  className="flex flex-1 items-start text-left focus:outline-none rounded-xl p-1"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate leading-tight">{item.title}</p>
                    <p className={`mt-1 text-[10px] ${loadedTranslationId === item.id ? 'text-sky-700/80' : 'text-slate-400'}`}>
                      {new Date(item.createdAt).toLocaleDateString()} - {item.language.toUpperCase()}
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => onDeleteTranslation(item.id)}
                  title="Eliminar traducción"
                  className="ml-2 rounded-full p-1.5 opacity-40 transition-opacity hover:opacity-100 hover:bg-rose-100 hover:text-rose-700"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="p-3 text-center text-xs text-slate-400 italic">
            No hay traducciones guardadas en este perfil.
          </p>
        )}
      </div>
    </aside>
  );
};
