import React from "react";

const LoginForm = ({ loginData, setLoginData, handleLogin, isSigningIn, onSwitchToSignup }) => {
  return (
    <form onSubmit={handleLogin} className="space-y-6">
      <div>
        <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Email Address</label>
        <input
          type="email"
          value={loginData.email}
          onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
          required
          className="bg-[#0a0a0c] border border-white/10 text-white rounded-xl py-2.5 px-3 focus:border-[#8B2FC9] focus:ring-[#8B2FC9]/20 outline-none w-full"
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Password</label>
        <input
          type="password"
          value={loginData.password}
          onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
          required
          className="bg-[#0a0a0c] border border-white/10 text-white rounded-xl py-2.5 px-3 focus:border-[#8B2FC9] focus:ring-[#8B2FC9]/20 outline-none w-full"
          placeholder="••••••••"
        />
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center">
          <input type="checkbox" className="rounded border-white/10 bg-[#0a0a0c] text-[#8B2FC9] focus:ring-[#8B2FC9]/20" />
          <span className="ml-2 text-sm text-gray-400">Remember me</span>
        </label>
        <button type="button" className="text-sm text-[#8B2FC9] hover:text-white transition-colors font-medium">
          Forgot password?
        </button>
      </div>

      <button
        type="submit"
        disabled={isSigningIn}
        className="bg-[#8B2FC9] hover:bg-[#7a25b3] text-white font-bold rounded-xl py-3 shadow-[0_4px_14px_0_rgba(139,47,201,0.39)] w-full disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
      >
        {isSigningIn ? "Signing in..." : "Sign In"}
      </button>

      <div className="my-8 flex items-center">
        <div className="flex-1 border-t border-white/10"></div>
        <span className="px-4 text-sm text-gray-500">OR</span>
        <div className="flex-1 border-t border-white/10"></div>
      </div>

      <div className="text-center">
        <p className="text-gray-400 text-sm">
          Don't have an account?{" "}
          <button type="button" onClick={onSwitchToSignup} className="text-[#8B2FC9] hover:text-white font-bold transition-colors ml-1">
            Sign up
          </button>
        </p>
      </div>
    </form>
  );
};

export default LoginForm;
