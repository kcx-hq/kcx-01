import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = `${import.meta.env.VITE_API_URL}/api/chatbot`;

function SummaryCard({ summary }) {
  const entries =
    summary && typeof summary === "object" ? Object.entries(summary) : [];

  if (!entries.length) {
    return (
      <div
        className="
          mt-2 text-xs p-3 rounded-xl
          bg-[var(--bg-main)] border border-[var(--border-light)]
          text-[var(--text-secondary)]
        "
      >
        No summary available yet.
      </div>
    );
  }

  return (
    <div
      className="
        mt-2 p-3 rounded-xl
        bg-[var(--bg-main)] border border-[var(--border-light)]
      "
    >
      <div className="text-[11px] uppercase tracking-wide text-[var(--text-disabled)] mb-2">
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
              <div className="text-xs text-[var(--text-secondary)] min-w-[110px]">
                {label}
              </div>
              <div className="text-xs text-[var(--text-primary)] text-right flex-1">
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

  useEffect(() => {
    if (!autoFocus) return;
    if (didAutoFocusRef.current) return;
    didAutoFocusRef.current = true;

    const t = setTimeout(() => focusInput(), 150);
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

        shouldFocusAfterReplyRef.current = true;
      } catch (e) {
        setError(e?.message || "Error communicating with server");
        pushBot("Error communicating with server.");
      } finally {
        setLoading(false);
      }
    },
    [sessionId, loading, pushBot, pushUser, navigate]
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

  const handleContainerPointerDown = (e) => {
    const tag = e.target?.tagName?.toLowerCase();
    if (tag === "button" || tag === "input" || tag === "textarea") return;
    focusInput();
  };

  return (
    <div
      ref={containerRef}
      className="h-full flex flex-col text-[var(--text-primary)] bg-transparent"
      onMouseDown={handleContainerPointerDown}
      onTouchStart={handleContainerPointerDown}
    >
      {/* Outer shell (light) */}
      <div
        className="
          flex flex-col h-full rounded-3xl
          bg-[var(--bg-surface)]
          border border-[var(--border-light)]
          shadow-[var(--shadow-md)]
        "
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-[var(--border-light)] flex items-center justify-between">
          <div>
            <p className="font-semibold text-[var(--text-primary)]">
              Chat with Us
            </p>
            <p className="text-[11px] text-[var(--text-disabled)]">
              {sessionId ? `Session: ${sessionId.slice(0, 8)}…` : "Starting…"}
            </p>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              aria-label="Close chat"
              className="
                ml-1 w-8 h-8 rounded-xl
                bg-[var(--bg-main)]
                border border-[var(--border-light)]
                text-[var(--text-secondary)]
                hover:text-[var(--text-primary)]
                transition-colors
              "
              disabled={loading}
              type="button"
            >
              ✕
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-[var(--highlight-yellow)] border border-[var(--border-light)] text-xs text-[var(--text-primary)]">
            {error}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${
                m.sender === "bot" ? "justify-start" : "justify-end"
              }`}
            >
              {m.sender === "bot" ? (
                <div
                  className="
                    max-w-[85%] rounded-2xl px-4 py-3
                    bg-[var(--bg-main)]
                    border border-[var(--border-light)]
                    text-[var(--text-primary)]
                  "
                >
                  {m.text && (
                    <div className="text-sm whitespace-pre-wrap">{m.text}</div>
                  )}
                  {m.summary && <SummaryCard summary={m.summary} />}
                </div>
              ) : (
                <div
                  className="
                    max-w-[85%] rounded-2xl px-4 py-3 text-sm
                    bg-[var(--brand-secondary)] text-white
                  "
                >
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
                type="button"
                className="
                  px-3 py-1.5 rounded-xl text-xs font-semibold
                  bg-[var(--bg-main)]
                  border border-[var(--border-light)]
                  text-[var(--text-secondary)]
                  hover:text-[var(--text-primary)]
                  transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                {btn.label}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-[var(--border-light)] flex gap-2">
          <input
            ref={inputRef}
            className="
              flex-1 rounded-xl px-3 py-2
              bg-[var(--bg-main)]
              border border-[var(--border-light)]
              text-sm text-[var(--text-primary)]
              outline-none
              focus:border-[var(--brand-secondary)]
            "
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
            type="button"
            className="
              px-4 py-2 rounded-xl text-sm font-bold
              bg-[var(--brand-secondary)] text-white
              disabled:opacity-60 disabled:cursor-not-allowed
            "
          >
            {loading ? "Sending…" : "Send"}
          </button>
        </div>

        {/* Footer commands */}
        <div className="px-4 pb-3 flex gap-2 flex-wrap text-[11px]">
          {["help", "back", "skip", "summary"].map((cmd) => (
            <button
              key={cmd}
              onClick={() => sendRawMessage(cmd)}
              disabled={loading}
              type="button"
              className="
                px-3 py-1.5 rounded-xl
                bg-[var(--bg-main)]
                border border-[var(--border-light)]
                text-[var(--text-secondary)]
                hover:text-[var(--text-primary)]
                transition-colors
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
