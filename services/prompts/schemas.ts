export const REPASAR_SCHEMA = `{
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
}`;

export const UNIR_SCHEMA = `{
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
      },
      {
        "left": { "type": "image", "content": "gallina", "searchTerm": "gallina" },
        "right": { "type": "image", "content": "huevo", "searchTerm": "huevo" }
      }
    ]
  }
}`;

export const RODEAR_SCHEMA = `{
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
    "options": [
      { "type": "image", "content": "manzana", "searchTerm": "manzana" },
      { "type": "image", "content": "pera", "searchTerm": "pera" },
      { "type": "image", "content": "coche", "searchTerm": "coche" },
      { "type": "image", "content": "mesa", "searchTerm": "mesa" }
    ]
  }
}`;

export const COPIAR_SCHEMA = `{
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
}`;

export const WORKSHEET_JSON_EXAMPLE = `{
  "title": "string corto en español",
  "pictogramSearchTerm": "sustantivo simple para el pictograma principal",
  "sections": [
    ${REPASAR_SCHEMA},
    ${UNIR_SCHEMA},
    ${RODEAR_SCHEMA},
    ${COPIAR_SCHEMA}
  ]
}`;

export const WORKSHEET_JSON_SHAPE = `{
  "title": "string corto en español",
  "pictogramSearchTerm": "sustantivo simple para el pictograma principal",
  "sections": [
    {
      "exerciseType": "repasar | unir | rodear | copiar",
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
    ${RODEAR_SCHEMA}
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
        "exerciseType": "repasar | unir | rodear | copiar",
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
