from .config import EXERCISE_MANIFESTS, PICTOGRAM_RULES

def build_adp_prompt(options, child_profile, language):
    """
    Generates the ADP planning agent prompt.
    """
    lang_names = {
        'es': 'Castilian Spanish (es)',
        'val': 'Valencian/Catalan (val)',
        'en': 'English (en)',
    }
    target_lang = lang_names.get(language, lang_names['es'])
    
    exercise_details = []
    for t, manifest in EXERCISE_MANIFESTS.items():
        rules_str = "\n".join([f"  - {r}" for r in manifest["promptRules"]])
        details = f"- \"{t}\": {manifest['pedagogicalDescription']}\n  Limits: Min items: {manifest['minGenerateItems']}, Max items: {manifest['maxGenerateItems']}\n  Constraints and rules:\n{rules_str}"
        exercise_details.append(details)
    exercise_details_str = "\n".join(exercise_details)

    requested_count_str = f"Generate exactly {options['requestedExerciseCount']} exercises." if options.get("requestedExerciseCount") else "Generate a recommended number of exercises (usually between 3 and 5) based on the student profile."

    prompt = f"""You are the Pedagogical Evaluator Agent (PEA) / ADP stratega for Adaptator-TEA.
Your role is to design the pedagogical plan and worksheet structure for a student with special education needs.

STUDENT PROFILE:
{child_profile}

PEDAGOGICAL GOALS:
- Topic: {options.get('topic', '')}
- Goal: {options.get('goal', '')}
- Details (Teacher Instructions): {options.get('extraDetails', '')}

AVAILABLE EXERCISE TYPES & STRUCTURAL CONSTRAINTS:
{exercise_details_str}

EXERCISE COUNT:
{requested_count_str}

RULES:
1. Choose the most appropriate exercise types from the available list for this student's profile.
2. Structure the learning progression logically (easier exercises first, e.g. repasar before copiar).
3. For each exercise, write a clear objective, a concise instruction in uppercase, and a highly detailed content description.
4. CRITICAL: The content description must strictly match the supported structure of the exercise type. Do NOT invent layouts, background scenes, interactive diagrams, or custom shapes that are not supported. E.g. for "rodear", describe targets and distractors; for "unir", describe left and right pairs; for "repasar", list words to trace.
5. If appropriate for numeracy or visual matching, you can plan "unir" exercises that match text numbers with a repeated pictogram (quantity), describing it in the exercise content description.
6. All texts (titles, instructions, description details) MUST be in {target_lang}.
7. Output ONLY a valid JSON object matching the schema below. No conversational text.
8. CRITICAL: Strictly follow any exclusions, constraints, or explicit focus areas requested by the teacher in "Details" under PEDAGOGICAL GOALS. For instance, if the teacher explicitly says they do not want a specific type of exercise (e.g., "no quiero ejercicios de repasar", "no repasar", "no copiar", "do not include matching"), you MUST NOT plan or choose that exercise type under any circumstances, even if it is recommended by the student profile. Do not select it from the available exercise list.
9. CRITICAL: For each exercise plan, analyze the student's profile (specifically their attention span, motor skills, age, and cognitive support level) and EXPLICITLY specify the exact number of elements, pairs, options, or words to generate in the "description" field. The chosen count MUST fall strictly within the "Min items" and "Max items" limits specified for that exercise type. High support needs / short attention span profiles should get a count close to the Min limit (e.g., exactly 3 pairs/6 items for unir, exactly 4 options/items for rodear); lower support needs / higher attention span profiles should get a count close to the Max limit (e.g., exactly 5-6 pairs/10-12 items for unir, exactly 6-8 options/items for rodear).

OUTPUT SCHEMA:
{{
  "title": "Short descriptive title of the worksheet in {target_lang}",
  "pictogramSearchTerm": "Simple noun in {target_lang} representing the overall theme",
  "exercisePlans": [
    {{
      "type": "one of the available exercise types",
      "objective": "Detailed pedagogical objective for this exercise",
      "instruction": "SHORT INSTRUCTION IN UPPERCASE",
      "description": "Extremely detailed description of the content to generate. E.g. 'Match number 1 with 1 flower pictogram, number 2 with 2 flower pictograms, number 3 with 3 flower pictograms. Left column has numbers, right column has repeated flower pictures.'"
    }}
  ]
}}

JSON ONLY. Respect Markdown JSON formatting."""
    return prompt

