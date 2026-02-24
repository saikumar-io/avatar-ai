# 🧠 Multilingual AI Digital Human with Financial Intelligence

A real-time 3D AI avatar that understands text or speech, responds in multiple Indian languages, and provides dynamic loan analytics with animated financial dashboards.

---

## 🚀 Tech Stack

- 🧠 Groq (LLaMA 3.3) — AI Brain  
- 🗣 Sarvam AI — Multilingual TTS & STT  
- 🔊 ElevenLabs — High-quality English TTS  
- 👄 Rhubarb Lip Sync — Viseme generation  
- 🎭 React + Three.js — 3D Avatar rendering  
- 📊 Recharts — Financial visualization  
- ⚡ Express (Node.js) — Audio + LipSync engine  
- 🐍 Flask (Python) — AI + Loan Intelligence backend  

---

## 💼 Financial Intelligence Features

- Multi-loan simulation:
  - Home
  - Car
  - Personal
  - Education
  - Business
- Loan amount parsing:
  - `500000`
  - `5 lakh`
  - `1.5 crore`
  - `200 thousand`
- EMI & Total Interest comparison
- Affordability Score
- Cash Flow Stability Indicator
- Risk Adjusted Flexibility Meter
- Animated bar & line charts
- Visualization synced with avatar speech
- Automatic chart reset on new conversation

---

## 🎥 How It Works

1. User sends text or voice input  
2. Python backend processes message via Groq  
3. Loan engine computes EMI, interest & indicators  
4. Response sent to frontend  
5. TTS generated using Sarvam or ElevenLabs  
6. Node backend runs Rhubarb for lip-sync  
7. Avatar speaks with synchronized animations  
8. Financial dashboard animates in real time  

---

## 🏗 Architecture

User
↓
Frontend (React + Three.js + Charts)
↓
Python Backend (Groq + Loan Engine)
↓
Node Backend (Audio + LipSync)
↓
3D Avatar + Financial Dashboard


---

## ⚙️ Setup

### 1 Python Backend

```bash
cd services/python-api
python -m venv venv
source venv/bin/activate   # in Linux
pip install -r requirements.txt
python3 main.py
```

### 2 Node Backend

```bash
cd apps/backend
bun run dev
```

### 2 React Frontend

```bash
cd apps/frontend
bun run dev
```


🔧 Requirements

1.Node.js (v18+)
2.Python 3.10+
3.FFmpeg
4.Rhubarb Lip Sync