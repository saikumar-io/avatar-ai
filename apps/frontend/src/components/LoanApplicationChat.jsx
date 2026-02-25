import React, { useState, useEffect } from "react";

const LoanApplicationChat = ({ onBack }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [done, setDone] = useState(false);
  const [collectedData, setCollectedData] = useState(null);

  // Helper function to add messages
  const addMsg = (sender, text) => {
    setMessages((prev) => [...prev, { sender, text }]);
  };

  // Start chat on load
  useEffect(() => {
  const startChat = async () => {
    // Reset backend session
    await fetch("http://localhost:3000/api/loan/reset-session", {
      method: "POST",
    });

    // Start conversation
    const res = await fetch("http://localhost:3000/api/loan/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "__START__" }),
    });

    const data = await res.json();

    if (data.question) {
      setMessages([{ sender: "bot", text: data.question }]);
    }
  };

  startChat();
}, []);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = input;

    addMsg("user", userMsg);
    setInput("");

    try {
      const res = await fetch("http://localhost:3000/api/loan/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg }),
      });

      const data = await res.json();

      if (data.error) {
        addMsg("bot", `❌ ${data.error}`);
      }

      if (data.done) {
        setDone(true);
        setCollectedData(data.collectedData);
        addMsg("bot", data.message || "All details collected.");
      } else if (data.question) {
        addMsg("bot", data.question);
      }
    } catch (error) {
      console.error("Send message error:", error);
    }
  };

  const submitApplication = async () => {
  const res = await fetch("http://localhost:3000/api/loan/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ collectedData }),
  });

  const data = await res.json();

  setMessages((prev) => [
    ...prev,
    { sender: "bot", text: "🎉 Application submitted successfully!" },
  ]);

  setDone("submitted"); // special state
};

  const cancelApplication = async () => {
    await fetch("http://localhost:3000/api/loan/reset-session", {
      method: "POST",
    });
    onBack();
  };

  return (
    <div className="h-full flex flex-col p-6 bg-[#0a192f] text-white">

      <button onClick={cancelApplication} className="mb-4 text-sm text-gray-400">
        ← Back to Loan Advisor
      </button>

      <div className="flex-1 overflow-y-auto space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={m.sender === "user" ? "text-right" : "text-left"}>
            <div className="inline-block bg-[#112240] px-4 py-2 rounded-xl">
              {m.text}
            </div>
          </div>
        ))}
      </div>

      {!done && (
        <div className="mt-4 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 px-3 py-2 bg-[#112240] rounded-xl"
            placeholder="Type your answer..."
          />
          <button
            onClick={sendMessage}
            className="bg-[#c5a059] px-4 rounded-xl"
          >
            Send
          </button>
        </div>
      )}

      {done === true && (
  <button
    onClick={submitApplication}
    className="mt-4 bg-green-500 px-4 py-2 rounded-xl"
  >
    Submit Application
  </button>
)}

{done === "submitted" && (
  <button
    onClick={onBack}
    className="mt-4 bg-[#c5a059] px-4 py-2 rounded-xl"
  >
    Back to Dashboard
  </button>
)}
    </div>
  );
};

export default LoanApplicationChat;