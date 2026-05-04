import React, { useState } from 'react';
import hersheyFonts from 'hersheytext/hersheytext.min.json';
import { WorksheetItem } from '../../types';
import { Pictogram, getAdaptiveSpelledBoxWidth } from '../PictogramRenderer';

const TRACE_VIEWBOX_WIDTH = 620;
const TRACE_VIEWBOX_HEIGHT = 88;
const TRACE_TEXT_HEIGHT_UNITS = 22;
const TRACE_TEXT_SIDE_PADDING = 28;
const TRACE_TEXT_TOP_PADDING = 5;
const TRACE_TEXT_BOTTOM_PADDING = 7;
const TRACE_TEXT_BASELINE = TRACE_VIEWBOX_HEIGHT - TRACE_TEXT_BOTTOM_PADDING;
const TRACE_TEXT_DEFAULT_SPACE_UNITS = 10;
const TRACE_TEXT_LETTER_SPACING_UNITS = 0.6;
const TRACE_TEXT_ADVANCE_MULTIPLIER = 1.68;
const HERSHEY_ASCII_OFFSET = 33;

type HersheyGlyph = {
  d: string;
  o: number | string;
};

type HersheyFont = {
  name: string;
  chars: HersheyGlyph[];
};

const TRACE_STROKE_FONT = (hersheyFonts as Record<string, HersheyFont>).futural;

const getStrokeGlyph = (character: string): HersheyGlyph | null => {
  const glyphIndex = character.charCodeAt(0) - HERSHEY_ASCII_OFFSET;
  return TRACE_STROKE_FONT.chars[glyphIndex] || null;
};

const canRenderAsStrokeText = (content: string): boolean =>
  Array.from(content).every(character => character === ' ' || !!getStrokeGlyph(character));

const getStrokeTextMetrics = (content: string): { totalWidthUnits: number; scale: number; translateX: number } => {
  const characters = Array.from(content);
  const totalWidthUnits = characters.reduce((sum, character, index) => {
    if (character === ' ') {
      return sum + TRACE_TEXT_DEFAULT_SPACE_UNITS * TRACE_TEXT_ADVANCE_MULTIPLIER;
    }

    const glyph = getStrokeGlyph(character);
    const glyphWidth = Number(glyph?.o || TRACE_TEXT_DEFAULT_SPACE_UNITS) * TRACE_TEXT_ADVANCE_MULTIPLIER;
    const extraSpacing = index < characters.length - 1 ? TRACE_TEXT_LETTER_SPACING_UNITS : 0;
    return sum + glyphWidth + extraSpacing;
  }, 0);

  const availableWidth = TRACE_VIEWBOX_WIDTH - TRACE_TEXT_SIDE_PADDING * 2;
  const availableHeight = TRACE_VIEWBOX_HEIGHT - TRACE_TEXT_TOP_PADDING - TRACE_TEXT_BOTTOM_PADDING;
  const widthScale = totalWidthUnits > 0 ? availableWidth / totalWidthUnits : 1;
  const heightScale = availableHeight / TRACE_TEXT_HEIGHT_UNITS;
  const scale = Math.min(widthScale, heightScale);
  const renderedWidth = totalWidthUnits * scale;
  const translateX = (TRACE_VIEWBOX_WIDTH - renderedWidth) / 2;

  return { totalWidthUnits, scale, translateX };
};

const offsetStrokePathData = (pathData: string, offsetX: number): string =>
  pathData.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (_, x, y) => `${Number(x) + offsetX},${y}`);

const renderStrokeText = (content: string, solidText?: boolean) => {
  const { scale, translateX } = getStrokeTextMetrics(content);
  let offsetX = 0;
  const characters = Array.from(content);
  const combinedPathData = characters.map((character, index) => {
    if (character === ' ') {
      offsetX += TRACE_TEXT_DEFAULT_SPACE_UNITS * TRACE_TEXT_ADVANCE_MULTIPLIER;
      return '';
    }

    const glyph = getStrokeGlyph(character);
    if (!glyph) {
      return '';
    }
    const pathData = offsetStrokePathData(glyph.d, offsetX);

    offsetX += Number(glyph.o || TRACE_TEXT_DEFAULT_SPACE_UNITS) * TRACE_TEXT_ADVANCE_MULTIPLIER;
    if (index < characters.length - 1) {
      offsetX += TRACE_TEXT_LETTER_SPACING_UNITS;
    }
    return pathData;
  }).filter(Boolean).join(' ');

  return (
    <path
      d={combinedPathData}
      transform={`translate(${translateX} ${TRACE_TEXT_TOP_PADDING}) scale(${scale} ${scale})`}
      fill="none"
      stroke={solidText ? '#000000' : '#7c8da3'}
      strokeWidth={solidText ? 1.85 : 1.4}
      strokeDasharray={solidText ? undefined : '3.8 4.4'}
      strokeLinecap="round"
      strokeLinejoin="round"
      vectorEffect="non-scaling-stroke"
    />
  );
};

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
  const canRenderStrokeText = canRenderAsStrokeText(item.content);

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
          <line x1="0" y1="44" x2="620" y2="44" stroke="#a7b7ca" strokeWidth="1" strokeDasharray="3 7" />
          <line x1="0" y1="82" x2="620" y2="82" stroke="black" strokeWidth="2" />
          {!hideText && canRenderStrokeText && renderStrokeText(item.content, solidText)}
          {!hideText && !canRenderStrokeText && (
            <text
              x="310"
              y="52"
              textAnchor="middle"
              dominantBaseline="middle"
              fill={solidText ? 'black' : '#94a3b8'}
              fillOpacity={solidText ? '1' : '0.55'}
              stroke="none"
              fontSize="94"
              fontWeight={solidText ? '500' : '400'}
              fontFamily="'Patrick Hand Local', 'Patrick Hand', cursive"
              fontKerning="none"
              textRendering="geometricPrecision"
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
