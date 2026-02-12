import { getPhonemes } from "./rhubarbLipSync.mjs";
import { readJsonTranscript } from "../utils/files.mjs";

const lipSync = async ({ messages, audioFileName }) => {
  for (const message of messages) {
    // Run rhubarb on the EXACT file
    await getPhonemes({ audioBaseName: audioFileName });

    // Attach lipsync JSON
    message.lipsync = await readJsonTranscript({
      fileName: `audios/${audioFileName}.json`,
    });
  }

  return messages;
};

export { lipSync };
