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
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
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
      className="py-24 bg-[#0f0f11] relative overflow-hidden"
      id="contact"
    >
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute right-0 bottom-0 w-[600px] h-[600px] bg-[#8B2FC9]/10 rounded-full blur-[120px] pointer-events-none"
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-900/30 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-6">
            <motion.span
              animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-[#8B2FC9]"
            />
            Self-serve FinOps
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            Start analyzing your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-[#8B2FC9]">
              cloud spend today.
            </span>
          </h2>

          <p className="text-gray-400 text-lg mb-8 leading-relaxed">
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
                <CheckCircle2 className="text-[#8B2FC9]" size={20} />
                <p className="text-gray-300">{text}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* RIGHT */}
        <motion.div
          variants={slideRightVariants}
          className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 md:p-8 rounded-3xl shadow-2xl relative max-w-lg mx-auto w-full"
        >
          <motion.form variants={containerVariants} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <motion.div variants={formItemVariants}>
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                  First Name
                </label>
                <input
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    setError("");
                  }}
                  className="w-full bg-[#0f0f11]/50 border border-white/10 rounded-lg p-2.5 text-sm text-white"
                  placeholder="Jane"
                />
              </motion.div>

              <motion.div variants={formItemVariants}>
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                  Last Name
                </label>
                <input
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    setError("");
                  }}
                  className="w-full bg-[#0f0f11]/50 border border-white/10 rounded-lg p-2.5 text-sm text-white"
                  placeholder="Doe"
                />
              </motion.div>
            </div>

            <motion.div variants={formItemVariants}>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                Work Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                className="w-full bg-[#0f0f11]/50 border border-white/10 rounded-lg p-2.5 text-sm text-white"
                placeholder="jane@company.com"
              />
            </motion.div>

            <motion.div variants={formItemVariants}>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                I am interested in
              </label>
              <select
                value={interest}
                onChange={(e) => {
                  setInterest(e.target.value);
                  setError("");
                }}
                className="w-full bg-[#0f0f11]/50 border border-white/10 rounded-lg p-2.5 text-sm text-white"
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
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                Message
              </label>
              <textarea
                rows="3"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-[#0f0f11]/50 border border-white/10 rounded-lg p-2.5 text-sm text-white resize-none"
                placeholder="Tell us about your team size or cloud spend..."
              />
            </motion.div>

            {error && (
              <p className="text-center text-[12px] text-red-500">{error}</p>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={handleBookSlot}
              className="w-full py-3.5 bg-[#8B2FC9] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(139,47,201,0.3)]"
            >
              Book Your Audit
              <ArrowRight size={18} />
            </motion.button>

            <p className="text-center text-[10px] text-gray-500">
              We respect your inbox. No spam, ever.
            </p>
          </motion.form>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default InquirySection;
