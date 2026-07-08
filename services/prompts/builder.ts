import {
  WORKSHEET_JSON_EXAMPLE,
  WORKSHEET_JSON_SHAPE,
  REFINEMENT_JSON_SCHEMA,
  WORKSHEET_OPERATION_JSON_EXAMPLE,
  WORKSHEET_OPERATION_JSON_SCHEMA,
} from './schemas';
import {
  OPERATIONS_INTERNAL_VALIDATION_CHECKLIST,
  PROFILE_SELECTION_GUIDE,
  REFINEMENT_INTERNAL_VALIDATION_CHECKLIST,
  WORKSHEET_INTERNAL_VALIDATION_CHECKLIST,
} from './examples';
import {
  EXERCISE_STRUCTURE_RULES,
  FORBIDDEN_TECHNICAL_FIELDS,
  ID_RULES,
  JSON_ONLY_RULE,
  OPERATION_PRESERVATION_RULES,
  OPERATION_RULES,
  PEDAGOGICAL_RULES,
  PICTOGRAM_RULES,
  SECTION_OUTPUT_RULES,
  WORKSHEET_GENERATION_RULES,
} from './blocks';

export interface PromptOptions {
  topic?: string;
  goal?: string;
  extraDetails?: string;
  requestedExerciseCount?: number;
  language?: 'es' | 'val' | 'en';
}

const compact = (...blocks: Array<string | undefined | null | false>): string =>
  blocks
    .filter(Boolean)
    .map(block => String(block).trim())
    .filter(Boolean)
    .join('\n\n');

const buildInstructionPrompt = (showPictogramInstructions: boolean): string =>
  showPictogramInstructions
    ? `INSTRUCTIONS FOR PICTOGRAMS:
- instruction.text must be brief and in UPPERCASE.
- instruction.pictograms must contain simple terms to search for pictograms.`
    : `INSTRUCTIONS FOR PICTOGRAMS:
- instruction.text must be brief and in UPPERCASE.
- Omit instruction.pictograms.`;

const buildPedagogicalContext = (options: PromptOptions): string => {
  const lines = [
    options.topic?.trim() ? `Topic: ${options.topic.trim()}` : '',
    options.goal?.trim() ? `Goal: ${options.goal.trim()}` : '',
    options.extraDetails?.trim() ? `Details: ${options.extraDetails.trim()}` : '',
  ].filter(Boolean);

  return lines.length > 0
    ? compact('PEDAGOGICAL CONTEXT:', lines.join('\n'))
    : '';
};

const buildExerciseCountRule = (requestedExerciseCount?: number): string =>
  requestedExerciseCount && requestedExerciseCount > 0
    ? `EXERCISE COUNT:
- The teacher requested exactly ${requestedExerciseCount} exercises in "sections".
- Respect that exact count.`
    : `EXERCISE COUNT:
- Adapt the number of exercises to the student's profile.
- If no exact count is specified, generate at least 4 exercises.`;

const buildOriginalPedagogicalContext = (
  originalTopic?: string,
  originalGoal?: string,
  originalExtraDetails?: string
): string => {
  const lines = [
    originalTopic?.trim() ? `Original Topic: ${originalTopic.trim()}` : '',
    originalGoal?.trim() ? `Original Goal: ${originalGoal.trim()}` : '',
    originalExtraDetails?.trim() ? `Original Details: ${originalExtraDetails.trim()}` : '',
  ].filter(Boolean);

  return lines.length > 0
    ? lines.join('\n')
    : 'No additional original pedagogical context saved.';
};

const buildLanguageRule = (lang?: 'es' | 'val' | 'en'): string => {
  const languageNames = {
    es: 'Castilian Spanish (es) as spoken in Spain',
    val: 'Valencian/Catalan (val) as spoken in the Valencian Community',
    en: 'English (en)',
  };
  const targetLang = lang ? languageNames[lang] : languageNames.es;

  return `OUTPUT LANGUAGE:
- All student-facing and teacher-facing text in the generated JSON (such as worksheet title, section instructions, traceable texts, copying copies, etc.) MUST be written in ${targetLang}.
- Use clear, frequent, and functional vocabulary in that specific language.
- Do NOT output any English text for these fields unless English is the requested output language.
- Keep the language natural and grammatically correct for ${targetLang}.`;
};

