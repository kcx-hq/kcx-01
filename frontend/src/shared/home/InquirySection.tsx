import React, { useState } from "react";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const InquirySection = () => {
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [interest, setInterest] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const isFormValid =
    firstName.trim() && lastName.trim() && email.trim() && interest.trim();

  const finalMessage = `Interest: ${interest}\n\nMessage: ${
    message.trim() || "N/A"
  }`;

  const fullName = `${firstName.trim()} ${lastName.trim()}`;

  function handleBookSlot() {
    if (!isFormValid) {
      setError("Please fill in all required fields.");
      return;
    }

    setError("");

    navigate("/book-slot", {
      state: {
        inquiry: {
          name: fullName,
          email: email.trim(),
          message: finalMessage,
        },
      },
    });
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.1 },
    },
  };

  const slideLeftVariants = {
    hidden: { x: -40, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  const slideRightVariants = {
    hidden: { x: 40, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  const formItemVariants = {
    hidden: { y: 15, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.4 },
    },
  };

  return (
    <section
      className="py-28 bg-[var(--bg-soft)] relative overflow-hidden"
      id="contact"
    >
      {/* Background accents */}
      <motion.div
        animate={{ scale: [1, 1.12, 1], opacity: [0.16, 0.28, 0.16] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute right-0 bottom-0 w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none"
        style={{ backgroundColor: "rgba(35,162,130,0.2)" }}
      />
      <motion.div
        animate={{ scale: [1.05, 1, 1.05], opacity: [0.1, 0.18, 0.1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute -left-24 -top-24 w-[520px] h-[520px] rounded-full blur-[120px] pointer-events-none"
        style={{ backgroundColor: "rgba(25,38,48,0.12)" }}
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center relative z-10"
      >
        {/* LEFT */}
        <motion.div variants={slideLeftVariants}>
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-[var(--bg-dark)] text-xs font-semibold mb-6 shadow-[var(--shadow-sm)]">
            <motion.span
              animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-[var(--brand-primary)]"
            />
            Self-serve FinOps
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-6 leading-tight">
            Start analyzing your <br />
            <span className="text-[var(--brand-primary)]">cloud spend today.</span>
          </h2>

          <p className="text-[var(--text-secondary)] text-lg mb-8 leading-relaxed">
            Upload your cloud billing data to get instant visibility into costs,
            unit economics, and inefficiencies — without slowing down engineering
            teams.
          </p>

          <div className="space-y-4 mb-10">
            {[
              "Built for engineering-led teams",
              "Self-serve platform with instant insights",
              "Secure by default (read-only analysis)",
            ].map((text, index) => (
              <motion.div
                key={index}
                variants={formItemVariants}
                className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border-light)] bg-white/90 px-3 py-2 shadow-[var(--shadow-sm)]"
              >
                <CheckCircle2
                  className="text-[var(--brand-primary)]"
                  size={20}
                />
                <p className="text-[var(--text-primary)]">{text}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* RIGHT */}
        <motion.div
          variants={slideRightVariants}
          className="bg-white border border-slate-200 p-6 md:p-8 rounded-[var(--radius-lg)] shadow-[0_24px_60px_-32px_rgba(15,23,42,0.45)] relative max-w-lg mx-auto w-full overflow-hidden"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-[var(--brand-primary)]" />
          <motion.form variants={containerVariants} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <motion.div variants={formItemVariants}>
                <label className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
                  First Name
                </label>
                <input
                  value={firstName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setFirstName(e.target.value);
                    setError("");
                  }}
                  className="w-full bg-white border border-[var(--border-light)] rounded-[var(--radius-md)] p-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] shadow-sm focus:outline-none focus:border-[var(--brand-primary)] focus:ring-4 focus:ring-[var(--brand-primary)]/20"
                  placeholder="Jane"
                />
              </motion.div>

              <motion.div variants={formItemVariants}>
                <label className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
                  Last Name
                </label>
                <input
                  value={lastName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setLastName(e.target.value);
                    setError("");
                  }}
                  className="w-full bg-white border border-[var(--border-light)] rounded-[var(--radius-md)] p-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] shadow-sm focus:outline-none focus:border-[var(--brand-primary)] focus:ring-4 focus:ring-[var(--brand-primary)]/20"
                  placeholder="Doe"
                />
              </motion.div>
            </div>

            <motion.div variants={formItemVariants}>
              <label className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
                Work Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                className="w-full bg-white border border-[var(--border-light)] rounded-[var(--radius-md)] p-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] shadow-sm focus:outline-none focus:border-[var(--brand-primary)] focus:ring-4 focus:ring-[var(--brand-primary)]/20"
                placeholder="jane@company.com"
              />
            </motion.div>

            <motion.div variants={formItemVariants}>
              <label className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
                I am interested in
              </label>
              <select
                value={interest}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  setInterest(e.target.value);
                  setError("");
                }}
                className="w-full bg-white border border-[var(--border-light)] rounded-[var(--radius-md)] p-2.5 text-sm text-[var(--text-primary)] shadow-sm focus:outline-none focus:border-[var(--brand-primary)] focus:ring-4 focus:ring-[var(--brand-primary)]/20"
              >
                <option value="">Select an option</option>
                <option value="FinOps Snapshot">FinOps Snapshot</option>
                <option value="FinOps Continuous Integration">
                  FinOps Continuous Integration
                </option>
                <option value="Other Inquiry">Other Inquiry</option>
              </select>
            </motion.div>

            <motion.div variants={formItemVariants}>
              <label className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
                Message
              </label>
              <textarea
                rows={4}
                value={message}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
                className="w-full bg-white border border-[var(--border-light)] rounded-[var(--radius-md)] p-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] resize-none shadow-sm focus:outline-none focus:border-[var(--brand-primary)] focus:ring-4 focus:ring-[var(--brand-primary)]/20"
                placeholder="Tell us about your team size or cloud spend..."
              />
            </motion.div>

            {error && (
              <p className="rounded-[var(--radius-sm)] border border-red-200 bg-red-50 px-3 py-2 text-center text-[12px] font-medium text-red-700">
                {error}
              </p>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={handleBookSlot}
              className={`w-full py-3.5 text-white font-bold rounded-[var(--radius-md)] flex items-center justify-center gap-2 transition-all ${
                isFormValid
                  ? "bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] shadow-[0_18px_30px_-18px_rgba(35,162,130,0.65)]"
                  : "bg-slate-300 cursor-not-allowed"
              }`}
            >
              Book Your Audit
              <ArrowRight size={18} />
            </motion.button>

            <p className="text-center text-[10px] text-[var(--text-secondary)]">
              We respect your inbox. No spam, ever.
            </p>
          </motion.form>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default InquirySection;
