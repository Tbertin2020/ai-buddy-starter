import json

log_path = r"C:\Users\hp\.gemini\antigravity-ide\brain\4f47d85e-e173-4578-b800-d2a70a0c8e2e\.system_generated\logs\transcript.jsonl"

with open(log_path, 'r', encoding='utf-8') as f:
    for i, line in enumerate(f):
        if i in [78, 79, 80]:
            print(f"--- LINE {i} ---")
            data = json.loads(line)
            # Pretty print the json line
            print(json.dumps(data, indent=2))
