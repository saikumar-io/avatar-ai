# 🧠 Multilingual Digital Human Avatar

A real-time 3D talking avatar that understands text or speech and responds in multiple Indian languages with synchronized lip movements and animations.

This system combines:

- 🧠 **Groq (LLaMA 3.3)** — AI Brain  
- 🗣 **Sarvam AI** — Multilingual Text-to-Speech & Speech-to-Text  
- 👄 **Rhubarb Lip Sync** — Viseme generation  
- 🎭 **React + Three.js** — 3D Avatar rendering  
- ⚡ **Express (Node.js)** — Avatar audio + lip-sync engine  
- 🐍 **Flask (Python)** — AI + Language backend  

---

# 🏗 System Architecture

```
User
  ↓
Frontend (React + Three.js)
  ↓
Python Backend (Groq + Sarvam)
  ↓
Node Avatar Engine (Audio + LipSync)
  ↓
3D Avatar with animations
```

---

# 📁 Project Structure

```
avatar-ai/
│
├── apps/
│   ├── frontend/        → React + Three.js UI
│   └── backend/         → Node Avatar Engine (TTS bridge + Rhubarb)
│
└── services/
    └── python-api/      → Flask AI Backend (Groq + Sarvam)
```

---

# 🚀 Features

- ✅ Text-based chat
- 🎤 Voice input (microphone support)
- 🌍 Multilingual responses:
  - English (en-IN)
  - Hindi (hi-IN)
  - Telugu (te-IN)
  - Tamil (ta-IN)
  - Kannada (kn-IN)
- 👄 Real-time lip sync
- 😊 Facial expressions
- 🎬 Idle + talking animations
- 🔄 Language switching mid-conversation
- 👨 Male voice support (Sarvam configuration)

---

# ⚙️ Requirements

Install the following before running the project:

- **Node.js (v18+)**
- **Python 3.10+**
- **FFmpeg**
- **Rhubarb Lip Sync**

### Download Rhubarb

Official repository:
https://github.com/DanielSWolf/rhubarb-lip-sync/releases

After downloading:

Place the extracted files inside:

```
apps/backend/bin/
```

On Linux / Mac:

```
chmod +x rhubarb
```

---

# 🧠 Python AI Backend Setup (Groq + Sarvam)

Navigate to:

```
cd services/python-api
```

Create virtual environment:

```
python -m venv venv
source venv/bin/activate
```

Install dependencies:

```
pip install -r requirements.txt
```

Create a `.env` file:

```
GROQ_API_KEY=your_groq_api_key
SARVAM_API_KEY=your_sarvam_api_key
```

Start backend:

```
python app.py
```

Runs at:

```
http://127.0.0.1:5000
```

---

# 👄 Node Avatar Backend Setup (LipSync Engine)

Navigate to:

```
cd apps/backend
```

If using Bun:

```
bun install
bun run server
```

If using Node:

```
npm install
node server.js
```

Runs at:

```
http://localhost:3000
```

This service:

- Receives AI-generated text
- Calls Python TTS
- Saves MP3 audio
- Runs Rhubarb lip-sync
- Returns audio + viseme data to frontend

---

# 🎭 Frontend Setup (React + Three.js)

Navigate to:

```
cd apps/frontend
```

If using Bun:

```
bun install
bun run dev
```

If using Node:

```
npm install
npm run dev
```

Open browser:

```
http://localhost:5173
```

---

# 🔊 Voice System

Current configuration:

- English / Hindi / Tamil → High-quality TTS
- Telugu / Kannada → Sarvam multilingual neural voice
- Male voice enabled via Sarvam speaker configuration

---

# 🎥 How It Works

## Text Flow

1. User types message  
2. Python backend sends to Groq LLM  
3. AI response generated  
4. Sarvam TTS produces audio  
5. Node backend runs Rhubarb  
6. Viseme data returned  
7. Avatar speaks with lip-sync  

---

## Voice Flow

1. User speaks via microphone  
2. Sarvam STT converts speech → text  
3. Text sent to Groq  
4. Response generated  
5. Sarvam TTS produces audio  
6. Rhubarb generates visemes  
7. Avatar speaks with synchronized lips  

---

# 🧹 Architecture Design

The system is intentionally separated into:

- 🐍 Python → AI + Language Processing  
- ⚡ Node → Audio + LipSync Engine  
- 🎭 Frontend → 3D Rendering  

This makes it easy to:

- Replace TTS providers  
- Upgrade LLM models  
- Deploy services independently  
- Scale backend services  

---

# 🛠 Development Notes

- Restart Node backend after modifying Rhubarb configuration
- Restart Python backend after language changes
- Clear `apps/backend/audios/` if files accumulate
- Ensure FFmpeg is accessible globally (`ffmpeg -version`)

---

# 📌 Future Improvements

- Streaming LLM responses
- Emotion-based voice synthesis
- Real-time WebRTC voice chat
- Docker deployment
- Persistent chat memory
- Voice cloning

---

# 👨‍💻 Author

Built as a multilingual interactive AI digital human system using modern LLM and speech technologies.
