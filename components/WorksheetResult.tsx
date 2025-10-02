import React, { forwardRef } from 'react';
import { Worksheet } from '../types';
import { WorksheetDisplay } from './WorksheetDisplay';
import { Bookmark, Edit3, SaveIcon } from './Icons';
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
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
          <h3 className="text-xl font-bold">{title}</h3>
          <div className="flex items-center gap-3">
            {onEdit && (
              <button
                onClick={onEdit}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white font-semibold rounded-md shadow-sm hover:bg-gray-700 transition-colors"
              >
                <Edit3 className="h-5 w-5" />
                <span>Editar</span>
              </button>
            )}
            {onSave && (
              <button
                onClick={onSave}
                disabled={isSaved}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed w-[160px]"
              >
                <Bookmark className="h-5 w-5" />
                <span>{isSaved ? 'Guardada' : 'Guardar Ficha'}</span>
              </button>
            )}
            <button
              onClick={onDownload}
              disabled={!isDownloadReady || isDownloading}
              title={!isDownloadReady ? "Preparando herramientas de descarga..." : "Descargar PDF como archivo"}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-md shadow-sm hover:bg-green-700 transition-colors disabled:bg-green-300 disabled:cursor-wait w-[180px]"
            >
              {isDownloading ? (
                <>
                  <Spinner />
                  <span>Descargando...</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                  Descargar PDF
                </>
              )}
            </button>
          </div>
        </div>
        <div ref={ref} className="bg-white p-2">
          <WorksheetDisplay worksheet={worksheet} />
        </div>
      </div>
    );
  }
);

WorksheetResult.displayName = 'WorksheetResult';