import React, { useEffect, useRef, useState } from 'react';
import type { Worksheet, WorksheetExercise, WorksheetItem, WorksheetSection } from '../types';
import { getFlattenedItemsFromExercise, normalizeWorksheet } from '../services/worksheetNormalizer';
import { searchPictograms } from '../services/pictogramService';

import { RepasarDisplay } from './display/RepasarDisplay';
import { UnirDisplay } from './display/UnirDisplay';
import { RodearDisplay } from './display/RodearDisplay';
import { CopiarDisplay } from './display/CopiarDisplay';

const pictogramUrlCache = new Map<string, string>();

export const Pictogram: React.FC<{ searchTerm: string; altText: string; className?: string; src?: string | null }> = ({ searchTerm, altText, className, src }) => {
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



const SectionHeader: React.FC<{ instruction: WorksheetSection['instruction'] }> = ({ instruction }) => (
  <div className="flex items-center gap-6 mb-6">
    {instruction.pictograms && instruction.pictograms.length > 0 && (
      <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg">
        {instruction.pictograms.map((picto, idx) => (
          <div key={idx} className="flex flex-col items-center text-sm font-semibold text-gray-500">
            <div className="w-16 h-16 p-1.5 bg-white rounded border border-gray-300 flex items-center justify-center">
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
    <h3 className="font-bold text-3xl text-gray-600 uppercase tracking-widest">{instruction.text}</h3>
  </div>
);

const renderExercise = (exercise: WorksheetExercise) => {
  switch (exercise.type) {
    case 'repasar':
      return <RepasarDisplay exercise={exercise} />;
    case 'unir':
      return <UnirDisplay exercise={exercise} />;
    case 'copiar':
      return <CopiarDisplay exercise={exercise} />;
    case 'rodear':
    default:
      return <RodearDisplay exercise={exercise as any} />;
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
