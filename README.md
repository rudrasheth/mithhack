# UPI Fraud Detection System

## Project Structure
- **frontend/**: React 19 Application (The User Interface & Edge Risk Engine)
- **backend/**: Node.js Express API (Orchestrator & Database)
- **ml_service/**: Python FastAPI (Heavy ML Inference: XGBoost + mBERT)

## Setup Instructions

### 1. Prerequisites
- Node.js (v18+)
- Python (v3.9+)

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

### 3. Backend
```bash
cd backend
npm install
# Create a .env file with PORT=5000
npm start
```

### 4. ML Service
```bash
cd ml_service
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
