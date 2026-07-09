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
  pedagogicalDescription: 'Copying exercises reinforce spelling, letter-by-letter writing, and word copying.',
  jsonSchema: `{
  "exerciseType": "copiar",
  "instruction": {
    "text": "COPIAR",
    "pictograms": [
      { "searchTerm": "copiar", "content": "COPIAR" }
    ]
  },
  "exercise": {
    "copies": ["SEMILLA", "RAÍZ", "TALLO"]
  }
}`,
  promptRules: [
    'All words to copy go in "copies" as raw strings in UPPERCASE.',
    'Do not include "image" or "searchTerm" items in this exercise.',
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
    "copies": ["SOL", "NUBE"]
  }
}`,
    },
  ],
};
