import React from "react";
import { TrendingUp, AlertTriangle, Target, Search } from "lucide-react";
import { motion } from "framer-motion";

const FinOpsSection = () => {
  // Animation Variants for Parent Container (The Grid)
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  // Animation Variants for Children (The Rows)
  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  return (
    <section className="py-24 bg-[var(--bg-main)] relative overflow-hidden">
      {/* Animated Vertical Line */}
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        whileInView={{ height: "100%", opacity: 1 }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
        viewport={{ once: true }}
        className="absolute top-0 left-1/2 -translate-x-1/2 w-px bg-gradient-to-b from-transparent via-[var(--brand-secondary)]/30 to-transparent"
      />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-6">
            Why <span className="text-[var(--brand-primary)]">FinOps</span>{" "}
            Matters Now
          </h2>

          <p className="text-[var(--text-secondary)] text-lg">
            Cloud spending is the new "dark matter". We help you move fast{" "}
            <em>without</em> breaking the bank.
          </p>
        </motion.div>

        {/* Feature Grid with Staggered Animation */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 gap-12"
        >
          <FeatureRow
            icon={AlertTriangle}
            title="Stop the Bleeding"
            desc="30% of cloud spend is wasted. We surface this instantly."
            tone="warning"
            variants={itemVariants}
          />
          <FeatureRow
            icon={TrendingUp}
            title="Expand Margins"
            desc="Every dollar saved goes directly to your bottom line."
            tone="success"
            variants={itemVariants}
          />
          <FeatureRow
            icon={Search}
            title="Granular Visibility"
            desc="You can't fix what you can't see. Executive dashboards included."
            tone="info"
            variants={itemVariants}
          />
          <FeatureRow
            icon={Target}
            title="Forecast Confidence"
            desc="No more surprises. Fix leaks before they become board issues."
            tone="brand"
            variants={itemVariants}
          />
        </motion.div>
      </div>
    </section>
  );
};

// Extracted Component
const FeatureRow = ({ icon: Icon, title, desc, tone, variants }) => {
  // map tones to your theme tokens
  const toneMap = {
    warning: {
      bg: "bg-[var(--highlight-yellow)]",
      border: "border-[var(--border-light)]",
      icon: "text-[var(--brand-secondary)]",
    },
    success: {
      bg: "bg-[var(--highlight-green)]",
      border: "border-[var(--border-light)]",
      icon: "text-[var(--brand-primary)]",
    },
    info: {
      bg: "bg-[var(--highlight-purple)]",
      border: "border-[var(--border-light)]",
      icon: "text-[var(--brand-secondary)]",
    },
    brand: {
      bg: "bg-[var(--bg-soft)]",
      border: "border-[var(--border-light)]",
      icon: "text-[var(--brand-secondary)]",
    },
  };

  const styles = toneMap[tone] || toneMap.brand;

  return (
    <motion.div variants={variants} className="flex gap-6 group cursor-default">
      <div
        className={`
          shrink-0 w-12 h-12 rounded-[var(--radius-md)]
          ${styles.bg} flex items-center justify-center
          border ${styles.border}
          group-hover:scale-110
          group-hover:shadow-[0_0_15px_rgba(0,0,0,0.08)]
          transition-all duration-300
        `}
      >
        <Icon className={styles.icon} size={24} />
      </div>

      <div>
        <h3 className="text-xl text-[var(--text-primary)] font-bold mb-2 group-hover:opacity-90 transition-opacity">
          {title}
        </h3>
        <p className="text-[var(--text-secondary)] leading-relaxed group-hover:text-[var(--text-primary)] transition-colors">
          {desc}
        </p>
      </div>
    </motion.div>
  );
};

export default FinOpsSection;
