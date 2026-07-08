import { EXERCISE_TYPE_ORDER, getExerciseSchema } from '../../components/exercises/registry';

// Dynamically compile the registered schemas to inject into example documents
const compiledSchemas = EXERCISE_TYPE_ORDER.map(type => getExerciseSchema(type)).join(',\n');
const circlingSchema = getExerciseSchema('rodear');

export const WORKSHEET_JSON_EXAMPLE = `{
  "title": "string corto en español",
  "pictogramSearchTerm": "sustantivo simple para el pictograma principal",
  "sections": [
    ${compiledSchemas}
  ]
}`;

export const WORKSHEET_JSON_SHAPE = `{
  "title": "string corto en español",
  "pictogramSearchTerm": "sustantivo simple para el pictograma principal",
  "sections": [
    {
      "exerciseType": "${EXERCISE_TYPE_ORDER.join(' | ')}",
      "instruction": {
        "text": "string breve en MAYÚSCULAS",
        "pictograms": [
          { "searchTerm": "string", "content": "string" }
        ]
      },
      "exercise": {}
    }
  ]
}`;

export const REFINEMENT_JSON_SCHEMA = `{
  "title": "string opcional",
  "pictogramSearchTerm": "string opcional",
  "sections": [
    ${circlingSchema}
  ]
}`;

export const WORKSHEET_OPERATION_JSON_EXAMPLE = `{
  "operations": [
    {
      "type": "update_section",
      "sectionId": "id_de_la_seccion_existente",
      "section": {
        "exerciseType": "unir",
        "instruction": {
          "text": "UNIR ANIMAL CON SONIDO",
          "pictograms": [
            { "searchTerm": "unir", "content": "UNIR" },
            { "searchTerm": "animal", "content": "ANIMAL" },
            { "searchTerm": "sonido", "content": "SONIDO" }
          ]
        },
        "exercise": {
          "type": "unir",
          "pairs": [
            {
              "left": { "type": "image", "content": "vaca", "searchTerm": "vaca" },
              "right": { "type": "image", "content": "mugir", "searchTerm": "mugir" }
            },
            {
              "left": { "type": "image", "content": "oveja", "searchTerm": "oveja" },
              "right": { "type": "image", "content": "balar", "searchTerm": "balar" }
            },
            {
              "left": { "type": "image", "content": "perro", "searchTerm": "perro" },
              "right": { "type": "image", "content": "ladrar", "searchTerm": "ladrar" }
            }
          ]
        }
      }
    }
  ]
}`;

export const WORKSHEET_OPERATION_JSON_SCHEMA = `{
  "operations": [
    {
      "type": "update_worksheet | create_section | update_section | delete_section | move_section",
      "afterSectionId": "string opcional, solo para create_section",
      "sectionId": "string obligatorio en update_section, delete_section o move_section",
      "toIndex": 0,
      "changes": {
        "title": "string opcional",
        "pictogramSearchTerm": "string opcional"
      },
      "section": {
        "exerciseType": "${EXERCISE_TYPE_ORDER.join(' | ')}",
        "instruction": {
          "text": "string breve en MAYÚSCULAS",
          "pictograms": [
            { "searchTerm": "string", "content": "string" }
          ]
        },
        "exercise": {}
      }
    }
  ]
}`;
