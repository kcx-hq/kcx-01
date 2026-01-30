import React from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';

const TermsOfService = () => {
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 }
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f11] font-sans">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 pt-24 pb-16">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="bg-[#1a1b20] border border-white/10 rounded-xl p-8 md:p-10 shadow-2xl"
        >
          <motion.div variants={itemVariants}>
            <h1 className="text-4xl font-bold text-white mb-2">Terms of Use (Early Access)</h1>
            <p className="text-gray-500 text-sm mb-8">Last Updated: 12 January 2026</p>
          </motion.div>
          
          <div className="text-gray-400 text-base leading-relaxed space-y-6">
            <motion.section variants={itemVariants}>
              <h2 className="text-2xl font-semibold text-white mb-4">Early Access Notice</h2>
              <p className="mb-4">
                K&Co currently provides its platform in an early access stage. Features, functionality, and availability may change without prior notice as the platform continues to evolve.
              </p>
              <p>
                By accessing or using the K&Co platform, you acknowledge that the service is provided in its current form and may be modified, suspended, or discontinued at any time.
              </p>
            </motion.section>

            <motion.section variants={itemVariants}>
              <h2 className="text-2xl font-semibold text-white mb-4">Acceptance of Terms</h2>
              <p>
                By creating an account or using the K&Co platform, you agree to these Terms of Use. If you do not agree, you should not access or use the service.
              </p>
            </motion.section>

            <motion.section variants={itemVariants}>
              <h2 className="text-2xl font-semibold text-white mb-4">Use of the Platform</h2>
              <p className="mb-3">
                You agree to use the K&Co platform only for lawful and intended purposes. You must not:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Attempt to gain unauthorized access to the platform or its systems</li>
                <li>Interfere with or disrupt the service or infrastructure</li>
                <li>Misuse the platform in a manner that could harm K&Co or other users</li>
              </ul>
            </motion.section>

            <motion.section variants={itemVariants}>
              <h2 className="text-2xl font-semibold text-white mb-4">Accounts and Security</h2>
              <p>
                You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. K&Co is not responsible for any loss or damage resulting from unauthorized access caused by your failure to protect your credentials.
              </p>
            </motion.section>

            <motion.section variants={itemVariants}>
              <h2 className="text-2xl font-semibold text-white mb-4">Service Availability</h2>
              <p>
                The K&Co platform is provided on a best-effort basis. We do not guarantee uninterrupted access, continuous availability, or error-free operation. Features may be added, modified, or removed as part of ongoing development.
              </p>
            </motion.section>

            <motion.section variants={itemVariants}>
              <h2 className="text-2xl font-semibold text-white mb-4">Termination</h2>
              <p>
                K&Co may suspend or terminate access to the platform at any time, with or without notice, if these terms are violated or if continued access may pose a risk to the platform or its users.
              </p>
            </motion.section>

            <motion.section variants={itemVariants}>
              <h2 className="text-2xl font-semibold text-white mb-4">Changes to These Terms</h2>
              <p>
                These Terms of Use may be updated from time to time. Continued use of the platform after changes are published constitutes acceptance of the updated terms.
              </p>
            </motion.section>

            <motion.section variants={itemVariants}>
              <h2 className="text-2xl font-semibold text-white mb-4">Contact</h2>
              <p>
                For questions regarding these Terms of Use, please contact us through the Contact Us section of our website:{' '}
                <a 
                  href="https://www.kandco.io/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[#8B2FC9] hover:text-[#a02ff1] underline"
                >
                  https://www.kandco.io/
                </a>
              </p>
            </motion.section>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default TermsOfService;
