import React, { useState, useCallback } from 'react';
import { Spinner } from './Spinner';

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

  const dropzoneClasses = `mt-1 flex justify-center items-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors duration-200 min-h-[160px] ${
    isDragging && isReady ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'
  }`;

  return (
    <div
      className={dropzoneClasses}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {!isReady ? (
        <div className="flex flex-col items-center justify-center text-gray-500">
          <Spinner className="text-gray-400" />
          <span className="mt-2 text-sm font-medium">Iniciando herramientas PDF...</span>
        </div>
      ) : isProcessing ? (
        <div className="flex flex-col items-center justify-center text-gray-500">
          <Spinner className="text-gray-400" />
          <span className="mt-2 text-sm font-medium">Procesando PDF...</span>
        </div>
      ) : (
        <div className="space-y-1 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="flex text-sm text-gray-600">
            <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
              <span>Sube un archivo PDF</span>
              <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="application/pdf" disabled={isProcessing || !isReady} />
            </label>
            <p className="pl-1">o arrástralo aquí</p>
          </div>
          <p className="text-xs text-gray-500">Solo archivos PDF</p>
        </div>
      )}
    </div>
  );
};
