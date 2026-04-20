import React, { useEffect, useRef, useState } from 'react';
import type { Worksheet, WorksheetExercise, WorksheetItem, WorksheetSection } from '../types';
import { getFlattenedItemsFromExercise, normalizeWorksheet } from '../services/worksheetNormalizer';
import { searchPictograms } from '../services/pictogramService';

const pictogramUrlCache = new Map<string, string>();

const Pictogram: React.FC<{ searchTerm: string; altText: string; className?: string; src?: string | null }> = ({ searchTerm, altText, className, src }) => {
  const [imgSrc, setImgSrc] = useState<string>(src || '');
  const searchTermsRef = useRef<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    if (src) {
      setImgSrc(src);
      return () => {
        cancelled = true;
      };
    }

    const terms = searchTerm ? [searchTerm, ...searchTerm.split(' ').reverse()] : [];
    const uniqueTerms = [...new Set(terms)].filter(term => term && term.trim() !== '');
    searchTermsRef.current = uniqueTerms;

    setImgSrc('');

    const resolvePictogram = async () => {
      for (const term of uniqueTerms) {
        const cacheKey = term.trim().toLowerCase();
        if (pictogramUrlCache.has(cacheKey)) {
          if (!cancelled) {
            setImgSrc(pictogramUrlCache.get(cacheKey) || '');
          }
          return;
        }

        const results = await searchPictograms(term);
        const nextUrl = results[0]?.url || '';
        if (nextUrl) {
          pictogramUrlCache.set(cacheKey, nextUrl);
          if (!cancelled) {
            setImgSrc(nextUrl);
          }
          return;
        }
      }
    };

    void resolvePictogram();

    return () => {
      cancelled = true;
    };
  }, [searchTerm, altText, src]);

  const handleError = () => {
    for (const term of searchTermsRef.current) {
      pictogramUrlCache.delete(term.trim().toLowerCase());
    }
    setImgSrc('');
  };

  if (!imgSrc) {
    return <span className="px-1 text-center text-[10px] font-bold text-gray-700">{altText}</span>;
  }

  return <img src={imgSrc} alt={altText} className={className} onError={handleError} />;
};

const renderTraceableGuide = (item: WorksheetItem, index: number) => {
  const searchTerm = item.searchTerm || item.content;

  return (
    <div key={index} className="w-full max-w-[760px] bg-white pdf-avoid-break">
      <div className="flex items-center gap-0">
        <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-xl border-2 border-black bg-white p-2">
          <Pictogram searchTerm={searchTerm} altText={item.content} className="max-h-full max-w-full object-contain" src={item.selectedPictoUrl} />
        </div>
        <svg viewBox="0 0 620 88" className="block h-[88px] w-full overflow-visible" preserveAspectRatio="none" aria-hidden="true">
          <line x1="0" y1="6" x2="620" y2="6" stroke="black" strokeWidth="2" />
          <line x1="0" y1="44" x2="620" y2="44" stroke="#6b7280" strokeWidth="2" strokeDasharray="6 6" />
          <line x1="0" y1="82" x2="620" y2="82" stroke="black" strokeWidth="2" />
          <text
            x="310"
            y="52"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="transparent"
            stroke="#cbd5e1"
            strokeWidth="1.2"
            strokeDasharray="3 3"
            strokeLinecap="round"
            strokeLinejoin="round"
            paintOrder="stroke"
            fontSize="94"
            letterSpacing="0"
            fontWeight="100"
            fontFamily="'Helvetica Neue', Arial, sans-serif"
          >
            {item.content}
          </text>
        </svg>
      </div>
    </div>
  );
};

const renderWorksheetItem = (item: WorksheetItem, index: number) => {
  switch (item.type) {
    case 'image':
      return (
        <div key={index} className="flex flex-col items-center justify-center p-3 border-2 border-black rounded-lg h-40 w-40 bg-white pdf-avoid-break">
          {item.selectedPictoUrl || item.searchTerm ? (
            <Pictogram
              searchTerm={item.searchTerm || item.content}
              altText={item.content}
              src={item.selectedPictoUrl}
              className="max-h-24 max-w-24 object-contain"
            />
          ) : (
            <div className="flex flex-1 items-center justify-center px-2 text-center text-5xl font-bold text-gray-700">
              {item.content}
            </div>
          )}
          <span className="text-base text-center mt-2 font-mono text-gray-700 uppercase">{item.content}</span>
        </div>
      );
    case 'text':
      return <div key={index} className="flex items-center justify-center h-32 w-32 text-4xl font-bold text-gray-700 pdf-avoid-break">{item.content}</div>;
    case 'traceable_text':
      return renderTraceableGuide(item, index);
    case 'empty_box':
      return <div key={index} className="h-32 w-32 border-2 border-black rounded-lg bg-white pdf-avoid-break"></div>;
    default:
      return null;
  }
};

const SectionHeader: React.FC<{ instruction: WorksheetSection['instruction'] }> = ({ instruction }) => (
  <div className="text-center mb-6">
    <h3 className="font-bold text-2xl text-gray-600 uppercase tracking-widest">{instruction.text}</h3>
    {instruction.pictograms && instruction.pictograms.length > 0 && (
      <div className="mt-3 flex items-center justify-center gap-2 p-2 bg-gray-100 rounded-lg">
        {instruction.pictograms.map((picto, idx) => (
          <div key={idx} className="flex flex-col items-center text-xs font-semibold text-gray-500">
            <div className="w-10 h-10 p-1 bg-white rounded border border-gray-300 flex items-center justify-center">
              {picto.url || picto.searchTerm ? (
                <Pictogram
                  searchTerm={picto.searchTerm || picto.content}
                  altText={picto.content}
                  src={picto.url}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <span className="px-1 text-center text-[10px] font-bold text-gray-700">{picto.content}</span>
              )}
            </div>
            <span className="mt-1">{picto.content}</span>
          </div>
        ))}
      </div>
    )}
  </div>
);

