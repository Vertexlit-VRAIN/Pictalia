import { ExerciseType } from '../../types';
import { ExerciseManifest, FewShotExample } from './types';
import { manifest as tracingManifest } from './tracing/manifest';
import { manifest as matchingManifest } from './matching/manifest';
import { manifest as circlingManifest } from './circling/manifest';
import { manifest as copyingManifest } from './copying/manifest';

export const EXERCISE_REGISTRY: Record<ExerciseType, ExerciseManifest> = {
  repasar: tracingManifest,
  unir: matchingManifest,
  rodear: circlingManifest,
  copiar: copyingManifest,
};

export const EXERCISE_TYPE_ORDER: ExerciseType[] = ['repasar', 'unir', 'rodear', 'copiar'];

export const getAvailableExerciseTypes = (): ExerciseType[] => EXERCISE_TYPE_ORDER;

export const getExerciseManifest = (type: ExerciseType): ExerciseManifest => {
  const manifest = EXERCISE_REGISTRY[type];
  if (!manifest) {
    throw new Error(`Exercise type "${type}" is not registered in the Exercise Registry.`);
  }
  return manifest;
};

export const getExercisePedagogicalDescription = (type: ExerciseType): string =>
  getExerciseManifest(type).pedagogicalDescription;

export const getExerciseSchema = (type: ExerciseType): string =>
  getExerciseManifest(type).jsonSchema;

export const getExercisePromptRules = (type: ExerciseType): string[] =>
  getExerciseManifest(type).promptRules;

export const getExerciseFewShotExamples = (type: ExerciseType): FewShotExample[] =>
  getExerciseManifest(type).fewShotExamples;
