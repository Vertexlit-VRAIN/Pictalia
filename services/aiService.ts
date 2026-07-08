import { APP_DATA_STORAGE_KEY, CHILD_PROFILE } from '../constants';
import type { Worksheet, Profile, AppData, SavedWorksheet, WorksheetOperationRequest } from '../types';
import { runAiPrompt } from './aiClient';
import { normalizeWorksheet } from './worksheetNormalizer';
import {
  buildWorksheetEditingContext,
  parseWorksheetOperationRequest,
  validateOperationsAgainstInstruction,
  validateOperationsForTargetSection,
} from './worksheetOperations';


import { buildSemanticRepairPrompt } from './multiagent/prompts/semanticRepairPrompt';
import { buildExerciseCountRepairPrompt } from './multiagent/prompts/exerciseCountRepairPrompt';
import { buildJsonRepairPrompt } from './multiagent/prompts/jsonRepairPrompt';
import { buildRefinementPrompt } from './multiagent/prompts/refinementPrompt';
import { buildExerciseRefinementPrompt } from './multiagent/prompts/exerciseRefinementPrompt';
import { buildTranslationPrompt } from './multiagent/prompts/translationPrompt';

interface GenerateWorksheetOptions {
  topic?: string;
  goal?: string;
  extraDetails?: string;
  language?: 'es' | 'val' | 'en';
}

const EXERCISE_COUNT_PATTERNS = [
  /\b(\d{1,2})\s+(?:ejercicios?|actividades?|secciones?)\b/i,
  /\b(?:con|de|tenga|tener|incluye?|incluya|quiero|necesito)\s+(\d{1,2})\s+(?:ejercicios?|actividades?|secciones?)\b/i,
  /\b(\d{1,2})\s+(?:exercises?|activities?|sections?)\b/i,
];

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
    : 'Ficha visual';
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
  } as unknown as Worksheet);
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
  [options.topic, options.goal, options.extraDetails]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

const extractRequestedExerciseCount = (options: GenerateWorksheetOptions): number | undefined => {
  const textBlocks = [
    options.topic,
    options.goal,
    options.extraDetails,
  ].filter(Boolean) as string[];

  for (const text of textBlocks) {
    for (const pattern of EXERCISE_COUNT_PATTERNS) {
      const match = text.match(pattern);
      if (!match) continue;

      const count = Number.parseInt(match[1], 10);
      if (Number.isFinite(count) && count > 0) {
        return count;
      }
    }
  }

  return undefined;
};

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

const needsExerciseCountRepair = (worksheet: Worksheet, requestedExerciseCount?: number): boolean =>
  !!requestedExerciseCount && worksheet.sections.length < requestedExerciseCount;

const repairSemanticMismatch = async (rawText: string, options: GenerateWorksheetOptions): Promise<Worksheet> => {
  const { content: childProfile, showPictogramInstructions } = getActiveProfileData();
  const repairPrompt = buildSemanticRepairPrompt(rawText, options, childProfile, showPictogramInstructions);

  const repairedText = await runAiPrompt(repairPrompt);
  return normalizeWorksheetPayload(parseJsonPayload(repairedText));
};

const repairExerciseCountMismatch = async (
  worksheet: Worksheet,
  options: GenerateWorksheetOptions,
  requestedExerciseCount: number
): Promise<Worksheet> => {
  const { content: childProfile, showPictogramInstructions } = getActiveProfileData();
  const repairPrompt = buildExerciseCountRepairPrompt(
    JSON.stringify(worksheet, null, 2),
    requestedExerciseCount,
    options,
    childProfile,
    showPictogramInstructions
  );

  const repairedText = await runAiPrompt(repairPrompt);
  return normalizeWorksheetPayload(parseJsonPayload(repairedText));
};

