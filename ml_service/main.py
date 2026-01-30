from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import re

app = FastAPI()

class SMSRequest(BaseModel):
    text: str
    sender: str

class Transaction(BaseModel):
    upi_id: str
    amount: float
    merchant_name: str
    message: str | None = None

# --- Fraud Indicators ---
URGENCY_PATTERNS = [
    r"urgent", r"immediately", r"24 hours", r"block", r"suspend", 
    r"expire", r"kyc", r"pan card", r"otp", r"limited time"
]

AUTHORITY_PATTERNS = [
    r"rbi", r"bank manager", r"income tax", r"police", r"cyber cell", 
    r"customer care", r"support"
]

SCAM_LINKS = [
    r"bit\.ly", r"tinyurl", r"ngrok", r"apk"
]

def analyze_linguistics(text: str):
    text_lower = text.lower()
    
    urgency_score = sum(1 for p in URGENCY_PATTERNS if re.search(p, text_lower))
    authority_score = sum(1 for p in AUTHORITY_PATTERNS if re.search(p, text_lower))
    link_score = sum(1 for p in SCAM_LINKS if re.search(p, text_lower))
    
    # Calculate Risk Score (0.0 to 1.0)
    risk = 0.0
    risk += urgency_score * 0.3
    risk += authority_score * 0.25
    risk += link_score * 0.4
    
    # Cap at 0.99
    final_risk = min(risk, 0.99)
    
    # Detect specific triggers
    triggers = []
    if urgency_score > 0: triggers.append("Urgency Tactics")
    if authority_score > 0: triggers.append("Authority Impersonation")
    if link_score > 0: triggers.append("Suspicious Link")
    
    return final_risk, triggers

@app.post("/analyze/sms")
def analyze_sms(sms: SMSRequest):
    risk_score, triggers = analyze_linguistics(sms.text)
    
    # Additional sender checks (Mock)
    if len(sms.sender) == 10 and sms.sender.isdigit():
        risk_score += 0.2 # Personal number sending alerts is suspicious
        triggers.append("Sender Identity Mismatch")
        
    return {
        "risk_score": float(f"{risk_score:.2f}"),
        "triggers": triggers,
        "verdict": "FRAUD" if risk_score > 0.6 else "SAFE"
    }

@app.post("/predict")
def predict_fraud(transaction: Transaction):
    # Hybrid Model Logic: Combine NLP + Velocity rules
    nlp_risk, triggers = analyze_linguistics(transaction.message or "")
    
    # Mock Velocity Check (Randomized for demo, but normally would check DB)
    velocity_risk = 0.0
    if transaction.amount > 10000:
        velocity_risk = 0.4
        
    total_risk = (nlp_risk * 0.7) + (velocity_risk * 0.3)
    
    return {
        "risk_score": float(f"{total_risk:.2f}"),
        "factors": {
            "linguistic": triggers,
            "velocity": "HIGH" if velocity_risk > 0 else "NORMAL"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