def build_ac_prompt(exercise_blueprint, language, feedback=None):
    """
    Generates the exercise constructor prompt (AC).
    """
    lang_names = {
        'es': 'Castilian Spanish (es)',
        'val': 'Valencian/Catalan (val)',
        'en': 'English (en)',
    }
    target_lang = lang_names.get(language, lang_names['es'])
    
    manifest = EXERCISE_MANIFESTS[exercise_blueprint["type"]]
    specific_rules = manifest["promptRules"]
    exercise_schema = manifest["jsonSchema"]
    
    base_rules = [
        'Generate the exact content and the exact element count (number of options, pairs, words, traces) described in the blueprint description. Do NOT default or be limited to the counts shown in the JSON schemas or few-shot examples.',
        *specific_rules,
        f"All student-facing and teacher-facing text in the JSON (instructions, contents, searchTerms, copies, etc.) MUST be written in {target_lang}.",
        "Do NOT include any additional fields or wrapper objects. The output must be exactly the JSON section structure.",
        "Do NOT include markdown styling or text outside the JSON block. Return ONLY the JSON object."
    ]
    base_rules_str = "\n".join([f"{idx+1}. {rule}" for idx, rule in enumerate(base_rules)])
    
    feedback_str = f"""ATTENTION - PREVIOUS FEEDBACK TO CORRECT:
The previous attempt to generate this exercise failed validation or pedagogical criteria. You MUST correct it based on the following feedback:
"{feedback}"\n""" if feedback else ""

    prompt = f"""You are the Exercise Constructor Agent (AC) for Adaptator-TEA.
Your role is to generate the exact JSON structure for a single educational exercise according to a provided pedagogical blueprint.
{feedback_str}
PEDAGOGICAL BLUEPRINT:
- Exercise Type: {exercise_blueprint['type']}
- Objective: {exercise_blueprint['objective']}
- Instruction: {exercise_blueprint['instruction']}
- Detailed Content Description: {exercise_blueprint['description']}

TARGET SCHEMA AND RULES:
You must output a single JSON object matching the format below.
{exercise_schema}

ADDITIONAL RULES:
{base_rules_str}

{PICTOGRAM_RULES}

JSON ONLY. Respect Markdown JSON formatting."""
    return prompt

def build_pea_prompt(exercise_blueprint, exercise_json, child_profile, language):
    """
    Generates the individual evaluator (PEA) prompt.
    """
    lang_names = {
        'es': 'Castilian Spanish (es)',
        'val': 'Valencian/Catalan (val)',
        'en': 'English (en)',
    }
    target_lang = lang_names.get(language, lang_names['es'])
    
    prompt = f"""You are the Pedagogical Evaluator Agent (PEA) for Adaptator-TEA.
Your role is to review a single educational exercise generated by the Exercise Constructor Agent (AC) against the student's profile and the pedagogical plan.

STUDENT PROFILE:
{child_profile}

PEDAGOGICAL PLAN FOR THIS EXERCISE:
- Exercise Type: {exercise_blueprint['type']}
- Objective: {exercise_blueprint['objective']}
- Instruction: {exercise_blueprint['instruction']}
- Detailed Content Description: {exercise_blueprint['description']}

GENERATED JSON TO EVALUATE:
{exercise_json}

EVALUATION CRITERIA:
1. JSON Schema Validity: The JSON must parse correctly and have the exact fields defined for type "{exercise_blueprint['type']}".
2. Adaptability to Profile: The activity must fit the motor, cognitive, and attention limits of the student.
3. Instruction Visual Clarity: The instruction text must be brief, direct, written in {target_lang} (UPPERCASE) and accompanied by matching pictograms.
4. Content Matching: The generated options/items/pairs must strictly represent the detailed description and theme of the blueprint.
5. Pictogram Search Terms Audit: Inspect all "searchTerm" fields. They must contain exactly one simple concrete word.
   - REJECT any search term that contains multi-word concepts, sentences, or instructions (e.g. "perro marron", "abuela feliz").
   - REJECT any search term with hyphens (-), underscores (_) or files extensions (e.g. "plato_picto", "flor_image").
   - Ensure spelling is correct in {target_lang}.

OUTPUT FORMAT:
You must return a single valid JSON object with the following fields:
{{
  "approved": true or false,
  "feedback": "If approved=false, write detailed instructions on what needs to be changed. Explain what failed and how to correct it. If approved=true, leave empty."
}}

JSON ONLY. Respect Markdown JSON formatting."""
    return prompt

