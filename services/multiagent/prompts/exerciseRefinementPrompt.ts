import { compact, buildOriginalPedagogicalContext, buildLanguageRule } from './shared';
import {
  WORKSHEET_OPERATION_JSON_EXAMPLE,
  WORKSHEET_OPERATION_JSON_SCHEMA,
} from '../../prompts/schemas';
import {
  OPERATIONS_INTERNAL_VALIDATION_CHECKLIST,
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
} from '../../prompts/blocks';

export const buildExerciseRefinementPrompt = (
  jsonWorksheetContent: string,
  instructionText: string,
  childProfile: string,
  originalTopic?: string,
  originalGoal?: string,
  originalExtraDetails?: string,
  targetSectionId?: string,
  targetSectionContent?: string,
  worksheetContextSummary?: string,
  language?: 'es' | 'val' | 'en'
): string =>
  compact(
    'TASK:\nReturn JSON operations to edit an educational worksheet.',
    JSON_ONLY_RULE,
    `STUDENT PROFILE:\n${childProfile}`,
    `ORIGINAL PEDAGOGICAL CONTEXT:\n${buildOriginalPedagogicalContext(originalTopic, originalGoal, originalExtraDetails)}`,
    `CURRENT WORKSHEET IN CLEAN FORMAT FOR AI:\n${jsonWorksheetContent}`,
    `USER REQUEST:\n${instructionText}`,
    targetSectionId
      ? `TARGET SECTION:\nModify ONLY the section with sectionId "${targetSectionId}".`
      : '',
    targetSectionContent
      ? `TARGET SECTION CONTENT:\n${targetSectionContent}`
      : '',
    worksheetContextSummary
      ? `WORKSHEET SUMMARY:\n${worksheetContextSummary}`
      : '',
    OPERATION_RULES,
    ID_RULES,
    OPERATION_PRESERVATION_RULES,
    PEDAGOGICAL_RULES,
    SECTION_OUTPUT_RULES,
    EXERCISE_STRUCTURE_RULES,
    PICTOGRAM_RULES,
    FORBIDDEN_TECHNICAL_FIELDS,
    buildLanguageRule(language),
    `OPERATIONS EXAMPLE:\n${WORKSHEET_OPERATION_JSON_EXAMPLE}`,
    `ESQUEMA DE SALIDA:\n${WORKSHEET_OPERATION_JSON_SCHEMA}`,
    OPERATIONS_INTERNAL_VALIDATION_CHECKLIST
  );
