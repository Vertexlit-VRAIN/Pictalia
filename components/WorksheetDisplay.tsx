import React, { useState, useEffect, useRef } from 'react';
import { Worksheet, WorksheetItem, WorksheetLayout, WorksheetSection } from '../types';

/**
 * A robust component for displaying pictograms.
 * It attempts to fetch an image from ARASAAC using a primary search term.
 * If that fails, it breaks the term into individual words and tries each one.
 * As a final fallback, it uses a seeded image from Picsum Photos.
 */
const Pictogram: React.FC<{ searchTerm: string; altText: string; className?: string; src?: string | null }> = ({ searchTerm, altText, className, src }) => {
  const [imgSrc, setImgSrc] = useState<string>(src || '');
  
  const attemptRef = useRef(0);
  const searchTermsRef = useRef<string[]>([]);

  useEffect(() => {
    if (src) {
      setImgSrc(src);
      return;
    }
    attemptRef.current = 0;
    const terms = searchTerm ? [searchTerm, ...searchTerm.split(' ').reverse()] : [];
    const uniqueTerms = [...new Set(terms)].filter(t => t && t.trim() !== '');
    searchTermsRef.current = uniqueTerms;

    if (uniqueTerms.length > 0) {
      setImgSrc(`https://api.arasaac.org/api/pictograms/search/${encodeURIComponent(uniqueTerms[0])}?best=true`);
    } else {
      setImgSrc(`https://picsum.photos/seed/${encodeURIComponent(altText || 'placeholder')}/200`);
    }
  }, [searchTerm, altText, src]);

  const handleError = () => {
    attemptRef.current += 1;
    const nextAttemptIndex = attemptRef.current;
    const searchTerms = searchTermsRef.current;

    if (nextAttemptIndex < searchTerms.length) {
      const nextTerm = searchTerms[nextAttemptIndex];
      setImgSrc(`https://api.arasaac.org/api/pictograms/search/${encodeURIComponent(nextTerm)}?best=true`);
    } else {
      const fallbackSearchTerm = searchTerm || altText || 'fallback';
      setImgSrc(`https://picsum.photos/seed/${encodeURIComponent(fallbackSearchTerm)}/200`);
    }
  };

  if (!imgSrc) return null;

  return <img src={imgSrc} alt={altText} className={className} onError={handleError} />;
};


const renderWorksheetItem = (item: WorksheetItem, index: number) => {
  switch (item.type) {
    case 'image':
      return (
        <div key={index} className="flex flex-col items-center justify-center p-2 border-2 border-black rounded-lg h-32 w-32 bg-white pdf-avoid-break">
          <Pictogram 
            src={item.selectedPictoUrl}
            searchTerm={item.searchTerm || item.content} 
            altText={item.content} 
            className="max-h-20 max-w-20 object-contain"
          />
          <span className="text-sm text-center mt-2 font-mono text-gray-700 uppercase">{item.content}</span>
        </div>
      );
    case 'text':
      return <div key={index} className="flex items-center justify-center h-32 w-32 text-4xl font-bold text-gray-700 pdf-avoid-break">{item.content}</div>;
    case 'traceable_text':
      return (
        <div key={index} className="flex items-center justify-center h-32 w-32 text-8xl font-bold text-gray-300 pdf-avoid-break" style={{ fontFamily: "'Comic Sans MS', cursive, sans-serif", border: "2px dashed #d1d5db", borderRadius: "0.5rem" }}>
          {item.content}
        </div>
      );
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
                            <Pictogram src={picto.url} searchTerm={picto.searchTerm} altText={picto.content} className="max-w-full max-h-full" />
                        </div>
                        <span className="mt-1">{picto.content}</span>
                    </div>
                ))}
            </div>
        )}
    </div>
);

