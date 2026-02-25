import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";

import { lipSync } from "./modules/lip-sync.mjs";
import { generateAudio } from "./modules/elevenLabs.mjs";
import loanRoutes from "./routes/loanRoutes.js";


dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use("/api/loan", loanRoutes);

mongoose.connect("mongodb://admin:admin123@localhost:27017/loanapp?authSource=admin")
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Error:", err));

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

    let audioBuffer;

    // 🔵 Use Sarvam only for Telugu & Kannada
    const useSarvam = ["te-IN", "kn-IN"].includes(language);

    if (useSarvam) {
      console.log("🟢 Using Sarvam TTS");

      const ttsResponse = await axios.post(
        `${PY_BACKEND}/text-to-speech`,
        {
          inputs: [text],
          target_language_code: language,
          source_language_code: "auto",
        },
        { responseType: "arraybuffer" }
      );

      audioBuffer = Buffer.from(ttsResponse.data);

    } else {
  console.log("🔵 Using ElevenLabs TTS");

  try {
    const audioBase64 = await generateAudio(text, baseName);
    audioBuffer = Buffer.from(audioBase64, "base64");
  } catch (err) {
    console.log("⚠️ ElevenLabs failed, falling back to Sarvam");

    const ttsResponse = await axios.post(
      `${PY_BACKEND}/text-to-speech`,
      {
        inputs: [text],
        target_language_code: language,
        source_language_code: language,
      },
      { responseType: "arraybuffer" }
    );

    audioBuffer = Buffer.from(ttsResponse.data);
  }
}


    // Save mp3
    fs.writeFileSync(mp3Path, audioBuffer);

    const audioBase64Final = audioBuffer.toString("base64");

    const messages = [
      {
        id,
        text,
        audio: audioBase64Final,
        facialExpression: "neutral",
        animation: "Talking",
      },
    ];

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
