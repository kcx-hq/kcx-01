import React, { useEffect, useRef, useState, useCallback } from "react";

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/chatbot`
  : "https://master-01-backend.onrender.com/api/chatbot";

export default function Chatbot() {
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const endRef = useRef(null);

  const pushBot = useCallback((text) => {
    if (!text) return;
    setMessages((m) => [...m, { sender: "bot", text }]);
  }, []);

  const pushUser = useCallback((text) => {
    if (!text) return;
    setMessages((m) => [...m, { sender: "user", text }]);
  }, []);

  const startSession = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${API_BASE}/session`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to start session");

      const data = await res.json();
      setSessionId(data.sessionId);
      setMessages([{ sender: "bot", text: data.question }]);
    } catch (e) {
      setError(e?.message || "Failed to start session");
      pushBot("Error starting session. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [pushBot]);

  useEffect(() => {
    startSession();
  }, [startSession]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendRawMessage = useCallback(
    async (rawText) => {
      const text = (rawText || "").trim();
      if (!text || !sessionId || loading) return;

      pushUser(text);
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`${API_BASE}/message`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, message: text }),
        });

        if (!res.ok) throw new Error("Failed to send message");

        const data = await res.json();

        if (data.reply) pushBot(data.reply);
        if (data.summary) {
          setMessages((m) => [...m, { sender: "bot", summary: data.summary }]);
        }
        if (data.question && data.question !== data.reply) {
          pushBot(data.question);
        }
      } catch (e) {
        setError(e?.message || "Error communicating with server");
        pushBot("Error communicating with server.");
      } finally {
        setLoading(false);
      }
    },
    [sessionId, loading, pushBot, pushUser]
  );

  const sendMessage = async () => {
    if (!input.trim()) return;
    const text = input;
    setInput("");
    await sendRawMessage(text);
  };

  return (
    <div className="h-full flex flex-col text-white bg-transparent">

      {/* GLASS CONTAINER */}
      <div className="flex flex-col h-full rounded-3xl 
        bg-gradient-to-br from-white/10 via-white/5 to-transparent
        backdrop-blur-2xl border border-white/10
        shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)]
      ">

        {/* Header */}
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <div>
            <p className="font-semibold">Requirements Chatbot</p>
            <p className="text-[11px] text-gray-400">
              {sessionId ? `Session: ${sessionId.slice(0, 8)}…` : "Starting…"}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => sendRawMessage("summary")}
              className="glass-btn"
              disabled={loading}
            >
              Summary
            </button>
            <button
              onClick={() => sendRawMessage("restart")}
              className="glass-btn"
              disabled={loading}
            >
              Restart
            </button>
            <button
              onClick={startSession}
              className="px-3 py-1.5 rounded-xl text-xs font-bold
              bg-[#8B2FC9] hover:bg-[#7a25b3]"
            >
              New
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-red-900/40 border border-red-700 text-xs">
            {error}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.sender === "bot" ? "justify-start" : "justify-end"}`}
            >
              {m.sender === "bot" ? (
                <div className="glass-bubble">
                  {m.text && <div className="text-sm whitespace-pre-wrap">{m.text}</div>}
                  {m.summary && (
                    <pre className="mt-2 text-xs bg-black/40 p-3 rounded-xl border border-white/10">
                      {JSON.stringify(m.summary, null, 2)}
                    </pre>
                  )}
                </div>
              ) : (
                <div className="bg-[#8B2FC9] text-white rounded-2xl px-4 py-3 text-sm max-w-[85%]
                  shadow-[0_6px_20px_rgba(139,47,201,0.45)]">
                  {m.text}
                </div>
              )}
            </div>
          ))}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/10 flex gap-2">
          <input
            className="flex-1 rounded-xl px-3 py-2 bg-black/40 border border-white/10
              text-sm outline-none focus:border-[#8B2FC9]"
            placeholder="Type your message…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="bg-[#8B2FC9] hover:bg-[#7a25b3] px-4 py-2 rounded-xl text-sm font-bold"
          >
            Send
          </button>
        </div>

        {/* Footer */}
        <div className="px-4 pb-3 text-[11px] text-gray-400 flex gap-3">
          <span>help</span>
          <span>back</span>
          <span>skip</span>
          <span>summary</span>
          <span>restart</span>
          <span>confirm</span>
        </div>
      </div>
    </div>
  );
}
