import re
import json
import requests
from concurrent.futures import ThreadPoolExecutor

def extract_json_object(raw_text):
    """
    Cleans prompt response wrappers and returns a raw JSON substring.
    """
    trimmed = raw_text.strip()
    if trimmed.startswith('{') and trimmed.endswith('}'):
        return trimmed

    fenced_match = re.search(r"```(?:json)?\s*([\s\S]*?)```", trimmed, re.IGNORECASE)
    if fenced_match:
        return fenced_match.group(1).strip()

    first_brace = trimmed.find('{')
    last_brace = trimmed.rfind('}')
    if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
        return trimmed[first_brace:last_brace + 1]

    return trimmed

LLM_CALL_HISTORY = []

def clear_history():
    global LLM_CALL_HISTORY
    LLM_CALL_HISTORY.clear()

def get_history():
    return list(LLM_CALL_HISTORY)

def call_llm(prompt_text, settings):
    """
    Performs the HTTP post request to Gemini API or local Ollama and records history.
    """
    provider = settings.get("provider", "gemini")
    
    try:
        if provider == "ollama":
            url = settings.get("ollamaBaseUrl", "http://localhost:11434").rstrip('/') + "/api/chat"
            model = settings.get("ollamaModel", "gemma2")
            body = {
                "model": model,
                "stream": False,
                "format": "json",
                "messages": [{"role": "user", "content": prompt_text}]
            }
            resp = requests.post(url, json=body, timeout=120)
            if resp.status_code != 200:
                raise Exception(f"Ollama returned error ({resp.status_code}): {resp.text}")
            payload = resp.json()
            response_text = payload.get("message", {}).get("content", "").strip()
            
        else:  # Gemini
            api_key = settings.get("geminiApiKey", "")
            model = settings.get("geminiModel", "gemini-1.5-flash")
            if not api_key:
                raise Exception("Gemini API key is missing. Set GEMINI_API_KEY environment variable.")
                
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
            body = {
                "contents": [{"parts": [{"text": prompt_text}]}],
                "generationConfig": {
                    "responseMimeType": "application/json",
                    "temperature": 0.4
                }
            }
            resp = requests.post(url, json=body, timeout=120)
            if resp.status_code != 200:
                raise Exception(f"Gemini returned error ({resp.status_code}): {resp.text}")
            payload = resp.json()
            
            candidates = payload.get("candidates", [])
            if not candidates:
                raise Exception("Gemini returned empty candidates block.")
                
            parts = candidates[0].get("content", {}).get("parts", [])
            response_text = "".join([part.get("text", "") for part in parts]).strip()

        LLM_CALL_HISTORY.append({
            "prompt": prompt_text,
            "response": response_text,
            "provider": provider,
            "status": "success"
        })
        return response_text

    except Exception as e:
        LLM_CALL_HISTORY.append({
            "prompt": prompt_text,
            "response": str(e),
            "provider": provider,
            "status": "failed"
        })
        raise e

def repair_json_response(bad_json, target_schema_desc, settings):
    """
    Calls LLM to self-heal a syntax-error-ridden JSON payload.
    """
    prompt = f"""You are a JSON repair assistant.
The following text was intended to be a valid JSON matching the schema/instructions below, but it is corrupted or contains syntax errors.
Fix the JSON so it is 100% syntactically valid and strictly adheres to the requested schema. Return ONLY the valid JSON block.

TARGET SCHEMA/EXPECTATIONS:
{target_schema_desc}

CORRUPTED TEXT:
{bad_json}

JSON ONLY. Respect Markdown JSON formatting."""
    repaired_text = call_llm(prompt, settings)
    return json.loads(extract_json_object(repaired_text))

