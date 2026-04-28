import React, { useState } from 'react';
import { WorksheetItem } from '../../types';
import { Pictogram, getAdaptiveSpelledBoxWidth } from '../PictogramRenderer';

const getAdaptiveImageWidth = (item: WorksheetItem, isSpelledFallback: boolean): string => {
  const shouldExpand = item.pictogramRenderMode === 'spell' || isSpelledFallback;
  return getAdaptiveSpelledBoxWidth(item.searchTerm || item.content || '', shouldExpand, {
    minRem: 8.5,
    baseRem: 4.5,
    stepRem: 2.8,
    maxRem: 34,
  });
};

const ImageItemCard: React.FC<{
  item: WorksheetItem;
  index: number;
  hidePicto?: boolean;
  hideText?: boolean;
}> = ({ item, index, hidePicto, hideText }) => {
  const [isSpelledFallback, setIsSpelledFallback] = useState(item.pictogramRenderMode === 'spell');
  const adaptiveWidth = getAdaptiveImageWidth(item, isSpelledFallback);
  const showLetterBlocks = item.pictogramRenderMode === 'spell' || isSpelledFallback;

  return (
    <div
      key={index}
      className="flex flex-shrink-0 flex-col items-center justify-center p-3 border-2 border-black rounded-lg min-h-44 bg-white pdf-avoid-break"
      style={{
        width: adaptiveWidth,
        minWidth: adaptiveWidth,
      }}
    >
      {!hidePicto && (
        item.selectedPictoUrl || item.searchTerm ? (
              <Pictogram
                searchTerm={item.searchTerm || item.content}
                altText={item.content}
                src={item.selectedPictoUrl}
                renderMode={item.pictogramRenderMode}
            letterTerms={item.spelledLetterTerms}
            letterUrls={item.spelledLetterUrls}
            className="max-h-24 max-w-24 object-contain"
            letterWrapperClassName="max-h-28 w-full min-w-0 justify-center px-1"
            letterTileClassName="max-h-12 max-w-12"
            letterSingleRow
            onFallbackModeChange={setIsSpelledFallback}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center px-2 text-center text-5xl font-bold text-gray-700 break-words line-clamp-2 overflow-hidden">
            {item.content.substring(0, 7)}
          </div>
        )
      )}
      {!hideText && !showLetterBlocks && <span className="mt-2 text-sm text-center font-mono text-gray-700 uppercase">{item.content}</span>}
    </div>
  );
};

const renderTraceableGuide = (item: WorksheetItem, index: number, hidePicto?: boolean, hideText?: boolean, solidText?: boolean) => {
  const searchTerm = item.searchTerm || item.content;

  return (
    <div key={index} className="w-full max-w-[760px] bg-white pdf-avoid-break">
      <div className="flex items-center gap-0">
        {!hidePicto ? (
          <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-xl border-2 border-black bg-white p-2">
            <Pictogram
              searchTerm={searchTerm}
              altText={item.content}
              className="max-h-full max-w-full object-contain"
              src={item.selectedPictoUrl}
              renderMode={item.pictogramRenderMode}
              letterTerms={item.spelledLetterTerms}
              letterUrls={item.spelledLetterUrls}
              letterTileClassName="min-h-8 min-w-8 max-w-full"
            />
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
      return <ImageItemCard item={item} index={index} hidePicto={hidePicto} hideText={hideText} />;
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