const buildWorksheetContract = (
  showPictogramInstructions: boolean,
  requestedExerciseCount?: number,
  language?: 'es' | 'val' | 'en'
): string =>
  compact(
    JSON_ONLY_RULE,
    buildExerciseCountRule(requestedExerciseCount),
    WORKSHEET_GENERATION_RULES,
    SECTION_OUTPUT_RULES,
    EXERCISE_STRUCTURE_RULES,
    PICTOGRAM_RULES,
    FORBIDDEN_TECHNICAL_FIELDS,
    buildLanguageRule(language),
    buildInstructionPrompt(showPictogramInstructions)
  );

const buildGenerationPromptBase = (
  task: string,
  options: PromptOptions,
  childProfile: string,
  showPictogramInstructions: boolean,
  extraBlocks?: string
): string =>
  compact(
    `TASK:\n${task}`,
    `STUDENT PROFILE:\n${childProfile}`,
    buildPedagogicalContext(options),
    extraBlocks,
    PEDAGOGICAL_RULES,
    PROFILE_SELECTION_GUIDE,
    buildWorksheetContract(showPictogramInstructions, options.requestedExerciseCount, options.language),
    `JSON EXAMPLE:\n${WORKSHEET_JSON_EXAMPLE}`,
    `OUTPUT SCHEMA:\n${WORKSHEET_JSON_SHAPE}`,
    WORKSHEET_INTERNAL_VALIDATION_CHECKLIST
  );

export const buildWorksheetPrompt = (
  options: PromptOptions,
  childProfile: string,
  showPictogramInstructions: boolean
): string =>
  buildGenerationPromptBase(
    'Generate an adapted educational worksheet.',
    options,
    childProfile,
    showPictogramInstructions
  );

export const buildSemanticRepairPrompt = (
  rawText: string,
  options: PromptOptions,
  childProfile: string,
  showPictogramInstructions: boolean
): string => {
  const context = [
    options.topic,
    options.goal,
    options.extraDetails,
  ].filter(Boolean).join(' ') || 'original topic';

  return compact(
    'TASK:\nRepair this worksheet because it does not fit the requested topic or profile.',
    `STUDENT PROFILE:\n${childProfile}`,
    `EXPECTED TOPIC / CONTEXT:\n${context}`,
    PEDAGOGICAL_RULES,
    buildWorksheetContract(showPictogramInstructions, options.requestedExerciseCount, options.language),
    'REPAIR RULES:\n- Keep the JSON structure.\n- Correct any out-of-topic or too generic content.\n- If the topic is not literacy, do not use isolated letters or vowels.',
    `JSON EXAMPLE:\n${WORKSHEET_JSON_EXAMPLE}`,
    `SCHEMA:\n${WORKSHEET_JSON_SHAPE}`,
    REFINEMENT_INTERNAL_VALIDATION_CHECKLIST,
    `ORIGINAL OUTPUT:\n${rawText}`
  );
};

export const buildExerciseCountRepairPrompt = (
  jsonWorksheetContent: string,
  requestedExerciseCount: number,
  options: PromptOptions,
  childProfile: string,
  showPictogramInstructions: boolean
): string =>
  compact(
    'TASK:\nRepair this worksheet because it has fewer exercises than requested.',
    `STUDENT PROFILE:\n${childProfile}`,
    buildPedagogicalContext(options),
    `CURRENT WORKSHEET:\n${jsonWorksheetContent}`,
    `REPAIR RULES:\n- The teacher requested exactly ${requestedExerciseCount} exercises in "sections".\n- Preserve the topic, difficulty level, and pedagogical style.\n- Keep the valid exercises and only generate the missing ones.`,
    PEDAGOGICAL_RULES,
    buildWorksheetContract(showPictogramInstructions, requestedExerciseCount, options.language),
    `JSON EXAMPLE:\n${WORKSHEET_JSON_EXAMPLE}`,
    `SCHEMA:\n${WORKSHEET_JSON_SHAPE}`,
    WORKSHEET_INTERNAL_VALIDATION_CHECKLIST
  );

