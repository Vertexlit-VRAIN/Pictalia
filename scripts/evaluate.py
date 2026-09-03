import os
import sys
import json
import time
import csv
import argparse

# Ensure SCRIPT_DIR is in path so we can import generator package modularly
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(SCRIPT_DIR)

from generator.workflow import generate_worksheet
from generator.api import clear_history, get_history
ROOT_DIR = os.path.dirname(SCRIPT_DIR)
DEFAULT_TASKS_PATH = os.path.join(SCRIPT_DIR, 'tasks.json')
DEFAULT_PROFILES_PATH = os.path.join(SCRIPT_DIR, 'student_profiles.json')
DEFAULT_OUTPUT_CSV = os.path.join(SCRIPT_DIR, 'evaluation_results.csv')
DEFAULT_OUTPUT_SUMMARY = os.path.join(SCRIPT_DIR, 'evaluation_summary.json')

def load_json(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

def evaluate_worksheet_quality(worksheet, task_details, profile_id):
    """
    Analyzes the generated worksheet for:
    - Pictogram keyword guidelines (no underscores, no technical suffixes, single-word rules)
    - Teacher exclusions compliance
    - Dynamic element scaling matching the profile support needs
    """
    quality = {
        "valid_structure": True,
        "pictogram_violations": 0,
        "pictogram_violation_details": [],
        "exclusions_complied": True,
        "exclusion_violations": [],
        "total_exercises": 0,
        "exercise_types": [],
        "items_per_exercise": {},
    }
    
    sections = worksheet.get("sections", [])
    quality["total_exercises"] = len(sections)
    
    # 1. Check exclusions (e.g. "no repasar", "sin copiar" in task details)
    details_lower = task_details.lower()
    excluded_types = []
    if "no repasar" in details_lower or "sin repasar" in details_lower or "evitar repasar" in details_lower:
        excluded_types.append("repasar")
    if "no copiar" in details_lower or "sin copiar" in details_lower or "evitar copiar" in details_lower:
        excluded_types.append("copiar")
    if "no unir" in details_lower or "sin unir" in details_lower or "evitar unir" in details_lower:
        excluded_types.append("unir")
    if "no rodear" in details_lower or "sin rodear" in details_lower or "evitar rodear" in details_lower:
        excluded_types.append("rodear")
        
    for sec_idx, section in enumerate(sections):
        sec_type = section.get("exerciseType")
        quality["exercise_types"].append(sec_type)
        
        # Check exclusion violation
        if sec_type in excluded_types:
            quality["exclusions_complied"] = False
            quality["exclusion_violations"].append(f"Section {sec_idx+1} has excluded type '{sec_type}'")
            
        # Count elements (items)
        items = section.get("items", [])
        quality["items_per_exercise"][f"sec_{sec_idx+1}_{sec_type}"] = len(items)
        
        # 2. Check pictogram rules in instruction
        instruction = section.get("instruction", {})
        pictograms = instruction.get("pictograms", [])
        for picto in pictograms:
            term = picto.get("searchTerm", "")
            verify_pictogram_term(term, f"sec_{sec_idx+1}_instruction", quality)
            
        # 3. Check pictogram rules in section items
        for item_idx, item in enumerate(items):
            term = item.get("searchTerm", "")
            if term:
                verify_pictogram_term(term, f"sec_{sec_idx+1}_item_{item_idx+1}", quality)
                
    return quality

def verify_pictogram_term(term, context, quality):
    """
    Checks if a pictogram search term violates the single-word, no-underscore, and no-suffix rules.
    """
    if not term:
        return
        
    term_str = str(term).strip()
    
    # Check underscores, hyphens, and spaces
    if "_" in term_str or "-" in term_str:
        quality["pictogram_violations"] += 1
        quality["pictogram_violation_details"].append(f"[{context}] Contains underscore/hyphen: '{term_str}'")
        
    if " " in term_str:
        quality["pictogram_violations"] += 1
        quality["pictogram_violation_details"].append(f"[{context}] Multi-word search term: '{term_str}'")
        
    # Check suffixes
    suffixes = ["_pictograma", "_picto", "_image", "_dibujo", "pictograma", "image", "dibujo"]
    for suffix in suffixes:
        if term_str.lower().endswith(suffix) and len(term_str) > len(suffix):
            quality["pictogram_violations"] += 1
            quality["pictogram_violation_details"].append(f"[{context}] Contains technical suffix: '{term_str}'")
            break

def main():
    parser = argparse.ArgumentParser(description="TEA-Adaptator Scientific Benchmarking Suite")
    parser.add_argument("--tasks-limit", type=int, default=5, help="Number of tasks to evaluate (1 to 50)")
    parser.add_argument("--provider", type=str, default="gemini", choices=["gemini", "ollama", "both"], help="LLM Provider to test")
    parser.add_argument("--modes", type=str, default="single,multi", help="Comma-separated modes (single,multi)")
    parser.add_argument("--profiles", type=str, default="alto_soporte,medio_soporte,bajo_soporte", help="Comma-separated student profile IDs")
    parser.add_argument("--gemini-model", type=str, default="gemini-1.5-flash", help="Gemini model name")
    parser.add_argument("--ollama-model", type=str, default="gemma2", help="Ollama model name")
    parser.add_argument("--ollama-url", type=str, default="http://localhost:11434", help="Ollama URL")
    parser.add_argument("--output-csv", type=str, default=DEFAULT_OUTPUT_CSV, help="Output CSV path")
    parser.add_argument("--output-summary", type=str, default=DEFAULT_OUTPUT_SUMMARY, help="Output JSON summary path")
    
    args = parser.parse_args()
    
    # Load inputs
    tasks = load_json(DEFAULT_TASKS_PATH)[:args.tasks_limit]
    profiles = load_json(DEFAULT_PROFILES_PATH)
    
    # Filter profiles
    selected_profile_ids = [p.strip() for p in args.profiles.split(',')]
    profiles = [p for p in profiles if p["id"] in selected_profile_ids]
    
    # Setup runs list
    modes_list = [m.strip() for m in args.modes.split(',')]
    
    providers = []
    if args.provider in ["gemini", "both"]:
        providers.append("gemini")
    if args.provider in ["ollama", "both"]:
        providers.append("ollama")
        
    gemini_key = os.environ.get("GEMINI_API_KEY", "")
    if "gemini" in providers and not gemini_key:
        print("WARNING: GEMINI_API_KEY env variable not set. Gemini calls might fail.")
        
    runs = []
    for task in tasks:
        for profile in profiles:
            for provider in providers:
                for mode in modes_list:
                    runs.append({
                        "task": task,
                        "profile": profile,
                        "provider": provider,
                        "mode": mode
                    })
                    
    total_runs = len(runs)
    print(f"============================================================")
    # Correct capitalization
    print(f"Starting Benchmark Evaluation: {total_runs} total runs planned.")
    print(f"Tasks: {len(tasks)} | Profiles: {len(profiles)} | Providers: {providers} | Modes: {modes_list}")
    print(f"============================================================")
    
    results = []
    
    # Write CSV header immediately
    headers = [
        "run_id", "task_id", "topic", "profile_id", "provider", "model", "mode",
        "success", "latency_ms", "retry_count", "adp_time_ms", "ac_time_ms",
        "total_exercises", "exercise_types", "items_per_exercise",
        "pictogram_violations", "exclusions_complied", "error_message"
    ]
    
    with open(args.output_csv, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(headers)
        
    completed = 0
    # Create generated worksheets directory
    worksheets_dir = os.path.join(SCRIPT_DIR, 'generated_worksheets')
    os.makedirs(worksheets_dir, exist_ok=True)

    for idx, run in enumerate(runs):
        task = run["task"]
        profile = run["profile"]
        provider = run["provider"]
        mode = run["mode"]
        
        model = args.gemini_model if provider == "gemini" else args.ollama_model
        
        run_id = idx + 1
        print(f"\n[{run_id}/{total_runs}] Running: Task {task['id']} ({task['topic']}) | Profile: {profile['id']} | Mode: {mode} | LLM: {model}")
        
        # Clear LLM call history for this specific run
        clear_history()
        
        settings = {
            "provider": provider,
            "geminiApiKey": gemini_key,
            "geminiModel": args.gemini_model,
            "ollamaBaseUrl": args.ollama_url,
            "ollamaModel": args.ollama_model,
            "useSinglePrompt": (mode == "single"),
            "arasaacApiUrl": "https://api.arasaac.org/api/pictograms"
        }
        
        options = {
            "topic": task["topic"],
            "goal": task["goal"],
            "extraDetails": task["extraDetails"],
            "language": "es"
        }
        
        start_time = time.time()
        success = True
        error_msg = ""
        worksheet = {}
        
        # Broad try-except wrapping the execution to keep evaluate.py bulletproof
        try:
            worksheet = generate_worksheet(
                options=options,
                profile_content=profile["content"],
                show_pictograms=profile.get("showPictogramInstructions", True),
                settings=settings
            )
        except Exception as e:
            success = False
            error_msg = str(e)
            print(f"ERROR on run {run_id}: {error_msg}")
            
        elapsed_ms = int((time.time() - start_time) * 1000)
            
        # Quality audit
        quality = {
            "pictogram_violations": 0,
            "exclusions_complied": True,
            "total_exercises": 0,
            "exercise_types": [],
            "items_per_exercise": {},
        }
        
        try:
            if success:
                quality = evaluate_worksheet_quality(worksheet, task["extraDetails"], profile["id"])
        except Exception as e:
            print(f"WARNING: Quality audit failed on run {run_id}: {e}")
            quality["exclusions_complied"] = False
            
        telemetry = worksheet.get("telemetry", {})
        retry_count = telemetry.get("retryCount", 0)
        adp_time = telemetry.get("adpTimeMs", 0)
        ac_time = telemetry.get("acTimeMs", 0)
        
        row = [
            run_id,
            task["id"],
            task["topic"],
            profile["id"],
            provider,
            model,
            mode,
            "YES" if success else "NO",
            elapsed_ms,
            retry_count,
            adp_time,
            ac_time,
            quality["total_exercises"],
            ",".join(quality["exercise_types"]),
            json.dumps(quality["items_per_exercise"]),
            quality["pictogram_violations"],
            "YES" if quality["exclusions_complied"] else "NO",
            error_msg
        ]
        
        # Append row to CSV
        try:
            with open(args.output_csv, 'a', newline='', encoding='utf-8') as csvfile:
                writer = csv.writer(csvfile)
                writer.writerow(row)
        except Exception as e:
            print(f"CRITICAL: Failed to write to CSV: {e}")
            
        # Get accumulated LLM call history for this run
        calls_log = get_history()
        
        # Prepare run trace payload with the final worksheet section
        trace_payload = {
            "run_info": {
                "run_id": run_id,
                "task_id": task["id"],
                "topic": task["topic"],
                "profile_id": profile["id"],
                "provider": provider,
                "model": model,
                "mode": mode,
                "success": success,
                "error_message": error_msg,
                "elapsed_ms": elapsed_ms
            },
            "llm_calls": calls_log,
            "final_worksheet": worksheet
        }
        
        # Save trace file to disk
        try:
            model_safe = model.replace(':', '_').replace('/', '_').replace('\\', '_')
            trace_filename = f"run_{run_id}_task_{task['id']}_{profile['id']}_{provider}_{model_safe}_{mode}.json"
            trace_filepath = os.path.join(worksheets_dir, trace_filename)
            with open(trace_filepath, 'w', encoding='utf-8') as f:
                json.dump(trace_payload, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"WARNING: Failed to save JSON trace file: {e}")
            
        results.append({
            "run_id": run_id,
            "task_id": task["id"],
            "topic": task["topic"],
            "profile_id": profile["id"],
            "provider": provider,
            "model": model,
            "mode": mode,
            "success": success,
            "latency_ms": elapsed_ms,
            "retry_count": retry_count,
            "adp_time_ms": adp_time,
            "ac_time_ms": ac_time,
            "total_exercises": quality["total_exercises"],
            "exercise_types": quality["exercise_types"],
            "items_per_exercise": quality["items_per_exercise"],
            "pictogram_violations": quality["pictogram_violations"],
            "exclusions_complied": quality["exclusions_complied"],
            "error_message": error_msg,
            "trace_filepath": trace_filepath if 'trace_filepath' in locals() else ""
        })
        
        completed += 1
        print(f"Finished: Success={success} | Latency={elapsed_ms}ms | Retries={retry_count} | Picto Violations={quality['pictogram_violations']} | Exclusions Complied={quality['exclusions_complied']}")
    # Compile Summary
    summary = {}
    for r in results:
        key = f"{r['provider']}:{r['model']} ({r['mode']})"
        if key not in summary:
            summary[key] = {
                "runs": 0,
                "successes": 0,
                "total_latency_ms": 0,
                "total_retries": 0,
                "picto_violations": 0,
                "exclusions_violations_count": 0,
            }
        summary[key]["runs"] += 1
        if r["success"]:
            summary[key]["successes"] += 1
        summary[key]["total_latency_ms"] += r["latency_ms"]
        summary[key]["total_retries"] += r["retry_count"]
        summary[key]["picto_violations"] += r["pictogram_violations"]
        if not r["exclusions_complied"]:
            summary[key]["exclusions_violations_count"] += 1
            
    summary_report = []
    for key, stats in summary.items():
        runs = stats["runs"]
        success_rate = (stats["successes"] / runs) * 100
        avg_latency = stats["total_latency_ms"] / runs
        avg_retries = stats["total_retries"] / runs
        total_picto_violations = stats["picto_violations"]
        excl_compliance_rate = ((runs - stats["exclusions_violations_count"]) / runs) * 100
        
        summary_report.append({
            "configuration": key,
            "runs": runs,
            "success_rate": f"{success_rate:.1f}%",
            "avg_latency_ms": f"{avg_latency:.0f}ms",
            "avg_retries": f"{avg_retries:.1f}",
            "total_picto_violations": total_picto_violations,
            "exclusion_compliance_rate": f"{excl_compliance_rate:.1f}%"
        })
        
    with open(args.output_summary, 'w', encoding='utf-8') as f:
        json.dump({
            "args": vars(args),
            "summary": summary_report,
            "detailed_runs": results
        }, f, indent=2, ensure_ascii=False)
        
    print("\n" + "="*60)
    print("BENCHMARK SUMMARY REPORT")
    print("="*60)
    print(f"{'Configuration':<35} | {'Runs':<4} | {'Success':<7} | {'Avg Lat':<8} | {'Retries':<7} | {'Picto Viol':<10} | {'Excl Comp':<9}")
    print("-"*100)
    for rep in summary_report:
        print(f"{rep['configuration']:<35} | {rep['runs']:<4} | {rep['success_rate']:<7} | {rep['avg_latency_ms']:<8} | {rep['avg_retries']:<7} | {rep['total_picto_violations']:<10} | {rep['exclusion_compliance_rate']:<9}")
    print("="*60)
    print(f"Detailed CSV logged to: {args.output_csv}")
    print(f"Summary JSON logged to: {args.output_summary}")

if __name__ == "__main__":
    main()
