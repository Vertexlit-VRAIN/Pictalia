import React, { useState } from 'react';
import { WorksheetItem } from '../../../types';
import { Pictogram } from '../../PictogramRenderer';
import { CheckCircleIcon } from '../../Icons';

// Inline simple icons to avoid dependency errors
const ChevronRightIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);

interface CirclingPlayProps {
  prompt?: WorksheetItem | null;
  options: WorksheetItem[];
  onComplete: () => void;
}

export const CirclingPlay: React.FC<CirclingPlayProps> = ({ prompt, options, onComplete }) => {
  // Guardar los índices de los elementos seleccionados/rodeados
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

  const toggleSelectOption = (idx: number) => {
    setSelectedIndices(prev =>
      prev.includes(idx)
        ? prev.filter(index => index !== idx)
        : [...prev, idx]
    );
  };

  const handleNext = () => {
    onComplete();
  };

  return (
    <div className="flex flex-col items-center gap-6 max-w-2xl mx-auto w-full p-4">
      <div className="text-center">
        {prompt && (
          <div className="mb-4 inline-flex items-center gap-3 bg-white p-3 border-2 border-slate-300 rounded-3xl shadow-sm">
            <span className="text-xs font-black uppercase text-slate-500 tracking-wider pl-2">
              Objetivo:
            </span>
            <Pictogram
              searchTerm={prompt.searchTerm || prompt.content}
              src={prompt.selectedPictoUrl}
              renderMode="auto"
              className="max-h-12 max-w-12 object-contain"
              letterWrapperClassName="hidden"
            />
            <span className="text-base font-extrabold uppercase text-slate-800 pr-2">
              {prompt.content}
            </span>
          </div>
        )}
        <h3 className="text-2xl font-black text-slate-800 uppercase tracking-wide">
          Rodea las opciones que corresponden al objetivo
        </h3>
        <p className="mt-2 text-slate-500 font-semibold">
          Haz clic o toca en las imágenes correctas para dibujar un círculo a su alrededor.
        </p>
      </div>

      {/* Opciones en una cuadrícula */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 w-full max-w-lg justify-center p-4 bg-slate-50 border-4 border-slate-200/60 rounded-[32px]">
        {options.map((item, idx) => {
          const isSelected = selectedIndices.includes(idx);
          const quantity = item.quantity || 1;

          return (
            <div key={idx} className="relative flex justify-center items-center">
              <button
                type="button"
                onClick={() => toggleSelectOption(idx)}
                className={`relative z-10 flex flex-col items-center justify-center p-4 bg-white border-2 border-slate-200 rounded-2xl h-36 w-36 hover:border-slate-300 hover:scale-102 transition shadow-sm`}
              >
                {item.type === 'text' && (
                  <span className="text-4xl font-extrabold text-slate-700">{item.content}</span>
                )}

                {item.type === 'image' && (
                  quantity > 1 ? (
                    <div className="grid grid-cols-2 gap-1.5 justify-center items-center w-full h-full">
                      {Array.from({ length: quantity }).map((_, i) => (
                        <Pictogram
                          key={i}
                          searchTerm={item.searchTerm || item.content}
                          src={item.selectedPictoUrl}
                          renderMode="auto"
                          className="max-h-8 max-w-8 object-contain mx-auto"
                          letterWrapperClassName="hidden"
                        />
                      ))}
                    </div>
                  ) : (
                    <Pictogram
                      searchTerm={item.searchTerm || item.content}
                      src={item.selectedPictoUrl}
                      renderMode="auto"
                      className="max-h-20 max-w-20 object-contain"
                      letterWrapperClassName="hidden"
                    />
                  )
                )}

                {item.type === 'image' && quantity === 1 && (
                  <span className="mt-2 text-[10px] font-black uppercase text-slate-400">{item.content}</span>
                )}
              </button>

              {/* Círculo superpuesto si está seleccionado */}
              {isSelected && (
                <div 
                  className="absolute inset-0 z-20 pointer-events-none animate-draw-circle"
                  style={{
                    border: '8px solid rgba(236, 72, 153, 0.85)', // Círculo rosa rotulador
                    borderRadius: '45% 55% 50% 50% / 50% 45% 55% 50%', // Forma ligeramente irregular
                    transform: 'rotate(-3deg) scale(1.15)',
                    boxShadow: '0 0 12px rgba(236, 72, 153, 0.3)'
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="flex w-full items-center justify-end mt-4">
        <button
          type="button"
          onClick={handleNext}
          className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-6 py-3 font-bold text-white shadow-lg shadow-sky-600/20 hover:bg-sky-700 transition"
        >
          ¡Listo!
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};
