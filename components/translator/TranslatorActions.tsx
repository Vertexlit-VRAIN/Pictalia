import React from 'react';
import { DownloadIcon, SaveIcon } from '../Icons';
import type { TextToken } from '../../types';

interface TranslatorActionsProps {
  tokens: TextToken[];
  saveTitle: string;
  setSaveTitle: (val: string) => void;
  isSaving: boolean;
  onSave: () => void;
  onPrint: () => void;
}

export const TranslatorActions: React.FC<TranslatorActionsProps> = ({
  tokens,
  saveTitle,
  setSaveTitle,
  isSaving,
  onSave,
  onPrint,
}) => {
  if (tokens.length === 0) return null;

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/50 space-y-4">
      <h3 className="text-sm font-black text-slate-900 px-1">Acciones</h3>
      
      {/* Print button */}
      <button
        onClick={onPrint}
        className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition"
      >
        <DownloadIcon className="h-4 w-4" />
        <span>Imprimir / PDF</span>
      </button>

      <hr className="border-slate-100" />

      {/* Save Form */}
      <div className="space-y-2">
        <label htmlFor="save-title-input" className="block text-xs font-bold text-slate-500 uppercase tracking-wide px-1">
          Título del documento
        </label>
        <input
          id="save-title-input"
          type="text"
          value={saveTitle}
          onChange={(e) => setSaveTitle(e.target.value)}
          placeholder="Ej: Ficha de lectura..."
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
        />
        <button
          onClick={onSave}
          disabled={isSaving}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white px-4 py-3 text-sm font-semibold transition shadow-md shadow-slate-950/10"
        >
          <SaveIcon className="h-4 w-4" />
          <span>{isSaving ? 'Guardando...' : 'Guardar en Historial'}</span>
        </button>
      </div>
    </div>
  );
};