def search_official_arasaac(search_term, api_url, lang='es'):
    """
    Search pictogram URL from official ARASAAC API.
    """
    lang_map = {
        'val': 'ca',
        'valenciano': 'ca',
        'ca': 'ca',
        'catalan': 'ca',
        'en': 'en',
        'english': 'en',
        'ing': 'en',
        'inglés': 'en'
    }
    api_lang = lang_map.get(lang.lower().strip(), 'es')
    
    modified_term = search_term.strip()
    if modified_term.upper().startswith('COLOR '):
        modified_term = modified_term[6:].strip()
        
    def run_search(term, current_lang):
        try:
            url = f"{api_url.rstrip('/')}/{current_lang}/bestsearch/{requests.utils.quote(term)}"
            resp = requests.get(url, timeout=15)
            if resp.status_code == 200:
                payload = resp.json()
                results = []
                for picto in payload:
                    picto_id = picto.get("_id")
                    keywords = [kw.get("keyword") for kw in picto.get("keywords", []) if kw.get("keyword")]
                    results.append({
                        "id": str(picto_id),
                        "url": f"https://static.arasaac.org/pictograms/{picto_id}/{picto_id}_500.png",
                        "keywords": keywords
                    })
                return results
        except Exception:
            pass
        return []

    # 1. Search in requested language
    results = run_search(modified_term, api_lang)
    if results:
        return results
        
    # Split fallback
    words = [w for w in modified_term.split() if w]
    if len(words) > 1:
        for word in words:
            fallback = run_search(word, api_lang)
            if fallback:
                return fallback
                
    # 2. Spanish fallback
    if api_lang != 'es':
        results = run_search(modified_term, 'es')
        if results:
            return results
        if len(words) > 1:
            for word in words:
                fallback = run_search(word, 'es')
                if fallback:
                    return fallback
                    
    return []

def resolve_pictograms_in_worksheet(worksheet, language, arasaac_url):
    """
    Scans worksheet for pictogram search terms and fetches their URLs concurrently.
    """
    search_queries = []
    
    # Global cover picto
    cover_term = worksheet.get("pictogramSearchTerm", "")
    if cover_term:
        search_queries.append({"type": "cover", "term": cover_term, "target": worksheet})
        
    sections = worksheet.get("sections", [])
    for sec_idx, section in enumerate(sections):
        # Instruction pictograms
        instruction = section.get("instruction", {})
        pictograms = instruction.get("pictograms", [])
        for picto_idx, picto in enumerate(pictograms):
            term = picto.get("searchTerm", picto.get("content", ""))
            if term:
                search_queries.append({"type": "instruction", "term": term, "target": picto})
                
        # Exercise items pictograms
        exercise_type = section.get("exerciseType")
        exercise = section.get("exercise", {})
        
        if exercise_type == "rodear":
            options = exercise.get("options", [])
            for opt_idx, opt in enumerate(options):
                term = opt.get("searchTerm", opt.get("content", ""))
                if term:
                    search_queries.append({"type": "item", "term": term, "target": opt})
                    
        elif exercise_type == "unir":
            pairs = exercise.get("pairs", [])
            for pair_idx, pair in enumerate(pairs):
                left = pair.get("left", {})
                right = pair.get("right", {})
                
                left_term = left.get("searchTerm", left.get("content", ""))
                if left_term:
                    search_queries.append({"type": "item", "term": left_term, "target": left})
                    
                right_term = right.get("searchTerm", right.get("content", ""))
                if right_term:
                    search_queries.append({"type": "item", "term": right_term, "target": right})

    # Execute searches concurrently
    def fetch_url(query):
        res = search_official_arasaac(query["term"], arasaac_url, language)
        url = res[0]["url"] if res else ""
        options = [r["url"] for r in res]
        return query, url, options

    with ThreadPoolExecutor(max_workers=10) as executor:
        completed = list(executor.map(fetch_url, search_queries))
        
    for query, url, options in completed:
        target = query["target"]
        if query["type"] == "cover":
            target["selectedPictoUrl"] = url
            target["pictoOptions"] = options
        elif query["type"] == "instruction":
            target["url"] = url
        elif query["type"] == "item":
            target["selectedPictoUrl"] = url
            target["pictoOptions"] = options
