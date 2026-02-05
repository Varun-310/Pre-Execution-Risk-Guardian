import os
import json
import re
from google import genai
from models import RiskAssessment, MessageContext
from dotenv import load_dotenv
import time

load_dotenv()

# Multiple API keys (comma-separated in .env)
API_KEYS = [key.strip() for key in os.getenv("GEMINI_API_KEY", "").split(",") if key.strip()]

# Models to try in order (primary first, then fallback)
PRIMARY_MODEL = "gemini-3-flash-preview"
FALLBACK_MODEL = "gemma-3-27b-it"

# Initialize clients for each API key
clients = [genai.Client(api_key=key) for key in API_KEYS] if API_KEYS else []

def extract_json(text: str) -> dict:
    """Extract JSON from response that might have markdown formatting."""
    try:
        return json.loads(text)
    except:
        pass
    
    json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text, re.DOTALL)
    if json_match:
        return json.loads(json_match.group(1))
    
    json_match = re.search(r'\{[^{}]*"decision"[^{}]*\}', text, re.DOTALL)
    if json_match:
        return json.loads(json_match.group(0))
    
    raise ValueError("No valid JSON found")

def try_request(client, model: str, prompt: str, client_idx: int) -> RiskAssessment:
    """Try a single API request."""
    start = time.time()
    response = client.models.generate_content(
        model=model,
        contents=prompt,
        config={"temperature": 0.1, "max_output_tokens": 300}
    )
    result_json = extract_json(response.text)
    elapsed = time.time() - start
    print(f"[Guardian AI] ✓ {model} (API {client_idx+1}) in {elapsed:.2f}s")
    return RiskAssessment(**result_json)

def analyze_message_risk(context: MessageContext) -> RiskAssessment:
    """
    Analyze incoming message with sequential model fallback:
    1. Try gemini-3-flash-preview with all API keys
    2. If all fail, try gemma-3-27b-it with all API keys
    """
    if not clients:
        return RiskAssessment(
            decision="WARN", risk_score=50, confidence=0.0,
            risk_factors=["Missing API Key"],
            reasoning="No Gemini API Key configured.",
            suggestions="Add GEMINI_API_KEY to .env"
        )

    # Build prompt
    links_str = "\n".join([f"  - {link}" for link in context.links]) if context.links else "  None"
    files_str = "\n".join([f"  - {f.name} ({f.type})" for f in context.files]) if context.files else "  None"

    prompt = f"""Analyze this message for phishing, malware, or scam threats.

SENDER: {context.sender}
SUBJECT: {context.subject or "N/A"}
BODY: {context.body}
LINKS: {links_str}
FILES: {files_str}

DECISION:
- BLOCK (80-100): Clear phishing/scam - fake domain, credential request
- WARN (40-70): Suspicious but possibly legitimate  
- ALLOW (0-20): Safe message

JSON only:
{{"decision": "ALLOW", "risk_score": 0, "confidence": 0.9, "risk_factors": [], "reasoning": "Safe", "suggestions": "None"}}"""

    # Step 1: Try PRIMARY model (gemini-3-flash-preview) with all API keys
    print(f"[Guardian AI] Trying {PRIMARY_MODEL}...")
    for idx, client in enumerate(clients):
        try:
            return try_request(client, PRIMARY_MODEL, prompt, idx)
        except Exception as e:
            print(f"[Guardian AI] ✗ {PRIMARY_MODEL} (API {idx+1}): {str(e)[:40]}")
            continue

    # Step 2: PRIMARY failed with all APIs - Try FALLBACK model (gemma-3-27b-it)
    print(f"[Guardian AI] Falling back to {FALLBACK_MODEL}...")
    for idx, client in enumerate(clients):
        try:
            return try_request(client, FALLBACK_MODEL, prompt, idx)
        except Exception as e:
            print(f"[Guardian AI] ✗ {FALLBACK_MODEL} (API {idx+1}): {str(e)[:40]}")
            continue

    # All failed
    print("[Guardian AI] All models and APIs failed!")
    return RiskAssessment(
        decision="WARN", risk_score=50, confidence=0.0,
        risk_factors=["API Error"],
        reasoning="All API attempts failed.",
        suggestions="Proceed with caution."
    )
