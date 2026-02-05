import os
import json
import re
from google import genai
from models import RiskAssessment, MessageContext
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")

# Initialize the new genai client
client = genai.Client(api_key=API_KEY) if API_KEY else None

def extract_json(text: str) -> dict:
    """Extract JSON from response that might have markdown formatting."""
    # Try direct parse first
    try:
        return json.loads(text)
    except:
        pass
    
    # Try to find JSON in markdown code blocks
    json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text, re.DOTALL)
    if json_match:
        return json.loads(json_match.group(1))
    
    # Try to find raw JSON object
    json_match = re.search(r'\{[^{}]*"decision"[^{}]*\}', text, re.DOTALL)
    if json_match:
        return json.loads(json_match.group(0))
    
    raise ValueError("No valid JSON found in response")

def analyze_message_risk(context: MessageContext) -> RiskAssessment:
    """
    Analyze incoming message for security threats before user interaction.
    """
    if not client:
        return RiskAssessment(
            decision="WARN",
            risk_score=50,
            confidence=0.0,
            risk_factors=["Missing API Key"],
            reasoning="Gemini API Key is missing.",
            suggestions="Please add GEMINI_API_KEY to backend/.env"
        )

    # Format links and files for the prompt
    links_str = "\n".join([f"  - {link}" for link in context.links]) if context.links else "  None"
    files_str = "\n".join([f"  - {f.name} ({f.type})" for f in context.files]) if context.files else "  None"

    prompt = f"""Analyze this message for phishing, malware, or scam threats.

SENDER: {context.sender}
SUBJECT: {context.subject or "N/A"}
BODY: {context.body}
LINKS: {links_str}
FILES: {files_str}

THREAT INDICATORS TO CHECK:
1. Fake domains (e.g., "bankofamerica-secure.net" instead of "bankofamerica.com", "paypa1" with number 1)
2. Urgency/fear tactics ("account suspended", "verify immediately")
3. Suspicious file types (.exe, .bat, .scr, .zip from unknown sender)
4. Request for credentials or personal info

DECISION:
- BLOCK (risk 80-100): Clear phishing/scam - fake domain, credential request, known scam pattern
- WARN (risk 40-70): Suspicious elements but possibly legitimate
- ALLOW (risk 0-20): Normal safe message

Respond with ONLY this JSON format, no other text:
{{"decision": "ALLOW", "risk_score": 0, "confidence": 0.9, "risk_factors": [], "reasoning": "Safe message", "suggestions": "None needed"}}"""

    try:
        response = client.models.generate_content(
            model="gemma-3-27b-it",
            contents=prompt,
            config={
                "temperature": 0.1,
                "max_output_tokens": 300,
            }
        )
        
        raw_text = response.text
        print(f"[Guardian AI] Raw: {raw_text[:100]}...")
        
        result_json = extract_json(raw_text)
        assessment = RiskAssessment(**result_json)
        
        print(f"[Guardian AI] ✓ Decision: {assessment.decision}, Score: {assessment.risk_score}")
        
        return assessment
        
    except Exception as e:
        print(f"[Guardian AI] ERROR: {str(e)}")
        return RiskAssessment(
            decision="WARN",
            risk_score=50,
            confidence=0.0,
            risk_factors=["Analysis Error"],
            reasoning=f"Could not complete analysis: {str(e)[:80]}",
            suggestions="Proceed with caution."
        )