const renderSection = ({ instruction, items, layout }: WorksheetSection) => {
  if (layout === 'true_false') {
    if (items.length < 3) return <div className="text-red-500 p-4">Error: Se esperaban 3 items para el layout "true_false".</div>;
    const [mainImage, affirmation1, affirmation2] = items;
    return (
        <div className="p-4 mt-4 bg-white pdf-avoid-break">
            <SectionHeader instruction={instruction} />
            <div className="flex flex-col items-center gap-6">
                <div className="flex flex-col items-center justify-center p-2 h-64 w-full bg-gray-50 rounded-lg">
                  <Pictogram
                    searchTerm={mainImage.searchTerm || mainImage.content}
                    altText={mainImage.content}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="flex items-center justify-around w-full mt-4">
                    <Pictogram searchTerm="correcto" altText="Correcto" className="w-28 h-28" />
                    <div className="flex gap-4">
                      {renderWorksheetItem(affirmation1, 1)}
                      {renderWorksheetItem(affirmation2, 2)}
                    </div>
                    <Pictogram searchTerm="incorrecto" altText="Incorrecto" className="w-28 h-28" />
                </div>
            </div>
        </div>
    );
  }

  if (layout === 'sentence_building') {
      const emptyBoxes = items.filter(item => item.type === 'empty_box');
      const pictos = items.filter(item => item.type !== 'empty_box');
      return (
          <div className="p-4 mt-4 bg-white pdf-avoid-break">
              <SectionHeader instruction={instruction} />
              <div className="flex flex-row items-center justify-center gap-4 flex-wrap mb-8">
                  {emptyBoxes.map((item, index) => renderWorksheetItem(item, index))}
              </div>
              <div className="flex items-center w-full my-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 flex-shrink-0"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" x2="8.12" y1="4" y2="15.88"/><line x1="14.47" x2="20" y1="14.48" y2="20"/><line x1="8.12" x2="12" y1="8.12" y2="12"/></svg>
                <div className="w-full border-t-4 border-dashed border-gray-400 ml-2"></div>
              </div>
              <div className="flex flex-row items-center justify-center gap-4 flex-wrap mt-8">
                  {pictos.map((item, index) => renderWorksheetItem(item, index + emptyBoxes.length))}
              </div>
          </div>
      );
  }
  
  if (layout === 'matching_horizontal') {
    if (items.length === 0 || items.length % 2 !== 0) {
      return <div className="text-red-500 p-4">Error: Se esperaba un número par de items para el layout "matching_horizontal".</div>;
    }

    const midPoint = items.length / 2;
    const topRowItems = items.slice(0, midPoint);
    const bottomRowItems = items.slice(midPoint);
    const shuffledBottomRowItems = [...bottomRowItems].sort(() => Math.random() - 0.5);

    return (
      <div className="p-4 mt-4 bg-white pdf-avoid-break">
        <SectionHeader instruction={instruction} />
        <div className="flex flex-col items-stretch gap-8">
          <div className="flex flex-row items-start justify-around w-full">
            {topRowItems.map((item, index) => (
              <div key={`top-${index}`} className="flex flex-col items-center gap-4">
                {renderWorksheetItem(item, index)}
                <div className="w-5 h-5 rounded-full border-2 border-black bg-white shadow-inner"></div>
              </div>
            ))}
          </div>
          <div className="flex flex-row items-start justify-around w-full">
            {shuffledBottomRowItems.map((item, index) => (
              <div key={`bottom-${index}`} className="flex flex-col items-center gap-4">
                 <div className="w-5 h-5 rounded-full border-2 border-black bg-white shadow-inner"></div>
                {renderWorksheetItem(item, index + midPoint)}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const layoutClasses = layout === 'row' 
    ? "flex flex-row items-center justify-center gap-4 flex-wrap"
    : "flex flex-col items-center justify-center gap-4";
  
  return (
    <div className="p-4 border-2 border-gray-300 rounded-lg mt-4 bg-white pdf-avoid-break">
      <SectionHeader instruction={instruction} />
      <div className={layoutClasses}>
        {items.map((item, index) => renderWorksheetItem(item, index))}
      </div>
    </div>
  );
};


export const WorksheetDisplay: React.FC<{ worksheet: Worksheet }> = ({ worksheet }) => {
  return (
    <div className="p-6 border-4 border-black bg-slate-50 aspect-[210/297] w-full mx-auto" style={{fontFamily: "'Comic Sans MS', cursive, sans-serif"}}>
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
           <Pictogram
            src={worksheet.pictogramUrl}
            searchTerm={worksheet.pictogramSearchTerm}
            altText={worksheet.pictogramSearchTerm}
            className="max-h-12 max-w-12"
           />
        </div>
        <h2 className="text-4xl font-extrabold tracking-wider text-black uppercase">{worksheet.title}</h2>
      </header>
      
      <main className="space-y-4">
        {worksheet.sections.map((section, index) => (
          <React.Fragment key={index}>
            {renderSection(section)}
            {index < worksheet.sections.length - 1 && (
              <div className="w-full border-t-2 border-dashed border-gray-300 my-6"></div>
            )}
          </React.Fragment>
        ))}
      </main>
    </div>
  );
};
