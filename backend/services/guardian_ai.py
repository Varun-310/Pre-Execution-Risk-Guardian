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

# Models to try in order of preference
MODELS = ["gemini-3-flash-preview", "gemma-3-27b-it"]

# Initialize clients for each API key
clients = [genai.Client(api_key=key) for key in API_KEYS] if API_KEYS else []

def extract_json(text: str) -> dict:
    """Extract JSON from response - handles various formats."""
    if not text or not text.strip():
        raise ValueError("Empty response")
    
    text = text.strip()
    
    # Direct JSON parse
    try:
        return json.loads(text)
    except:
        pass
    
    # Find JSON in markdown code blocks
    patterns = [
        r'```json\s*(\{[\s\S]*?\})\s*```',
        r'```\s*(\{[\s\S]*?\})\s*```',
        r'(\{[\s\S]*?"decision"[\s\S]*?\})',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            try:
                return json.loads(match.group(1))
            except:
                continue
    
    # Last resort: find any JSON-like structure
    start = text.find('{')
    end = text.rfind('}')
    if start != -1 and end > start:
        try:
            return json.loads(text[start:end+1])
        except:
            pass
    
    raise ValueError(f"No valid JSON found in: {text[:100]}...")

def try_request(client, model: str, prompt: str, client_idx: int) -> RiskAssessment:
    """Try a single API request."""
    start = time.time()
    response = client.models.generate_content(
        model=model,
        contents=prompt,
        config={"temperature": 0.1, "max_output_tokens": 200}
    )
    
    raw_text = response.text
    result_json = extract_json(raw_text)
    
    # Validate required fields
    if "decision" not in result_json:
        raise ValueError("Missing 'decision' field")
    
    elapsed = time.time() - start
    assessment = RiskAssessment(**result_json)
    print(f"[Guardian AI] ✓ {model} (API {client_idx+1}) in {elapsed:.2f}s: {assessment.decision}")
    return assessment

def analyze_message_risk(context: MessageContext) -> RiskAssessment:
    """
    Analyze message with sequential model fallback across all API keys.
    """
    if not clients:
        return RiskAssessment(
            decision="WARN", risk_score=50, confidence=0.0,
            risk_factors=["Missing API Key"],
            reasoning="No Gemini API Key configured.",
            suggestions="Add GEMINI_API_KEY to .env"
        )

    # Build prompt - clearer instructions for JSON output
    links_str = ", ".join(context.links) if context.links else "None"
    files_str = ", ".join([f.name for f in context.files]) if context.files else "None"

    prompt = f"""Analyze for phishing/scams. Return ONLY valid JSON, no other text:
{{"decision":"ALLOW/WARN/BLOCK","risk_score":0-100,"confidence":0.0-1.0,"risk_factors":["list"],"reasoning":"brief","suggestions":"action"}}

From: {context.sender} | Subject: {context.subject or "N/A"}
Content: {context.body[:300]}
Links: {links_str} | Files: {files_str}

BLOCK=phishing/fake domains/scams, WARN=suspicious, ALLOW=safe"""

    # Try each model with all API keys before moving to next model
    for model in MODELS:
        print(f"[Guardian AI] Trying {model}...")
        for idx, client in enumerate(clients):
            try:
                return try_request(client, model, prompt, idx)
            except Exception as e:
                err_msg = str(e)[:50].replace('\n', ' ')
                print(f"[Guardian AI] ✗ {model} (API {idx+1}): {err_msg}")
                continue
        print(f"[Guardian AI] {model} failed on all APIs, trying next model...")

    # All failed
    print("[Guardian AI] All models and APIs failed!")
    return RiskAssessment(
        decision="WARN", risk_score=50, confidence=0.0,
        risk_factors=["API Error"],
        reasoning="All API attempts failed.",
        suggestions="Proceed with caution."
    )
