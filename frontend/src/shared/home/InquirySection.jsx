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
      className="py-24 bg-[var(--bg-main)] relative overflow-hidden"
      id="contact"
    >
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.18, 0.32, 0.18] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute right-0 bottom-0 w-[600px] h-[600px] bg-[var(--highlight-purple)] rounded-full blur-[120px] pointer-events-none"
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--highlight-purple)] border border-[var(--border-light)] text-[var(--brand-secondary)] text-xs font-semibold mb-6 shadow-[var(--shadow-sm)]">
            <motion.span
              animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-[var(--brand-primary)]"
            />
            Self-serve FinOps
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-6 leading-tight">
            Start analyzing your <br />
            <span
              className="text-transparent bg-clip-text"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, var(--text-primary), var(--brand-secondary))",
              }}
            >
              cloud spend today.
            </span>
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
                className="flex items-center gap-3"
              >
                <CheckCircle2 className="text-[var(--brand-secondary)]" size={20} />
                <p className="text-[var(--text-secondary)]">{text}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* RIGHT */}
        <motion.div
          variants={slideRightVariants}
          className="bg-[var(--bg-surface)]/85 backdrop-blur-xl border border-[var(--border-light)] p-6 md:p-8 rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] relative max-w-lg mx-auto w-full"
        >
          <motion.form variants={containerVariants} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <motion.div variants={formItemVariants}>
                <label className="text-[11px] font-semibold text-[var(--text-disabled)] uppercase tracking-wide">
                  First Name
                </label>
                <input
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    setError("");
                  }}
                  className="w-full bg-[var(--bg-main)] border border-[var(--border-light)] rounded-[var(--radius-md)] p-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/40"
                  placeholder="Jane"
                />
              </motion.div>

              <motion.div variants={formItemVariants}>
                <label className="text-[11px] font-semibold text-[var(--text-disabled)] uppercase tracking-wide">
                  Last Name
                </label>
                <input
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    setError("");
                  }}
                  className="w-full bg-[var(--bg-main)] border border-[var(--border-light)] rounded-[var(--radius-md)] p-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/40"
                  placeholder="Doe"
                />
              </motion.div>
            </div>

            <motion.div variants={formItemVariants}>
              <label className="text-[11px] font-semibold text-[var(--text-disabled)] uppercase tracking-wide">
                Work Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                className="w-full bg-[var(--bg-main)] border border-[var(--border-light)] rounded-[var(--radius-md)] p-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/40"
                placeholder="jane@company.com"
              />
            </motion.div>

            <motion.div variants={formItemVariants}>
              <label className="text-[11px] font-semibold text-[var(--text-disabled)] uppercase tracking-wide">
                I am interested in
              </label>
              <select
                value={interest}
                onChange={(e) => {
                  setInterest(e.target.value);
                  setError("");
                }}
                className="w-full bg-[var(--bg-main)] border border-[var(--border-light)] rounded-[var(--radius-md)] p-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/40"
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
              <label className="text-[11px] font-semibold text-[var(--text-disabled)] uppercase tracking-wide">
                Message
              </label>
              <textarea
                rows="3"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-[var(--bg-main)] border border-[var(--border-light)] rounded-[var(--radius-md)] p-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/40"
                placeholder="Tell us about your team size or cloud spend..."
              />
            </motion.div>

            {error && <p className="text-center text-[12px] text-red-600">{error}</p>}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={handleBookSlot}
              className="w-full py-3.5 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-[var(--radius-md)] flex items-center justify-center gap-2 shadow-[var(--shadow-md)]"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, var(--brand-secondary), var(--brand-primary))",
              }}
            >
              Book Your Audit
              <ArrowRight size={18} />
            </motion.button>

            <p className="text-center text-[10px] text-[var(--text-disabled)]">
              We respect your inbox. No spam, ever.
            </p>
          </motion.form>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default InquirySection;