export const buildJsonRepairPrompt = (
  rawText: string,
  errorMsg: string,
  mode: 'worksheet' | 'refinement' | 'operations'
): string => {
  const schema = mode === 'worksheet'
    ? WORKSHEET_JSON_SHAPE
    : mode === 'operations'
      ? WORKSHEET_OPERATION_JSON_SCHEMA
      : REFINEMENT_JSON_SCHEMA;

  return compact(
    'TASK:\nRepair the JSON format formatting error.',
    `ERROR MESSAGE:\n${errorMsg}`,
    JSON_ONLY_RULE,
    `SCHEMA:\n${schema}`,
    `JSON TO REPAIR:\n${rawText}`
  );
};

export const buildRefinementPrompt = (
  jsonWorksheetContent: string,
  instructionText: string,
  childProfile: string,
  language: 'es' | 'val' | 'en'
): string =>
  compact(
    'TASK:\nRefine the worksheet according to the teacher\'s instruction.',
    `STUDENT PROFILE:\n${childProfile}`,
    `CURRENT WORKSHEET:\n${jsonWorksheetContent}`,
    `INSTRUCTION:\n${instructionText}`,
    PEDAGOGICAL_RULES,
    SECTION_OUTPUT_RULES,
    EXERCISE_STRUCTURE_RULES,
    PICTOGRAM_RULES,
    FORBIDDEN_TECHNICAL_FIELDS,
    buildLanguageRule(language),
    JSON_ONLY_RULE,
    `JSON EXAMPLE:\n${WORKSHEET_JSON_EXAMPLE}`,
    `SCHEMA:\n${REFINEMENT_JSON_SCHEMA}`,
    REFINEMENT_INTERNAL_VALIDATION_CHECKLIST
  );

export const buildExerciseRefinementPrompt = (
  jsonWorksheetContent: string,
  instructionText: string,
  childProfile: string,
  originalTopic?: string,
  originalGoal?: string,
  originalExtraDetails?: string,
  targetSectionId?: string,
  targetSectionContent?: string,
  worksheetContextSummary?: string,
  language?: 'es' | 'val' | 'en'
): string =>
  compact(
    'TASK:\nReturn JSON operations to edit an educational worksheet.',
    JSON_ONLY_RULE,
    `STUDENT PROFILE:\n${childProfile}`,
    `ORIGINAL PEDAGOGICAL CONTEXT:\n${buildOriginalPedagogicalContext(originalTopic, originalGoal, originalExtraDetails)}`,
    `CURRENT WORKSHEET IN CLEAN FORMAT FOR AI:\n${jsonWorksheetContent}`,
    `USER REQUEST:\n${instructionText}`,
    targetSectionId
      ? `TARGET SECTION:\nModify ONLY the section with sectionId "${targetSectionId}".`
      : '',
    targetSectionContent
      ? `TARGET SECTION CONTENT:\n${targetSectionContent}`
      : '',
    worksheetContextSummary
      ? `WORKSHEET SUMMARY:\n${worksheetContextSummary}`
      : '',
    OPERATION_RULES,
    ID_RULES,
    OPERATION_PRESERVATION_RULES,
    PEDAGOGICAL_RULES,
    SECTION_OUTPUT_RULES,
    EXERCISE_STRUCTURE_RULES,
    PICTOGRAM_RULES,
    FORBIDDEN_TECHNICAL_FIELDS,
    buildLanguageRule(language),
    `OPERATIONS EXAMPLE:\n${WORKSHEET_OPERATION_JSON_EXAMPLE}`,
    `ESQUEMA DE SALIDA:\n${WORKSHEET_OPERATION_JSON_SCHEMA}`,
    OPERATIONS_INTERNAL_VALIDATION_CHECKLIST
  );

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
