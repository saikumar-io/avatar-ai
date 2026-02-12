import { createContext, useContext, useEffect, useRef, useState } from "react";

const PY_BACKEND = "http://127.0.0.1:5000";
const AVATAR_BACKEND = "http://127.0.0.1:3000";

const SpeechContext = createContext();

export const SpeechProvider = ({ children }) => {
  const [chatHistory, setChatHistory] = useState([]);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState(null);

  const [language, setLanguage] = useState("en-IN");
  const [loading, setLoading] = useState(false);
  const [thinking, setThinking] = useState(false);

  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const typingTimer = useRef(null);
  const [typingText, setTypingText] = useState("");

  /* ---------------- LANGUAGE CHANGE ---------------- */

  const changeLanguage = async (langCode) => {
    setLanguage(langCode);

    try {
      await fetch(`${PY_BACKEND}/set-language`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language_code: langCode }),
      });
    } catch (err) {
      console.error("Language set error:", err);
    }
  };

  /* ---------------- TEXT SEND ---------------- */

  const sendText = async (userText) => {
    if (!userText || loading) return;

    setLoading(true);
    setThinking(true);

    setChatHistory((prev) => [...prev, { role: "user", text: userText }]);

    try {
      // 1️⃣ Chat (Groq backend)
      const res = await fetch(`${PY_BACKEND}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          session_id: "default",
          language_code: language,
        }),
      });

      const data = await res.json();
      if (!data.response) throw new Error("No AI text");

      // Add placeholder assistant bubble
      setChatHistory((prev) => [...prev, { role: "assistant", text: "" }]);

      // 2️⃣ Avatar TTS
      const avatarRes = await fetch(`${AVATAR_BACKEND}/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: data.response,
          language,
        }),
      });

      const avatarData = await avatarRes.json();

      if (avatarData.messages) {
        setMessages(avatarData.messages);
      }

    } catch (err) {
      console.error("SendText error:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- TYPING EFFECT ---------------- */

  const startTyping = (fullText) => {
    clearInterval(typingTimer.current);
    setThinking(false);
    setTypingText("");

    let i = 0;
    typingTimer.current = setInterval(() => {
      i++;
      setTypingText(fullText.slice(0, i));

      if (i >= fullText.length) {
        clearInterval(typingTimer.current);
      }
    }, 80); // slower typing (feel natural)
  };

  const finishTyping = () => {
    clearInterval(typingTimer.current);
  };

  /* ---------------- AVATAR QUEUE ---------------- */

  const onMessageStarted = (text) => {
    startTyping(text);
  };

  const onMessageEnded = () => {
    setMessages((prev) => prev.slice(1));
    finishTyping();
  };

  useEffect(() => {
    if (messages.length > 0) {
      setMessage(messages[0]);
    } else {
      setMessage(null);
    }
  }, [messages]);

  useEffect(() => {
    if (!typingText) return;

    setChatHistory((prev) => {
      const updated = [...prev];
      updated[updated.length - 1] = {
        role: "assistant",
        text: typingText,
      };
      return updated;
    });
  }, [typingText]);

  /* ---------------- MIC SETUP ---------------- */

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/wav" });
        chunksRef.current = [];

        const formData = new FormData();
        formData.append("audio", blob, "voice.wav");

        try {
          const res = await fetch(`${PY_BACKEND}/speech-to-text`, {
            method: "POST",
            body: formData,
          });

          const data = await res.json();

          if (data.transcription) {
            await sendText(data.transcription);
          }
        } catch (err) {
          console.error("Mic STT error:", err);
        }
      };
    });
  }, []);

  const startRecording = () => {
    if (loading || !mediaRecorderRef.current) return;
    mediaRecorderRef.current.start();
    setRecording(true);
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;
    mediaRecorderRef.current.stop();
    setRecording(false);
  };

  return (
    <SpeechContext.Provider
      value={{
        sendText,
        message,
        chatHistory,
        thinking,
        loading,
        onMessageStarted,
        onMessageEnded,
        changeLanguage,
        language,
        recording,
        startRecording,
        stopRecording,
      }}
    >
      {children}
    </SpeechContext.Provider>
  );
};

export const useSpeech = () => useContext(SpeechContext);
