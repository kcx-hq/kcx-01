import React, { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const Navbar = ({ showJourney = () => {} }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const navigate = useNavigate();

  // Scroll handler for navbar background and active section detection
  useEffect(() => {
    const sections = ['hero', 'about', 'services', 'pricing', 'contact', 'how-it-works'];
    
    const updateActiveSection = () => {
      const scrollPosition = window.scrollY + 150; // Offset for navbar height
      
      // Find the section currently in view
      for (let i = sections.length - 1; i >= 0; i--) {
        const sectionId = sections[i];
        const element = document.getElementById(sectionId);
        if (element) {
          const offsetTop = element.offsetTop;
          if (scrollPosition >= offsetTop) {
            setActiveSection(sectionId);
            return;
          }
        }
      }
      
      // If at top, set hero as active
      if (window.scrollY < 100) {
        setActiveSection('hero');
      }
    };

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
      updateActiveSection();
    };

    // Initial check
    updateActiveSection();
    setIsScrolled(window.scrollY > 20);

    // Update on scroll
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleNavClick = (path) => {
    setIsMobileMenuOpen(false);
    if (path.startsWith("#")) {
      if (window.location.pathname !== "/") {
        navigate("/");
        setTimeout(() => {
          const element = document.getElementById(path.substring(1));
          if (element) element.scrollIntoView({ behavior: "smooth" });
        }, 100);
      } else {
        const element = document.getElementById(path.substring(1));
        if (element) element.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      navigate(path);
    }
  };

  const handleJourneyClick = () => {
    setIsMobileMenuOpen(false);
    // Call showJourney function to trigger section visibility
    if (showJourney) {
      showJourney();
    }
    // Smooth scroll to the section
    setTimeout(() => {
      const journeySection = document.getElementById('how-it-works');
      if (journeySection) {
        journeySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  return (
    <>
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-[#0f0f11]/80 backdrop-blur-md border-b border-white/10 py-4"
            : "bg-transparent py-6"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* --- LOGO --- */}
          <Link to="/" className="flex items-center gap-2 group">
            <img
              src="/k&cologo.svg"
              alt="K&Co Logo"
              className="w-10 h-10 object-contain group-hover:opacity-90 transition-opacity"
            />
            <span className="text-2xl font-bold tracking-tight text-white group-hover:text-white/90 transition-colors">
              K&Co.
            </span>
          </Link>

          {/* --- DESKTOP NAVIGATION --- */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
            <button
              onClick={() => handleNavClick("#about")}
              className={`hover:text-white transition-colors relative group ${
                activeSection === 'about' ? 'text-white' : ''
              }`}
            >
              About
              <span className={`absolute -bottom-1 left-0 h-0.5 bg-[#a02ff1] transition-all ${
                activeSection === 'about' ? 'w-full' : 'w-0 group-hover:w-full'
              }`}></span>
            </button>
            <button
              onClick={() => handleNavClick("#services")}
              className={`hover:text-white transition-colors relative group ${
                activeSection === 'services' ? 'text-white' : ''
              }`}
            >
              Services
              <span className={`absolute -bottom-1 left-0 h-0.5 bg-[#a02ff1] transition-all ${
                activeSection === 'services' ? 'w-full' : 'w-0 group-hover:w-full'
              }`}></span>
            </button>

            <button
              onClick={() => handleNavClick("#pricing")}
              className={`hover:text-white transition-colors relative group ${
                activeSection === 'pricing' ? 'text-white' : ''
              }`}
            >
              Pricing
              <span className={`absolute -bottom-1 left-0 h-0.5 bg-[#a02ff1] transition-all ${
                activeSection === 'pricing' ? 'w-full' : 'w-0 group-hover:w-full'
              }`}></span>
            </button>

            <button
              onClick={() => handleNavClick("#contact")}
              className={`hover:text-white transition-colors relative group ${
                activeSection === 'contact' ? 'text-white' : ''
              }`}
            >
              Contact
              <span className={`absolute -bottom-1 left-0 h-0.5 bg-[#a02ff1] transition-all ${
                activeSection === 'contact' ? 'w-full' : 'w-0 group-hover:w-full'
              }`}></span>
            </button>

            {/* UPDATED CTA BUTTON */}
            <a
              href="#how-it-works"
              onClick={(e) => {
                e.preventDefault();
                handleJourneyClick();
              }}
              className={`px-5 py-2.5 rounded-full border transition-all duration-300 font-semibold inline-block cursor-pointer ${
                activeSection === 'how-it-works'
                  ? 'border-[#a02ff1] bg-[#a02ff1] text-white shadow-[0_0_20px_rgba(160,47,241,0.4)]'
                  : 'border-white/20 text-white hover:bg-[#a02ff1] hover:border-[#a02ff1] shadow-[0_0_15px_rgba(160,47,241,0)] hover:shadow-[0_0_20px_rgba(160,47,241,0.4)]'
              }`}
            >
              How it Works
            </a>
          </div>

          {/* --- MOBILE MENU TOGGLE --- */}
          <button
            className="md:hidden text-white hover:text-[#a02ff1] transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </nav>

      {/* --- MOBILE MENU OVERLAY --- */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-[#0f0f11] pt-24 px-6 md:hidden animate-in slide-in-from-top-10 fade-in duration-200">
          <div className="flex flex-col gap-6 text-xl font-bold text-gray-300">
            <button
              onClick={() => handleNavClick("#services")}
              className={`text-left transition-colors ${
                activeSection === 'services' ? 'text-[#a02ff1]' : 'hover:text-[#a02ff1]'
              }`}
            >
              Services
            </button>
            <button
              onClick={() => handleNavClick("#about")}
              className={`text-left transition-colors ${
                activeSection === 'about' ? 'text-[#a02ff1]' : 'hover:text-[#a02ff1]'
              }`}
            >
              About
            </button>
            <button
              onClick={() => handleNavClick("#pricing")}
              className={`text-left transition-colors ${
                activeSection === 'pricing' ? 'text-[#a02ff1]' : 'hover:text-[#a02ff1]'
              }`}
            >
              Pricing
            </button>
            <button
              onClick={() => handleNavClick("#contact")}
              className={`text-left transition-colors ${
                activeSection === 'contact' ? 'text-[#a02ff1]' : 'hover:text-[#a02ff1]'
              }`}
            >
              Contact
            </button>

            {/* Mobile CTA */}
            <button
              onClick={handleJourneyClick}
              className="w-full py-4 bg-[#a02ff1] text-white rounded-xl mt-4 shadow-lg shadow-purple-900/50"
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
