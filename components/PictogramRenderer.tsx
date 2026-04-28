import React, { useEffect, useMemo, useRef, useState } from 'react';
import { searchPictograms } from '../services/pictogramService';
import type { PictogramRenderMode } from '../types';

const pictogramUrlCache = new Map<string, string>();
const LETTER_BLOCK_FONT_FAMILY = "'Verdana', 'Trebuchet MS', 'Arial Rounded MT Bold', Arial, sans-serif";
const MAX_VISIBLE_LETTER_BLOCKS = 7;

const normalizeTerm = (value: string): string => value.trim().toLowerCase();

const getCandidateTerms = (searchTerm: string): string[] => {
  const normalized = searchTerm.trim();
  if (!normalized) return [];

  return [...new Set([normalized, ...normalized.split(' ').reverse()].filter(Boolean))];
};

const getSpellableCharacters = (value: string): string[] =>
  Array.from(value.trim()).filter(character => character.trim().length > 0);

const getWordRowWidthRem = (letterCount: number, isCompactWord: boolean): number => {
  const visibleLetters = Math.min(letterCount, MAX_VISIBLE_LETTER_BLOCKS);
  const tileRem = isCompactWord ? 2.5 : 3;
  const gapRem = isCompactWord ? 0.25 : 0.375;

  return visibleLetters * tileRem + Math.max(visibleLetters - 1, 0) * gapRem;
};

export const getLongestSpelledWordLength = (value: string): number =>
  value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .reduce((longest, word) => Math.min(MAX_VISIBLE_LETTER_BLOCKS, Math.max(longest, Array.from(word).length)), 0);

export const getAdaptiveSpelledBoxWidth = (
  value: string,
  shouldExpand: boolean,
  options?: { minRem?: number; baseRem?: number; stepRem?: number; maxRem?: number }
): string => {
  const longestWordLength = getLongestSpelledWordLength(value);
  const minRem = options?.minRem ?? 4;
  const baseRem = options?.baseRem ?? 4;
  const stepRem = options?.stepRem ?? 1.35;
  const maxRem = options?.maxRem ?? 20;

  if (!shouldExpand || longestWordLength <= 1) {
    return `${minRem}rem`;
  }

  return `${Math.min(maxRem, Math.max(minRem, baseRem + longestWordLength * stepRem))}rem`;
};

export const getAdaptiveSpelledBoxStyle = (
  value: string,
  shouldExpand: boolean,
  options?: { minRem?: number; baseRem?: number; stepRem?: number; maxRem?: number; defaultRem?: number }
): React.CSSProperties => {
  const defaultRem = options?.defaultRem ?? options?.minRem ?? 4;

  if (!shouldExpand) {
    return {
      width: `${defaultRem}rem`,
      minWidth: `${defaultRem}rem`,
    };
  }

  const computedWidth = getAdaptiveSpelledBoxWidth(value, true, options);
  return {
    width: 'fit-content',
    minWidth: computedWidth,
    maxWidth: '100%',
  };
};

const resolveCachedPictogram = async (term: string): Promise<string> => {
  const cacheKey = normalizeTerm(term);
  if (!cacheKey) return '';

  if (pictogramUrlCache.has(cacheKey)) {
    return pictogramUrlCache.get(cacheKey) || '';
  }

  const results = await searchPictograms(term);
  const nextUrl = results[0]?.url || '';
  if (nextUrl) {
    pictogramUrlCache.set(cacheKey, nextUrl);
  }
  return nextUrl;
};

type SpelledCharacter = {
  character: string;
  term: string;
};

type SpelledWord = {
  text: string;
  letters: SpelledCharacter[];
};

const getWordRanges = (value: string): Array<{ word: string; indexes: number[] }> => {
  const trimmed = value.trim();
  if (!trimmed) return [];

  const ranges: Array<{ word: string; indexes: number[] }> = [];
  let currentWord = '';
  let currentIndexes: number[] = [];
  let glyphIndex = 0;

  for (const character of Array.from(trimmed)) {
    if (character.trim().length === 0) {
      if (currentWord) {
        ranges.push({ word: currentWord, indexes: currentIndexes });
        currentWord = '';
        currentIndexes = [];
      }
      continue;
    }

    currentWord += character;
    currentIndexes.push(glyphIndex);
    glyphIndex += 1;
  }

  if (currentWord) {
    ranges.push({ word: currentWord, indexes: currentIndexes });
  }

  return ranges;
};

