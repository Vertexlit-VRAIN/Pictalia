import { ExerciseManifest } from '../types';

export const manifest: ExerciseManifest = {
  type: 'rodear',
  label: 'Rodear',
  instructionText: 'RODEAR',
  addLabel: 'Añadir pictograma',
  defaultLayout: 'row',
  instructionTerms: ['rodear'],
  minimumItems: 2,
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
    'Renders a list of options. Distractors must be concrete, simple, and clearly distinct from target items.',
    'An optional "prompt" object can define the target concept.',
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
