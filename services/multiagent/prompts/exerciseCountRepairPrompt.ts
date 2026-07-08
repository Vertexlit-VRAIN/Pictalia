import { compact, buildPedagogicalContext, buildWorksheetContract, PEDAGOGICAL_RULES, WORKSHEET_JSON_EXAMPLE, WORKSHEET_JSON_SHAPE, WORKSHEET_INTERNAL_VALIDATION_CHECKLIST, PromptOptions } from './shared';

export const buildExerciseCountRepairPrompt = (
  jsonWorksheetContent: string,
  requestedExerciseCount: number,
  options: PromptOptions,
  childProfile: string,
  showPictogramInstructions: boolean
): string =>
  compact(
    'TASK:\nRepair this worksheet because it has fewer exercises than requested.',
    `STUDENT PROFILE:\n${childProfile}`,
    buildPedagogicalContext(options),
    `CURRENT WORKSHEET:\n${jsonWorksheetContent}`,
    `REPAIR RULES:\n- The teacher requested exactly ${requestedExerciseCount} exercises in "sections".\n- Preserve the topic, difficulty level, and pedagogical style.\n- Keep the valid exercises and only generate the missing ones.`,
    PEDAGOGICAL_RULES,
    buildWorksheetContract(showPictogramInstructions, requestedExerciseCount, options.language),
    `JSON EXAMPLE:\n${WORKSHEET_JSON_EXAMPLE}`,
    `SCHEMA:\n${WORKSHEET_JSON_SHAPE}`,
    WORKSHEET_INTERNAL_VALIDATION_CHECKLIST
  );
