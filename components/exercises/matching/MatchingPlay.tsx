import React, { useState, useEffect, useMemo, useRef } from 'react';
import { WorksheetItem, UnirExercisePair } from '../../../types';
import { Pictogram } from '../../PictogramRenderer';
import { CheckCircleIcon } from '../../Icons';

interface MatchingPlayProps {
  pairs: UnirExercisePair[];
  onComplete: () => void;
}

const shuffleArray = <T,>(items: T[]): T[] => {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
};

export const InteractiveItemCard: React.FC<{
  item: WorksheetItem;
  isSelected: boolean;
  isMatched: boolean;
  onClick: () => void;
  column: 'left' | 'right';
  index: number;
}> = ({ item, isSelected, isMatched, onClick, column, index }) => {
  const quantity = item.quantity || 1;

  const cardStyle = `
    flex flex-col items-center justify-center p-4 border-4 rounded-3xl min-h-36 w-36 bg-white transition-all cursor-pointer select-none
    ${isMatched ? 'border-emerald-500 opacity-60 bg-emerald-50' : ''}
    ${isSelected ? 'border-sky-500 ring-4 ring-sky-200 scale-105' : ''}
    ${!isMatched && !isSelected ? 'border-slate-300 hover:border-slate-400 hover:scale-102' : ''}
  `;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isMatched}
      className={cardStyle}
    >
      {item.type === 'text' && (
        <span className="text-5xl font-black text-slate-800">{item.content}</span>
      )}
      
      {item.type === 'image' && (
        quantity > 1 ? (
          <div className="grid grid-cols-2 gap-2 justify-center items-center w-full h-full">
            {Array.from({ length: quantity }).map((_, i) => (
              <Pictogram
                key={i}
                searchTerm={item.searchTerm || item.content}
                src={item.selectedPictoUrl}
                renderMode="auto"
                className="max-h-10 max-w-10 object-contain mx-auto"
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

      {item.type === 'traceable_text' && (
        <span className="text-3xl font-bold font-mono tracking-wider text-slate-700">{item.content}</span>
      )}

      {/* Etiqueta textual opcional abajo en minúsculas/pequeña */}
      {item.type === 'image' && quantity === 1 && (
        <span className="mt-2 text-xs font-semibold text-slate-500 uppercase">{item.content}</span>
      )}
    </button>
  );
};

export const MatchingPlay: React.FC<MatchingPlayProps> = ({ pairs, onComplete }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Mantener los elementos de la izquierda y la derecha
  const leftItems = useMemo(() => pairs.map(p => p.left), [pairs]);
  const rightItemsOriginal = useMemo(() => pairs.map(p => p.right), [pairs]);

  // Barajar la columna derecha al montar
  const [rightItems, setRightItems] = useState<WorksheetItem[]>([]);
  useEffect(() => {
    setRightItems(shuffleArray(rightItemsOriginal));
  }, [rightItemsOriginal]);

  // Estados de conexión
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [selectedRight, setSelectedRight] = useState<number | null>(null);
  const [connections, setConnections] = useState<Array<{ leftIndex: number; rightIndex: number }>>([]);
  const [dotsCoordinates, setDotsCoordinates] = useState<Record<string, { x: number; y: number }>>({});

  // Recalcular las coordenadas de los círculos conectores en la pantalla para trazar las líneas SVG
  const updateDotsCoordinates = () => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const coords: Record<string, { x: number; y: number }> = {};

    // Obtener las coordenadas de los círculos de la izquierda
    leftItems.forEach((_, idx) => {
      const el = document.getElementById(`dot-left-${idx}`);
      if (el) {
        const r = el.getBoundingClientRect();
        coords[`left-${idx}`] = {
          x: r.left + r.width / 2 - containerRect.left,
          y: r.top + r.height / 2 - containerRect.top
        };
      }
    });

    // Obtener las coordenadas de los círculos de la derecha
    rightItems.forEach((item, idx) => {
      const el = document.getElementById(`dot-right-${idx}`);
      if (el) {
        const r = el.getBoundingClientRect();
        coords[`right-${idx}`] = {
          x: r.left + r.width / 2 - containerRect.left,
          y: r.top + r.height / 2 - containerRect.top
        };
      }
    });

    setDotsCoordinates(coords);
  };

  useEffect(() => {
    // Retrasar la obtención de coordenadas para asegurar que el DOM se haya renderizado
    const timer = setTimeout(updateDotsCoordinates, 300);
    window.addEventListener('resize', updateDotsCoordinates);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateDotsCoordinates);
    };
  }, [leftItems, rightItems, connections]);

  // Interacción de clic en elementos de la izquierda
  const handleLeftClick = (idx: number) => {
    // Si ya está conectado, no hacer nada
    if (connections.some(c => c.leftIndex === idx)) return;

    if (selectedLeft === idx) {
      setSelectedLeft(null);
    } else {
      setSelectedLeft(idx);
      
      // Si ya hay un elemento seleccionado en la derecha, realizar la conexión
      if (selectedRight !== null) {
        makeConnection(idx, selectedRight);
      }
    }
  };

  // Interacción de clic en elementos de la derecha
  const handleRightClick = (idx: number) => {
    // Si ya está conectado, no hacer nada
    if (connections.some(c => c.rightIndex === idx)) return;

    if (selectedRight === idx) {
      setSelectedRight(null);
    } else {
      setSelectedRight(idx);

      // Si ya hay un elemento seleccionado en la izquierda, realizar la conexión
      if (selectedLeft !== null) {
        makeConnection(selectedLeft, idx);
      }
    }
  };

  // Validar y conectar elementos
  const makeConnection = (leftIdx: number, rightIdx: number) => {
    const leftItem = leftItems[leftIdx];
    const rightItem = rightItems[rightIdx];

    // Buscar si esta pareja corresponde al orden correcto original
    const correctPair = pairs.find(
      p =>
        (p.left.content === leftItem.content && p.left.searchTerm === leftItem.searchTerm) &&
        (p.right.content === rightItem.content && p.right.searchTerm === rightItem.searchTerm)
    );

    if (correctPair) {
      // Conexión correcta
      setConnections(prev => [...prev, { leftIndex: leftIdx, rightIndex: rightIdx }]);
      setSelectedLeft(null);
      setSelectedRight(null);
    } else {
      // Conexión incorrecta: Destellar un error visual y resetear selecciones
      setSelectedLeft(null);
      setSelectedRight(null);
    }
  };

  // Comprobar si todo está completado
  useEffect(() => {
    if (connections.length > 0 && connections.length === pairs.length) {
      const timer = setTimeout(onComplete, 1200);
      return () => clearTimeout(timer);
    }
  }, [connections, pairs, onComplete]);

  // Colores para las líneas de conexiones correctas
  const lineColors = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'];

  return (
    <div className="flex flex-col items-center gap-6 max-w-3xl mx-auto w-full p-4">
      <div className="text-center">
        <h3 className="text-2xl font-black text-slate-800 uppercase tracking-wide">
          Une las parejas tocando un elemento de cada lado
        </h3>
        <p className="mt-2 text-slate-500 font-semibold">
          Conecta los números con su cantidad correspondiente o asocia las imágenes.
        </p>
      </div>

      <div 
        ref={containerRef}
        className="relative w-full border-4 border-slate-200 rounded-[32px] bg-slate-50/50 p-8 shadow-inner min-h-[380px] grid grid-cols-[1fr_auto_1fr] items-center gap-8"
      >
        {/* SVG de fondo para dibujar las conexiones */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-15 overflow-visible">
          {connections.map((conn, idx) => {
            const start = dotsCoordinates[`left-${conn.leftIndex}`];
            const end = dotsCoordinates[`right-${conn.rightIndex}`];
            if (!start || !end) return null;

            return (
              <line
                key={idx}
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                stroke={lineColors[idx % lineColors.length]}
                strokeWidth="6"
                strokeLinecap="round"
                className="animate-dash"
              />
            );
          })}
        </svg>

        {/* Columna Izquierda */}
        <div className="flex flex-col gap-6 items-end">
          {leftItems.map((item, idx) => {
            const isMatched = connections.some(c => c.leftIndex === idx);
            const isSelected = selectedLeft === idx;

            return (
              <div key={`left-row-${idx}`} className="flex items-center gap-4">
                <InteractiveItemCard
                  item={item}
                  isSelected={isSelected}
                  isMatched={isMatched}
                  onClick={() => handleLeftClick(idx)}
                  column="left"
                  index={idx}
                />
                
                {/* Punto conector */}
                <div 
                  id={`dot-left-${idx}`} 
                  className={`w-6 h-6 rounded-full border-4 bg-white transition-all
                    ${isMatched ? 'border-emerald-500 bg-emerald-500 scale-90' : ''}
                    ${isSelected ? 'border-sky-500 bg-sky-200 scale-120' : 'border-slate-400'}
                  `}
                />
              </div>
            );
          })}
        </div>

        {/* Espacio Central */}
        <div className="w-16"></div>

        {/* Columna Derecha */}
        <div className="flex flex-col gap-6 items-start">
          {rightItems.map((item, idx) => {
            const isMatched = connections.some(c => c.rightIndex === idx);
            const isSelected = selectedRight === idx;

            return (
              <div key={`right-row-${idx}`} className="flex items-center gap-4">
                {/* Punto conector */}
                <div 
                  id={`dot-right-${idx}`} 
                  className={`w-6 h-6 rounded-full border-4 bg-white transition-all
                    ${isMatched ? 'border-emerald-500 bg-emerald-500 scale-90' : ''}
                    ${isSelected ? 'border-sky-500 bg-sky-200 scale-120' : 'border-slate-400'}
                  `}
                />

                <InteractiveItemCard
                  item={item}
                  isSelected={isSelected}
                  isMatched={isMatched}
                  onClick={() => handleRightClick(idx)}
                  column="right"
                  index={idx}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Indicador de éxito final */}
      {connections.length === pairs.length && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold px-6 py-3 animate-bounce">
          <CheckCircleIcon className="h-6 w-6 text-emerald-600" />
          ¡Muy bien hecho! Parejas completadas.
        </div>
      )}
    </div>
  );
};
