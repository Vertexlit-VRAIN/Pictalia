import { ExerciseManifest } from '../types';

export const manifest: ExerciseManifest = {
  type: 'rodear',
  label: 'Rodear',
  instructionText: 'RODEAR',
  addLabel: 'Añadir pictograma',
  defaultLayout: 'row',
  instructionTerms: ['rodear'],
  minimumItems: 2,
  minGenerateItems: 4,
  maxGenerateItems: 8,
  createDefaultExercise: () => ({
    type: 'rodear',
    prompt: null,
    options: [
      {
        type: 'image',
        content: 'opcion 1',
        searchTerm: 'opcion 1',
        selectedPictoUrl: '',
        pictoOptions: [],
        pictogramRenderMode: 'auto',
        spelledLetterTerms: [],
        spelledLetterUrls: [],
      },
      {
        type: 'image',
        content: 'opcion 2',
        searchTerm: 'opcion 2',
        selectedPictoUrl: '',
        pictoOptions: [],
        pictogramRenderMode: 'auto',
        spelledLetterTerms: [],
        spelledLetterUrls: [],
      },
    ],
  }),

  // AI & Pedagogical Directives
  pedagogicalDescription: 'Circling exercises evaluate selective attention, target discrimination, and categorization.',
  jsonSchema: `{
  "exerciseType": "rodear",
  "instruction": {
    "text": "RODEAR FRUTAS",
    "pictograms": [
      { "searchTerm": "rodear", "content": "RODEAR" },
      { "searchTerm": "fruta", "content": "FRUTAS" }
    ]
  },
  "exercise": {
    "prompt": null,
    "options": [
      { "content": "manzana", "searchTerm": "manzana" },
      { "content": "pera", "searchTerm": "pera" },
      { "content": "coche", "searchTerm": "coche" }
    ]
  }
}`,
  promptRules: [
    'Renders a simple flat list or grid of options. Distractors must be concrete, simple, and clearly distinct from target items.',
    'An optional "prompt" object can define the target concept.',
    'CRITICAL: Only plan a simple list/grid of options. Never plan complex illustration scenes, body parts labeling, interactive layouts, or subgroups.',
    'Scale the number of options (targets + distractors) dynamically based on the student profile, strictly between 4 and 8 options. High support needs profiles should have 4 options; lower support needs should have 6 to 8 options.',
  ],
  fewShotExamples: [
    {
      title: 'Target Discrimination',
      description: 'Finds objects of the same category',
      json: `{
  "exerciseType": "rodear",
  "instruction": {
    "text": "RODEA LOS ANIMALES",
    "pictograms": [
      { "searchTerm": "rodear", "content": "RODEAR" },
      { "searchTerm": "animal", "content": "ANIMALES" }
    ]
  },
  "exercise": {
    "prompt": null,
    "options": [
      { "content": "perro", "searchTerm": "perro" },
      { "content": "silla", "searchTerm": "silla" },
      { "content": "gato", "searchTerm": "gato" }
    ]
  }
}`,
    },
  ],
};