def build_gpea_prompt(child_profile, worksheet_json, language):
    """
    Generates the global evaluator (GPEA) prompt.
    """
    prompt = f"""You are the Global Pedagogical Evaluator Agent (GPEA) for Adaptator-TEA.
Your role is to audit a full educational worksheet containing multiple exercises, ensuring overall progression, visual simplicity, and structural coherence.

STUDENT PROFILE:
{child_profile}

GENERATED WORKSHEET JSON:
{worksheet_json}

EVALUATION CRITERIA:
1. Overall Coherence: The worksheet must maintain a single, consistent theme across all exercises.
2. Progression & Visual Load: The exercises must be ordered from easiest (e.g., repasar) to hardest (e.g., copiar). The total number of items must not overwhelm the student's attention limits.
3. Pictogram Consistency: Search terms for pictograms must be simple single words in the target language. No underscores, hyphens, or technical suffixes.

OUTPUT FORMAT:
You must return a single valid JSON object with the following fields:
{{
  "approved": true or false,
  "feedback": "If approved=false, provide general feedback and specific suggestions for each failed exercise.",
  "rejectedSectionIndexes": [index of failed exercises in the worksheet sections list, starting from 0. E.g. [1] to reject the second exercise. Empty if all are approved.]
}}

JSON ONLY. Respect Markdown JSON formatting."""
    return prompt

def build_single_prompt(options, child_profile, language, show_pictograms):
    """
    Generates the Single-Prompt pipeline unifier.
    """
    lang_names = {
        'es': 'Castilian Spanish (es)',
        'val': 'Valencian/Catalan (val)',
        'en': 'English (en)',
    }
    target_lang = lang_names.get(language, lang_names['es'])

    exercise_rules_list = []
    for t, manifest in EXERCISE_MANIFESTS.items():
        rules_str = "\n".join([f"  - {r}" for r in manifest["promptRules"]])
        item_desc = f"""- Exercise type "{t}":
  JSON Schema format:
  {manifest['jsonSchema']}
  Limits: Min items: {manifest['minGenerateItems']}, Max items: {manifest['maxGenerateItems']}
  Rules:
  {rules_str}"""
        exercise_rules_list.append(item_desc)
    exercise_rules_str = "\n\n".join(exercise_rules_list)

    prompt = f"""You are the Adaptator-TEA AI system.
Your goal is to generate a complete educational worksheet adapted for a student with special education needs (TEA).

STUDENT PROFILE:
{child_profile}

PEDAGOGICAL PLAN:
- Topic: {options.get('topic', '')}
- Goal: {options.get('goal', '')}
- Details (Teacher Instructions): {options.get('extraDetails', '')}

PEDAGOGICAL RULES:
- Adapt the exercise to the student profile. Prioritize autonomy, visual support, and low verbal load.
- Choose simple and concrete visual representations. Everyday vocabulary only.
- Strict Content Coherence: All titles, instructions, text, and search terms must have 100% direct thematic coherence with the topic. Do not mix unrelated subjects.
- Element Scaling: Dynamically adapt the number of elements/items in each generated exercise section (e.g., pairs in "unir", options in "rodear", words/letters in "repasar"/"copiar") to the student's age, attention limit, and cognitive support level. The chosen count MUST fall strictly within the "Min items" and "Max items" limits specified for that exercise type. High support needs profiles should get a count close to the Min limit; lower support needs should get a count close to the Max limit.

MANDATORY STRUCTURE BY TYPE:
{exercise_rules_str}

{PICTOGRAM_RULES}

CRITICAL GENERATION RULES:
1. Output ONLY a valid JSON object matching the worksheet schema below. No conversational text.
2. Strictly follow the exclusions, constraints, or focus areas requested in "Details". For instance, if the teacher explicitly says "no quiero ejercicios de repasar" or similar, you MUST NOT include any sections of type "repasar" in the worksheet under any circumstances.
3. Every exercise section must include an instruction text (UPPERCASE) and associated instruction pictograms (each with searchTerm and content).

WORKSHEET OUTPUT SCHEMA:
{{
  "title": "Descriptive worksheet title in {target_lang}",
  "pictogramSearchTerm": "Simple theme word for the whole worksheet",
  "sections": [
    {{
      "exerciseType": "repasar / unir / rodear / copiar",
      "instruction": {{
        "text": "INSTRUCTION TEXT",
        "pictograms": [
          {{ "searchTerm": "term", "content": "WORD" }}
        ]
      }},
      "exercise": <structure matching the corresponding schema for exerciseType>
    }}
  ]
}}

JSON ONLY. Respect Markdown JSON formatting."""
    return prompt
