import { useRef } from "react";
import { useSpeech } from "../hooks/useSpeech";
import { LoanChart } from "./LoanChart";

export const ChatInterface = () => {
  const inputRef = useRef(null);

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
    isSpeaking,
  } = useSpeech();

  const send = () => {
    if (loading) return;

    const text = inputRef.current?.value?.trim();
    if (!text) return;

    sendText(text);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#0a192f] text-white p-6">

      {/* HEADER */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-wide">
          Loan <span className="text-[#c5a059]">Assistant</span>
        </h2>

        <select
          value={language}
          onChange={(e) => changeLanguage(e.target.value)}
          disabled={loading}
          className="bg-[#0a192f] border border-[#1e2d44] text-white 
                     px-4 py-2 rounded-xl focus:outline-none 
                     focus:border-[#c5a059]"
        >
          <option value="en-IN">English</option>
          <option value="hi-IN">Hindi</option>
          <option value="te-IN">Telugu</option>
          <option value="ta-IN">Tamil</option>
          <option value="kn-IN">Kannada</option>
        </select>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">

        {chatHistory.map((msg, i) => (
          <div
            key={i}
            className={`max-w-[75%] px-5 py-3 rounded-2xl text-sm shadow-md transition-all duration-300 ${
              msg.role === "user"
                ? "ml-auto bg-[#c5a059] text-[#0a192f]"
                : "mr-auto bg-[#112240] text-gray-200"
            }`}
          >
            {msg.text || ""}
          </div>
        ))}

        {thinking && (
          <div className="mr-auto bg-[#112240] px-5 py-3 rounded-2xl text-sm italic text-gray-400">
            Analyzing loan options...
          </div>
        )}

        {analysis && (
          <div className="mt-6 bg-[#112240] rounded-3xl p-6">
            <LoanChart
              analysis={analysis}
              isSpeaking={isSpeaking}
            />
          </div>
        )}
      </div>

      {/* INPUT AREA */}
      <div className="mt-6 flex gap-3 items-center bg-[#112240] rounded-2xl p-3">

        <input
          ref={inputRef}
          className="flex-1 bg-transparent text-white 
                     placeholder:text-gray-500 
                     focus:outline-none px-3 py-2"
          placeholder="Ask about loan options..."
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
          disabled={loading}
        />

        <button
          onClick={recording ? stopRecording : startRecording}
          disabled={loading}
          className={`px-4 py-2 rounded-xl transition-all ${
            recording
              ? "bg-red-500 animate-pulse"
              : "bg-[#c5a059] text-[#0a192f] hover:bg-[#b38e4a]"
          }`}
        >
          🎤
        </button>

        <button
          onClick={send}
          disabled={loading}
          className="bg-[#c5a059] text-[#0a192f] 
                     px-5 py-2 rounded-xl font-semibold 
                     hover:bg-[#b38e4a] transition-all 
                     disabled:opacity-40"
        >
          Send
        </button>
      </div>
    </div>
  );
};