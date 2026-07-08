import { APP_DATA_STORAGE_KEY, DEFAULT_AI_SETTINGS } from '../constants';
import type { AppData, AISettings } from '../types';

const getAppData = (): AppData | null => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }

  try {
    const appDataRaw = localStorage.getItem(APP_DATA_STORAGE_KEY);
    return appDataRaw ? JSON.parse(appDataRaw) as AppData : null;
  } catch (error) {
    console.error('Could not load app data from localStorage.', error);
    return null;
  }
};

const getAISettings = (): AISettings => {
  const appData = getAppData();
  return {
    ...DEFAULT_AI_SETTINGS,
    ...(appData?.aiSettings || {}),
  };
};

const callGemini = async (promptText: string, settings: AISettings): Promise<string> => {
  if (!settings.geminiApiKey.trim()) {
    throw new Error('Configura una clave de API de Gemini en el perfil para usar este proveedor.');
  }

  const body: Record<string, unknown> = {
    contents: [{
      parts: [{ text: promptText }],
    }],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.4,
    },
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(settings.geminiModel)}:generateContent?key=${encodeURIComponent(settings.geminiApiKey)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  const responseText = await response.text();
  if (!response.ok) {
    throw new Error(`Gemini devolvió un error (${response.status}): ${responseText}`);
  }

  const payload = JSON.parse(responseText);
  const text = payload?.candidates?.[0]?.content?.parts
    ?.map((part: { text?: string }) => part.text || '')
    .join('')
    .trim();

  if (!text) {
    throw new Error('Gemini no devolvió contenido útil.');
  }

  return text;
};

const normalizeOllamaBaseUrl = (baseUrl: string): string => baseUrl.replace(/\/+$/, '');

const callOllama = async (promptText: string, settings: AISettings): Promise<string> => {
  const baseUrl = normalizeOllamaBaseUrl(settings.ollamaBaseUrl);
  if (!baseUrl) {
    throw new Error('Configura la URL base de Ollama en el perfil para usar este proveedor.');
  }

  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: settings.ollamaModel,
      stream: false,
      format: 'json',
      messages: [{
        role: 'user',
        content: promptText,
      }],
    }),
  });

  const responseText = await response.text();
  if (!response.ok) {
    throw new Error(`Ollama devolvió un error (${response.status}): ${responseText}`);
  }

  const payload = JSON.parse(responseText);
  const text = payload?.message?.content?.trim();
  if (!text) {
    throw new Error('Ollama no devolvió contenido útil.');
  }

  return text;
};

const callDebugProxy = async (promptText: string, settings: AISettings): Promise<string> => {
  const response = await fetch('/__ai-debug', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      promptText,
      settings,
    }),
  });

  const responseText = await response.text();
  if (!response.ok) {
    throw new Error(`AI debug proxy devolvió un error (${response.status}): ${responseText}`);
  }

  const payload = JSON.parse(responseText);
  if (!payload?.text) {
    throw new Error('AI debug proxy no devolvió contenido útil.');
  }

  return payload.text as string;
};

export const runAiPrompt = async (promptText: string): Promise<string> => {
  const settings = getAISettings();

  if (import.meta.env.DEV) {
    return callDebugProxy(promptText, settings);
  }

  if (settings.provider === 'ollama') {
    return callOllama(promptText, settings);
  }

  return callGemini(promptText, settings);
};