const renderRepasarExercise = (exercise: Extract<WorksheetExercise, { type: 'repasar' }>) => (
  <div className="flex flex-col items-center justify-center gap-4">
    {exercise.prompts.map((item, index) => renderWorksheetItem(item, index))}
  </div>
);

const getStableHash = (value: string): number => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash) + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
};

const getStableShuffledItems = (items: WorksheetItem[]): WorksheetItem[] =>
  [...items]
    .map((item, index) => ({
      item,
      order: getStableHash(`${item.content}|${item.searchTerm || ''}|${index}`),
    }))
    .sort((left, right) => left.order - right.order)
    .map(entry => entry.item);

const renderUnirExercise = (exercise: Extract<WorksheetExercise, { type: 'unir' }>) => {
  const leftColumnItems = exercise.pairs.map(pair => pair.left);
  const rightColumnItems = getStableShuffledItems(exercise.pairs.map(pair => pair.right));

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_180px_minmax(0,1fr)] items-start">
      <div className="flex flex-col gap-8 items-end">
        {leftColumnItems.map((item, index) => (
          <div key={`left-${index}`} className="flex items-center gap-4">
            {renderWorksheetItem(item, index)}
            <div className="w-5 h-5 rounded-full border-2 border-black bg-white shadow-inner flex-shrink-0"></div>
          </div>
        ))}
      </div>

      <div className="min-h-full"></div>

      <div className="flex flex-col gap-8 items-start">
        {rightColumnItems.map((item, index) => (
          <div key={`right-${index}`} className="flex items-center gap-4">
            <div className="w-5 h-5 rounded-full border-2 border-black bg-white shadow-inner flex-shrink-0"></div>
            {renderWorksheetItem(item, index + leftColumnItems.length)}
          </div>
        ))}
      </div>
    </div>
  );
};

const renderRodearExercise = (exercise: Extract<WorksheetExercise, { type: 'rodear' }>) => (
  <div className="space-y-6">
    {exercise.prompt && (
      <div className="flex justify-center">
        {renderWorksheetItem(exercise.prompt, 0)}
      </div>
    )}
    <div className="flex flex-row items-center justify-center gap-4 flex-wrap">
      {exercise.options.map((item, index) => renderWorksheetItem(item, index + (exercise.prompt ? 1 : 0)))}
    </div>
  </div>
);

const renderCopiarExercise = (exercise: Extract<WorksheetExercise, { type: 'copiar' }>) => (
  <div className="flex flex-col items-center gap-6">
    <div className="flex items-center justify-center">
      {renderWorksheetItem(exercise.model, 0)}
    </div>
    <div className="flex flex-row items-center justify-center gap-4 flex-wrap">
      {exercise.copies.map((item, index) => renderWorksheetItem(item, index + 1))}
    </div>
  </div>
);

const renderExercise = (exercise: WorksheetExercise) => {
  switch (exercise.type) {
    case 'repasar':
      return renderRepasarExercise(exercise);
    case 'unir':
      return renderUnirExercise(exercise);
    case 'copiar':
      return renderCopiarExercise(exercise);
    case 'rodear':
    default:
      return renderRodearExercise(exercise);
  }
};

const renderSection = (section: WorksheetSection) => {
  const exercise = section.exercise || {
    type: 'rodear',
    options: section.items || [],
  };

  return (
    <div className="p-4 border-2 border-gray-300 rounded-lg mt-4 bg-white pdf-avoid-break">
      <SectionHeader instruction={section.instruction} />
      {renderExercise(exercise)}
    </div>
  );
};

export const WorksheetDisplay: React.FC<{ worksheet: Worksheet }> = ({ worksheet }) => {
  const normalizedWorksheet = normalizeWorksheet(worksheet);

  return (
    <div className="p-6 border-4 border-black bg-slate-50 aspect-[210/297] w-full mx-auto" style={{ fontFamily: "'Comic Sans MS', cursive, sans-serif" }}>
      <style>
        {`
          @media print {
            .pdf-avoid-break {
              page-break-inside: avoid;
            }
          }
        `}
      </style>
      <header className="flex items-center justify-center gap-4 p-4 border-b-4 border-black mb-6 pdf-avoid-break">
        <div className="h-16 w-16 flex items-center justify-center border-2 border-black">
          {normalizedWorksheet.selectedPictoUrl || normalizedWorksheet.pictogramSearchTerm ? (
            <Pictogram
              searchTerm={normalizedWorksheet.pictogramSearchTerm}
              altText={normalizedWorksheet.pictogramSearchTerm}
              src={normalizedWorksheet.selectedPictoUrl}
              className="max-h-12 max-w-12 object-contain"
            />
          ) : (
            <span className="px-2 text-center text-xs font-bold text-gray-700 uppercase">{normalizedWorksheet.pictogramSearchTerm}</span>
          )}
        </div>
        <h2 className="text-4xl font-extrabold tracking-wider text-black uppercase">{normalizedWorksheet.title}</h2>
      </header>

      <main className="space-y-4">
        {normalizedWorksheet.sections.map((section, index) => (
          <React.Fragment key={index}>
            {renderSection({
              ...section,
              items: section.exercise ? getFlattenedItemsFromExercise(section.exercise) : section.items || [],
            })}
            {index < normalizedWorksheet.sections.length - 1 && (
              <div className="w-full border-t-2 border-dashed border-gray-300 my-6"></div>
            )}
          </React.Fragment>
        ))}
      </main>
    </div>
  );
};
