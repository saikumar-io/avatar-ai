import { execCommand } from "../utils/files.mjs";

const getPhonemes = async ({ audioBaseName }) => {
  try {
    const start = Date.now();

    const mp3 = `audios/${audioBaseName}.mp3`;
    const wav = `audios/${audioBaseName}.wav`;
    const json = `audios/${audioBaseName}.json`;

    console.log(`🎤 Generating phonemes for ${audioBaseName}`);

    // 1️⃣ MP3 → WAV
    await execCommand({
      command: `ffmpeg -y -i ${mp3} ${wav}`,
    });

    // 2️⃣ WAV → JSON (Rhubarb)
    await execCommand({
      command: `./bin/rhubarb -f json -o ${json} ${wav} -r phonetic`,
    });

    console.log(`✅ Lip-sync done in ${Date.now() - start}ms`);
  } catch (error) {
    console.error(`❌ Rhubarb failed:`, error);
    throw error;
  }
};

export { getPhonemes };
