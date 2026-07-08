import { compact, PEDAGOGICAL_RULES, SECTION_OUTPUT_RULES, EXERCISE_STRUCTURE_RULES, PICTOGRAM_RULES, FORBIDDEN_TECHNICAL_FIELDS, buildLanguageRule, WORKSHEET_JSON_EXAMPLE, REFINEMENT_JSON_SCHEMA, REFINEMENT_INTERNAL_VALIDATION_CHECKLIST } from './shared';

export const buildRefinementPrompt = (
  jsonWorksheetContent: string,
  instructionText: string,
  childProfile: string,
  language: 'es' | 'val' | 'en'
): string =>
  compact(
    'TASK:\nRefine the worksheet according to the teacher\'s instruction.',
    `STUDENT PROFILE:\n${childProfile}`,
    `CURRENT WORKSHEET:\n${jsonWorksheetContent}`,
    `INSTRUCTION:\n${instructionText}`,
    PEDAGOGICAL_RULES,
    SECTION_OUTPUT_RULES,
    EXERCISE_STRUCTURE_RULES,
    PICTOGRAM_RULES,
    FORBIDDEN_TECHNICAL_FIELDS,
    buildLanguageRule(language),
    'JSON_ONLY_RULE:\nOutput ONLY a valid JSON object. No explanations or extra text.',
    `JSON EXAMPLE:\n${WORKSHEET_JSON_EXAMPLE}`,
    `SCHEMA:\n${REFINEMENT_JSON_SCHEMA}`,
    REFINEMENT_INTERNAL_VALIDATION_CHECKLIST
  );
