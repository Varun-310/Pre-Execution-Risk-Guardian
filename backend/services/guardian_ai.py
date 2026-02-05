import os
import json
import re
from google import genai
from models import RiskAssessment, MessageContext
from dotenv import load_dotenv
from concurrent.futures import ThreadPoolExecutor, as_completed
import time

load_dotenv()

# Multiple API keys (comma-separated in .env)
API_KEYS = [key.strip() for key in os.getenv("GEMINI_API_KEY", "").split(",") if key.strip()]

# Models to try (in order of preference)
MODELS = ["gemini-3-flash-preview", "gemma-3-27b-it"]

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

def try_single_request(client, model: str, prompt: str) -> RiskAssessment:
    """Try a single API request with specific client and model."""
    response = client.models.generate_content(
        model=model,
        contents=prompt,
        config={
            "temperature": 0.1,
            "max_output_tokens": 300,
        }
    )
    result_json = extract_json(response.text)
    return RiskAssessment(**result_json)

def analyze_message_risk(context: MessageContext) -> RiskAssessment:
    """
    Analyze incoming message with multi-API and model failover.
    Tries all combinations in parallel for speed.
    """
    if not clients:
        return RiskAssessment(
            decision="WARN",
            risk_score=50,
            confidence=0.0,
            risk_factors=["Missing API Key"],
            reasoning="No Gemini API Key configured.",
            suggestions="Add GEMINI_API_KEY to .env (comma-separated for multiple)"
        )

    # Build the prompt
    links_str = "\n".join([f"  - {link}" for link in context.links]) if context.links else "  None"
    files_str = "\n".join([f"  - {f.name} ({f.type})" for f in context.files]) if context.files else "  None"

    prompt = f"""Analyze this message for phishing, malware, or scam threats.

SENDER: {context.sender}
SUBJECT: {context.subject or "N/A"}
BODY: {context.body}
LINKS: {links_str}
FILES: {files_str}

THREAT INDICATORS:
1. Fake domains (bankofamerica-secure.net, paypa1.com with number 1)
2. Urgency/fear tactics
3. Suspicious files (.exe, .bat)
4. Credential requests

DECISION:
- BLOCK (80-100): Clear phishing/scam
- WARN (40-70): Suspicious but possibly legitimate
- ALLOW (0-20): Safe message

JSON only:
{{"decision": "ALLOW", "risk_score": 0, "confidence": 0.9, "risk_factors": [], "reasoning": "Safe", "suggestions": "None"}}"""

    # Try all API+model combinations in parallel
    start = time.time()
    
    with ThreadPoolExecutor(max_workers=len(clients) * len(MODELS)) as executor:
        futures = {}
        
        # Submit all combinations
        for client_idx, client in enumerate(clients):
            for model in MODELS:
                future = executor.submit(try_single_request, client, model, prompt)
                futures[future] = (client_idx, model)
        
        # Return first successful result
        for future in as_completed(futures, timeout=10):
            client_idx, model = futures[future]
            try:
                result = future.result()
                elapsed = time.time() - start
                print(f"[Guardian AI] ✓ {model} (API {client_idx+1}) in {elapsed:.2f}s: {result.decision}")
                return result
            except Exception as e:
                print(f"[Guardian AI] ✗ {model} (API {client_idx+1}): {str(e)[:50]}")
                continue
    
    # All failed
    elapsed = time.time() - start
    print(f"[Guardian AI] All APIs failed in {elapsed:.2f}s")
    return RiskAssessment(
        decision="WARN",
        risk_score=50,
        confidence=0.0,
        risk_factors=["API Error"],
        reasoning="All API attempts failed. Please try again.",
        suggestions="Proceed with caution."
    )
