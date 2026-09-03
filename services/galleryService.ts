import { PictogramSearchResult } from '../types';

export interface GalleryImage {
  id: string;
  dataUrl: string;
  keywords: {
    es: string[];
    val: string[];
    en: string[];
  };
  createdAt: string;
}

const DB_NAME = 'adaptatorGalleryDB';
const STORE_NAME = 'images';
const DB_VERSION = 1;

let dbInstance: IDBDatabase | null = null;

const getDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
};

export const saveGalleryImage = async (
  dataUrl: string,
  keywords: GalleryImage['keywords'],
  existingId?: string
): Promise<GalleryImage> => {
  const db = await getDB();
  const image: GalleryImage = {
    id: existingId || 'gallery_' + crypto.randomUUID(),
    dataUrl,
    keywords: {
      es: (keywords.es || []).map(k => k.toLowerCase().trim()).filter(Boolean),
      val: (keywords.val || []).map(k => k.toLowerCase().trim()).filter(Boolean),
      en: (keywords.en || []).map(k => k.toLowerCase().trim()).filter(Boolean),
    },
    createdAt: new Date().toISOString(),
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(image);

    request.onsuccess = () => resolve(image);
    request.onerror = () => reject(request.error);
  });
};

export const deleteGalleryImage = async (id: string): Promise<void> => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getAllGalleryImages = async (): Promise<GalleryImage[]> => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

const normalizeText = (text: string): string => {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
};

export const searchGalleryImages = async (
  term: string,
  lang: 'es' | 'val' | 'en' = 'es'
): Promise<PictogramSearchResult[]> => {
  const allImages = await getAllGalleryImages();
  const normalizedSearch = normalizeText(term);

  if (!normalizedSearch) return [];

  // Filter images that have keywords matching the search term
  const matches = allImages.filter(img => {
    const langKeywords = img.keywords[lang] || [];
    return langKeywords.some(keyword => normalizeText(keyword) === normalizedSearch);
  });

  return matches.map(img => ({
    id: img.id,
    url: img.dataUrl,
    keywords: img.keywords[lang] || [],
    isGallery: true,
  }));
};

/**
 * Automatically retrieves the first gallery image matching the search term,
 * to override ARASAAC lookup.
 */
export const getGalleryImageForKeyword = async (
  term: string,
  lang: 'es' | 'val' | 'en' = 'es'
): Promise<PictogramSearchResult | null> => {
  const results = await searchGalleryImages(term, lang);
  return results.length > 0 ? results[0] : null;
};

/**
 * Resizes an image file to exactly 500x500 pixels preserving transparency.
 */
export const resizeImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 500;
        canvas.height = 500;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo obtener el contexto de canvas de 2D.'));
          return;
        }

        // Draw image fitting 500x500 keeping aspect ratio with transparent background
        const scale = Math.min(500 / img.width, 500 / img.height);
        const x = (500 - img.width * scale) / 2;
        const y = (500 - img.height * scale) / 2;
        ctx.clearRect(0, 0, 500, 500);
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => reject(new Error('No se pudo cargar la imagen.'));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    reader.readAsDataURL(file);
  });
};
