import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = `${import.meta.env.VITE_API_URL}/api/chatbot`;

function SummaryCard({ summary }) {
  const entries =
    summary && typeof summary === "object" ? Object.entries(summary) : [];

  if (!entries.length) {
    return (
      <div className="mt-2 text-xs bg-black/30 p-3 rounded-xl border border-white/10 text-gray-300">
        No summary available yet.
      </div>
    );
  }

  return (
    <div className="mt-2 bg-black/30 p-3 rounded-xl border border-white/10">
      <div className="text-[11px] uppercase tracking-wide text-gray-400 mb-2">
        Summary
      </div>

      <div className="space-y-2">
        {entries.map(([label, value]) => {
          const display =
            value === null || value === undefined || String(value).trim() === ""
              ? "—"
              : Array.isArray(value)
              ? value.join(", ")
              : String(value);

          return (
            <div key={label} className="flex items-start justify-between gap-3">
              <div className="text-xs text-gray-400 min-w-[110px]">{label}</div>
              <div className="text-xs text-gray-200 text-right flex-1">
                {display}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Chatbot({ onClose, autoFocus = true }) {
  const navigate = useNavigate();

  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const didAutoFocusRef = useRef(false);
  const shouldFocusAfterReplyRef = useRef(false);


  const [sessionId, setSessionId] = useState(null);
  const [stepId, setStepId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const endRef = useRef(null);

  const QUICK_REPLIES = {
    service: [
      { label: "Dashboard", value: "Dashboard customization" },
      { label: "Cost optimization", value: "Cost optimization" },
      { label: "Billing issues", value: "Cloud billing issues" },
      { label: "Alerts", value: "Alerts & monitoring" },
      { label: "FinOps consult", value: "FinOps consultation" },
      { label: "Other", value: "Other" },
    ],
    provider: [
      { label: "AWS", value: "AWS" },
      { label: "GCP", value: "GCP" },
      { label: "Azure", value: "Azure" },
      { label: "Multi-cloud", value: "Multi-cloud" },
      { label: "Not sure", value: "Not sure" },
    ],
    spend: [
      { label: "< $1k", value: "< $1k" },
      { label: "$1k–$10k", value: "$1k–$10k" },
      { label: "$10k–$50k", value: "$10k–$50k" },
      { label: "$50k+", value: "$50k+" },
      { label: "Not sure", value: "Not sure" },
    ],
    role: [
      { label: "Finance", value: "Finance" },
      { label: "Engineering", value: "Engineering" },
      { label: "Leadership", value: "Leadership" },
      { label: "Ops/Cloud", value: "Ops/Cloud" },
      { label: "Other", value: "Other" },
    ],
    schedule_meeting: [
      { label: "Yes", value: "yes" },
      { label: "No", value: "no" },
    ],
  };

  const focusInput = useCallback(() => {
    // focus only if not already focused (prevents jank)
    if (document.activeElement !== inputRef.current) {
      inputRef.current?.focus();
    }
  }, []);

  useEffect(() => {
  if (loading) return;
  if (!shouldFocusAfterReplyRef.current) return;

  shouldFocusAfterReplyRef.current = false;

  requestAnimationFrame(() => {
    focusInput();
  });
}, [loading, messages.length, focusInput]);


  // ✅ Auto focus ONLY ONCE when the component opens
  useEffect(() => {
    if (!autoFocus) return;
    if (didAutoFocusRef.current) return;
    didAutoFocusRef.current = true;

    const t = setTimeout(() => focusInput(), 150); // allow animation mount
    return () => clearTimeout(t);
  }, [autoFocus, focusInput]);

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
      setStepId(data.stepId || null);
      setMessages([{ sender: "bot", text: data.question }]);

      // ✅ after new session, let user type immediately
      setTimeout(() => focusInput(), 120);
    } catch (e) {
      setError(e?.message || "Failed to start session");
      pushBot("Error starting session. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [pushBot, focusInput]);

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

        setStepId(data.stepId || null);

        if (data.reply) pushBot(data.reply);

        if (data.summary) {
          setMessages((m) => [...m, { sender: "bot", summary: data.summary }]);
        }

        if (data.question && data.question !== data.reply) {
          pushBot(data.question);
        }

        if (data.meeting) {
          navigate("/book-slot", { state: { inquiry: data.meeting } });
          return;
        }

        if (data.redirect) {
          navigate("/book-slot", { state: { inquiry: data.redirect } });
          return;
        }

        // ✅ after any response, keep user ready to type
       // ✅ after any response, keep user ready to type
shouldFocusAfterReplyRef.current = true;

      } catch (e) {
        setError(e?.message || "Error communicating with server");
        pushBot("Error communicating with server.");
      } finally {
        setLoading(false);
      }
    },
    [sessionId, loading, pushBot, pushUser, navigate, focusInput],
  );

  const sendMessage = async () => {
    if (loading) return;
    if (!input.trim()) return;

    const text = input;
    setInput("");
    await sendRawMessage(text);
  };

  const sendQuickReply = async (value) => {
    if (loading) return;
    await sendRawMessage(value);
  };

  const quickButtons = QUICK_REPLIES[stepId];

  // ✅ Click anywhere in the widget (except buttons/inputs) to focus input
  const handleContainerPointerDown = (e) => {
    const tag = e.target?.tagName?.toLowerCase();
    if (tag === "button" || tag === "input" || tag === "textarea") return;
    focusInput();
  };

  return (
    <div
      ref={containerRef}
      className="h-full flex flex-col text-white bg-transparent"
      onMouseDown={handleContainerPointerDown}
      onTouchStart={handleContainerPointerDown}
    >
      <div
        className="flex flex-col h-full rounded-3xl 
        bg-gradient-to-br from-white/10 via-white/5 to-transparent
        backdrop-blur-2xl border border-white/10
        shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)]"
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <div>
            <p className="font-semibold">Chat with Us</p>
            <p className="text-[11px] text-gray-400">
              {sessionId ? `Session: ${sessionId.slice(0, 8)}…` : "Starting…"}
            </p>
          </div>

          <div className="flex gap-2 items-center">
            {onClose && (
              <button
                onClick={onClose}
                aria-label="Close chat"
                className="ml-1 w-8 h-8 rounded-xl bg-black/40 border border-white/10 text-white/70 hover:text-white hover:bg-black/60 backdrop-blur-xl transition"
                disabled={loading}
              >
                ✕
              </button>
            )}
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
                  {m.text && (
                    <div className="text-sm whitespace-pre-wrap">{m.text}</div>
                  )}
                  {m.summary && <SummaryCard summary={m.summary} />}
                </div>
              ) : (
                <div className="bg-[#8B2FC9] text-white rounded-2xl px-4 py-3 text-sm max-w-[85%] shadow-[0_6px_20px_rgba(139,47,201,0.45)]">
                  {m.text}
                </div>
              )}
            </div>
          ))}
          <div ref={endRef} />
        </div>

        {/* Quick Replies */}
        {Array.isArray(quickButtons) && quickButtons.length > 0 && (
          <div className="px-4 pb-2 flex flex-wrap gap-2">
            {quickButtons.map((btn) => (
              <button
                key={btn.value}
                onClick={() => sendQuickReply(btn.value)}
                disabled={loading}
                className="
                  px-3 py-1.5 rounded-xl text-xs font-semibold
                  bg-white/10 border border-white/10
                  hover:bg-white/20 transition
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                {btn.label}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-white/10 flex gap-2">
          <input
            ref={inputRef}
            className="flex-1 rounded-xl px-3 py-2 bg-black/40 border border-white/10 text-sm outline-none focus:border-[#8B2FC9]"
            placeholder={loading ? "Sending…" : "Type your message…"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !loading) sendMessage();
            }}
            disabled={loading}
          />

          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="bg-[#8B2FC9] hover:bg-[#7a25b3] px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Sending…" : "Send"}
          </button>
        </div>

        {/* Footer buttons */}
        <div className="px-4 pb-3 flex gap-2 flex-wrap text-[11px]">
          {["help", "back", "skip", "summary"].map((cmd) => (
            <button
              key={cmd}
              onClick={() => sendRawMessage(cmd)}
              disabled={loading}
              className="
                px-3 py-1.5 rounded-xl
                bg-white/10 border border-white/10
                text-gray-300 font-medium
                hover:bg-white/20 hover:text-white
                transition
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              {cmd}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
