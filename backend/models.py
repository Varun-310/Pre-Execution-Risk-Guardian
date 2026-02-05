from pydantic import BaseModel, Field
from typing import List, Optional

class FileMetadata(BaseModel):
    name: str = Field(..., description="File name")
    type: str = Field(..., description="MIME type or extension")
    size: Optional[int] = Field(default=None, description="File size in bytes")

class MessageContext(BaseModel):
    """Channel-agnostic message context for analysis."""
    channel: str = Field(..., description="Message channel: 'EMAIL' or 'CHAT'")
    action: str = Field(..., description="User action: 'OPEN_LINK', 'OPEN_FILE', or 'FORWARD'")
    sender: str = Field(..., description="Sender identifier (email or username)")
    subject: Optional[str] = Field(default=None, description="Message subject (for emails)")
    body: str = Field(..., description="Message body content")
    links: List[str] = Field(default=[], description="URLs found in the message")
    files: List[FileMetadata] = Field(default=[], description="Attached files metadata")
    metadata: Optional[dict] = Field(default={}, description="Additional context")

class RiskAssessment(BaseModel):
    """Gemini's structured risk decision."""
    decision: str = Field(..., description="ALLOW, WARN, or BLOCK")
    risk_score: int = Field(..., description="0-100 integer score")
    confidence: float = Field(..., description="0.0-1.0 confidence score")
    risk_factors: List[str] = Field(default=[], description="List of identified risk factors")
    reasoning: str = Field(..., description="Explanation of the decision")
    suggestions: str = Field(..., description="Mitigation suggestions")
