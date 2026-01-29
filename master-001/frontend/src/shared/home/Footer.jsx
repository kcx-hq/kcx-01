import React from "react";
import { Linkedin, Twitter, Github } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-black border-t border-white/10 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          
          {/* Column 1: Brand & Logo */}
          <div className="md:col-span-1">
            
            {/* --- LOGO SECTION --- */}
            <a href="#" className="flex items-center gap-2 mb-6 group">
              <img 
                src="/k&cologo.svg" 
                alt="K&Co Logo" 
                className="w-10 h-10 object-contain group-hover:opacity-90 transition-opacity"
              />
              <span className="text-xl font-bold text-white group-hover:text-white/90 transition-colors">
                K&Co.
              </span>
            </a>

            <p className="text-gray-400 text-sm mb-6">
              Your FinOps Operating Partner. We help you hit plan and
              expand margins.
            </p>
            <div className="space-y-3">
              <p className="text-xs font-semibold text-white uppercase tracking-wider">
                Subscribe to Updates
              </p>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Email address"
                  className="bg-white/5 border border-white/10 rounded-l-lg px-3 py-2 text-sm text-white w-full focus:outline-none focus:border-[#8B2FC9]"
                />
                <button className="bg-[#8B2FC9] hover:bg-purple-700 text-white px-3 py-2 rounded-r-lg text-sm font-medium transition-colors">
                  Join
                </button>
              </div>
            </div>
          </div>

          {/* Column 2: Services */}
          <div>
            <h4 className="text-white font-bold mb-6">Services</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li>
                <a href="#" className="hover:text-[#8B2FC9] transition-colors">
                  Cloud FinOps Audit
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#8B2FC9] transition-colors">
                  FinOps Analytics
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#8B2FC9] transition-colors">
                  Managed Partnership
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#8B2FC9] transition-colors">
                  90-Day Plans
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Company */}
          <div>
            <h4 className="text-white font-bold mb-6">Company</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li>
                <a href="#" className="hover:text-[#8B2FC9] transition-colors">
                  About K&Co
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#8B2FC9] transition-colors">
                  Case Studies
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#8B2FC9] transition-colors">
                  Careers
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#8B2FC9] transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Legal & Social */}
          <div>
            <h4 className="text-white font-bold mb-6">Legal</h4>
            <ul className="space-y-4 text-sm text-gray-400 mb-8">
              <li>
                <a 
                  href="/privacy-policy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Privacy Policy 
                </a>
              </li>
              <li>
                <a 
                  href="/terms-of-service" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Terms of Service
                </a>
              </li>
            </ul>

            <div className="flex gap-4">
              <a
                href="https://www.linkedin.com/company/kco-finops/"
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-[#8B2FC9] hover:text-white transition-all"
              >
                <Linkedin size={18} />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-[#8B2FC9] hover:text-white transition-all"
              >
                <Twitter size={18} />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-[#8B2FC9] hover:text-white transition-all"
              >
                <Github size={18} />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col items-center justify-center gap-4 text-xs text-gray-500">
          <p>&copy; 2025 K&Co. All Rights Reserved.</p>
          <div className="flex gap-6">
            <span>Vadodara, India</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;