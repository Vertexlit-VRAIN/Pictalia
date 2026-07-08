import { ExerciseManifest } from '../types';

export const manifest: ExerciseManifest = {
  type: 'repasar',
  label: 'Repasar',
  instructionText: 'REPASAR',
  addLabel: 'Añadir trazo',
  defaultLayout: 'column',
  instructionTerms: ['repasar'],
  minimumItems: 1,
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
  pedagogicalDescription: 'Tracing exercises focus on fine motor skills, character/letter stroke practice, and simple visual-to-written recognition. Highly recommended for students who are beginning writing or require practice with shape tracing and coordinates.',
  jsonSchema: `{
  "exerciseType": "repasar",
  "instruction": {
    "text": "REPASAR",
    "pictograms": [
      { "searchTerm": "repasar", "content": "REPASAR" }
    ]
  },
  "exercise": {
    "type": "repasar",
    "prompts": [
      { "type": "traceable_text", "content": "3" },
      { "type": "traceable_text", "content": "FLOR" },
      { "type": "traceable_text", "content": "HOJA" },
      { "type": "traceable_text", "content": "RAÍZ" }
    ]
  }
}`,
  promptRules: [
    'The prompts array must contain only objects of type "traceable_text".',
    'Do NOT output a separate "image" item followed by a "traceable_text" item for the same concept; a single "traceable_text" item with the word or letter to trace in "content" is sufficient and will automatically display its corresponding pictogram.',
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
    "type": "repasar",
    "prompts": [
      { "type": "traceable_text", "content": "TALLO" },
      { "type": "traceable_text", "content": "HOJA" },
      { "type": "traceable_text", "content": "RAIZ" }
    ]
  }
}`,
    },
  ],
};
