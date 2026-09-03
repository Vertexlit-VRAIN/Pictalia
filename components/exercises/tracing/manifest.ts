import { ExerciseManifest } from '../types';

export const manifest: ExerciseManifest = {
  type: 'repasar',
  label: 'Repasar',
  instructionText: 'REPASAR',
  addLabel: 'Añadir trazo',
  defaultLayout: 'column',
  instructionTerms: ['repasar'],
  minimumItems: 1,
  minGenerateItems: 3,
  maxGenerateItems: 6,
  createDefaultExercise: () => ({
    type: 'repasar',
    prompts: [
      {
        type: 'traceable_text',
        content: 'A',
      },
    ],
  }),

  // AI & Pedagogical Directives
  pedagogicalDescription: 'Tracing exercises focus on fine motor skills and simple visual-written recognition. Recommended for students learning coordinate tracing.',
  jsonSchema: `{
  "exerciseType": "repasar",
  "instruction": {
    "text": "REPASAR",
    "pictograms": [
      { "searchTerm": "repasar", "content": "REPASAR" }
    ]
  },
  "exercise": {
    "prompts": ["3", "FLOR", "HOJA"]
  }
}`,
  promptRules: [
    'The "prompts" array must only contain raw strings representing the letters or words to trace (capitalized).',
    'CRITICAL: Only plan a simple list of letters, numbers, or words to trace in uppercase.',
    'Scale the number of items to trace dynamically based on the student profile, strictly between 3 and 6 elements. High support needs profiles should have 3 items; lower support needs should have 4 to 6 items.',
  ],
  fewShotExamples: [
    {
      title: 'Tracing digits and key vocabulary',
      description: 'Generates traces for counting digits and key terms related to plants',
      json: `{
  "exerciseType": "repasar",
  "instruction": {
    "text": "REPASAR LAS PARTES DE LA PLANTA",
    "pictograms": [
      { "searchTerm": "repasar", "content": "REPASAR" },
      { "searchTerm": "planta", "content": "PLANTA" }
    ]
  },
  "exercise": {
    "prompts": ["TALLO", "HOJA", "RAIZ"]
  }
}`,
    },
  ],
};
