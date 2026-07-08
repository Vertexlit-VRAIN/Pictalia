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
  pedagogicalDescription: 'Circling exercises evaluate selective attention, target discrimination, and categorization. The student must select/circle the options corresponding to the target prompt or instruction. Excellent for students needing target isolation from graphic distractors.',
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
    "type": "rodear",
    "prompt": null,
    "options": [
      { "type": "image", "content": "manzana", "searchTerm": "manzana" },
      { "type": "image", "content": "pera", "searchTerm": "pera" },
      { "type": "image", "content": "coche", "searchTerm": "coche" },
      { "type": "image", "content": "mesa", "searchTerm": "mesa" }
    ]
  }
}`,
  promptRules: [
    'Presents visual options. The options list must be a simple list of images or text options.',
    'It can optionally have a "prompt" object representing the target object/concept.',
    'Ensure distractors in "options" are clearly distinct from correct targets to prevent cognitive frustration.',
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
    "type": "rodear",
    "prompt": null,
    "options": [
      { "type": "image", "content": "perro", "searchTerm": "perro" },
      { "type": "image", "content": "silla", "searchTerm": "silla" },
      { "type": "image", "content": "gato", "searchTerm": "gato" },
      { "type": "image", "content": "lápiz", "searchTerm": "lapiz" }
    ]
  }
}`,
    },
  ],
};
