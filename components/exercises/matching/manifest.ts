import { ExerciseManifest } from '../types';

export const manifest: ExerciseManifest = {
  type: 'unir',
  label: 'Unir',
  instructionText: 'UNIR',
  addLabel: 'Añadir pareja',
  defaultLayout: 'matching_horizontal',
  instructionTerms: ['unir', 'flecha'],
  minimumItems: 4, // 2 pairs = 4 items
  createDefaultExercise: () => ({
    type: 'unir',
    pairs: [
      {
        left: {
          type: 'image',
          content: 'sol',
          searchTerm: 'sol',
          selectedPictoUrl: '',
          pictoOptions: [],
          pictogramRenderMode: 'auto',
          spelledLetterTerms: [],
          spelledLetterUrls: [],
        },
        right: {
          type: 'image',
          content: 'sol',
          searchTerm: 'sol',
          selectedPictoUrl: '',
          pictoOptions: [],
          pictogramRenderMode: 'auto',
          spelledLetterTerms: [],
          spelledLetterUrls: [],
        },
      },
      {
        left: {
          type: 'image',
          content: 'luna',
          searchTerm: 'luna',
          selectedPictoUrl: '',
          pictoOptions: [],
          pictogramRenderMode: 'auto',
          spelledLetterTerms: [],
          spelledLetterUrls: [],
        },
        right: {
          type: 'image',
          content: 'luna',
          searchTerm: 'luna',
          selectedPictoUrl: '',
          pictoOptions: [],
          pictogramRenderMode: 'auto',
          spelledLetterTerms: [],
          spelledLetterUrls: [],
        },
      },
    ],
  }),

  // AI & Pedagogical Directives
  pedagogicalDescription: 'Matching exercises evaluate logical association, categorization, cause-effect, and simple number-to-quantity mapping.',
  jsonSchema: `{
  "exerciseType": "unir",
  "instruction": {
    "text": "UNIR",
    "pictograms": [
      { "searchTerm": "unir", "content": "UNIR" },
      { "searchTerm": "flecha", "content": "FLECHA" }
    ]
  },
  "exercise": {
    "pairs": [
      {
        "left": { "content": "abeja", "searchTerm": "abeja" },
        "right": { "content": "flor", "searchTerm": "flor" }
      }
    ]
  }
}`,
  promptRules: [
    'Pairs must represent direct logical associations (e.g. animal-to-food, object-to-category).',
    'For quantity matching, the left item should have the number digit as content (e.g. "2"), and the right item should have the concrete noun as searchTerm (e.g. "flor") with the target quantity (e.g. 2).',
  ],
  fewShotExamples: [
    {
      title: 'Concept Association',
      description: 'Pairs animal terms with their food source or products',
      json: `{
  "exerciseType": "unir",
  "instruction": {
    "text": "ASOCIA EL ANIMAL CON SU COMIDA",
    "pictograms": [
      { "searchTerm": "unir", "content": "UNIR" },
      { "searchTerm": "animal", "content": "ANIMAL" },
      { "searchTerm": "comida", "content": "COMIDA" }
    ]
  },
  "exercise": {
    "pairs": [
      {
        "left": { "content": "vaca", "searchTerm": "vaca" },
        "right": { "content": "hierba", "searchTerm": "hierba" }
      },
      {
        "left": { "content": "mono", "searchTerm": "mono" },
        "right": { "content": "plátano", "searchTerm": "platano" }
      }
    ]
  }
}`,
    },
    {
      title: 'Number-Quantity Association',
      description: 'Pairs digit numbers with repeated pictogram grids (quantity matching)',
      json: `{
  "exerciseType": "unir",
  "instruction": {
    "text": "UNE CADA NÚMERO CON SU CANTIDAD",
    "pictograms": [
      { "searchTerm": "unir", "content": "UNIR" },
      { "searchTerm": "numero", "content": "NÚMERO" },
      { "searchTerm": "flor", "content": "CANTIDAD" }
    ]
  },
  "exercise": {
    "pairs": [
      {
        "left": { "content": "1" },
        "right": { "content": "manzana", "searchTerm": "manzana", "quantity": 1 }
      },
      {
        "left": { "content": "2" },
        "right": { "content": "manzana", "searchTerm": "manzana", "quantity": 2 }
      }
    ]
  }
}`,
    },
  ],
};
