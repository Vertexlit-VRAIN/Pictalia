import { APP_DATA_STORAGE_KEY, CHILD_PROFILE, DEFAULT_AI_SETTINGS } from '../constants';
import type { Worksheet, Profile, AppData, SavedWorksheet, AISettings } from '../types';
import { normalizeWorksheet } from './worksheetNormalizer';
import { buildWorksheetPrompt, buildRefinementPrompt, buildSemanticRepairPrompt, buildJsonRepairPrompt } from './prompts/builder';

interface GenerateWorksheetOptions {
  topic?: string;
  goal?: string;
  extraDetails?: string;
  adaptationDescription?: string;
  adaptationTextContent?: string;
  adaptationImage?: {
    mimeType: string;
    data: string;
  };
}

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

const getActiveProfileData = (): { profile: Profile | null; content: string; showPictogramInstructions: boolean } => {
  const appData = getAppData();
  const activeProfile = appData?.profiles.find(p => p.id === appData.activeProfileId) || null;

  if (activeProfile) {
    return {
      profile: activeProfile,
      content: activeProfile.content,
      showPictogramInstructions: activeProfile.showPictogramInstructions ?? true,
    };
  }

  return {
    profile: null,
    content: CHILD_PROFILE,
    showPictogramInstructions: true,
  };
};

const extractJsonObject = (rawText: string): string => {
  const trimmed = rawText.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return trimmed;
  }

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  throw new Error('La respuesta de la IA no contiene un JSON válido.');
};

// Los esquemas y reglas de salida ahora residen en services/prompts/schemas.ts

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const parseJsonPayload = (rawText: string): unknown => JSON.parse(extractJsonObject(rawText));

const normalizeWorksheetPayload = (payload: unknown): Worksheet => {
  if (!isRecord(payload)) {
    throw new Error('La IA no devolvió un objeto JSON válido para la ficha.');
  }

  const title = typeof payload.title === 'string' && payload.title.trim()
    ? payload.title.trim()
    : 'Ficha adaptada';
  const pictogramSearchTerm = typeof payload.pictogramSearchTerm === 'string' && payload.pictogramSearchTerm.trim()
    ? payload.pictogramSearchTerm.trim()
    : title;
  const sections = Array.isArray(payload.sections)
    ? payload.sections.filter(section => isRecord(section))
    : [];

  if (sections.length === 0) {
    throw new Error('La IA no devolvió ninguna sección utilizable.');
  }

  return normalizeWorksheet({
    ...payload,
    title,
    pictogramSearchTerm,
    sections,
  } as Worksheet);
};

const normalizeRefinementPayload = (payload: unknown): Partial<Worksheet> => {
  if (!isRecord(payload)) {
    throw new Error('La IA no devolvió un objeto JSON válido para el refinado.');
  }

  const normalized: Partial<Worksheet> = {};

  if (typeof payload.title === 'string' && payload.title.trim()) {
    normalized.title = payload.title.trim();
  }

  if (typeof payload.pictogramSearchTerm === 'string' && payload.pictogramSearchTerm.trim()) {
    normalized.pictogramSearchTerm = payload.pictogramSearchTerm.trim();
  }

  if (Array.isArray(payload.sections)) {
    normalized.sections = normalizeWorksheetPayload({
      title: normalized.title || 'Ficha refinada',
      pictogramSearchTerm: normalized.pictogramSearchTerm || normalized.title || 'ficha',
      sections: payload.sections,
    }).sections;
  }

  return normalized;
};

const getSemanticContext = (options: GenerateWorksheetOptions): string =>
  [options.topic, options.goal, options.extraDetails, options.adaptationDescription, options.adaptationTextContent]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

const isLiteracyTopic = (context: string): boolean =>
  /\b(letra|letras|vocal|vocales|silaba|silabas|sílaba|sílabas|abecedario|fonema|fonemas|lectura|escritura|lectoescritura)\b/i.test(context);

const isSingleLetterToken = (value: string): boolean => /^[a-záéíóúüñ]$/i.test(value.trim());

const needsSemanticRepair = (worksheet: Worksheet, options: GenerateWorksheetOptions): boolean => {
  const context = getSemanticContext(options);
  if (!context || isLiteracyTopic(context)) {
    return false;
  }

  const repasarTokens = worksheet.sections
    .filter(section => section.exercise?.type === 'repasar')
    .flatMap(section => section.exercise?.type === 'repasar' ? section.exercise.prompts : [])
    .map(item => item.content || '')
    .filter(Boolean);

  if (repasarTokens.length === 0) {
    return false;
  }

  const singleLetterCount = repasarTokens.filter(isSingleLetterToken).length;
  return singleLetterCount > 0 && singleLetterCount >= Math.ceil(repasarTokens.length / 2);
};

