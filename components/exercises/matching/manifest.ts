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
  pedagogicalDescription: 'Matching exercises evaluate logical association, categorization, cause-effect, and simple number-to-quantity mapping. Ideal for students with lower verbal loads who respond well to direct spatial and visual associations.',
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
    "type": "unir",
    "pairs": [
      {
        "left": { "type": "image", "content": "abeja", "searchTerm": "abeja" },
        "right": { "type": "image", "content": "flor", "searchTerm": "flor" }
      },
      {
        "left": { "type": "image", "content": "vaca", "searchTerm": "vaca" },
        "right": { "type": "image", "content": "leche", "searchTerm": "leche" }
      }
    ]
  }
}`,
  promptRules: [
    'The pairs must represent direct and immediate logical associations between two real and concrete elements (e.g. relationships of belonging, cause-effect, tool-action, animal-habitat, or element-category).',
    'NEVER pair elements with complex or non-pictographic visual variations (such as silhouettes, shadows, or blurry shapes).',
    'If the blueprint specifies matching quantity/numbers (e.g. number 2 with two flowers), set "type": "image", "searchTerm": "flor", and "quantity": 2 on the right item. The left/text item should have the number "2".',
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
    "type": "unir",
    "pairs": [
      {
        "left": { "type": "image", "content": "vaca", "searchTerm": "vaca" },
        "right": { "type": "image", "content": "hierba", "searchTerm": "hierba" }
      },
      {
        "left": { "type": "image", "content": "mono", "searchTerm": "mono" },
        "right": { "type": "image", "content": "plátano", "searchTerm": "platano" }
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
    "type": "unir",
    "pairs": [
      {
        "left": { "type": "text", "content": "1" },
        "right": { "type": "image", "content": "manzana", "searchTerm": "manzana", "quantity": 1 }
      },
      {
        "left": { "type": "text", "content": "2" },
        "right": { "type": "image", "content": "manzana", "searchTerm": "manzana", "quantity": 2 }
      }
    ]
  }
}`,
    },
  ],
};
