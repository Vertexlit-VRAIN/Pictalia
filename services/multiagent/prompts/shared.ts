import {
  WORKSHEET_JSON_EXAMPLE,
  WORKSHEET_JSON_SHAPE,
  REFINEMENT_JSON_SCHEMA,
  WORKSHEET_OPERATION_JSON_EXAMPLE,
  WORKSHEET_OPERATION_JSON_SCHEMA,
} from '../../prompts/schemas';
import {
  OPERATIONS_INTERNAL_VALIDATION_CHECKLIST,
  PROFILE_SELECTION_GUIDE,
  REFINEMENT_INTERNAL_VALIDATION_CHECKLIST,
  WORKSHEET_INTERNAL_VALIDATION_CHECKLIST,
} from '../../prompts/examples';
import {
  EXERCISE_STRUCTURE_RULES,
  FORBIDDEN_TECHNICAL_FIELDS,
  ID_RULES,
  JSON_ONLY_RULE,
  OPERATION_PRESERVATION_RULES,
  OPERATION_RULES,
  PEDAGOGICAL_RULES,
  PICTOGRAM_RULES,
  SECTION_OUTPUT_RULES,
  WORKSHEET_GENERATION_RULES,
} from '../../prompts/blocks';

export {
  WORKSHEET_JSON_EXAMPLE,
  WORKSHEET_JSON_SHAPE,
  REFINEMENT_JSON_SCHEMA,
  WORKSHEET_OPERATION_JSON_EXAMPLE,
  WORKSHEET_OPERATION_JSON_SCHEMA,
  OPERATIONS_INTERNAL_VALIDATION_CHECKLIST,
  PROFILE_SELECTION_GUIDE,
  REFINEMENT_INTERNAL_VALIDATION_CHECKLIST,
  WORKSHEET_INTERNAL_VALIDATION_CHECKLIST,
  EXERCISE_STRUCTURE_RULES,
  FORBIDDEN_TECHNICAL_FIELDS,
  ID_RULES,
  JSON_ONLY_RULE,
  OPERATION_PRESERVATION_RULES,
  OPERATION_RULES,
  PEDAGOGICAL_RULES,
  PICTOGRAM_RULES,
  SECTION_OUTPUT_RULES,
  WORKSHEET_GENERATION_RULES,
};

export interface PromptOptions {
  topic?: string;
  goal?: string;
  extraDetails?: string;
  requestedExerciseCount?: number;
  language?: 'es' | 'val' | 'en';
}

export const compact = (...blocks: Array<string | undefined | null | false>): string =>
  blocks
    .filter(Boolean)
    .map(block => String(block).trim())
    .filter(Boolean)
    .join('\n\n');

export const buildInstructionPrompt = (showPictogramInstructions: boolean): string =>
  showPictogramInstructions
    ? `INSTRUCTIONS FOR PICTOGRAMS:
- instruction.text must be brief and in UPPERCASE.
- instruction.pictograms must contain simple terms to search for pictograms.`
    : `INSTRUCTIONS FOR PICTOGRAMS:
- instruction.text must be brief and in UPPERCASE.
- Omit instruction.pictograms.`;

export const buildPedagogicalContext = (options: PromptOptions): string => {
  const lines = [
    options.topic?.trim() ? `Topic: ${options.topic.trim()}` : '',
    options.goal?.trim() ? `Goal: ${options.goal.trim()}` : '',
    options.extraDetails?.trim() ? `Details: ${options.extraDetails.trim()}` : '',
  ].filter(Boolean);

  return lines.length > 0
    ? compact('PEDAGOGICAL CONTEXT:', lines.join('\n'))
    : '';
};

export const buildExerciseCountRule = (requestedExerciseCount?: number): string =>
  requestedExerciseCount && requestedExerciseCount > 0
    ? `EXERCISE COUNT:
- The teacher requested exactly ${requestedExerciseCount} exercises in "sections".
- Respect that exact count.`
    : `EXERCISE COUNT:
- Adapt the number of exercises to the student's profile.
- If no exact count is specified, generate at least 4 exercises.`;

export const buildOriginalPedagogicalContext = (
  originalTopic?: string,
  originalGoal?: string,
  originalExtraDetails?: string
): string => {
  const lines = [
    originalTopic?.trim() ? `Original Topic: ${originalTopic.trim()}` : '',
    originalGoal?.trim() ? `Original Goal: ${originalGoal.trim()}` : '',
    originalExtraDetails?.trim() ? `Original Details: ${originalExtraDetails.trim()}` : '',
  ].filter(Boolean);

  return lines.length > 0
    ? lines.join('\n')
    : 'No additional original pedagogical context saved.';
};

export const buildLanguageRule = (lang?: 'es' | 'val' | 'en'): string => {
  const languageNames = {
    es: 'Castilian Spanish (es) as spoken in Spain',
    val: 'Valencian/Catalan (val) as spoken in the Valencian Community',
    en: 'English (en)',
  };
  const targetLang = lang ? languageNames[lang] : languageNames.es;

  return `OUTPUT LANGUAGE:
- All student-facing and teacher-facing text in the generated JSON (such as worksheet title, section instructions, traceable texts, copying copies, etc.) MUST be written in ${targetLang}.
- Use clear, frequent, and functional vocabulary in that specific language.
- Do NOT output any English text for these fields unless English is the requested output language.
- Keep the language natural and grammatically correct for ${targetLang}.`;
};

export const buildWorksheetContract = (
  showPictogramInstructions: boolean,
  requestedExerciseCount?: number,
  language?: 'es' | 'val' | 'en'
): string =>
  compact(
    JSON_ONLY_RULE,
    buildExerciseCountRule(requestedExerciseCount),
    WORKSHEET_GENERATION_RULES,
    SECTION_OUTPUT_RULES,
    EXERCISE_STRUCTURE_RULES,
    PICTOGRAM_RULES,
    FORBIDDEN_TECHNICAL_FIELDS,
    buildLanguageRule(language),
    buildInstructionPrompt(showPictogramInstructions)
  );

export const buildGenerationPromptBase = (
  task: string,
  options: PromptOptions,
  childProfile: string,
  showPictogramInstructions: boolean,
  extraBlocks?: string
): string =>
  compact(
    `TASK:\n${task}`,
    `STUDENT PROFILE:\n${childProfile}`,
    buildPedagogicalContext(options),
    extraBlocks,
    PEDAGOGICAL_RULES,
    PROFILE_SELECTION_GUIDE,
    buildWorksheetContract(showPictogramInstructions, options.requestedExerciseCount, options.language),
    `JSON EXAMPLE:\n${WORKSHEET_JSON_EXAMPLE}`,
    `OUTPUT SCHEMA:\n${WORKSHEET_JSON_SHAPE}`,
    WORKSHEET_INTERNAL_VALIDATION_CHECKLIST
  );
