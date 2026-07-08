import { compact } from './shared';

export const buildTranslationPrompt = (
  text: string,
  language: string,
  childProfile: string
): string => {
  return compact(
    `You are an expert in cognitive accessibility and Special Education, specializing in Autism Spectrum Disorder (ASD) and Augmentative and Alternative Communication (AAC) systems.
Your task is to analyze and segment the following text to adapt it as a "mixed text" (words combined with visual support pictograms) in Translator format.`,
    `STUDENT PROFILE:
${childProfile}`,
    `TEXT TO ANALYZE:
"""
${text}
"""`,
    `PREFERRED LANGUAGE:
${language === 'auto' ? 'Detect the main language of the text (Castilian Spanish -> "es", Valencian/Catalan -> "val", English -> "en").' : `The selected language is "${language}".`}`,
    `GRAMMATICAL ANALYSIS AND IMPORTANCE INSTRUCTIONS:
1. **Language**: Identify the main language of the text. If it is Valencian or Catalan, use "val". If Castilian Spanish, use "es". If English, use "en".
2. **Segmentation**: Split the text into tokens. Rejoining the "text" fields in order must rebuild EXACTLY the original input text.
3. **Grammatical Category (pos)**: Rigorously identify the category of each word:
   - 'noun': Nouns and proper names (e.g. niño, casa, perro, xiquet, dog, cat).
   - 'verb': Verbs in any form (infinitive, conjugated, auxiliary, gerund, etc. e.g. come, corre, vive, viu, runs, eating).
   - 'adjective': Adjectives (e.g. grande, gran, rojo, roja, big, blue).
   - 'adverb': Adverbs (e.g. muy, rápidamente, despacio, molt, fast).
   - 'determiner': Articles and determiners (e.g. el, la, los, un, una, els, the, a).
   - 'preposition': Prepositions (e.g. en, de, para, amb, in, under).
   - 'conjunction': Conjunctions (e.g. y, o, pero, i, and, but).
   - 'pronoun': Pronouns (e.g. él, ella, nosotros, he, they).
   - 'other': Interjections or other types.
4. **Search Concept (concept)**: For each word token ('type': 'word'), provide the lemma or base form in the corresponding language so that ARASAAC API search is optimal.
   - Spanish: infinitives for verbs (e.g. come -> comer, vive -> vivir), singular masculine for nouns/adjectives (e.g. casas -> casa, rojas -> rojo).
   - Valencian: infinitives for verbs (e.g. viu -> viure, menja -> menjar), singular for nouns/adjectives (e.g. xiquets -> xiquet, grans -> gran).
   - English: base form (e.g. runs -> run, eating -> eat, dogs -> dog).
   - Multi-word concepts: if you detect an idiom, compound verb, or concept best represented by a single pictogram (e.g., "wash hands", "rentar-se les mans", "lavarse las manos"), group it into a single token with type="word", text="exact phrase from text", pos="verb" (or category of the head) and concept="base form of action" (e.g., "wash hands").
5. **Importance (importance)**: Assign a decimal between 0.0 and 1.0. This determines which words receive visual support:
   - Keywords with high meaning (nouns, verbs, adjectives) must have high scores (0.8 to 1.0).
   - Functional words (articles, prepositions, conjunctions) must have low scores (0.1 to 0.3).
   - **Importance Variability**: DO NOT assign the same importance value to all words in the same grammatical category. Evaluate which words are core or indispensable to understand the sentence's main idea (higher scores, e.g. 1.0 or 0.9) and which are complementary (lower scores, e.g. 0.7 or 0.6). This allows the sliders to filter the most relevant words first.
6. **Recommended Sliders (recommendedSliders)**: Recommend an initial percentage (0 to 100) for each category adjusted to the profile and text difficulty.
7. **Language in JSON (language)**: The "language" field must be strictly "es", "val", or "en".`,
    `FORMAT RULES:
- Return ONLY the JSON object.
- No explanations before or after the JSON.
- Respect markdown JSON code block formatting.`,
    `PEDAGOGICAL AND GRAMMATICAL REFERENCE EXAMPLES:
 
Example 1 (Spanish, Profile with high support need):
Text: "El niño vive en una casa grande."
Response:
{
  "language": "es",
  "recommendedSliders": {
    "noun": 100,
    "verb": 80,
    "adjective": 50,
    "adverb": 35,
    "determiner": 15,
    "preposition": 10,
    "conjunction": 10,
    "pronoun": 20,
    "other": 0
  },
  "tokens": [
    {"text": "El", "type": "word", "pos": "determiner", "importance": 0.1, "concept": "el"},
    {"text": " ", "type": "whitespace"},
    {"text": "niño", "type": "word", "pos": "noun", "importance": 1.0, "concept": "niño"},
    {"text": " ", "type": "whitespace"},
    {"text": "vive", "type": "word", "pos": "verb", "importance": 0.9, "concept": "vivir"},
    {"text": " ", "type": "whitespace"},
    {"text": "en", "type": "word", "pos": "preposition", "importance": 0.2, "concept": "en"},
    {"text": " ", "type": "whitespace"},
    {"text": "una", "type": "word", "pos": "determiner", "importance": 0.1, "concept": "una"},
    {"text": " ", "type": "whitespace"},
    {"text": "casa", "type": "word", "pos": "noun", "importance": 0.7, "concept": "casa"},
    {"text": " ", "type": "whitespace"},
    {"text": "grande", "type": "word", "pos": "adjective", "importance": 0.8, "concept": "grande"},
    {"text": ".", "type": "punctuation"}
  ]
}
 
Example 2 (Valencian, Profile with high support need):
Text: "El xiquet menja en una casa gran."
Response:
{
  "language": "val",
  "recommendedSliders": {
    "noun": 100,
    "verb": 80,
    "adjective": 50,
    "adverb": 35,
    "determiner": 15,
    "preposition": 10,
    "conjunction": 10,
    "pronoun": 20,
    "other": 0
  },
  "tokens": [
    {"text": "El", "type": "word", "pos": "determiner", "importance": 0.1, "concept": "el"},
    {"text": " ", "type": "whitespace"},
    {"text": "xiquet", "type": "word", "pos": "noun", "importance": 1.0, "concept": "xiquet"},
    {"text": " ", "type": "whitespace"},
    {"text": "menja", "type": "word", "pos": "verb", "importance": 0.9, "concept": "menjar"},
    {"text": " ", "type": "whitespace"},
    {"text": "en", "type": "word", "pos": "preposition", "importance": 0.2, "concept": "en"},
    {"text": " ", "type": "whitespace"},
    {"text": "una", "type": "word", "pos": "determiner", "importance": 0.1, "concept": "una"},
    {"text": " ", "type": "whitespace"},
    {"text": "casa", "type": "word", "pos": "noun", "importance": 0.7, "concept": "casa"},
    {"text": " ", "type": "whitespace"},
    {"text": "gran", "type": "word", "pos": "adjective", "importance": 0.8, "concept": "gran"},
    {"text": ".", "type": "punctuation"}
  ]
}
 
Example 3 (English, Profile with high support need):
Text: "The dog runs fast."
Response:
{
  "language": "en",
  "recommendedSliders": {
    "noun": 100,
    "verb": 80,
    "adjective": 50,
    "adverb": 60,
    "determiner": 15,
    "preposition": 10,
    "conjunction": 10,
    "pronoun": 20,
    "other": 0
  },
  "tokens": [
    {"text": "The", "type": "word", "pos": "determiner", "importance": 0.1, "concept": "the"},
    {"text": " ", "type": "whitespace"},
    {"text": "dog", "type": "word", "pos": "noun", "importance": 1.0, "concept": "dog"},
    {"text": " ", "type": "whitespace"},
    {"text": "runs", "type": "word", "pos": "verb", "importance": 0.9, "concept": "run"},
    {"text": " ", "type": "whitespace"},
    {"text": "fast", "type": "word", "pos": "adverb", "importance": 0.7, "concept": "fast"},
    {"text": ".", "type": "punctuation"}
  ]
}`
  );
};
