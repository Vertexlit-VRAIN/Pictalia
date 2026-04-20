export const WORKSHEET_OUTPUT_RULES = `
REGLAS ESTRICTAS DE SALIDA:
- Devuelve SOLO un objeto JSON válido. Sin markdown. Sin comentarios. Sin texto antes ni después.
- Usa únicamente estos exerciseType: "repasar", "unir", "rodear", "copiar".
- El campo "exercise.type" debe coincidir exactamente con "exerciseType".
- No inventes layouts libres ni claves alternativas. No uses "activities", "tasks", "blocks", "pages" ni "elements".
- Cada sección debe contener exactamente: "exerciseType", "instruction", "exercise".
- Puedes omitir "instruction.pictograms" solo si se te pide instrucción simple. Nunca devuelvas null.
- Los items de imagen deben usar type "image" y llevar "searchTerm".
- Los items de trazado/copia deben usar type "traceable_text".
- No devuelvas ejercicios resueltos ni respuestas marcadas como correctas.
- Mantén todo el contenido alineado con el tema pedido. No uses letras, vocales, sílabas o palabras genéricas si el tema no es de lectoescritura.
- Si dudas entre dos formatos, elige SIEMPRE la estructura del esquema JSON mostrado.`;

export const REPASAR_SCHEMA = `
    {
      "exerciseType": "repasar",
      "instruction": {
        "text": "REPASAR",
        "pictograms": [{ "searchTerm": "repasar", "content": "REPASAR" }]
      },
      "exercise": {
        "type": "repasar",
        "prompts": [
          { "type": "traceable_text", "content": "A" },
          { "type": "traceable_text", "content": "A" },
          { "type": "traceable_text", "content": "A" }
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
        "text": "RODEAR PERRO",
        "pictograms": [
          { "searchTerm": "rodear", "content": "RODEAR" },
          { "searchTerm": "perro", "content": "PERRO" }
        ]
      },
      "exercise": {
        "type": "rodear",
        "options": [
          { "type": "image", "content": "perro", "searchTerm": "perro" },
          { "type": "image", "content": "gato", "searchTerm": "gato" },
          { "type": "image", "content": "pez", "searchTerm": "pez" }
        ]
      }
    }`;

export const COPIAR_SCHEMA = `
    {
      "exerciseType": "copiar",
      "instruction": {
        "text": "COPIAR",
        "pictograms": [{ "searchTerm": "copiar", "content": "COPIAR" }]
      },
      "exercise": {
        "type": "copiar",
        "model": { "type": "traceable_text", "content": "SOL" },
        "copies": [
          { "type": "traceable_text", "content": "SOL" }
        ]
      }
    }`;

export const WORKSHEET_JSON_SCHEMA = `{
  "title": "string corto en español",
  "pictogramSearchTerm": "sustantivo simple para el pictograma principal",
  "sections": [
${REPASAR_SCHEMA},
${UNIR_SCHEMA},
${RODEAR_SCHEMA},
${COPIAR_SCHEMA}
  ]
}`;

export const REFINEMENT_JSON_SCHEMA = `{
  "title": "string opcional",
  "pictogramSearchTerm": "string opcional",
  "sections": [
${RODEAR_SCHEMA}
  ]
}`;