const repairJsonResponse = async (rawText: string, mode: 'worksheet' | 'refinement' | 'operations'): Promise<unknown> => {
  let errorMsg = 'unknown parsing error';
  try {
    JSON.parse(extractJsonObject(rawText));
  } catch (e: any) {
    errorMsg = e.message;
  }
  const promptText = buildJsonRepairPrompt(rawText, errorMsg, mode);

  const repairedText = await runAiPrompt(promptText);
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

const parseOperationResponse = async (rawText: string): Promise<WorksheetOperationRequest> => {
  try {
    return parseWorksheetOperationRequest(parseJsonPayload(rawText));
  } catch (error) {
    console.warn('Fallo al parsear las operaciones iniciales. Intentando reparación automática.', error);
    return parseWorksheetOperationRequest(await repairJsonResponse(rawText, 'operations'));
  }
};



export { generateWorksheet } from './multiagent/workflow';

export const refineWorksheet = async (originalWorksheet: SavedWorksheet, instruction: string): Promise<Partial<Worksheet>> => {
  const { content: childProfile } = getActiveProfileData();

  const prompt = buildRefinementPrompt(
    JSON.stringify(originalWorksheet, null, 2),
    instruction,
    childProfile,
    originalWorksheet.language || 'es'
  );

  try {
    const rawText = await runAiPrompt(prompt);
    return await parseRefinementResponse(rawText);
  } catch (error) {
    console.error('Error al refinar la ficha:', error);
    throw new Error(error instanceof Error ? error.message : 'No se pudo refinar la ficha. Por favor, inténtalo de nuevo.');
  }
};

export const refineExercise = async (
  originalWorksheet: SavedWorksheet,
  instruction: string,
  targetSectionId?: string
): Promise<WorksheetOperationRequest> => {
  const { content: childProfile } = getActiveProfileData();
  const { worksheetPayload, worksheetContextSummary, targetSectionContent } = buildWorksheetEditingContext(
    originalWorksheet,
    targetSectionId
  );

  const prompt = buildExerciseRefinementPrompt(
    worksheetPayload,
    instruction,
    childProfile,
    originalWorksheet.originalTopic,
    originalWorksheet.originalGoal,
    originalWorksheet.originalExtraDetails,
    targetSectionId,
    targetSectionContent,
    worksheetContextSummary,
    originalWorksheet.language || 'es'
  );

  try {
    const rawText = await runAiPrompt(prompt);
    const response = await parseOperationResponse(rawText);
    return {
      operations: validateOperationsAgainstInstruction(
        originalWorksheet,
        validateOperationsForTargetSection(response.operations, targetSectionId),
        instruction,
        targetSectionId
      ),
    };
  } catch (error) {
    console.error('Error al refinar el ejercicio:', error);
    throw new Error(error instanceof Error ? error.message : 'No se pudieron interpretar las operaciones de edición. Por favor, inténtalo de nuevo.');
  }
};

export interface TranslationResponse {
  language: 'es' | 'val' | 'en';
  recommendedSliders: {
    noun: number;
    verb: number;
    adjective: number;
    adverb: number;
    determiner?: number;
    preposition?: number;
    conjunction?: number;
    pronoun?: number;
    other: number;
  };
  tokens: any[];
}

export const translateTextToMixed = async (
  text: string,
  language: string
): Promise<TranslationResponse> => {
  const { content: childProfile } = getActiveProfileData();

  try {
    const promptText = buildTranslationPrompt(text, language, childProfile);
    const rawText = await runAiPrompt(promptText);
    const parsed = parseJsonPayload(rawText) as TranslationResponse;
    
    if (!parsed || !parsed.language || !parsed.tokens) {
      throw new Error("Respuesta inválida del modelo de traducción.");
    }

    // Normalizar el idioma detectado/devuelto por la IA
    let normalizedLanguage: 'es' | 'val' | 'en' = 'es';
    const langStr = String(parsed.language || '').toLowerCase().trim();
    if (langStr.includes('val') || langStr.includes('cat') || langStr === 'catalan' || langStr === 'valenciano') {
      normalizedLanguage = 'val';
    } else if (langStr.includes('en') || langStr === 'english' || langStr.includes('ing')) {
      normalizedLanguage = 'en';
    } else {
      normalizedLanguage = 'es';
    }
    parsed.language = normalizedLanguage;
    
    return parsed;
  } catch (error) {
    console.error('Error al traducir el texto:', error);
    throw new Error(error instanceof Error ? error.message : 'No se pudo traducir el texto. Por favor, inténtalo de nuevo.');
  }
};
