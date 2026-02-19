import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Send, 
  X, 
  Bot, 
  User, 
  Sparkles, 
  MoreHorizontal, 
  ArrowLeft, 
  HelpCircle, 
  FileText, 
  SkipForward 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE = `${import.meta.env.VITE_API_URL}/api/chatbot`;

// --- SUMMARY CARD COMPONENT ---
function SummaryCard({ summary }) {
  const entries = summary && typeof summary === "object" ? Object.entries(summary) : [];

  if (!entries.length) return null;

  return (
    <div className="mt-3 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-50">
        <FileText size={14} className="text-[var(--brand-primary)]" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Session Summary</span>
      </div>

      <div className="space-y-2.5">
        {entries.map(([label, value]) => {
          const display = value === null || value === undefined || String(value).trim() === ""
            ? "—"
            : Array.isArray(value) ? value.join(", ") : String(value);

          return (
            <div key={label} className="flex justify-between items-start gap-4 text-xs">
              <span className="text-slate-500 font-medium min-w-[100px]">{label}</span>
              <span className="text-slate-800 font-semibold text-right flex-1">{display}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- TYPING INDICATOR ---
const TypingIndicator = () => (
  <div className="flex gap-1 p-2">
    <motion.div 
      className="w-1.5 h-1.5 bg-slate-400 rounded-full"
      animate={{ y: [0, -4, 0] }}
      transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
    />
    <motion.div 
      className="w-1.5 h-1.5 bg-slate-400 rounded-full"
      animate={{ y: [0, -4, 0] }}
      transition={{ duration: 0.6, delay: 0.1, repeat: Infinity, ease: "easeInOut" }}
    />
    <motion.div 
      className="w-1.5 h-1.5 bg-slate-400 rounded-full"
      animate={{ y: [0, -4, 0] }}
      transition={{ duration: 0.6, delay: 0.2, repeat: Infinity, ease: "easeInOut" }}
    />
  </div>
);

// --- MAIN CHATBOT COMPONENT ---
export default function Chatbot({ onClose, autoFocus = true }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const endRef = useRef(null);
  
  // State
  const [sessionId, setSessionId] = useState(null);
  const [stepId, setStepId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Focus Logic
  useEffect(() => {
    if (autoFocus) setTimeout(() => inputRef.current?.focus(), 300);
  }, [autoFocus]);

  // Scroll to bottom
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // --- API LOGIC (Kept same structure, improved error handling) ---
  const startSession = useCallback(async () => {
    try {
      setIsTyping(true);
      const res = await fetch(`${API_BASE}/session`, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      
      setSessionId(data.sessionId);
      setStepId(data.stepId || null);
      
      // Artificial delay for realism
      setTimeout(() => {
        setMessages([{ sender: "bot", text: data.question }]);
        setIsTyping(false);
      }, 800);

    } catch (e) {
      setMessages([{ sender: "bot", text: "Connection error. Please restart the chat." }]);
      setIsTyping(false);
    }
  }, []);

  useEffect(() => { startSession(); }, [startSession]);

  const sendMessage = async (overrideText = null) => {
    const text = overrideText || input.trim();
    if (!text || loading) return;

    if (!overrideText) setInput(""); // Clear input only if typing
    
    // Optimistic Update
    setMessages(prev => [...prev, { sender: "user", text }]);
    setLoading(true);
    setIsTyping(true);

    try {
      const res = await fetch(`${API_BASE}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: text }),
      });

      if (!res.ok) throw new Error("Failed");
      const data = await res.json();

      setStepId(data.stepId || null);

      // Handle Redirects
      if (data.meeting) { navigate("/book-slot", { state: { inquiry: data.meeting } }); return; }
      if (data.redirect) { navigate("/book-slot", { state: { inquiry: data.redirect } }); return; }

      // Process Bot Response
      setTimeout(() => {
        setIsTyping(false);
        const newMessages = [];
        if (data.reply) newMessages.push({ sender: "bot", text: data.reply });
        if (data.summary) newMessages.push({ sender: "bot", summary: data.summary });
        if (data.question && data.question !== data.reply) newMessages.push({ sender: "bot", text: data.question });
        
        setMessages(prev => [...prev, ...newMessages]);
        setLoading(false);
        setTimeout(() => inputRef.current?.focus(), 100);
      }, 600); // Small delay for "thinking" feel

    } catch (e) {
      setIsTyping(false);
      setLoading(false);
      setMessages(prev => [...prev, { sender: "bot", text: "Sorry, I encountered an error. Please try again." }]);
    }
  };

  // --- QUICK REPLIES DATA ---
  const QUICK_REPLIES = {
    service: [
      { label: "Dashboard", value: "Dashboard customization" },
      { label: "Cost optimization", value: "Cost optimization" },
      { label: "Billing issues", value: "Cloud billing issues" },
      { label: "FinOps consult", value: "FinOps consultation" },
    ],
    provider: [
      { label: "AWS", value: "AWS" },
      { label: "GCP", value: "GCP" },
      { label: "Azure", value: "Azure" },
      { label: "Multi-cloud", value: "Multi-cloud" },
    ],
    spend: [
      { label: "< $1k", value: "< $1k" },
      { label: "$1k–$10k", value: "$1k–$10k" },
      { label: "$10k–$50k", value: "$10k–$50k" },
      { label: "$50k+", value: "$50k+" },
    ],
    role: [
      { label: "Finance", value: "Finance" },
      { label: "Engineering", value: "Engineering" },
      { label: "Leadership", value: "Leadership" },
    ],
    schedule_meeting: [
      { label: "Yes, book now", value: "yes" },
      { label: "No, later", value: "no" },
    ],
  };

  const quickButtons = QUICK_REPLIES[stepId] || [];

  return (
    <div className="h-full flex flex-col font-sans">
      {/* === OUTER SHELL === */}
      <div className="flex flex-col h-full rounded-3xl overflow-hidden bg-slate-50 border border-slate-200 shadow-2xl relative">
        
        {/* === HEADER === */}
        <div className="bg-white/80 backdrop-blur-md px-5 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--brand-primary)] to-[#0C4A6E] flex items-center justify-center text-white shadow-lg shadow-[var(--brand-primary)]/20">
                <Sparkles size={18} fill="currentColor" />
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full"></div>
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">KCX Assistant</h3>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Online</p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-200 flex items-center justify-center transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* === MESSAGES AREA === */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
          
          {/* Welcome Timestamp */}
          <div className="text-center">
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">
              Today
            </span>
          </div>

          <AnimatePresence initial={false}>
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex gap-3 ${m.sender === "bot" ? "justify-start" : "justify-end"}`}
              >
                {/* Bot Avatar */}
                {m.sender === "bot" && (
                  <div className="w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center shrink-0 shadow-sm mt-1">
                    <Bot size={16} className="text-[var(--brand-primary)]" />
                  </div>
                )}

                {/* Bubble */}
                <div className={`
                  max-w-[80%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm
                  ${m.sender === "bot" 
                    ? "bg-white border border-slate-100 text-slate-600 rounded-tl-none" 
                    : "bg-[var(--brand-primary)] text-white rounded-tr-none shadow-[var(--brand-primary)]/20"
                  }
                `}>
                  {m.text && <div className="whitespace-pre-wrap">{m.text}</div>}
                  {m.summary && <SummaryCard summary={m.summary} />}
                </div>

                {/* User Avatar (Optional) */}
                {m.sender === "user" && (
                  <div className="w-8 h-8 rounded-full bg-[var(--brand-secondary)] flex items-center justify-center shrink-0 shadow-sm mt-1 text-white">
                    <User size={14} />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing Indicator */}
          {isTyping && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }} 
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 justify-start"
            >
              <div className="w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center shrink-0 shadow-sm">
                <Bot size={16} className="text-[var(--brand-primary)]" />
              </div>
              <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none px-4 py-2 shadow-sm">
                <TypingIndicator />
              </div>
            </motion.div>
          )}

          <div ref={endRef} />
        </div>

        {/* === QUICK ACTIONS & INPUT === */}
        <div className="bg-white p-4 border-t border-slate-100">
          
          {/* Quick Reply Chips */}
          {!loading && quickButtons.length > 0 && (
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
              {quickButtons.map((btn) => (
                <button
                  key={btn.value}
                  onClick={() => sendMessage(btn.value)}
                  className="
                    whitespace-nowrap px-4 py-2 rounded-xl text-xs font-semibold
                    bg-slate-50 border border-slate-200 text-slate-600
                    hover:bg-[var(--brand-primary)] hover:text-white hover:border-[var(--brand-primary)]
                    transition-all active:scale-95 shadow-sm
                  "
                >
                  {btn.label}
                </button>
              ))}
            </div>
          )}

          {/* Input Field */}
          <div className="relative flex items-center gap-2">
            
            {/* Context Menu (Help/Reset) */}
            <div className="absolute -top-10 right-0 flex gap-2">
               {["back", "help", "skip"].map(cmd => (
                 <button 
                    key={cmd}
                    onClick={() => sendMessage(cmd)}
                    className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-[var(--brand-primary)] hover:bg-white border border-transparent hover:border-slate-200 transition-all text-[10px] uppercase font-bold"
                    title={cmd}
                 >
                    {cmd === 'back' && <ArrowLeft size={14} />}
                    {cmd === 'help' && <HelpCircle size={14} />}
                    {cmd === 'skip' && <SkipForward size={14} />}
                 </button>
               ))}
            </div>

            <input
              ref={inputRef}
              className="
                flex-1 bg-slate-50 border border-slate-200 text-slate-800
                rounded-xl px-4 py-3 text-sm outline-none transition-all
                focus:bg-white focus:border-[var(--brand-primary)] focus:ring-4 focus:ring-[var(--brand-primary-soft)]
                placeholder:text-slate-400
              "
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              disabled={loading}
            />
            
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="
                p-3 rounded-xl bg-[var(--brand-primary)] text-white shadow-lg shadow-[var(--brand-primary)]/30
                hover:bg-[var(--brand-primary-hover)] hover:-translate-y-0.5 active:translate-y-0
                disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
                transition-all duration-200
              "
            >
              <Send size={18} fill="currentColor" />
            </button>
          </div>
          
          <div className="text-center mt-2">
            <span className="text-[10px] text-slate-300 font-medium">Powered by KCX AI</span>
          </div>

        </div>
      </div>
    </div>
  );
}