import React from "react";
import type { LucideIcon } from "lucide-react";
import { Linkedin, Twitter, Github } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-[var(--bg-dark)] border-t border-[var(--border-dark)] pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          
          {/* Column 1: Brand */}
          <div className="md:col-span-1">
            <a href="#" className="flex items-center gap-3 mb-6">
              <img
                src="/KCX.logo.svg"
                alt="KCX. Logo"
                className="h-8 w-auto object-contain shrink-0"
              />
              <div className="leading-none">
                <span className="block text-[1.75rem] font-bold tracking-tight text-[var(--text-on-dark)]">
                  KC<span className="text-[var(--brand-primary)]">X</span>
                </span>
                <span className="mt-0.5 block text-[10px] font-medium tracking-wide text-[var(--text-on-dark-muted)]">
                  FINOPS PLATFORM
                </span>
              </div>
            </a>

            <p className="text-[var(--text-on-dark-muted)] text-sm mb-6">
              Your FinOps Operating Partner. We help you hit plan and expand
              margins.
            </p>

            <div className="space-y-3">
              <p className="text-xs font-semibold text-[var(--text-on-dark)] uppercase tracking-wider">
                Subscribe to Updates
              </p>

              <div className="flex">
                <input
                  type="email"
                  placeholder="Email address"
                  className="bg-white border border-[var(--border-light)] rounded-l-[var(--radius-md)] px-3 py-2 text-sm text-[var(--text-primary)] w-full outline-none"
                />
                <button className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white px-4 py-2 rounded-r-[var(--radius-md)] text-sm font-medium transition-colors">
                  Join
                </button>
              </div>
            </div>
          </div>

          {/* Column 2: Services */}
          <div>
            <h4 className="text-[var(--text-on-dark)] font-bold mb-6">
              Services
            </h4>
            <ul className="space-y-4 text-sm text-[var(--text-on-dark-muted)]">
              {[
                "Cloud FinOps Audit",
                "FinOps Analytics",
                "Managed Partnership",
                "90-Day Plans",
              ].map((label) => (
                <li key={label}>
                  <a
                    href="#"
                    className="hover:text-[var(--brand-primary)] transition-colors"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Company */}
          <div>
            <h4 className="text-[var(--text-on-dark)] font-bold mb-6">
              Company
            </h4>
            <ul className="space-y-4 text-sm text-[var(--text-on-dark-muted)]">
              {["About KCX.", "Case Studies", "Careers", "Contact"].map(
                (label) => (
                  <li key={label}>
                    <a
                      href="#"
                      className="hover:text-[var(--brand-primary)] transition-colors"
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
            <h4 className="text-[var(--text-on-dark)] font-bold mb-6">
              Legal
            </h4>

            <ul className="space-y-4 text-sm text-[var(--text-on-dark-muted)] mb-8">
              <li>
                <Link
                  to="/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[var(--brand-primary)] transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms-of-service"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[var(--brand-primary)] transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>

            <div className="flex gap-4">
              {[Linkedin, Twitter, Github].map((Icon: LucideIcon, idx) => (
                <a
                  key={idx}
                  href="#"
                  className="w-10 h-10 rounded-full bg-white/5 border border-[var(--border-dark)] flex items-center justify-center text-[var(--text-on-dark-muted)] hover:text-[var(--brand-primary)] hover:border-[var(--brand-primary)] transition-colors"
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[var(--border-dark)] flex flex-col items-center gap-4 text-xs text-[var(--text-on-dark-muted)]">
          <p>&copy; 2025 KCX. All Rights Reserved.</p>
          <span>Vadodara, India</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
