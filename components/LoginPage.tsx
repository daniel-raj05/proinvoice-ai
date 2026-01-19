
import React, { useState } from 'react';
import { Icons, INITIAL_BUSINESS } from '../constants';
import { User } from '../types';
import { supabase } from '../supabase';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      if (isLogin) {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (authError) throw authError;
        onLogin({
          id: data.user.id,
          name: data.user.user_metadata.name || 'User',
          email: data.user.email!
        });
      } else {
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name }
          }
        });
        if (authError) throw authError;
        if (data.user) {
          alert('Check your email for confirmation link!');
          setIsLogin(true);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden selection:bg-indigo-500/30 selection:text-white">
      {/* Dynamic Animated Background Blobs */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 blur-[150px] rounded-full animate-pulse duration-[10000ms]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse duration-[8000ms]"></div>
        <div className="absolute top-[30%] left-[40%] w-[20%] h-[20%] bg-violet-600/10 blur-[100px] rounded-full animate-bounce duration-[15000ms]"></div>
        
        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-50 contrast-150"></div>
        <div className="absolute inset-0 bg-grid-slate-900/[0.04] bg-[bottom_1px_center] mask-image:linear-gradient(to_bottom,transparent,black,transparent)"></div>
      </div>

      <div className="relative z-10 w-full max-w-[480px]">
        {/* Branding Header with Pulse Glow */}
        <div className="text-center mb-10 animate-in fade-in slide-in-from-top-6 duration-1000 ease-out">
          <div className="relative inline-block mb-6">
            {/* Logo Outer Glow Ring */}
            <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full scale-110 animate-pulse duration-[4000ms]"></div>
            
            <div className="relative w-24 h-24 bg-white rounded-[2rem] shadow-[0_0_40px_rgba(79,70,229,0.2)] border border-white/20 overflow-hidden p-2 transition-transform duration-500 hover:rotate-3">
              <img src={INITIAL_BUSINESS.logo} alt="JKI Logo" className="w-full h-full object-contain filter drop-shadow-sm" />
            </div>
          </div>
          
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase mb-2">
            JKI <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-400">Billing</span>
          </h1>
          <p className="text-slate-500 font-bold text-xs tracking-[0.3em] uppercase opacity-80">
            Next-Gen ERP & GST Architecture
          </p>
        </div>

        {/* Login Card with Glassmorphism and Indigo Glow */}
        <div className="bg-slate-900/40 backdrop-blur-xl p-10 md:p-12 rounded-[3rem] border border-white/5 shadow-[0_0_60px_-15px_rgba(79,70,229,0.15)] animate-in fade-in zoom-in-95 duration-700 delay-100 relative group">
          {/* Subtle Card Border Highlight Glow */}
          <div className="absolute inset-0 rounded-[3rem] p-[1px] bg-gradient-to-br from-white/10 to-transparent pointer-events-none opacity-50"></div>
          
          <div className="mb-8 relative">
            <h2 className="text-2xl font-black text-white tracking-tight mb-1">
              {isLogin ? 'Establish Session' : 'Provision Account'}
            </h2>
            <p className="text-slate-400 text-sm font-medium">
              {isLogin ? 'Secure access for authorized personnel' : 'Initialize your business enterprise profile'}
            </p>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-3 animate-in fade-in slide-in-from-left-4">
              <Icons.StatusOverdue className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 ml-1">Identity Tag</label>
                <div className="relative group/field">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Icons.Business className="w-4 h-4 text-slate-500 group-focus-within/field:text-indigo-400 transition-colors" />
                  </div>
                  <input 
                    type="text" 
                    required 
                    className="w-full pl-12 pr-5 py-4 bg-white/[0.03] border border-white/10 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/40 focus:bg-white/[0.06] outline-none transition-all font-semibold text-white placeholder-slate-600 text-sm" 
                    placeholder="Business Name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                  />
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 ml-1">Auth Identifier</label>
              <div className="relative group/field">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Icons.Email className="w-4 h-4 text-slate-500 group-focus-within/field:text-indigo-400 transition-colors" />
                </div>
                <input 
                  type="email" 
                  required 
                  className="w-full pl-12 pr-5 py-4 bg-white/[0.03] border border-white/10 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/40 focus:bg-white/[0.06] outline-none transition-all font-semibold text-white placeholder-slate-600 text-sm" 
                  placeholder="admin@jki-industries.com" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 ml-1">Security Token</label>
              <div className="relative group/field">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Icons.Lock className="w-4 h-4 text-slate-500 group-focus-within/field:text-indigo-400 transition-colors" />
                </div>
                <input 
                  type="password" 
                  required 
                  className="w-full pl-12 pr-5 py-4 bg-white/[0.03] border border-white/10 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/40 focus:bg-white/[0.06] outline-none transition-all font-semibold text-white placeholder-slate-600 text-sm" 
                  placeholder="••••••••" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading} 
              className="w-full relative group/btn"
            >
              {/* Button Outer Glow */}
              <div className={`absolute inset-0 bg-indigo-600/30 blur-xl rounded-2xl transition-all duration-500 scale-90 opacity-0 ${!isLoading ? 'group-hover/btn:opacity-100 group-hover/btn:scale-105' : ''}`}></div>
              
              <div className="relative bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:from-slate-700 disabled:to-slate-800 text-white py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3">
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Icons.StatusPaid className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                    {isLogin ? 'Initiate Login' : 'Register Profile'}
                  </>
                )}
              </div>
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-white/5 text-center">
            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">
              {isLogin ? "No session token?" : "Already verified?"}
              <button 
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }} 
                className="ml-3 text-indigo-400 font-black hover:text-indigo-300 transition-colors underline underline-offset-4 decoration-2"
              >
                {isLogin ? 'Create Profile' : 'Secure Portal'}
              </button>
            </p>
          </div>
        </div>

        {/* Footer Info with Subtle Glow */}
        <div className="mt-12 text-center animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] opacity-30 flex items-center justify-center gap-4">
            <span className="w-8 h-[1px] bg-slate-800"></span>
            ENCRYPTED LINK • JKI 2025
            <span className="w-8 h-[1px] bg-slate-800"></span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
