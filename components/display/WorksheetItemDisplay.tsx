import React from 'react';
import { WorksheetItem } from '../../types';
import { Pictogram } from '../WorksheetDisplay';

const renderTraceableGuide = (item: WorksheetItem, index: number, hidePicto?: boolean, hideText?: boolean, solidText?: boolean) => {
  const searchTerm = item.searchTerm || item.content;

  return (
    <div key={index} className="w-full max-w-[760px] bg-white pdf-avoid-break">
      <div className="flex items-center gap-0">
        {!hidePicto ? (
          <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-xl border-2 border-black bg-white p-2">
            <Pictogram searchTerm={searchTerm} altText={item.content} className="max-h-full max-w-full object-contain" src={item.selectedPictoUrl} />
          </div>
        ) : (
          <div className="h-24 w-24 flex-shrink-0" aria-hidden="true" />
        )}
        <svg viewBox="0 0 620 88" className="block h-[88px] w-full overflow-visible" preserveAspectRatio="none" aria-hidden="true">
          <line x1="0" y1="6" x2="620" y2="6" stroke="black" strokeWidth="2" />
          <line x1="0" y1="44" x2="620" y2="44" stroke="#6b7280" strokeWidth="2" strokeDasharray="6 6" />
          <line x1="0" y1="82" x2="620" y2="82" stroke="black" strokeWidth="2" />
          {!hideText && (
            <text
              x="310"
              y="52"
              textAnchor="middle"
              dominantBaseline="middle"
              fill={solidText ? 'black' : 'transparent'}
              stroke={solidText ? 'none' : '#cbd5e1'}
              strokeWidth={solidText ? '0' : '1.2'}
              strokeDasharray={solidText ? 'none' : '3 3'}
              strokeLinecap="round"
              strokeLinejoin="round"
              paintOrder="stroke"
              fontSize="94"
              letterSpacing="0"
              fontWeight={solidText ? '400' : '100'}
              fontFamily="'Helvetica Neue', Arial, sans-serif"
            >
              {item.content}
            </text>
          )}
        </svg>
      </div>
    </div>
  );
};

export const WorksheetItemDisplay: React.FC<{ item: WorksheetItem; index: number; hidePicto?: boolean; hideText?: boolean; solidText?: boolean }> = ({ item, index, hidePicto, hideText, solidText }) => {
  switch (item.type) {
    case 'image':
      return (
        <div key={index} className="flex flex-col items-center justify-center p-3 border-2 border-black rounded-lg h-40 w-40 bg-white pdf-avoid-break">
          {!hidePicto && (
            item.selectedPictoUrl || item.searchTerm ? (
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
            )
          )}
          {!hideText && <span className="text-base text-center mt-2 font-mono text-gray-700 uppercase">{item.content}</span>}
        </div>
      );
    case 'text':
      return <div key={index} className="flex items-center justify-center h-32 w-32 text-4xl font-bold text-gray-700 pdf-avoid-break">{!hideText ? item.content : ''}</div>;
    case 'traceable_text':
      return renderTraceableGuide(item, index, hidePicto, hideText, solidText);
    case 'empty_box':
      return <div key={index} className="h-32 w-32 border-2 border-black rounded-lg bg-white pdf-avoid-break"></div>;
    default:
      return null;
  }
};
