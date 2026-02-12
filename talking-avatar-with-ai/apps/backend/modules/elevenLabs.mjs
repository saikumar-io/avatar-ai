import axios from "axios";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const ELEVEN_API_KEY = process.env.ELEVEN_LABS_API_KEY;
const VOICE_ID = process.env.ELEVEN_LABS_VOICE_ID || "pNInz6obpgDQGcFmaJgB";
const MODEL_ID = process.env.ELEVEN_LABS_MODEL_ID || "eleven_monolingual_v1";

if (!ELEVEN_API_KEY) {
  throw new Error("❌ ELEVEN_LABS_API_KEY missing in .env");
}

/**
 * Generates TTS audio, saves MP3, returns BASE64
 */
export async function generateAudio(text, fileBaseName) {
  const outputDir = path.resolve("audios");
  const mp3Path = path.join(outputDir, `${fileBaseName}.mp3`);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const response = await axios.post(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
    {
      text,
      model_id: MODEL_ID,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.5,
      },
    },
    {
      headers: {
        "xi-api-key": ELEVEN_API_KEY,
        "Content-Type": "application/json",
      },
      responseType: "arraybuffer",
    }
  );

  // Save MP3 for Rhubarb
  fs.writeFileSync(mp3Path, response.data);

  // Convert to base64 for frontend
  const audioBase64 = Buffer.from(response.data).toString("base64");

  return audioBase64;
}
