import { APP_DATA_STORAGE_KEY, DEFAULT_PICTOGRAM_SETTINGS } from '../constants';
import type { AppData, PictogramSearchResult, PictogramSettings } from '../types';

interface ArasaacPictogram {
  _id: number;
  keywords?: { keyword: string }[];
}

const getPictogramSettings = (): PictogramSettings => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { ...DEFAULT_PICTOGRAM_SETTINGS };
  }

  try {
    const appDataRaw = localStorage.getItem(APP_DATA_STORAGE_KEY);
    const appData = appDataRaw ? JSON.parse(appDataRaw) as AppData : null;
    return {
      ...DEFAULT_PICTOGRAM_SETTINGS,
      ...(appData?.pictogramSettings || {}),
    };
  } catch (error) {
    console.error('Could not load pictogram settings from localStorage.', error);
    return { ...DEFAULT_PICTOGRAM_SETTINGS };
  }
};

const normalizeBaseUrl = (value: string): string => value.replace(/\/+$/, '');

const mapArasaacPictograms = (pictograms: ArasaacPictogram[]): PictogramSearchResult[] =>
  pictograms.map((picto) => ({
    id: String(picto._id),
    url: `https://static.arasaac.org/pictograms/${picto._id}/${picto._id}_500.png`,
    keywords: picto.keywords?.map(keyword => keyword.keyword) || [],
  }));

const normalizeArasaacLang = (lang: string): string => {
  const code = lang.toLowerCase().trim();
  if (code === 'val' || code === 'valenciano' || code === 'ca' || code === 'catalan') {
    return 'ca';
  }
  if (code === 'en' || code === 'english' || code === 'ing' || code === 'inglés') {
    return 'en';
  }
  return 'es';
};

const searchOfficialArasaac = async (searchTerm: string, apiUrl: string, lang = 'es'): Promise<PictogramSearchResult[]> => {
  const apiLang = normalizeArasaacLang(lang);
  let modifiedSearchTerm = searchTerm.trim();
  if (modifiedSearchTerm.toUpperCase().startsWith('COLOR ')) {
    modifiedSearchTerm = modifiedSearchTerm.substring(6).trim();
  }

  const runSearch = async (term: string, currentLang: string): Promise<PictogramSearchResult[]> => {
    const response = await fetch(`${normalizeBaseUrl(apiUrl)}/${currentLang}/bestsearch/${encodeURIComponent(term)}`);
    console.log(`ARASAAC API Response Status for "${term}" (${currentLang}): ${response.status} ${response.statusText}`);
    if (!response.ok) {
      return [];
    }

    const pictograms = await response.json() as ArasaacPictogram[];
    return mapArasaacPictograms(pictograms);
  };

  try {
    // 1. Try search in the requested language
    let results = await runSearch(modifiedSearchTerm, apiLang);
    if (results.length > 0) {
      return results;
    }

    // Try fallback search by splitting words if multi-word
    const words = modifiedSearchTerm.split(/\s+/).filter(Boolean);
    if (words.length > 1) {
      for (const word of words) {
        const fallbackResults = await runSearch(word, apiLang);
        if (fallbackResults.length > 0) {
          return fallbackResults;
        }
      }
    }

    // 2. If no results found and language is not Spanish, fallback to Spanish as a last resort
    if (apiLang !== 'es') {
      console.log(`No results for "${modifiedSearchTerm}" in ${apiLang}. Falling back to Spanish (es)...`);
      results = await runSearch(modifiedSearchTerm, 'es');
      if (results.length > 0) {
        return results;
      }
      if (words.length > 1) {
        for (const word of words) {
          const fallbackResults = await runSearch(word, 'es');
          if (fallbackResults.length > 0) {
            return fallbackResults;
          }
        }
      }
    }

    return [];
  } catch (error) {
    console.error(`Error fetching pictograms for "${searchTerm}" (${lang}):`, error);
    return [];
  }
};

const searchPrivateApi = async (searchTerm: string, apiUrl: string): Promise<PictogramSearchResult[]> => {
  try {
    const response = await fetch(`${normalizeBaseUrl(apiUrl)}/search?query=${encodeURIComponent(searchTerm)}`);
    console.log(`Private pictogram API response for "${searchTerm}": ${response.status} ${response.statusText}`);
    if (!response.ok) {
      return [];
    }

    const payload = await response.json();
    if (!Array.isArray(payload)) {
      return [];
    }

    return payload.map((item: any) => ({
      id: String(item.id ?? item._id ?? item.url),
      url: String(item.url),
      keywords: Array.isArray(item.keywords) ? item.keywords.map(String) : [],
    })).filter((item: PictogramSearchResult) => item.url);
  } catch (error) {
    console.error(`Error fetching pictograms from private API for "${searchTerm}":`, error);
    return [];
  }
};

import { searchGalleryImages } from './galleryService';

export const searchPictograms = async (
  searchTerm: string,
  lang = 'es',
  options?: { isManualSearch?: boolean }
): Promise<PictogramSearchResult[]> => {
  const isManual = options?.isManualSearch || false;

  // 1. Search local gallery first
  const galleryResults = await searchGalleryImages(searchTerm, lang as any);

  // If auto-selection (not manual), gallery result takes complete precedence. Skip API.
  if (!isManual && galleryResults.length > 0) {
    console.log(`[PIC TO AUTOSELECT] Local gallery match found for "${searchTerm}". Skipping ARASAAC API.`);
    return galleryResults;
  }

  // 2. Search API
  const settings = getPictogramSettings();
  let apiResults: PictogramSearchResult[] = [];

  try {
    if (settings.provider === 'private_api') {
      apiResults = await searchPrivateApi(searchTerm, settings.privateApiUrl);
    } else {
      apiResults = await searchOfficialArasaac(searchTerm, settings.arasaacApiUrl, lang);
    }
  } catch (error) {
    console.error("API search failed:", error);
  }

  if (isManual) {
    // Combine results: gallery matches first, then API matches
    return [...galleryResults, ...apiResults];
  }

  return apiResults;
};
