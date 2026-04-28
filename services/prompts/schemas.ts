export const WORKSHEET_OUTPUT_RULES = `
REGLAS ESTRICTAS DE SALIDA:
- Devuelve SOLO un objeto JSON válido. Sin markdown. Sin comentarios. Sin texto antes ni después.
- Usa únicamente estos exerciseType: "repasar", "unir", "rodear", "copiar".
- El campo "exercise.type" debe coincidir exactamente con "exerciseType".
- No inventes claves alternativas. No uses "activities", "tasks", "blocks", "pages" ni "elements".
- Cada sección debe contener exactamente: "exerciseType", "instruction", "exercise".
- Puedes omitir "instruction.pictograms" solo si se pide instrucción simple. Nunca devuelvas null.
- Los items de imagen deben usar type "image" y llevar "searchTerm".
- Los items de trazado o copia deben usar type "traceable_text".
- No devuelvas ejercicios resueltos ni respuestas marcadas.
- Mantén todo el contenido alineado con el tema pedido.
- Si el tema no es de lectoescritura, no uses letras, vocales, sílabas o palabras genéricas.
- Si dudas entre dos formatos, elige SIEMPRE la estructura del esquema JSON mostrado.
`;

export const REPASAR_SCHEMA = `
    {
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
          { "type": "traceable_text", "content": "FLOR" },
          { "type": "traceable_text", "content": "HOJA" },
          { "type": "traceable_text", "content": "RAÍZ" }
        ]
      }
    }`;

export const UNIR_SCHEMA = `
    {
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

export const RODEAR_SCHEMA = `
    {
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

export const COPIAR_SCHEMA = `
    {
      "exerciseType": "copiar",
      "instruction": {
        "text": "COPIAR",
        "pictograms": [
          { "searchTerm": "copiar", "content": "COPIAR" }
        ]
      },
      "exercise": {
        "type": "copiar",
        "model": { "type": "traceable_text", "content": "SEMILLA" },
        "copies": [
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