export const PROFILE_SELECTION_GUIDE = `
SELECTION GUIDE BASED ON PROFILE:
- Prioritize "rodear" and "unir" if the student needs visual support, lower verbal load, or discrimination tasks.
- Use "repasar" if the student can work on tracing or meaningful written recognition.
- Use "copiar" only if the profile allows copying full words.
- If the student has more difficulty, use fewer types and simpler activities.
- If the student has higher competence, combine more variety or greater complexity.
`;

export const WORKSHEET_INTERNAL_VALIDATION_CHECKLIST = `
INTERNAL VALIDATION:
- Is the JSON valid?
- Are there at least 4 exercises unless another quantity was requested?
- Does each exercise.type match exerciseType?
- Is all content related to the topic?
- Are the activities suitable for the profile?
- If there is "copiar", does it use only copies?
- Is there no text outside the JSON?
`;

export const REFINEMENT_INTERNAL_VALIDATION_CHECKLIST = `
INTERNAL VALIDATION:
- Is the JSON valid?
- Does each exercise.type match exerciseType?
- Does all modified content still belong to the topic?
- Are the activities still suitable for the profile?
- If there is "copiar", does it use only copies?
- Is there no text outside the JSON?
`;

export const OPERATIONS_INTERNAL_VALIDATION_CHECKLIST = `
INTERNAL VALIDATION:
- Is the JSON valid?
- Does the response contain only "operations"?
- Does each operation use a permitted type?
- Do sectionId and afterSectionId exist in the context when required?
- Do new sections omit internalId?
- Do modified sections maintain consistent exerciseType/exercise.type?
- Does new or modified content still belong to the topic?
- Are new or modified activities still suitable for the profile?
- If there is "copiar", does it use only copies?
- Is there no text outside the JSON?
`;
