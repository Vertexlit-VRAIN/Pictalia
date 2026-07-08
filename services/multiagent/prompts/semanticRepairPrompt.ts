import { compact, buildWorksheetContract, PEDAGOGICAL_RULES, REFINEMENT_INTERNAL_VALIDATION_CHECKLIST, WORKSHEET_JSON_EXAMPLE, WORKSHEET_JSON_SHAPE, PromptOptions } from './shared';

export const buildSemanticRepairPrompt = (
  rawText: string,
  options: PromptOptions,
  childProfile: string,
  showPictogramInstructions: boolean
): string => {
  const context = [
    options.topic,
    options.goal,
    options.extraDetails,
  ].filter(Boolean).join(' ') || 'original topic';

  return compact(
    'TASK:\nRepair this worksheet because it does not fit the requested topic or profile.',
    `STUDENT PROFILE:\n${childProfile}`,
    `EXPECTED TOPIC / CONTEXT:\n${context}`,
    PEDAGOGICAL_RULES,
    buildWorksheetContract(showPictogramInstructions, options.requestedExerciseCount, options.language),
    'REPAIR RULES:\n- Keep the JSON structure.\n- Correct any out-of-topic or too generic content.\n- If the topic is not literacy, do not use isolated letters or vowels.',
    `JSON EXAMPLE:\n${WORKSHEET_JSON_EXAMPLE}`,
    `SCHEMA:\n${WORKSHEET_JSON_SHAPE}`,
    REFINEMENT_INTERNAL_VALIDATION_CHECKLIST,
    `ORIGINAL OUTPUT:\n${rawText}`
  );
};