const SpelledPictogram: React.FC<{
  text: string;
  altText: string;
  letterTerms?: string[];
  letterUrls?: string[];
  wrapperClassName?: string;
  tileClassName?: string;
  singleRow?: boolean;
}> = ({ text, altText, letterTerms, letterUrls, wrapperClassName, tileClassName, singleRow }) => {
  const words = useMemo(() => {
    const glyphs = getSpellableCharacters(text);
    const wordRanges = getWordRanges(text);
    if (glyphs.length === 0 || wordRanges.length === 0) {
      return [];
    }

    const resolvedCharacters = glyphs.map((character, index) => ({
      character,
      term: letterTerms?.[index]?.trim() || character,
    }));

    return wordRanges.map(({ word, indexes }) => ({
      text: word,
      letters: indexes.map(index => resolvedCharacters[index]).filter(Boolean),
    })).filter(word => word.letters.length > 0);
  }, [letterTerms, text]);

  if (words.length === 0) {
    return <span className="px-1 text-center text-[10px] font-bold text-gray-700">{altText}</span>;
  }

  const maxWordLength = words.reduce((longest, word) => Math.max(longest, word.letters.length), 0);
  const isCompactWord = maxWordLength >= 8;
  const isMediumWord = maxWordLength >= 5 && maxWordLength < 8;

  const compactTileClassName =
    isCompactWord
      ? 'min-h-10 min-w-10 px-1 py-1'
      : isMediumWord
        ? 'min-h-11 min-w-11 px-1.5 py-1'
        : 'min-h-12 min-w-12 px-1.5 py-1.5';

  const overflowClassName = singleRow && words.length === 1 ? 'overflow-hidden' : 'overflow-visible';
  const rowGapClassName = words.length > 1 ? 'gap-2' : 'gap-1';
  const letterGapClassName = isCompactWord ? 'gap-1' : 'gap-1.5';

  return (
    <div className={`flex max-w-full flex-col items-center flex-1 justify-center ${rowGapClassName} ${overflowClassName} ${wrapperClassName || ''}`} aria-label={altText}>
      {words.map(({ text: wordText, letters }, wordIndex) => (
        <div
          key={`${wordText}-${wordIndex}`}
          className={`flex max-w-full flex-nowrap justify-center overflow-hidden ${letterGapClassName}`}
          title={wordText}
          style={{ width: `${getWordRowWidthRem(letters.length, isCompactWord)}rem` }}
        >
          {letters.slice(0, MAX_VISIBLE_LETTER_BLOCKS).map(({ character, term }, letterIndex) => (
            <div
              key={`${character}-${wordIndex}-${letterIndex}`}
              className={`inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.08)] ${compactTileClassName} ${tileClassName || ''}`}
              title={term}
            >
              <span
                className={`${isCompactWord ? 'text-sm' : 'text-base'} text-center font-extrabold uppercase tracking-[0.03em] text-slate-800`}
                style={{ fontFamily: LETTER_BLOCK_FONT_FAMILY }}
              >
                {character}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export const Pictogram: React.FC<{
  searchTerm: string;
  altText: string;
  className?: string;
  src?: string | null;
  renderMode?: PictogramRenderMode;
  letterTerms?: string[];
  letterUrls?: string[];
  letterWrapperClassName?: string;
  letterTileClassName?: string;
  letterSingleRow?: boolean;
  onFallbackModeChange?: (isSpelledFallback: boolean) => void;
}> = ({
  searchTerm,
  altText,
  className,
  src,
  renderMode = 'auto',
  letterTerms,
  letterUrls,
  letterWrapperClassName,
  letterTileClassName,
  letterSingleRow,
  onFallbackModeChange,
}) => {
  const [imgSrc, setImgSrc] = useState<string>(src || '');
  const [showSpelledFallback, setShowSpelledFallback] = useState(renderMode === 'spell');
  const searchTermsRef = useRef<string[]>([]);
  const candidateTerms = useMemo(() => getCandidateTerms(searchTerm), [searchTerm]);

  useEffect(() => {
    let cancelled = false;

    if (renderMode === 'spell') {
      setImgSrc('');
      setShowSpelledFallback(true);
      return () => {
        cancelled = true;
      };
    }

    if (src) {
      setImgSrc(src);
      setShowSpelledFallback(false);
      return () => {
        cancelled = true;
      };
    }

    searchTermsRef.current = candidateTerms;
    setImgSrc('');
    setShowSpelledFallback(false);

    const resolvePictogram = async () => {
      for (const term of candidateTerms) {
        const nextUrl = await resolveCachedPictogram(term);
        if (nextUrl) {
          if (!cancelled) {
            setImgSrc(nextUrl);
            setShowSpelledFallback(false);
          }
          return;
        }
      }

      if (!cancelled) {
        setShowSpelledFallback(Boolean(searchTerm.trim()));
      }
    };

    void resolvePictogram();

    return () => {
      cancelled = true;
    };
  }, [candidateTerms, renderMode, searchTerm, src]);

  const handleError = () => {
    for (const term of searchTermsRef.current) {
      pictogramUrlCache.delete(normalizeTerm(term));
    }
    setImgSrc('');
    setShowSpelledFallback(Boolean(searchTerm.trim()));
  };

  useEffect(() => {
    onFallbackModeChange?.(showSpelledFallback);
  }, [onFallbackModeChange, showSpelledFallback]);

  if (showSpelledFallback) {
    return (
      <SpelledPictogram
        text={searchTerm || altText}
        altText={altText}
        letterTerms={letterTerms}
        letterUrls={letterUrls}
        wrapperClassName={letterWrapperClassName}
        tileClassName={letterTileClassName}
        singleRow={letterSingleRow}
      />
    );
  }

  if (!imgSrc) {
    return <span className="px-1 text-center text-[10px] font-bold text-gray-700">{altText}</span>;
  }

  return <img src={imgSrc} alt={altText} className={className} onError={handleError} />;
};
