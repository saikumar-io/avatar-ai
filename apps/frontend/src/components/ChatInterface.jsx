import { useRef } from "react";
import { useSpeech } from "../hooks/useSpeech";
import { LoanChart } from "./LoanChart";


export const ChatInterface = () => {
  const inputRef = useRef();

  const {
    sendText,
    chatHistory,
    thinking,
    loading,
    changeLanguage,
    language,
    recording,
    startRecording,
    stopRecording,
    analysis,
  } = useSpeech();

  const send = () => {
    if (loading) return;

    const text = inputRef.current.value.trim();
    if (!text) return;

    sendText(text);
    inputRef.current.value = "";
  };

  return (
    <div className="h-full flex flex-col bg-neutral-900 text-white p-4">

      {/* LANGUAGE DROPDOWN */}
      <select
        value={language}
        onChange={(e) => changeLanguage(e.target.value)}
        className="mb-3 p-2 rounded text-black"
        disabled={loading}
      >
        <option value="en-IN">English</option>
        <option value="hi-IN">Hindi</option>
        <option value="te-IN">Telugu</option>
        <option value="ta-IN">Tamil</option>
        <option value="kn-IN">Kannada</option>
      </select>

      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-2">
        {chatHistory.map((msg, i) => (
          <div
            key={i}
            className={`max-w-[85%] px-4 py-2 rounded-xl text-sm ${
              msg.role === "user"
                ? "ml-auto bg-blue-600"
                : "mr-auto bg-neutral-700"
            }`}
          >
            {msg.text || ""}
          </div>
        ))}

        {thinking && (
          <div className="mr-auto bg-neutral-700 px-4 py-2 rounded-xl text-sm italic opacity-70">
            Thinking…
          </div>
        )}
        {analysis && <LoanChart analysis={analysis} />}
      </div>

      {/* INPUT + MIC */}
      <div className="mt-4 flex gap-2 items-center">
        <input
          ref={inputRef}
          className="flex-1 rounded-md px-3 py-2 text-black"
          placeholder="Type your message…"
          onKeyDown={(e) => e.key === "Enter" && send()}
          disabled={loading}
        />

        <button
          onClick={recording ? stopRecording : startRecording}
          className={`px-4 py-2 rounded-md ${
            recording ? "bg-red-600 animate-pulse" : "bg-green-600"
          }`}
          disabled={loading}
        >
          🎤
        </button>

        <button
          onClick={send}
          className="bg-blue-600 px-4 py-2 rounded-md disabled:opacity-50"
          disabled={loading}
        >
          Send
        </button>
      </div>
    </div>
  );
};
