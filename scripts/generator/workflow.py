import re
import json
import time

from .prompts import (
    build_adp_prompt,
    build_ac_prompt,
    build_pea_prompt,
    build_gpea_prompt,
    build_single_prompt
)
from .api import (
    call_llm,
    extract_json_object,
    repair_json_response,
    resolve_pictograms_in_worksheet
)

def get_semantic_exercise_count(options):
    text_blocks = [options.get("topic", ""), options.get("goal", ""), options.get("extraDetails", "")]
    patterns = [
        r"\b(\d{1,2})\s+(?:ejercicios?|actividades?|secciones?)\b",
        r"\b(?:con|de|tenga|tener|incluye?|incluya|quiero|necesito)\s+(\d{1,2})\s+(?:ejercicios?|actividades?|secciones?)\b",
        r"\b(\d{1,2})\s+(?:exercises?|activities?|sections?)\b"
    ]
    for text in text_blocks:
        if not text:
            continue
        for pat in patterns:
            match = re.search(pat, text, re.IGNORECASE)
            if match:
                val = int(match.group(1))
                if val > 0:
                    return val
    return None

def normalize_exercise_structure(section):
    """
    Normalizes sections and copies structural prompts/copies lists to items array to match TS.
    """
    exercise_type = section.get("exerciseType")
    exercise = section.get("exercise", {})
    
    items = []
    if exercise_type == "repasar":
        prompts = exercise.get("prompts", [])
        for prompt in prompts:
            items.append({
                "type": "traceable_text",
                "content": str(prompt).upper()
            })
            
    elif exercise_type == "copiar":
        copies = exercise.get("copies", [])
        for copy in copies:
            items.append({
                "type": "traceable_text",
                "content": str(copy).upper()
            })
            
    elif exercise_type == "rodear":
        options = exercise.get("options", [])
        for opt in options:
            items.append({
                "type": "image",
                "content": opt.get("content", ""),
                "searchTerm": opt.get("searchTerm", opt.get("content", "")).lower(),
                "selectedPictoUrl": "",
                "pictoOptions": [],
                "pictogramRenderMode": "auto"
            })
            
    elif exercise_type == "unir":
        pairs = exercise.get("pairs", [])
        left_items = []
        right_items = []
        for pair in pairs:
            left = pair.get("left", {})
            right = pair.get("right", {})
            left_items.append({
                "type": "image",
                "content": left.get("content", ""),
                "searchTerm": left.get("searchTerm", left.get("content", "")).lower(),
                "selectedPictoUrl": "",
                "pictoOptions": [],
                "pictogramRenderMode": "auto"
            })
            right_items.append({
                "type": "image",
                "content": right.get("content", ""),
                "searchTerm": right.get("searchTerm", right.get("content", "")).lower(),
                "selectedPictoUrl": "",
                "pictoOptions": [],
                "pictogramRenderMode": "auto"
            })
        items = left_items + right_items
        
    section["items"] = items

