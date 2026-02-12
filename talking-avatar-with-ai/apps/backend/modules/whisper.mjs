import fs from "fs";
import dotenv from "dotenv";
import OpenAI from "openai";
import { convertAudioToMp3 } from "../utils/audios.mjs";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function convertAudioToText({ audioData }) {
  // 1. Convert incoming audio to MP3
  const mp3AudioData = await convertAudioToMp3({ audioData });

  // 2. Write temp file
  const outputPath = "/tmp/output.mp3";
  fs.writeFileSync(outputPath, mp3AudioData);

  try {
    // 3. Transcribe using OpenAI Whisper (direct SDK call)
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(outputPath),
      model: "whisper-1",
    });

    // 4. Return plain text
    return transcription.text;
  } finally {
    // 5. Cleanup temp file
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }
  }
}

export { convertAudioToText };
