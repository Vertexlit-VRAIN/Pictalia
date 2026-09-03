# Pictogram rules (translated from TypeScript shared.ts and blocks.ts)
PICTOGRAM_RULES = """PICTOGRAM SEARCH TERM & CONTENT RULES:
1. Every item inside the JSON containing "searchTerm" (for pictogram lookup) or "content" (displayed text) MUST contain a single, simple, concrete word (e.g. "sol", "perro", "abrigo").
2. CRITICAL: Never use multi-word descriptions, qualifiers, sentences, or phrases for search terms (e.g. NEVER write "sol de verano", "abuela feliz", "comer manzana").
3. CRITICAL: Do NOT use technical qualifiers or file extensions in the search term. For example, never use suffixes like "_pictograma", "_image", "_dibujo", "_picto", "pictograma", "image", or "dibujo".
4. Do NOT use punctuation, hyphens (-), or underscores (_) inside "searchTerm" (e.g. use "manzana", never "manzana_roja" or "manzana-roja").
5. The content text of the pictogram should match the search term but in UPPERCASE."""

# Exercise Manifest Definitions (equivalent to components/exercises/*)
EXERCISE_MANIFESTS = {
    "repasar": {
        "pedagogicalDescription": "Tracing exercises focus on fine motor skills and simple visual-written recognition. Recommended for students learning coordinate tracing.",
        "minGenerateItems": 3,
        "maxGenerateItems": 6,
        "promptRules": [
            'The "prompts" array must only contain raw strings representing the letters or words to trace (capitalized).',
            'CRITICAL: Only plan a simple list of letters, numbers, or words to trace in uppercase.',
            'Scale the number of items to trace dynamically based on the student profile, strictly between 3 and 6 elements. High support needs profiles should have 3 items; lower support needs should have 4 to 6 items.'
        ],
        "jsonSchema": """{
  "exerciseType": "repasar",
  "instruction": {
    "text": "REPASAR LA PALABRA",
    "pictograms": [
      { "searchTerm": "repasar", "content": "REPASAR" }
    ]
  },
  "exercise": {
    "prompts": ["A", "B", "C"]
  }
}"""
    },
    "unir": {
        "pedagogicalDescription": "Matching exercises build cognitive associations and relational classification (e.g. image to word, number to quantity).",
        "minGenerateItems": 6,  # 3 pairs = 6 items
        "maxGenerateItems": 12, # 6 pairs = 12 items
        "promptRules": [
            'Pairs must represent direct logical associations (e.g. animal-to-food, object-to-category).',
            'For quantity matching, the left item should have the number digit as content (e.g. "2"), and the right item should have the concrete noun as searchTerm (e.g. "flor") with the target quantity (e.g. 2).',
            'CRITICAL: Only plan direct left-to-right item matching pairs. Do not plan multiple levels, sub-questions, or other layout formats.',
            'Scale the number of matching pairs dynamically based on the student profile, strictly between 3 and 6 pairs. High support needs profiles should have 3 pairs (6 items); lower support needs should have 4 to 6 pairs. Do not generate only 2 pairs unless explicitly asked.'
        ],
        "jsonSchema": """{
  "exerciseType": "unir",
  "instruction": {
    "text": "UNIR CADA ANIMAL CON SU COMIDA",
    "pictograms": [
      { "searchTerm": "unir", "content": "UNIR" }
    ]
  },
  "exercise": {
    "pairs": [
      {
        "left": { "content": "mono", "searchTerm": "mono" },
        "right": { "content": "plátano", "searchTerm": "platano" }
      }
    ]
  }
}"""
    },
    "rodear": {
        "pedagogicalDescription": "Circling exercises reinforce selective attention and visual discrimination of target elements in a set of distractors.",
        "minGenerateItems": 4,
        "maxGenerateItems": 8,
        "promptRules": [
            'Renders a simple flat list or grid of options. Distractors must be concrete, simple, and clearly distinct from target items.',
            'An optional "prompt" object can define the target concept.',
            'CRITICAL: Only plan a simple list/grid of options. Never plan complex illustration scenes, body parts labeling, interactive layouts, or subgroups.',
            'Scale the number of options (targets + distractors) dynamically based on the student profile, strictly between 4 and 8 options. High support needs profiles should have 4 options; lower support needs should have 6 to 8 options.'
        ],
        "jsonSchema": """{
  "exerciseType": "rodear",
  "instruction": {
    "text": "RODEA LOS ANIMALES",
    "pictograms": [
      { "searchTerm": "rodear", "content": "RODEAR" }
    ]
  },
  "exercise": {
    "prompt": null,
    "options": [
      { "content": "perro", "searchTerm": "perro" },
      { "content": "silla", "searchTerm": "silla" }
    ]
  }
}"""
    },
    "copiar": {
        "pedagogicalDescription": "Copying exercises reinforce spelling, letter-by-letter writing, and word copying.",
        "minGenerateItems": 3,
        "maxGenerateItems": 6,
        "promptRules": [
            'All words to copy go in "copies" as raw strings in UPPERCASE.',
            'Do not include "image" or "searchTerm" items in this exercise.',
            'CRITICAL: Only plan a simple list of words to copy in uppercase.',
            'Scale the number of words to copy dynamically based on the student profile, strictly between 3 and 6 elements. High support needs profiles should have 3 words; lower support needs should have 4 to 6 words.'
        ],
        "jsonSchema": """{
  "exerciseType": "copiar",
  "instruction": {
    "text": "COPIA LAS PALABRAS",
    "pictograms": [
      { "searchTerm": "copiar", "content": "COPIAR" }
    ]
  },
  "exercise": {
    "copies": ["SOL", "LUNA"]
  }
}"""
    }
}