def generate_worksheet(options, profile_content, show_pictograms, settings):
    """
    Orchestrates the Worksheet generation (Single-Prompt or Multi-Agent System).
    """
    start_time = time.time()
    language = options.get("language", "es")
    arasaac_url = settings.get("arasaacApiUrl", "https://api.arasaac.org/api/pictograms")
    
    use_single_prompt = settings.get("useSinglePrompt", False)
    
    adp_time_ms = 0
    ac_time_ms = 0
    retry_count = 0
    
    if use_single_prompt:
        # SINGLE PROMPT MODE
        prompt = build_single_prompt(options, profile_content, language, show_pictograms)
        raw_output = call_llm(prompt, settings)
        
        try:
            worksheet = json.loads(extract_json_object(raw_output))
        except Exception:
            # Try to repair JSON
            worksheet = repair_json_response(raw_output, "Worksheet JSON containing sections list", settings)
            
        # Structure sections items
        for sec in worksheet.get("sections", []):
            normalize_exercise_structure(sec)
    else:
        # MULTI-AGENT SYSTEM (MAS) MODE
        options["requestedExerciseCount"] = get_semantic_exercise_count(options)
        
        # 1. ADP (Planning)
        adp_start = time.time()
        adp_prompt = build_adp_prompt(options, profile_content, language)
        adp_raw = call_llm(adp_prompt, settings)
        
        try:
            blueprint = json.loads(extract_json_object(adp_raw))
        except Exception:
            blueprint = repair_json_response(adp_raw, "ADP Worksheet Blueprint JSON containing exercisePlans list", settings)
        adp_time_ms = int((time.time() - adp_start) * 1000)
        
        exercise_plans = blueprint.get("exercisePlans", [])
        sections = []
        
        # 2. AC + PEA (Construction & Individual Evaluation)
        ac_start = time.time()
        for idx, plan in enumerate(exercise_plans):
            feedback = None
            section_json = None
            
            # Max 3 attempts per exercise section
            for attempt in range(3):
                ac_prompt = build_ac_prompt(plan, language, feedback)
                ac_raw = call_llm(ac_prompt, settings)
                
                try:
                    section_json = json.loads(extract_json_object(ac_raw))
                except Exception:
                    section_json = repair_json_response(ac_raw, f"Exercise JSON for type '{plan['type']}'", settings)
                
                # Run PEA audit
                pea_prompt = build_pea_prompt(plan, json.dumps(section_json), profile_content, language)
                pea_raw = call_llm(pea_prompt, settings)
                
                try:
                    audit_res = json.loads(extract_json_object(pea_raw))
                except Exception:
                    audit_res = {"approved": True, "feedback": ""} # fallback
                    
                if audit_res.get("approved", True):
                    break
                else:
                    feedback = audit_res.get("feedback", "El ejercicio no cumple las pautas.")
                    retry_count += 1
            
            if section_json:
                normalize_exercise_structure(section_json)
                sections.append(section_json)
                
        ac_time_ms = int((time.time() - ac_start) * 1000)
        
        # Assemble preliminary worksheet
        worksheet = {
            "title": blueprint.get("title", "Ficha Adaptada"),
            "pictogramSearchTerm": blueprint.get("pictogramSearchTerm", ""),
            "sections": sections
        }
        
        # 3. GPEA (Global Evaluation)
        # Max 2 global attempts
        for global_attempt in range(2):
            gpea_prompt = build_gpea_prompt(profile_content, json.dumps(worksheet), language)
            gpea_raw = call_llm(gpea_prompt, settings)
            
            try:
                gpea_audit = json.loads(extract_json_object(gpea_raw))
            except Exception:
                gpea_audit = {"approved": True, "rejectedSectionIndexes": []}
                
            if gpea_audit.get("approved", True) or not gpea_audit.get("rejectedSectionIndexes"):
                break
                
            rejected_indexes = gpea_audit.get("rejectedSectionIndexes", [])
            feedback = gpea_audit.get("feedback", "Coherencia global inválida.")
            
            # Reconstruct failed sections
            for rej_idx in rejected_indexes:
                if rej_idx < len(exercise_plans) and rej_idx < len(worksheet["sections"]):
                    plan = exercise_plans[rej_idx]
                    ac_prompt = build_ac_prompt(plan, language, f"GLOBAL REJECTION FEEDBACK: {feedback}")
                    ac_raw = call_llm(ac_prompt, settings)
                    
                    try:
                        section_json = json.loads(extract_json_object(ac_raw))
                    except Exception:
                        section_json = repair_json_response(ac_raw, f"Exercise JSON for type '{plan['type']}'", settings)
                        
                    normalize_exercise_structure(section_json)
                    worksheet["sections"][rej_idx] = section_json
                    retry_count += 1
                    
    # 4. Resolve Pictograms (ARASAAC lookup in Python)
    resolve_pictograms_in_worksheet(worksheet, language, arasaac_url)
    
    total_time_ms = int((time.time() - start_time) * 1000)
    
    # Embed telemetry
    worksheet["telemetry"] = {
        "generationTimeMs": total_time_ms,
        "adpTimeMs": adp_time_ms,
        "acTimeMs": ac_time_ms,
        "rejectionCount": 0,
        "manualEditsCount": 0,
        "pictoOverridesCount": 0,
        "retryCount": retry_count,
        "createdTimestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }
    
    return worksheet
