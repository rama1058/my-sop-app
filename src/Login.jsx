import React, { useState } from 'react';
import { supabase } from './lib/supabase';
import { Lock, Mail, Loader2, LogIn, Sparkles } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (data?.session) {
        onLoginSuccess(data.session);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Gagal login, periksa email & password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 selection:bg-emerald-500 selection:text-white">
      <div className="bg-white border border-slate-200/80 rounded-3xl p-8 max-w-md w-full shadow-xl space-y-6 relative overflow-hidden">
        
        {/* Glow Decor */}
        <div className="absolute -top-16 -right-16 w-40 h-40 bg-emerald-100/60 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-blue-100/60 rounded-full blur-2xl pointer-events-none"></div>

        {/* Brand Header */}
        <div className="text-center space-y-2 relative z-10">
          <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center font-black text-2xl text-white mx-auto shadow-md">
            S
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">SOP-HUB</h1>
          <p className="text-xs text-slate-500">Masuk untuk mengakses sistem Knowledge Management</p>
        </div>

        {/* Form Login */}
        <form onSubmit={handleLogin} className="space-y-4 relative z-10">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
              {errorMsg}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Email Kerja</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="budi@sop-hub.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><LogIn className="w-4 h-4" /> Masuk ke Aplikasi</>}
          </button>
        </form>

        <div className="pt-2 text-center text-[11px] text-slate-400 border-t border-slate-100">
          <p>Butuh akun? Hubungi Admin Operasional toko kamu.</p>
        </div>

      </div>
    </div>
  );
}
