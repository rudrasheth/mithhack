# UPI Fraud Detection Platform - System Architecture

## 1. High-Level Architecture

The system is composed of three main micro-components:

1.  **Frontend (Edge Layer)**
    *   **Tech**: React 19, Tailwind CSS, Framer Motion, TensorFLow.js / ONNX.
    *   **Role**: UI presentation, "Risk Orb" visualization, proactive alerts.
    *   **Edge AI**: Runs quantized models for immediate offline checks.

2.  **Backend (Orchestration Layer)**
    *   **Tech**: Node.js (Express).
    *   **Role**: API Gateway, User Management, Transaction Routing, Notifications (WhatsApp/SMS).
    *   **Data Stores**:
        *   **MongoDB**: Persistent storage for transaction logs, user profiles, reporting.
        *   **Redis**: "Hot-List" cache for blocked UPI IDs and rate limiting.

3.  **ML Engine (Intelligence Layer)**
    *   **Tech**: Python (FastAPI).
    *   **Models**:
        *   **XGBoost**: Velocity & volumetric anomaly detection.
        *   **Bi-LSTM**: Sequential pattern recognition.
        *   **mBERT**: NLP Service for Hindi/English scam text analysis.
    *   **Role**: Real-time inference API called by the Backend.

## 2. Directory Structure

```
/mthi-hack
  /frontend      # React Application
  /backend       # Node.js Express Application
  /ml_service    # Python FastAPI Application
```

## 3. Key Design Concepts

*   **Risk Orb**: A dynamic UI element that shifts state (Smooth Blue -> Glitch/Jitter) based on risk scores.
*   **Trust Graph**: Weighted scoring system based on reporter credibility.
*   **Predictive Feed**: "Agentic" notifications instead of passive lists.
