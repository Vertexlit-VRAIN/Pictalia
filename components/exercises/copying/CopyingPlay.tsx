import React, { useState, useEffect } from 'react';
import { WorksheetItem } from '../../../types';
import { Pictogram } from '../../PictogramRenderer';
import { CheckCircleIcon, RotateCcwIcon } from '../../Icons';

// Inline simple icons to avoid dependency errors
const ChevronRightIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);

interface CopyingPlayProps {
  copies: WorksheetItem[];
  onComplete: () => void;
}

// Función para barajar las letras de una palabra
const shuffleLetters = (word: string): { id: string; letter: string }[] => {
  const letters = Array.from(word.toUpperCase()).map((letter, idx) => ({
    id: `${idx}-${letter}`,
    letter
  }));
  
  // Barajar hasta que sea diferente de la original (si tiene más de 1 letra)
  if (letters.length <= 1) return letters;
  
  for (let i = 0; i < 10; i++) {
    const shuffled = [...letters];
    for (let j = shuffled.length - 1; j > 0; j--) {
      const k = Math.floor(Math.random() * (j + 1));
      [shuffled[j], shuffled[k]] = [shuffled[k], shuffled[j]];
    }
    if (shuffled.map(l => l.letter).join('') !== word) {
      return shuffled;
    }
  }
  return letters;
};

export const CopyingPlay: React.FC<CopyingPlayProps> = ({ copies, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentItem = copies[currentIndex];
  const targetWord = currentItem ? currentItem.content.toUpperCase().trim() : '';

  // Estados del juego de deletreo
  const [lettersPool, setLettersPool] = useState<{ id: string; letter: string }[]>([]);
  const [userLetters, setUserLetters] = useState<Array<{ id: string; letter: string } | null>>([]);
  const [isSuccess, setIsSuccess] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Inicializar el pool de letras para la palabra actual
  useEffect(() => {
    if (!targetWord) return;
    setLettersPool(shuffleLetters(targetWord));
    setUserLetters(Array(targetWord.length).fill(null));
    setIsSuccess(false);
    setHasError(false);
  }, [currentIndex, targetWord]);

  // Manejar el clic en una letra del pool (para colocarla en la primera casilla libre)
  const handlePoolLetterClick = (item: { id: string; letter: string }) => {
    if (isSuccess) return;

    const firstEmptyIndex = userLetters.indexOf(null);
    if (firstEmptyIndex === -1) return; // Todo lleno

    const nextUserLetters = [...userLetters];
    nextUserLetters[firstEmptyIndex] = item;
    setUserLetters(nextUserLetters);

    // Quitar del pool
    setLettersPool(prev => prev.filter(l => l.id !== item.id));
    setHasError(false);
  };

  // Manejar el clic en una casilla de usuario (para quitar la letra y devolverla al pool)
  const handleUserLetterClick = (index: number) => {
    if (isSuccess) return;

    const item = userLetters[index];
    if (!item) return;

    const nextUserLetters = [...userLetters];
    nextUserLetters[index] = null;
    setUserLetters(nextUserLetters);

    // Devolver al pool
    setLettersPool(prev => [...prev, item]);
    setHasError(false);
  };

  // Reiniciar la palabra actual
  const handleReset = () => {
    if (isSuccess) return;
    setLettersPool(shuffleLetters(targetWord));
    setUserLetters(Array(targetWord.length).fill(null));
    setHasError(false);
  };

  // Comprobar si la palabra deletreada es correcta cuando se llenan todas las casillas
  useEffect(() => {
    if (userLetters.length === 0 || userLetters.includes(null)) return;

    const spelled = userLetters.map(l => l?.letter || '').join('');
    if (spelled === targetWord) {
      setIsSuccess(true);
      setHasError(false);
    } else {
      setHasError(true);
    }
  }, [userLetters, targetWord]);

  const handleNext = () => {
    if (currentIndex < copies.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 max-w-2xl mx-auto w-full p-4">
      <div className="text-center">
        <span className="text-sm font-bold bg-sky-100 text-sky-800 px-3 py-1 rounded-full uppercase tracking-wider">
          Palabra {currentIndex + 1} de {copies.length}
        </span>
        <h3 className="mt-2 text-xl font-bold text-slate-700 uppercase">
          Ordena las letras para copiar la palabra
        </h3>
      </div>

      {/* Tarjeta del Pictograma Guía */}
      {currentItem && (
        <div className="flex flex-col items-center p-4 border-4 border-slate-300 rounded-[32px] bg-white shadow-md">
          <Pictogram
            searchTerm={currentItem.searchTerm || currentItem.content}
            src={currentItem.selectedPictoUrl}
            renderMode="auto"
            className="max-h-24 max-w-24 object-contain"
            letterWrapperClassName="hidden"
          />
          <span className="mt-2 text-2xl font-black text-slate-800 uppercase tracking-widest">{targetWord}</span>
        </div>
      )}

      {/* Casilleros de las letras introducidas por el usuario */}
      <div className="flex flex-wrap justify-center gap-3 w-full p-6 bg-slate-50 border-4 border-slate-200/60 rounded-[28px] shadow-inner">
        {userLetters.map((item, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleUserLetterClick(idx)}
            className={`
              flex items-center justify-center w-12 h-12 text-2xl font-black border-4 rounded-xl transition-all select-none
              ${item ? 'bg-white border-sky-400 text-sky-800 shadow-md transform hover:scale-105 active:scale-95' : 'bg-slate-100 border-dashed border-slate-300 cursor-default'}
              ${isSuccess ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : ''}
              ${hasError && item ? 'border-rose-400 bg-rose-50 text-rose-800 animate-shake' : ''}
            `}
          >
            {item?.letter || ''}
          </button>
        ))}
      </div>

      {/* Pool de letras barajadas */}
      {!isSuccess && (
        <div className="flex flex-wrap justify-center gap-3 w-full p-4 border-2 border-dashed border-slate-200 rounded-[24px]">
          {lettersPool.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handlePoolLetterClick(item)}
              className="flex items-center justify-center w-12 h-12 text-2xl font-black bg-white border-4 border-slate-300 rounded-xl shadow-md transform hover:scale-105 hover:border-slate-400 active:scale-95 transition-all select-none"
            >
              {item.letter}
            </button>
          ))}
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex w-full items-center justify-between gap-4 mt-2">
        <button
          type="button"
          onClick={handleReset}
          disabled={isSuccess}
          className="inline-flex items-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-4 py-2.5 font-semibold text-slate-600 hover:bg-slate-50 transition disabled:opacity-40"
        >
          <RotateCcwIcon className="h-5 w-5 text-slate-500" />
          Reiniciar palabra
        </button>

        {isSuccess ? (
          <div className="flex items-center gap-2 rounded-2xl bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold px-6 py-3 animate-bounce">
            <CheckCircleIcon className="h-5 w-5 text-emerald-600" />
            ¡Correcto!
          </div>
        ) : (
          hasError && (
            <div className="text-rose-600 font-bold text-sm animate-pulse">
              Inténtalo de nuevo, el orden no es correcto
            </div>
          )
        )}

        <button
          type="button"
          onClick={handleNext}
          disabled={!isSuccess}
          className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-6 py-3 font-bold text-white shadow-lg shadow-sky-600/20 hover:bg-sky-700 transition disabled:opacity-40 disabled:bg-slate-300 disabled:shadow-none"
        >
          {currentIndex < copies.length - 1 ? 'Siguiente palabra' : '¡Terminado!'}
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};
