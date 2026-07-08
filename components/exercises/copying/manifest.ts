import { ExerciseManifest } from '../types';

export const manifest: ExerciseManifest = {
  type: 'copiar',
  label: 'Copiar',
  instructionText: 'COPIAR',
  addLabel: 'Añadir copia',
  defaultLayout: 'column',
  instructionTerms: ['copiar'],
  minimumItems: 1,
  createDefaultExercise: () => ({
    type: 'copiar',
    copies: [
      {
        type: 'traceable_text',
        content: 'PALABRA',
      },
    ],
  }),

  // AI & Pedagogical Directives
  pedagogicalDescription: 'Copying exercises reinforce spelling, letter-by-letter writing, and word copying. Recommended for students with higher writing capabilities who are learning spelling structures and character mapping.',
  jsonSchema: `{
  "exerciseType": "copiar",
  "instruction": {
    "text": "COPIAR",
    "pictograms": [
      { "searchTerm": "copiar", "content": "COPIAR" }
    ]
  },
  "exercise": {
    "type": "copiar",
    "copies": [
      { "type": "traceable_text", "content": "SEMILLA" },
      { "type": "traceable_text", "content": "RAÍZ" },
      { "type": "traceable_text", "content": "TALLO" }
    ]
  }
}`,
  promptRules: [
    'All words that the student must copy go inside "copies".',
    'Each element of "copies" must be of type "traceable_text".',
    'Do NOT use "image" or "searchTerm" inside the copying exercise.',
    'Words in "copies" must be in UPPERCASE.',
    'Words in "copies" must be distinct from each other.',
  ],
  fewShotExamples: [
    {
      title: 'Copying simple terms',
      description: 'Provides everyday words in uppercase for writing copy practice',
      json: `{
  "exerciseType": "copiar",
  "instruction": {
    "text": "COPIA LAS PALABRAS",
    "pictograms": [
      { "searchTerm": "copiar", "content": "COPIAR" }
    ]
  },
  "exercise": {
    "type": "copiar",
    "copies": [
      { "type": "traceable_text", "content": "SOL" },
      { "type": "traceable_text", "content": "NUBE" }
    ]
  }
}`,
    },
  ],
};
