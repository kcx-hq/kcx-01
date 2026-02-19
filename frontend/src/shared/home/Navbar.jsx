import React, { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const Navbar = ({ showJourney = () => {} }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const sections = ["hero", "about", "services", "pricing", "contact", "how-it-works"];

    const updateActiveSection = () => {
      const scrollPosition = window.scrollY + 150;

      for (let i = sections.length - 1; i >= 0; i--) {
        const id = sections[i];
        const el = document.getElementById(id);
        if (el && scrollPosition >= el.offsetTop) {
          setActiveSection(id);
          return;
        }
      }

      if (window.scrollY < 100) setActiveSection("hero");
    };

    const onScroll = () => {
      setIsScrolled(window.scrollY > 20);
      updateActiveSection();
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNavClick = (hash) => {
    setIsMobileMenuOpen(false);
    if (!hash.startsWith("#")) {
      navigate(hash);
      return;
    }

    if (window.location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const underline = (active) =>
    `absolute -bottom-1 left-0 h-0.5 transition-all ${
      active ? "w-full" : "w-0 group-hover:w-full"
    }`;

  return (
    <>
      {/* ================= NAVBAR ================= */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          isScrolled ? "py-4" : "py-6"
        }`}
        style={{
          backgroundColor: "var(--bg-dark)",
          borderBottom: "1px solid var(--border-dark)",
          boxShadow: isScrolled ? "var(--shadow-sm)" : "none",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-[var(--text-on-dark)]">
              KCX
              <span style={{ color: "var(--brand-primary)" }}>.</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[var(--text-on-dark-muted)]">
            {[
              ["About", "about"],
              ["Services", "services"],
              ["Pricing", "pricing"],
              ["Contact", "contact"],
            ].map(([label, id]) => (
              <button
                key={id}
                onClick={() => handleNavClick(`#${id}`)}
                className={`relative group transition-colors ${
                  activeSection === id
                    ? "text-[var(--text-on-dark)]"
                    : "hover:text-[var(--text-on-dark)]"
                }`}
              >
                {label}
                <span
                  className={underline(activeSection === id)}
                  style={{ backgroundColor: "var(--brand-primary)" }}
                />
              </button>
            ))}

            {/* CTA */}
            <button
              onClick={() => handleNavClick("#how-it-works")}
              className="ml-2 px-5 py-2.5 rounded-full font-semibold transition-colors"
              style={{
                backgroundColor: "var(--brand-primary)",
                color: "#ffffff",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "var(--brand-primary-hover)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "var(--brand-primary)")
              }
            >
              How it Works
            </button>
          </div>

          {/* Mobile Toggle */}
          <button
            className="md:hidden text-[var(--text-on-dark)]"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </nav>

      {/* ================= MOBILE MENU ================= */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 pt-24 px-6 md:hidden"
          style={{
            backgroundColor: "var(--bg-dark)",
          }}
        >
          <div className="flex flex-col gap-6 text-xl font-bold text-[var(--text-on-dark)]">
            {[
              ["Services", "services"],
              ["About", "about"],
              ["Pricing", "pricing"],
              ["Contact", "contact"],
            ].map(([label, id]) => (
              <button
                key={id}
                onClick={() => handleNavClick(`#${id}`)}
                className="text-left hover:opacity-90"
              >
                {label}
              </button>
            ))}

            <button
              onClick={() => handleNavClick("#how-it-works")}
              className="mt-4 w-full py-4 rounded-xl font-bold transition-colors"
              style={{
                backgroundColor: "var(--brand-primary)",
                color: "#ffffff",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "var(--brand-primary-hover)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "var(--brand-primary)")
              }
            >
              How it Works
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
