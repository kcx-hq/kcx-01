import React, { useState } from 'react';
import { 
  ArrowRight, 
  CheckCircle2, 
  BarChart3, 
  ShieldCheck, 
  Zap, 
  Menu, 
  X, 
  ChevronDown,
  Globe,
  PieChart,
  LayoutDashboard
} from 'lucide-react';

const KCXEnterprise = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* =======================
          1. NAVBAR 
      ======================= */}
      <nav className="fixed w-full z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            
            {/* Logo Area */}
            <div className="flex items-center gap-8">
              <a href="#" className="flex items-center gap-2 group">
                <div className="w-9 h-9 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold shadow-lg group-hover:bg-emerald-600 transition-colors">
                  K
                </div>
                <span className="text-xl font-bold tracking-tight text-slate-900">KCX.<span className="text-emerald-600">io</span></span>
              </a>

              {/* Desktop Nav Links */}
              <div className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
                <div className="group relative cursor-pointer py-4">
                  <span className="flex items-center gap-1 hover:text-slate-900">Product <ChevronDown className="w-3 h-3" /></span>
                  {/* Mega Menu Dropdown (Simplified) */}
                  <div className="absolute top-full left-0 w-64 bg-white border border-slate-100 shadow-xl rounded-xl p-4 hidden group-hover:block animate-in fade-in slide-in-from-top-2">
                    <a href="#" className="block p-3 rounded-lg hover:bg-slate-50">
                      <div className="font-semibold text-slate-900">Cost Intelligence</div>
                      <div className="text-xs text-slate-500 mt-1">Visualize every dollar.</div>
                    </a>
                    <a href="#" className="block p-3 rounded-lg hover:bg-slate-50">
                      <div className="font-semibold text-slate-900">Anomaly Detection</div>
                      <div className="text-xs text-slate-500 mt-1">AI-based alerts.</div>
                    </a>
                  </div>
                </div>
                <a href="#" className="hover:text-slate-900 transition-colors">Customers</a>
                <a href="#" className="hover:text-slate-900 transition-colors">Pricing</a>
                <a href="#" className="hover:text-slate-900 transition-colors">Docs</a>
              </div>
            </div>

            {/* Right Actions */}
            <div className="hidden lg:flex items-center gap-4">
              <button className="text-slate-600 hover:text-slate-900 font-medium text-sm">Sign In</button>
              <button className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-lg shadow-slate-900/10 flex items-center gap-2">
                Start Free Trial
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Toggle */}
            <div className="lg:hidden">
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600">
                {isMobileMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-slate-100 p-4 shadow-xl absolute w-full">
            <div className="space-y-4 font-medium text-slate-600">
              <a href="#" className="block py-2">Product</a>
              <a href="#" className="block py-2">Customers</a>
              <a href="#" className="block py-2">Pricing</a>
              <div className="pt-4 border-t border-slate-100">
                <button className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold">Get Started</button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* =======================
          2. HERO SECTION 
      ======================= */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background Gradients (Subtle) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full z-0 pointer-events-none">
          <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-emerald-50 rounded-full blur-[80px] opacity-60"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-50 rounded-full blur-[80px] opacity-60"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          
          {/* Trust Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-600 text-xs font-semibold mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Trusted by 500+ Engineering Teams
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 max-w-4xl mx-auto leading-tight">
            Cloud intelligence that <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-700">
              protects your margins.
            </span>
          </h1>

          {/* Subtext */}
          <p className="mt-6 text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            KCX. gives you total visibility into your AWS and Azure spend. 
            Detect anomalies, automate savings, and empower engineers to ship without breaking the budget.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-20">
            <button className="group bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-xl text-lg font-bold transition-all shadow-xl shadow-emerald-600/20 flex items-center gap-2">
              Calculate Savings
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-8 py-4 rounded-xl text-lg font-bold transition-all flex items-center gap-2 shadow-sm hover:shadow-md">
              <Globe className="w-5 h-5 text-slate-400" />
              Book a Demo
            </button>
          </div>

          {/* Dashboard Preview (CSS Only) */}
          <div className="relative mx-auto max-w-5xl group perspective-1000">
            {/* The "Screen" */}
            <div className="relative bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden transform transition-transform duration-700 group-hover:scale-[1.01]">
              
              {/* Fake Browser Header */}
              <div className="h-12 bg-slate-50 border-b border-slate-100 flex items-center px-4 gap-4">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                  <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                  <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                </div>
                <div className="flex-1 flex justify-center">
                   <div className="bg-white border border-slate-200 px-4 py-1 rounded-md text-xs font-mono text-slate-400 flex items-center gap-2">
                      <ShieldCheck className="w-3 h-3 text-emerald-500" /> app.kcx.io/dashboard
                   </div>
                </div>
              </div>

              {/* Dashboard Content */}
              <div className="p-8 bg-slate-50/30">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Card 1: Total Spend */}
                  <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                       <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600"><Zap className="w-5 h-5"/></div>
                       <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">+12% Saved</span>
                    </div>
                    <p className="text-sm font-medium text-slate-500">Monthly Forecast</p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">$12,405</p>
                  </div>

                  {/* Card 2: Active Clusters */}
                  <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                       <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><LayoutDashboard className="w-5 h-5"/></div>
                       <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-full">3 Regions</span>
                    </div>
                    <p className="text-sm font-medium text-slate-500">Active Resources</p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">1,892</p>
                  </div>

                  {/* Card 3: Anomaly Check */}
                  <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500">System Health</p>
                      <p className="text-xl font-bold text-slate-900 mt-1">All Systems Normal</p>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-600 text-sm font-bold mt-4">
                      <CheckCircle2 className="w-5 h-5" /> 0 Anomalies
                    </div>
                  </div>

                  {/* Large Chart Area */}
                  <div className="md:col-span-3 bg-white p-6 rounded-xl border border-slate-100 shadow-sm h-64 flex flex-col relative overflow-hidden">
                    <div className="flex justify-between items-center mb-6 z-10">
                      <h3 className="font-bold text-slate-900">Cost Trends (Last 30 Days)</h3>
                      <button className="text-xs font-bold text-emerald-600 border border-emerald-100 bg-emerald-50 px-3 py-1 rounded-md">Export CSV</button>
                    </div>
                    {/* CSS Chart Bars */}
                    <div className="flex-1 flex items-end justify-between gap-2 px-2 pb-2">
                       {[35, 50, 45, 60, 55, 75, 65, 80, 70, 90, 85, 95].map((h, i) => (
                          <div 
                            key={i} 
                            style={{height: `${h}%`}} 
                            className="w-full bg-slate-900 rounded-t-sm opacity-80 hover:opacity-100 hover:bg-emerald-600 transition-all duration-300 cursor-pointer relative group"
                          >
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                              ${h * 100}
                            </div>
                          </div>
                       ))}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =======================
          3. SOCIAL PROOF (Logos)
      ======================= */}
      <section className="py-10 border-y border-slate-100 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-8">Powering Financial Ops for Industry Leaders</p>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
             {/* Simple Text Placeholders for Logos to keep code clean */}
             <div className="text-2xl font-bold font-serif text-slate-800">Acme Corp</div>
             <div className="text-2xl font-bold font-mono text-slate-800">GlobalTech</div>
             <div className="text-2xl font-black italic text-slate-800">STRIPE</div>
             <div className="text-xl font-bold text-slate-800 tracking-tighter">Linear</div>
             <div className="text-2xl font-bold text-slate-800">Vercel</div>
          </div>
        </div>
      </section>

      {/* =======================
          4. FEATURES GRID 
      ======================= */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Everything you need to master your bill</h2>
            <p className="text-xl text-slate-500">KCX. connects directly to your cloud provider billing API to provide real-time insights.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
             {/* Feature 1 */}
             <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:border-emerald-200 transition-colors group">
               <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-110 transition-transform">
                 <PieChart className="w-6 h-6" />
               </div>
               <h3 className="text-xl font-bold text-slate-900 mb-3">Cost Allocation</h3>
               <p className="text-slate-600 leading-relaxed">
                 Tag every resource. Know exactly how much each team, feature, or customer costs you per month.
               </p>
             </div>

             {/* Feature 2 */}
             <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:border-emerald-200 transition-colors group">
               <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform">
                 <ShieldCheck className="w-6 h-6" />
               </div>
               <h3 className="text-xl font-bold text-slate-900 mb-3">Budget Guardrails</h3>
               <p className="text-slate-600 leading-relaxed">
                 Set hard and soft limits. Get Slack alerts instantly when a deployment spikes your burn rate.
               </p>
             </div>

             {/* Feature 3 */}
             <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:border-emerald-200 transition-colors group">
               <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 mb-6 group-hover:scale-110 transition-transform">
                 <BarChart3 className="w-6 h-6" />
               </div>
               <h3 className="text-xl font-bold text-slate-900 mb-3">Forecasting</h3>
               <p className="text-slate-600 leading-relaxed">
                 Predict your bill with 99% accuracy. Model "what-if" scenarios for Reserved Instances and Savings Plans.
               </p>
             </div>
          </div>
        </div>
      </section>

      {/* =======================
          5. CTA / FOOTER 
      ======================= */}
      <footer className="bg-slate-900 text-slate-300 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Pre-Footer CTA */}
          <div className="bg-emerald-600 rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 mb-16 shadow-2xl shadow-emerald-900/50 relative overflow-hidden">
             {/* Decorative Circles */}
             <div className="absolute -left-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
             <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-slate-900/10 rounded-full blur-2xl"></div>
             
             <div className="relative z-10">
               <h2 className="text-3xl font-bold text-white mb-2">Ready to optimize?</h2>
               <p className="text-emerald-100">Join 5,000+ engineers saving money today.</p>
             </div>
             <div className="flex gap-4 relative z-10">
               <button className="bg-white text-emerald-700 px-6 py-3 rounded-lg font-bold hover:bg-slate-100 transition-colors">Get Started Free</button>
             </div>
          </div>

          {/* Footer Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-slate-800 pt-12">
             <div className="col-span-2 md:col-span-1">
               <div className="text-xl font-bold text-white mb-4">KCX.io</div>
               <p className="text-sm opacity-60">Vadodara, India</p>
               <p className="text-sm opacity-60">© 2026 KCX. Inc.</p>
             </div>
             <div>
               <h4 className="text-white font-bold mb-4">Product</h4>
               <ul className="space-y-2 text-sm opacity-70">
                 <li><a href="#" className="hover:text-emerald-400">Features</a></li>
                 <li><a href="#" className="hover:text-emerald-400">Security</a></li>
                 <li><a href="#" className="hover:text-emerald-400">Enterprise</a></li>
               </ul>
             </div>
             <div>
               <h4 className="text-white font-bold mb-4">Company</h4>
               <ul className="space-y-2 text-sm opacity-70">
                 <li><a href="#" className="hover:text-emerald-400">About Us</a></li>
                 <li><a href="#" className="hover:text-emerald-400">Careers</a></li>
                 <li><a href="#" className="hover:text-emerald-400">Blog</a></li>
               </ul>
             </div>
             <div>
               <h4 className="text-white font-bold mb-4">Legal</h4>
               <ul className="space-y-2 text-sm opacity-70">
                 <li><a href="#" className="hover:text-emerald-400">Privacy</a></li>
                 <li><a href="#" className="hover:text-emerald-400">Terms</a></li>
               </ul>
             </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default KCXEnterprise;
