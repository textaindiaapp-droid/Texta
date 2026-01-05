
import React from 'react';
import { Storage } from '../services/storage.ts';

interface AccountViewProps {
  onClearData: () => void;
}

const AccountView: React.FC<AccountViewProps> = ({ onClearData }) => {
  return (
    <div className="p-8 pb-32 space-y-12 animate-slideUp">
      <header className="space-y-1">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Intelligence Workspace</h2>
        <p className="text-sm font-medium text-slate-400 uppercase tracking-widest">Phase 0 Local Node</p>
      </header>

      <section className="glass rounded-[2.5rem] p-8 space-y-8">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 3c1.223 0 2.39.218 3.475.617m1.99 4.743c.211.513.388 1.045.528 1.593M14.25 18c.921-.527 1.846-1.054 2.768-1.58m-7.788 1.58c-.922-.527-1.847-1.054-2.767-1.58m7.788 1.58c.451-.258.9-.515 1.352-.772m-6.436.772c-.451-.258-.9-.515-1.352-.772m6.436-.772c.451-.258.9-.515 1.352-.772m-6.436.772c-.451-.258-.9-.515-1.352-.772" /></svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Secure Profile</h3>
            <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest">Direct Local Persistence</p>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-white/40">
           <div className="flex justify-between items-center">
             <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Storage Mode</span>
             <span className="text-[10px] font-mono text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded">Native JSON</span>
           </div>
           <div className="flex justify-between items-center">
             <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Vault Status</span>
             <span className="text-[10px] font-bold text-emerald-500 uppercase">Synchronized</span>
           </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4">Privacy Manifesto</h3>
        <div className="glass rounded-[2rem] p-6 text-xs text-slate-600 leading-relaxed space-y-4">
          <p><strong>Zero External Leakage:</strong> All transcripts and tones are processed via Gemini API with zero-retention and stored only in your secure local workspace.</p>
          <p><strong>No Identity Profiling:</strong> Speaker detection is structural. We never attempt to link voices to real identities or emotional states.</p>
        </div>
      </section>

      <button 
        onClick={() => { if(confirm("This will permanently wipe all local records and intelligence. This cannot be undone. Continue?")) onClearData(); }}
        className="w-full glass p-5 rounded-[2rem] text-rose-500 font-bold text-sm flex items-center justify-center gap-2 hover:bg-rose-500 hover:text-white transition-all group"
      >
        <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        Destroy Intelligence Records
      </button>
    </div>
  );
};

export default AccountView;
