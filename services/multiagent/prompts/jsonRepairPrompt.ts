import { compact } from './shared';
import {
  WORKSHEET_JSON_SHAPE,
  REFINEMENT_JSON_SCHEMA,
  WORKSHEET_OPERATION_JSON_SCHEMA,
} from '../../prompts/schemas';

export const buildJsonRepairPrompt = (
  rawText: string,
  errorMsg: string,
  mode: 'worksheet' | 'refinement' | 'operations'
): string => {
  const schema = mode === 'worksheet'
    ? WORKSHEET_JSON_SHAPE
    : mode === 'operations'
      ? WORKSHEET_OPERATION_JSON_SCHEMA
      : REFINEMENT_JSON_SCHEMA;

  return compact(
    'TASK:\nRepair the JSON format formatting error.',
    `ERROR MESSAGE:\n${errorMsg}`,
    'JSON_ONLY_RULE:\nOutput ONLY a valid JSON object. No markdown wrapping or extra text.',
    `SCHEMA:\n${schema}`,
    `JSON TO REPAIR:\n${rawText}`
  );
};
