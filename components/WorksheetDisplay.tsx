import React, { useState } from 'react';
import type { Worksheet, WorksheetExercise, WorksheetItem, WorksheetSection } from '../types';
import { getFlattenedItemsFromExercise, normalizeWorksheet } from '../services/worksheetNormalizer';
import { RepasarDisplay } from './display/RepasarDisplay';
import { UnirDisplay } from './display/UnirDisplay';
import { RodearDisplay } from './display/RodearDisplay';
import { CopiarDisplay } from './display/CopiarDisplay';
import { Pictogram, getAdaptiveSpelledBoxWidth } from './PictogramRenderer';

const AdaptiveWorksheetPictoBox: React.FC<{
  searchTerm: string;
  altText: string;
  src?: string;
  renderMode?: Worksheet['pictogramRenderMode'];
  letterTerms?: string[];
  letterUrls?: string[];
  className: string;
  innerClassName: string;
  tileClassName: string;
  defaultWidthRem?: number;
  fallbackMinRem?: number;
  fallbackBaseRem?: number;
  fallbackStepRem?: number;
  fallbackMaxRem?: number;
  onFallbackModeChange?: (isSpelledFallback: boolean) => void;
}> = ({
  searchTerm,
  altText,
  src,
  renderMode,
  letterTerms,
  letterUrls,
  className,
  innerClassName,
  tileClassName,
  defaultWidthRem = 4,
  fallbackMinRem = 7,
  fallbackBaseRem = 6.5,
  fallbackStepRem = 1.15,
  fallbackMaxRem = 12,
  onFallbackModeChange,
}) => {
  const [isSpelledFallback, setIsSpelledFallback] = useState(renderMode === 'spell');

  const handleFallbackChange = (val: boolean) => {
    setIsSpelledFallback(val);
    onFallbackModeChange?.(val);
  };
  const shouldExpand = isSpelledFallback || renderMode === 'spell';
  const width = shouldExpand
    ? getAdaptiveSpelledBoxWidth(searchTerm || altText || '', true, {
        minRem: fallbackMinRem,
        baseRem: fallbackBaseRem,
        stepRem: fallbackStepRem,
        maxRem: fallbackMaxRem,
      })
    : `${defaultWidthRem}rem`;

  return (
    <div className={className} style={{ width, minWidth: width }}>
      <Pictogram
        searchTerm={searchTerm}
        altText={altText}
        src={src}
        renderMode={renderMode}
        letterTerms={letterTerms}
        letterUrls={letterUrls}
        className={innerClassName}
        letterWrapperClassName="max-w-full px-1 py-1"
        letterTileClassName={tileClassName}
        onFallbackModeChange={handleFallbackChange}
      />
    </div>
  );
};

const InstructionPictoCard: React.FC<{ picto: any }> = ({ picto }) => {
  const [isSpelledFallback, setIsSpelledFallback] = useState(picto.pictogramRenderMode === 'spell');

  if (isSpelledFallback) return null;

  return (
    <div className="flex flex-col items-center text-sm font-semibold text-gray-500">
      <AdaptiveWorksheetPictoBox
        searchTerm={picto.searchTerm || picto.content}
        altText={picto.content}
        src={picto.url}
        renderMode={picto.pictogramRenderMode}
        letterTerms={picto.spelledLetterTerms}
        letterUrls={picto.spelledLetterUrls}
        className="flex min-h-16 items-center justify-center rounded border border-gray-300 bg-white p-1.5"
        innerClassName="max-w-full max-h-full object-contain"
        tileClassName="min-h-10 min-w-10 max-w-full"
        onFallbackModeChange={setIsSpelledFallback}
      />
      {picto.pictogramRenderMode !== 'spell' && <span className="mt-1">{picto.content}</span>}
    </div>
  );
};

const SectionHeader: React.FC<{ instruction: WorksheetSection['instruction'] }> = ({ instruction }) => {
  const hasPictograms = instruction.pictograms && instruction.pictograms.length > 0;

  return (
    <div className="flex items-center gap-6 mb-6">
      {hasPictograms && (
        <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg empty:hidden">
          {instruction.pictograms!.map((picto, idx) => (
            <InstructionPictoCard key={idx} picto={picto} />
          ))}
        </div>
      )}
      <h3 className="font-bold text-3xl text-gray-600 uppercase tracking-widest">{instruction.text}</h3>
    </div>
  );
};

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
        <AdaptiveWorksheetPictoBox
          searchTerm={normalizedWorksheet.pictogramSearchTerm}
          altText={normalizedWorksheet.pictogramSearchTerm}
          src={normalizedWorksheet.selectedPictoUrl}
          renderMode={normalizedWorksheet.pictogramRenderMode}
          letterTerms={normalizedWorksheet.spelledLetterTerms}
          letterUrls={normalizedWorksheet.spelledLetterUrls}
          className="flex min-h-16 items-center justify-center border-2 border-black p-1"
          innerClassName="max-h-12 max-w-12 object-contain"
          tileClassName="min-h-10 min-w-10 max-w-full"
        />
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
