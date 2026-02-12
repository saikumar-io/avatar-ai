import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import fs from "fs";
import path from "path";

import { lipSync } from "./modules/lip-sync.mjs";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

const PY_BACKEND = "http://127.0.0.1:5000";

// Health check
app.get("/", (_, res) => {
  res.send("Avatar engine running");
});

/**
 * POST /tts
 * Body: { text: "...", language: "te-IN" }
 */
app.post("/tts", async (req, res) => {
  try {
    const { text, language } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Text required" });
    }

    const id = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const baseName = `message_${id}`;
    const mp3Path = path.resolve(`audios/${baseName}.mp3`);

    if (!fs.existsSync("audios")) {
      fs.mkdirSync("audios");
    }

    // 🔥 Call Python TTS (Sarvam multilingual)
    const ttsResponse = await axios.post(
      `${PY_BACKEND}/text-to-speech`,
      {
        inputs: [text],
        target_language_code: language,
        source_language_code: language,
      },
      { responseType: "arraybuffer" }
    );

    // Save mp3
    fs.writeFileSync(mp3Path, ttsResponse.data);

    // Convert to base64
    const audioBase64 = Buffer.from(ttsResponse.data).toString("base64");

    const messages = [
      {
        id,
        text,
        audio: audioBase64,
        facialExpression: "neutral",
        animation: "Talking",
      },
    ];

    // Run Rhubarb lipsync
    const synced = await lipSync({
      messages,
      audioFileName: baseName,
    });

    res.json({ messages: synced });

  } catch (err) {
    console.error("❌ Avatar TTS error:", err);
    res.status(500).json({ error: "Avatar generation failed" });
  }
});

app.listen(PORT, () => {
  console.log(`👄 Avatar engine running on http://localhost:${PORT}`);
});
