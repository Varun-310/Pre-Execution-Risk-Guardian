from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models import MessageContext, RiskAssessment
from services import guardian_ai

app = FastAPI(title="Pre-Execution Message Safety Guardian API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Message Safety Guardian Active"}

@app.post("/api/analyze-message", response_model=RiskAssessment)
def analyze_message(context: MessageContext):
    """
    Analyze incoming message for security threats before user interaction.
    Returns ALLOW, WARN, or BLOCK decision with reasoning.
    """
    try:
        result = guardian_ai.analyze_message_risk(context)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
