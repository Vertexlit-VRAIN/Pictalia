import React, { forwardRef } from 'react';
import { Worksheet } from '../types';
import { WorksheetDisplay } from './WorksheetDisplay';
import { Bookmark, DownloadIcon, CheckCircleIcon, Edit3 } from './Icons';
import { Spinner } from './Spinner';

interface WorksheetResultProps {
  worksheet: Worksheet;
  onDownload: () => void;
  isDownloadReady: boolean;
  title: string;
  onSave?: () => void;
  isSaved?: boolean;
  isDownloading?: boolean;
  onEdit?: () => void;
}

export const WorksheetResult = forwardRef<HTMLDivElement, WorksheetResultProps>(
  ({ worksheet, onDownload, isDownloadReady, title, onSave, isSaved, isDownloading, onEdit }, ref) => {
    return (
      <div className="mt-8">
        <div className="mb-5 flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/50 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-black tracking-tight text-slate-900">{title}</h3>
            <p className="mt-1 text-sm text-slate-500">Puedes revisar la ficha, descargarla, guardarla o pasar al modo edición.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {onEdit && (
              <button
                onClick={onEdit}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2.5 font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-600"
              >
                <Edit3 className="h-5 w-5" />
                <span>Editar</span>
              </button>
            )}
            {onSave && (
              <button
                onClick={onSave}
                disabled={isSaved}
                className="inline-flex w-[180px] items-center justify-center gap-2 rounded-2xl bg-sky-600 px-4 py-2.5 font-semibold text-white shadow-lg shadow-sky-600/20 transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-600"
              >
                {isSaved ? <CheckCircleIcon className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}
                <span>{isSaved ? 'Guardada' : 'Guardar Ficha'}</span>
              </button>
            )}
            <button
              onClick={onDownload}
              disabled={!isDownloadReady || isDownloading}
              title={!isDownloadReady ? "Preparando herramientas de descarga..." : "Descargar PDF como archivo"}
              className="inline-flex w-[190px] items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-wait disabled:bg-emerald-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-600"
            >
              {isDownloading ? (
                <>
                  <Spinner />
                  <span>Descargando...</span>
                </>
              ) : (
                <>
                  <DownloadIcon className="h-5 w-5" />
                  Descargar PDF
                </>
              )}
            </button>
          </div>
        </div>
        <div ref={ref} className="overflow-hidden rounded-[28px] border border-slate-200 bg-white p-3 shadow-xl shadow-slate-200/60">
          <WorksheetDisplay worksheet={worksheet} />
        </div>
      </div>
    );
  }
);

WorksheetResult.displayName = 'WorksheetResult';
