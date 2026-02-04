import React from "react";
import { Linkedin, Twitter, Github } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-[var(--bg-surface)] border-t border-[var(--border-light)] pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Column 1: Brand & Logo */}
          <div className="md:col-span-1">
            {/* --- LOGO SECTION --- */}
            <a href="#" className="flex items-center gap-2 mb-6">
              <img
                src="/k&cologo.svg"
                alt="K&Co Logo"
                className="w-10 h-10 object-contain"
              />
              <span className="text-xl font-bold text-[var(--text-primary)]">
                K&amp;Co.
              </span>
            </a>

            <p className="text-[var(--text-secondary)] text-sm mb-6">
              Your FinOps Operating Partner. We help you hit plan and expand
              margins.
            </p>

            <div className="space-y-3">
              <p className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                Subscribe to Updates
              </p>

              <div className="flex">
                <input
                  type="email"
                  placeholder="Email address"
                  className="bg-[var(--bg-main)] border border-[var(--border-light)] rounded-l-[var(--radius-md)] px-3 py-2 text-sm text-[var(--text-primary)] w-full outline-none"
                />
                <button className="bg-[var(--brand-secondary)] text-white px-3 py-2 rounded-r-[var(--radius-md)] text-sm font-medium">
                  Join
                </button>
              </div>
            </div>
          </div>

          {/* Column 2: Services */}
          <div>
            <h4 className="text-[var(--text-primary)] font-bold mb-6">
              Services
            </h4>
            <ul className="space-y-4 text-sm text-[var(--text-secondary)]">
              {[
                "Cloud FinOps Audit",
                "FinOps Analytics",
                "Managed Partnership",
                "90-Day Plans",
              ].map((label) => (
                <li key={label}>
                  <a
                    href="#"
                    className="hover:text-[var(--brand-secondary)] transition-colors"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Company */}
          <div>
            <h4 className="text-[var(--text-primary)] font-bold mb-6">
              Company
            </h4>
            <ul className="space-y-4 text-sm text-[var(--text-secondary)]">
              {["About K&Co", "Case Studies", "Careers", "Contact"].map(
                (label) => (
                  <li key={label}>
                    <a
                      href="#"
                      className="hover:text-[var(--brand-secondary)] transition-colors"
                    >
                      {label}
                    </a>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Column 4: Legal & Social */}
          <div>
            <h4 className="text-[var(--text-primary)] font-bold mb-6">Legal</h4>

            <ul className="space-y-4 text-sm text-[var(--text-secondary)] mb-8">
              <li>
                <Link
                  to="/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[var(--text-primary)] transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms-of-service"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[var(--text-primary)] transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>

            <div className="flex gap-4">
              <a
                href="https://www.linkedin.com/company/kco-finops/"
                className="w-10 h-10 rounded-full bg-[var(--bg-main)] border border-[var(--border-light)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--brand-secondary)] transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin size={18} />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-[var(--bg-main)] border border-[var(--border-light)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--brand-secondary)] transition-colors"
                aria-label="Twitter"
              >
                <Twitter size={18} />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-[var(--bg-main)] border border-[var(--border-light)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--brand-secondary)] transition-colors"
                aria-label="GitHub"
              >
                <Github size={18} />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[var(--border-light)] flex flex-col items-center justify-center gap-4 text-xs text-[var(--text-disabled)]">
          <p>&copy; 2025 K&amp;Co. All Rights Reserved.</p>
          <div className="flex gap-6">
            <span>Vadodara, India</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
