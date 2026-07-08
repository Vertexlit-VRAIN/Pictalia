import { APP_DATA_STORAGE_KEY, CHILD_PROFILE } from '../../constants';
import type { Profile, AppData } from '../../types';
import { runAiPrompt } from '../aiClient';
import { buildJsonRepairPrompt } from './prompts/jsonRepairPrompt';

export const getAppData = (): AppData | null => {
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

export const getActiveProfileData = (): { profile: Profile | null; content: string; showPictogramInstructions: boolean } => {
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

export const extractJsonObject = (rawText: string): string => {
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

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const parseJsonPayload = (rawText: string): unknown => JSON.parse(extractJsonObject(rawText));

export const repairJsonResponse = async (rawText: string, mode: 'worksheet' | 'refinement' | 'operations'): Promise<unknown> => {
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