const repairSemanticMismatch = async (rawText: string, options: GenerateWorksheetOptions): Promise<Worksheet> => {
  const { content: childProfile, showPictogramInstructions } = getActiveProfileData();
  const repairPrompt = buildSemanticRepairPrompt(rawText, options, childProfile, showPictogramInstructions);

  const repairedText = await runProviderPrompt(repairPrompt, options.adaptationImage);
  return normalizeWorksheetPayload(parseJsonPayload(repairedText));
};

const repairJsonResponse = async (rawText: string, mode: 'worksheet' | 'refinement'): Promise<unknown> => {
  let errorMsg = 'unknown parsing error';
  try {
    JSON.parse(extractJsonObject(rawText));
  } catch (e: any) {
    errorMsg = e.message;
  }
  const promptText = buildJsonRepairPrompt(rawText, errorMsg, mode);

  const repairedText = await runProviderPrompt(promptText);
  return parseJsonPayload(repairedText);
};

const parseWorksheetResponse = async (rawText: string): Promise<Worksheet> => {
  try {
    return normalizeWorksheetPayload(parseJsonPayload(rawText));
  } catch (error) {
    console.warn('Fallo al parsear la ficha inicial. Intentando reparación automática.', error);
    return normalizeWorksheetPayload(await repairJsonResponse(rawText, 'worksheet'));
  }
};

const parseRefinementResponse = async (rawText: string): Promise<Partial<Worksheet>> => {
  try {
    return normalizeRefinementPayload(parseJsonPayload(rawText));
  } catch (error) {
    console.warn('Fallo al parsear el refinado inicial. Intentando reparación automática.', error);
    return normalizeRefinementPayload(await repairJsonResponse(rawText, 'refinement'));
  }
};

const callGemini = async (promptText: string, settings: AISettings, adaptationImage?: GenerateWorksheetOptions['adaptationImage']): Promise<string> => {
  if (!settings.geminiApiKey.trim()) {
    throw new Error('Configura una clave de API de Gemini en el perfil para usar este proveedor.');
  }

  const body: Record<string, unknown> = {
    contents: adaptationImage
      ? [{
        parts: [
          { text: promptText },
          {
            inline_data: {
              mime_type: adaptationImage.mimeType,
              data: adaptationImage.data,
            },
          },
        ],
      }]
      : [{
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

const callOllama = async (promptText: string, settings: AISettings, adaptationImage?: GenerateWorksheetOptions['adaptationImage']): Promise<string> => {
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
        images: adaptationImage ? [adaptationImage.data] : undefined,
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

const callDebugProxy = async (promptText: string, settings: AISettings, adaptationImage?: GenerateWorksheetOptions['adaptationImage']): Promise<string> => {
  const response = await fetch('/__ai-debug', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      promptText,
      settings,
      adaptationImage: adaptationImage
        ? {
          mimeType: adaptationImage.mimeType,
          data: adaptationImage.data,
        }
        : null,
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

const runProviderPrompt = async (promptText: string, adaptationImage?: GenerateWorksheetOptions['adaptationImage']): Promise<string> => {
  const settings = getAISettings();

  if (import.meta.env.DEV) {
    return callDebugProxy(promptText, settings, adaptationImage);
  }

  if (settings.provider === 'ollama') {
    return callOllama(promptText, settings, adaptationImage);
  }

  return callGemini(promptText, settings, adaptationImage);
};

export const generateWorksheet = async (options: GenerateWorksheetOptions): Promise<Worksheet> => {
  const { content: childProfile, showPictogramInstructions } = getActiveProfileData();

  try {
    const promptText = buildWorksheetPrompt(
      {
        topic: options.topic,
        goal: options.goal,
        extraDetails: options.extraDetails,
        adaptationDescription: options.adaptationDescription,
        adaptationTextContent: options.adaptationTextContent,
        hasImage: !!options.adaptationImage,
      },
      childProfile,
      showPictogramInstructions
    );

    const rawText = await runProviderPrompt(promptText, options.adaptationImage);
    const worksheet = await parseWorksheetResponse(rawText);

    if (needsSemanticRepair(worksheet, options)) {
      console.warn('La ficha generada no respeta el tema. Intentando corrección semántica automática.');
      return await repairSemanticMismatch(rawText, options);
    }

    return worksheet;
  } catch (error) {
    console.error('Error al generar la ficha:', error);
    throw new Error(error instanceof Error ? error.message : 'No se pudo generar el contenido de la ficha. Por favor, inténtalo de nuevo.');
  }
};

export const refineWorksheet = async (originalWorksheet: SavedWorksheet, instruction: string): Promise<Partial<Worksheet>> => {
  const { content: childProfile } = getActiveProfileData();

  const prompt = buildRefinementPrompt(
    JSON.stringify(originalWorksheet, null, 2),
    instruction,
    childProfile
  );

  try {
    const rawText = await runProviderPrompt(prompt);
    return await parseRefinementResponse(rawText);
  } catch (error) {
    console.error('Error al refinar la ficha:', error);
    throw new Error(error instanceof Error ? error.message : 'No se pudo refinar la ficha. Por favor, inténtalo de nuevo.');
  }
};
