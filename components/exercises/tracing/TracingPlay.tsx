import React, { useRef, useState, useEffect } from 'react';
import { WorksheetItem } from '../../../types';
import { WorksheetItemDisplay } from '../../display/WorksheetItemDisplay';

// Inline simple icons to avoid dependency errors
const ChevronRightIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);

const TrashIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

interface TracingPlayProps {
  items: WorksheetItem[];
  onComplete: () => void;
}

export const TracingPlay: React.FC<TracingPlayProps> = ({ items, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokeColor, setStrokeColor] = useState('#3b82f6'); // azul amigable

  const currentItem = items[currentIndex];

  // Configurar el canvas y responder a cambios de tamaño
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Ajustar el tamaño del canvas al del contenedor
    const resizeCanvas = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width;
        canvas.height = rect.height;
        
        // Configurar los estilos por defecto del pincel
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 8;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Limpiar el canvas al cambiar de ítem
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [currentIndex]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();

    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(coords.x, coords.y);
    ctx.strokeStyle = strokeColor;
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleNext = () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 max-w-2xl mx-auto w-full p-4">
      <div className="text-center">
        <span className="text-sm font-bold bg-sky-100 text-sky-800 px-3 py-1 rounded-full uppercase tracking-wider">
          Actividad {currentIndex + 1} de {items.length}
        </span>
        <h3 className="mt-2 text-xl font-bold text-slate-700 uppercase">
          Repasa la letra o palabra dibujando encima
        </h3>
      </div>

      {/* Contenedor del trazado */}
      <div 
        ref={containerRef}
        className="relative w-full border-4 border-slate-300 rounded-3xl overflow-hidden bg-white shadow-lg min-h-64 flex items-center justify-center p-6"
      >
        {/* Guía punteada en el fondo */}
        <div className="w-full flex justify-center pointer-events-none select-none">
          <WorksheetItemDisplay 
            item={currentItem} 
            index={currentIndex} 
            hidePicto={false} 
            solidText={false}
            showMidline={true}
          />
        </div>

        {/* Canvas de dibujo libre encima */}
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="absolute inset-0 cursor-crosshair touch-none z-10"
        />
      </div>

      {/* Controles del trazado */}
      <div className="flex w-full items-center justify-between gap-4">
        <button
          type="button"
          onClick={clearCanvas}
          className="inline-flex items-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-5 py-3 font-semibold text-slate-600 hover:bg-slate-50 transition"
        >
          <TrashIcon className="h-5 w-5 text-rose-500" />
          Borrar lienzo
        </button>

        <div className="flex gap-2">
          {['#3b82f6', '#10b981', '#f59e0b', '#ec4899'].map(color => (
            <button
              key={color}
              type="button"
              onClick={() => setStrokeColor(color)}
              className="w-10 h-10 rounded-full border-2 transition"
              style={{
                backgroundColor: color,
                borderColor: strokeColor === color ? '#0f172a' : '#cbd5e1',
                transform: strokeColor === color ? 'scale(1.15)' : 'scale(1)'
              }}
              aria-label={`Color ${color}`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={handleNext}
          className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-6 py-3 font-bold text-white shadow-lg shadow-sky-600/20 hover:bg-sky-700 transition"
        >
          {currentIndex < items.length - 1 ? 'Siguiente' : '¡Terminado!'}
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};
