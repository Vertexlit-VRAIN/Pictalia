import React, { useState } from 'react';
import { SavedWorksheet, WorksheetSection } from '../../types';
import { Pictogram } from '../PictogramRenderer';
import { TracingPlay } from './tracing/TracingPlay';
import { MatchingPlay } from './matching/MatchingPlay';
import { CirclingPlay } from './circling/CirclingPlay';
import { CopyingPlay } from './copying/CopyingPlay';
import { XIcon, CheckCircleIcon } from '../Icons';

interface InteractiveWorksheetPlayProps {
  worksheet: SavedWorksheet;
  onClose: () => void;
}

export const InteractiveWorksheetPlay: React.FC<InteractiveWorksheetPlayProps> = ({ worksheet, onClose }) => {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);

  const isCompleted = currentSectionIndex === worksheet.sections.length;
  const currentSection = !isCompleted ? worksheet.sections[currentSectionIndex] : null;

  const handleSectionComplete = () => {
    setCurrentSectionIndex(prev => prev + 1);
  };

  const renderActivePlay = (section: WorksheetSection) => {
    const exercise = section.exercise;
    
    switch (section.exerciseType) {
      case 'repasar':
        return (
          <TracingPlay
            items={section.items}
            onComplete={handleSectionComplete}
          />
        );
      case 'unir':
        if (exercise.type === 'unir') {
          return (
            <MatchingPlay
              pairs={exercise.pairs}
              onComplete={handleSectionComplete}
            />
          );
        }
        break;
      case 'rodear':
        if (exercise.type === 'rodear') {
          return (
            <CirclingPlay
              prompt={exercise.prompt}
              options={exercise.options}
              onComplete={handleSectionComplete}
            />
          );
        }
        break;
      case 'copiar':
        if (exercise.type === 'copiar') {
          return (
            <CopyingPlay
              copies={exercise.copies}
              onComplete={handleSectionComplete}
            />
          );
        }
        break;
      default:
        return (
          <div className="p-8 text-center text-slate-500 font-bold">
            Este tipo de ejercicio no tiene reproductor digital interactivo.
            <button
              type="button"
              onClick={handleSectionComplete}
              className="mt-4 block mx-auto bg-sky-600 text-white rounded-xl px-4 py-2"
            >
              Omitir Ejercicio
            </button>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-100 text-slate-900 overflow-y-auto">
      {/* Barra superior de navegación/control */}
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 bg-sky-500 rounded-2xl flex items-center justify-center text-white">
            <span className="font-black text-xl">★</span>
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-wider">{worksheet.title}</h2>
            <p className="text-xs font-bold text-sky-600 uppercase tracking-widest">Modo Alumno - Actividad Digital</p>
          </div>
        </div>

        {/* Botón Salir */}
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1.5 rounded-2xl bg-rose-50 border border-rose-200 px-4 py-2 text-sm font-bold text-rose-700 hover:bg-rose-100 transition focus:outline-none"
        >
          <XIcon className="h-4 w-4" />
          Salir del Juego
        </button>
      </header>

      {/* Cuerpo principal del juego */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-4xl mx-auto">
        {!isCompleted && currentSection ? (
          <div className="w-full flex flex-col gap-6">
            {/* Barra de progreso de actividades */}
            <div className="w-full flex items-center justify-center gap-2">
              {worksheet.sections.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-4 rounded-full transition-all duration-300 ${
                    idx === currentSectionIndex
                      ? 'w-12 bg-sky-500 shadow-sm shadow-sky-300'
                      : idx < currentSectionIndex
                      ? 'w-4 bg-emerald-500'
                      : 'w-4 bg-slate-300'
                  }`}
                  title={`Paso ${idx + 1}`}
                />
              ))}
            </div>

            {/* Caja del Enunciado (Instrucciones con Pictogramas) */}
            <div className="w-full rounded-[28px] border-4 border-slate-300 bg-white p-6 shadow-md">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                {currentSection.instruction.pictograms && currentSection.instruction.pictograms.length > 0 && (
                  <div className="flex flex-wrap gap-2 shrink-0">
                    {currentSection.instruction.pictograms.map((picto, pIdx) => (
                      <div key={pIdx} className="bg-slate-50 border border-slate-200 p-1.5 rounded-2xl">
                        <Pictogram
                          searchTerm={picto.searchTerm || picto.content}
                          src={picto.url}
                          renderMode="auto"
                          className="max-h-12 max-w-12 object-contain"
                          letterWrapperClassName="hidden"
                        />
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex-1">
                  <span className="text-[10px] font-black uppercase text-sky-600 tracking-[0.2em]">Instrucciones</span>
                  <h1 className="text-2xl font-black text-slate-800 uppercase tracking-wide">
                    {currentSection.instruction.text}
                  </h1>
                </div>
              </div>
            </div>

            {/* Contenedor del Juego Activo */}
            <div className="w-full py-2">
              {renderActivePlay(currentSection)}
            </div>
          </div>
        ) : (
          /* Pantalla de Éxito / Felicitaciones */
          <div className="w-full max-w-md rounded-[36px] border-4 border-emerald-400 bg-white p-8 shadow-2xl text-center flex flex-col items-center gap-6 animate-scale-up">
            <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 animate-bounce">
              <CheckCircleIcon className="w-16 h-16" />
            </div>

            <div className="space-y-2">
              {/* Intentamos mostrar un pictograma de felicitación */}
              <div className="border border-slate-200 bg-slate-50 p-3 rounded-[24px] inline-block mb-2">
                <Pictogram
                  searchTerm="felicidades"
                  altText="MUY BIEN"
                  renderMode="auto"
                  className="max-h-24 max-w-24 object-contain mx-auto"
                  letterWrapperClassName="hidden"
                />
              </div>
              
              <h2 className="text-3xl font-black text-slate-800 uppercase tracking-wider">
                ¡Enhorabuena!
              </h2>
              <p className="text-slate-500 font-bold text-lg uppercase tracking-wide">
                Has completado todos los ejercicios con éxito.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="mt-2 w-full rounded-2xl bg-emerald-600 px-6 py-4 text-lg font-black uppercase tracking-wider text-white shadow-xl shadow-emerald-600/30 hover:bg-emerald-700 transition"
            >
              Terminar y Salir
            </button>
          </div>
        )}
      </main>
    </div>
  );
};
