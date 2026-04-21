import React, { useState, useCallback } from 'react';
import { Spinner } from './Spinner';
import { UploadCloudIcon } from './Icons';

interface FileUploadDropzoneProps {
  onFileSelect: (file: File | null) => void;
  isProcessing: boolean;
  isReady: boolean;
}

export const FileUploadDropzone: React.FC<FileUploadDropzoneProps> = ({ onFileSelect, isProcessing, isReady }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    onFileSelect(selectedFile);
  };

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (isReady) setIsDragging(true);
  }, [isReady]);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  }, []);
  
  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    if (isReady) {
      const droppedFile = event.dataTransfer.files?.[0] || null;
      onFileSelect(droppedFile);
    }
  }, [isReady, onFileSelect]);

  const dropzoneClasses = `mt-1 flex min-h-[200px] items-center justify-center rounded-[28px] border-2 border-dashed px-6 pb-6 pt-5 transition-all duration-200 ${
    isDragging && isReady ? 'border-sky-500 bg-sky-50 shadow-inner' : 'border-slate-300 bg-slate-50/70'
  }`;

  return (
    <div
      className={dropzoneClasses}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      role="button"
      tabIndex={0}
      aria-label="Zona para subir un archivo PDF"
    >
      {!isReady ? (
        <div className="flex flex-col items-center justify-center text-slate-500">
          <Spinner className="text-slate-400" />
          <span className="mt-2 text-sm font-medium">Iniciando herramientas PDF...</span>
        </div>
      ) : isProcessing ? (
        <div className="flex flex-col items-center justify-center text-slate-500">
          <Spinner className="text-slate-400" />
          <span className="mt-2 text-sm font-medium">Procesando PDF...</span>
        </div>
      ) : (
        <div className="space-y-3 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-sky-600 shadow-sm">
            <UploadCloudIcon className="h-8 w-8" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-semibold text-slate-900">Sube una ficha en PDF</p>
            <p className="text-sm text-slate-500">Arrastra el archivo o selecciónalo desde tu dispositivo.</p>
          </div>
          <div className="flex justify-center text-sm text-slate-600">
            <label htmlFor="file-upload" className="relative cursor-pointer rounded-xl bg-white px-3 py-2 font-semibold text-sky-700 shadow-sm transition hover:bg-sky-50 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-sky-600">
              <span>Sube un archivo PDF</span>
              <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="application/pdf" disabled={isProcessing || !isReady} />
            </label>
            <p className="pl-2 pt-2">o arrástralo aquí</p>
          </div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Solo archivos PDF</p>
        </div>
      )}
    </div>
  );
};
