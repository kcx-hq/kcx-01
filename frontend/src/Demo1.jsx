import React, { useState } from 'react';
import { 
  ArrowRight, 
  BarChart3, 
  CheckCircle2, 
  Menu, 
  X, 
  PieChart, 
  ShieldCheck, 
  Zap,
  ChevronRight
} from 'lucide-react';

const KCXGreenGray = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen font-sans bg-white text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* =======================
          1. NAVBAR 
      ======================= */}
      <nav className="fixed w-full z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-600/20">
                K
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">
                KCX<span className="text-slate-400">.io</span>
              </span>
            </div>

            {/* Desktop Links (Gray Secondary) */}
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-500">
              <a href="#" className="hover:text-emerald-600 transition-colors">Product</a>
              <a href="#" className="hover:text-emerald-600 transition-colors">Solutions</a>
              <a href="#" className="hover:text-emerald-600 transition-colors">Pricing</a>
              <a href="#" className="hover:text-emerald-600 transition-colors">Docs</a>
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-4">
              <button className="text-slate-600 hover:text-emerald-600 font-medium text-sm">Sign In</button>
              {/* Primary Green Button */}
              <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-lg shadow-emerald-900/10 flex items-center gap-2">
                Start Saving
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Toggle */}
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden text-slate-500">
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </nav>

      {/* =======================
          2. HERO SECTION 
      ======================= */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        
        {/* Subtle Gray Background Blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full z-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-slate-50 rounded-full blur-3xl opacity-50 -z-10"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          
          {/* Badge: Green Primary + Gray Secondary Text */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wide mb-8">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            New: Anomaly Detection v2.0
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 max-w-4xl mx-auto leading-tight">
            Stop guessing. <br />
            Start <span className="text-emerald-600 underline decoration-emerald-200 decoration-4 underline-offset-4">saving.</span>
          </h1>

          {/* Subtext (Gray Secondary) */}
          <p className="mt-6 text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            KCX connects to your cloud billing data to instantly identify waste, 
            allocate costs to teams, and automate savings.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-20">
            {/* Primary Action (Green) */}
            <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-xl text-lg font-bold transition-all shadow-xl shadow-emerald-600/20 flex items-center gap-2">
              Get Started for Free
              <ArrowRight className="w-5 h-5" />
            </button>
            
            {/* Secondary Action (Gray) */}
            <button className="bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 px-8 py-4 rounded-xl text-lg font-bold transition-all flex items-center gap-2">
              View Live Demo
            </button>
          </div>

          {/* Dashboard Preview */}
          <div className="relative mx-auto max-w-5xl group">
             {/* Green Glow behind the dashboard */}
             <div className="absolute -inset-1 bg-gradient-to-r from-emerald-100 to-slate-200 rounded-2xl blur opacity-50"></div>
             
             <div className="relative bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
                {/* Window Header */}
                <div className="h-12 bg-slate-50 border-b border-slate-100 flex items-center px-4 gap-2">
                   <div className="flex gap-1.5">
                     <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                     <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                     <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                   </div>
                   <div className="ml-4 text-xs font-mono text-slate-400">dashboard.kcx.io</div>
                </div>

                {/* Dashboard Grid */}
                <div className="p-8 grid md:grid-cols-3 gap-6 text-left">
                   {/* Card 1 */}
                   <div className="p-5 rounded-xl border border-slate-100 bg-white shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                         <div className="p-1.5 bg-emerald-100 rounded text-emerald-600"><Zap className="w-4 h-4" /></div>
                         <span className="text-sm font-semibold text-slate-500">Total Savings</span>
                      </div>
                      <div className="text-3xl font-bold text-slate-900">$42,050</div>
                      <div className="text-xs text-emerald-600 font-bold mt-2 flex items-center">
                        <ChevronRight className="w-3 h-3 rotate-[-90deg]" /> 12% vs last month
                      </div>
                   </div>
                   
                   {/* Card 2 */}
                   <div className="p-5 rounded-xl border border-slate-100 bg-white shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                         <div className="p-1.5 bg-slate-100 rounded text-slate-600"><PieChart className="w-4 h-4" /></div>
                         <span className="text-sm font-semibold text-slate-500">Budget Usage</span>
                      </div>
                      <div className="text-3xl font-bold text-slate-900">84%</div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
                         <div className="h-full w-[84%] bg-emerald-500 rounded-full"></div>
                      </div>
                   </div>

                   {/* Card 3 */}
                   <div className="p-5 rounded-xl border border-slate-100 bg-white shadow-sm flex flex-col justify-between">
                      <div className="flex items-center gap-2 mb-2">
                         <div className="p-1.5 bg-slate-100 rounded text-slate-600"><ShieldCheck className="w-4 h-4" /></div>
                         <span className="text-sm font-semibold text-slate-500">Health</span>
                      </div>
                      <div className="flex items-center gap-2">
                         <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                         <span className="font-bold text-slate-700">All Systems Good</span>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* =======================
          3. FEATURE STRIP (Gray Background) 
      ======================= */}
      <section className="py-24 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12">
            
            {/* Feature 1 */}
            <div className="group">
              <div className="w-12 h-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-emerald-600 mb-6 shadow-sm group-hover:border-emerald-500 transition-colors">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Cost Allocation</h3>
              <p className="text-slate-500 leading-relaxed">
                Automatically tag unallocated resources. We parse your AWS Cost & Usage Reports to find every penny.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group">
              <div className="w-12 h-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-emerald-600 mb-6 shadow-sm group-hover:border-emerald-500 transition-colors">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Instant Savings</h3>
              <p className="text-slate-500 leading-relaxed">
                Spot idle EC2 instances and unattached EBS volumes instantly. One-click remediation scripts included.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group">
              <div className="w-12 h-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-emerald-600 mb-6 shadow-sm group-hover:border-emerald-500 transition-colors">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Budget Alerts</h3>
              <p className="text-slate-500 leading-relaxed">
                Set sophisticated budget alarms. Get notified via Slack or Email before you overspend, not after.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* =======================
          4. FOOTER (Gray Section)
      ======================= */}
      <footer className="bg-slate-900 text-slate-400 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded bg-emerald-600 flex items-center justify-center text-white font-bold">K</div>
                <span className="text-xl font-bold text-white">KCX.io</span>
              </div>
              <p className="text-sm opacity-80 leading-relaxed">
                Empowering engineering teams to own their cloud costs without slowing down innovation.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Changelog</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Community</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Help Center</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-emerald-400 transition-colors">About</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
            <p>© 2026 KCX Inc. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Security</a>
            </div>
          </div>

        </div>
      </footer>
    </div>
  );
};

export default KCXGreenGray;