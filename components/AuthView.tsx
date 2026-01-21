
import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { auth } from "../services/firebase.ts";

const AuthView: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message.replace("Firebase: ", ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 space-y-12 animate-liquid-reveal">
      <div className="text-center space-y-3">
        <h1 className="text-5xl font-black text-slate-900 tracking-tighter">TEXTA</h1>
        <p className="label-caps text-indigo-500 tracking-[0.4em] opacity-80">Phase 0 Intelligence</p>
      </div>

      <div className="w-full max-w-md liquid-card p-10 md:p-14 border-white shadow-2xl bg-white/80">
        <div className="flex gap-4 mb-10 p-1.5 bg-slate-100 rounded-2xl">
          <button 
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-3 label-caps text-[10px] rounded-xl transition-all ${isLogin ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
          >
            Access Node
          </button>
          <button 
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-3 label-caps text-[10px] rounded-xl transition-all ${!isLogin ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
          >
            Create Node
          </button>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          <div className="space-y-2">
            <label className="label-caps text-[9px] text-slate-400 ml-2">Operator Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full p-5 bg-white border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-slate-800"
              placeholder="operator@texta.lab"
            />
          </div>

          <div className="space-y-2">
            <label className="label-caps text-[9px] text-slate-400 ml-2">Secure Cipher</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full p-5 bg-white border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-slate-800"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest text-center px-4 leading-relaxed">{error}</p>}

          <button 
            disabled={loading}
            className={`w-full py-6 bg-indigo-600 text-white label-caps tracking-[0.3em] rounded-2xl shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 ${loading ? 'opacity-50' : ''}`}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isLogin ? 'Initialize Node' : 'Register Operator'}
          </button>
        </form>
      </div>

      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] max-w-xs text-center leading-relaxed">
        Secure client-side encryption active. <br/> Your acoustics never leave the lab unshielded.
      </p>
    </div>
  );
};

export default AuthView;
