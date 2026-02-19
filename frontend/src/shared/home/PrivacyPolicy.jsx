import React from "react";
import { motion } from "framer-motion";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { Link } from "react-router-dom";

const PrivacyPolicy = () => {
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut", staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] font-sans">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 pt-24 pb-16">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="bg-[var(--bg-surface)] border border-[var(--border-light)] rounded-[var(--radius-lg)] p-8 md:p-10 shadow-[var(--shadow-md)]"
        >
          <motion.div variants={itemVariants}>
            <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-2">
              Privacy Policy (Early Access)
            </h1>
            <p className="text-[var(--text-disabled)] text-sm mb-8">
              Last Updated: 12 January 2026
            </p>
          </motion.div>

          <div className="text-[var(--text-secondary)] text-base leading-relaxed space-y-6">
            <motion.section variants={itemVariants}>
              <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4">
                Early Access Privacy Notice
              </h2>
              <p>
                This Privacy Policy applies to the K&amp;Co platform during its early
                access phase. Our data practices may evolve as the platform grows, and
                this policy may be updated accordingly.
              </p>
            </motion.section>

            <motion.section variants={itemVariants}>
              <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4">
                Information We Collect
              </h2>
              <p className="mb-3">
                We collect only the information necessary to operate and improve our
                services, which may include:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Name and email address</li>
                <li>Company or organization information</li>
                <li>Account authentication data</li>
                <li>
                  Basic usage and interaction data for platform analytics and monitoring
                </li>
              </ul>
            </motion.section>

            <motion.section variants={itemVariants}>
              <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4">
                How We Use Information
              </h2>
              <p className="mb-3">We use collected information to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide and manage access to the K&amp;Co platform</li>
                <li>Authenticate users and maintain accounts</li>
                <li>Improve platform functionality and user experience</li>
                <li>Communicate important service-related updates</li>
                <li>Maintain platform security and reliability</li>
              </ul>
            </motion.section>

            <motion.section variants={itemVariants}>
              <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4">
                Data Sharing
              </h2>
              <p className="mb-3">K&amp;Co does not sell personal data.</p>
              <p>
                Information may be shared only with trusted third-party service
                providers, such as cloud infrastructure or analytics providers,
                strictly for the purpose of operating and improving the platform.
              </p>
            </motion.section>

            <motion.section variants={itemVariants}>
              <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4">
                Data Security
              </h2>
              <p>
                We apply reasonable technical and organizational measures to protect
                user data. However, no system can be guaranteed to be completely
                secure.
              </p>
            </motion.section>

            <motion.section variants={itemVariants}>
              <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4">
                Data Retention
              </h2>
              <p>
                User data is retained for as long as an account remains active or as
                necessary to provide the service. Data may be deleted upon account
                closure or upon reasonable request, subject to operational
                requirements.
              </p>
            </motion.section>

            <motion.section variants={itemVariants}>
              <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4">
                User Choices
              </h2>
              <p>
                Users may request access to, correction of, or deletion of their
                personal information by contacting us through the method below.
              </p>
            </motion.section>

            <motion.section variants={itemVariants}>
              <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4">
                Contact Us
              </h2>
              <p>
                If you have any questions... please reach out via the Contact Us page
                on our website:{" "}
                <Link
                  to="/"
                  className="text-[var(--brand-secondary)] hover:text-[var(--brand-primary)] underline"
                >
                  Return to Home
                </Link>
              </p>
            </motion.section>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
