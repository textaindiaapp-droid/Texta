
import React from 'react';
import { auth } from '../services/firebase.ts';
import { signOut } from 'firebase/auth';
import { ConversationAnalysis } from '../types.ts';

interface AccountViewProps {
  onClearData: () => void;
  stats: {
    sessions: number;
    items: number;
  };
  archivedConversations: ConversationAnalysis[];
  onRestoreConv: (id: string) => Promise<void>;
  onPermanentDeleteConv: (id: string) => Promise<void>;
}

const AccountView: React.FC<AccountViewProps> = ({ 
  onClearData, 
  stats, 
  archivedConversations,
  onRestoreConv,
  onPermanentDeleteConv
}) => {
  const user = auth.currentUser;

  const getDaysRemaining = (archivedAt?: number) => {
    if (!archivedAt) return 0;
    const diff = archivedAt + (15 * 24 * 60 * 60 * 1000) - Date.now();
    return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
  };

  return (
    <div className="p-6 md:p-14 pb-44 space-y-12 animate-liquid-reveal">
      <header className="space-y-1 pt-2">
        <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Workspace</h2>
        <p className="label-caps text-indigo-500 opacity-80 tracking-[0.3em]">Node Operations Control</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Profile Card */}
        <section className="lg:col-span-2 space-y-8">
          <div className="liquid-card p-10 flex flex-col md:flex-row items-center gap-10 bg-white/90 border-white shadow-2xl">
            <div className="relative">
              <div className="w-28 h-28 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl overflow-hidden group">
                <svg className="w-14 h-14 group-hover:scale-110 transition-transform duration-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 border-4 border-white rounded-full shadow-lg" />
            </div>
            
            <div className="text-center md:text-left space-y-2 flex-1 min-w-0">
              <h3 className="text-2xl font-black text-slate-900 truncate">{user?.email || 'Anonymous Operator'}</h3>
              <div className="flex flex-wrap justify-center md:justify-start gap-2">
                <span className="label-caps text-[9px] px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">PRO NODE 0</span>
                <span className="label-caps text-[9px] px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">CLOUD SYNC ACTIVE</span>
              </div>
            </div>

            <button 
              onClick={() => signOut(auth)}
              className="px-6 py-4 label-caps text-[10px] text-slate-400 bg-slate-50 hover:bg-rose-50 hover:text-rose-500 rounded-2xl transition-all border border-slate-100"
            >
              Sign Out
            </button>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="liquid-card p-8 bg-white border-white shadow-xl space-y-4">
               <p className="label-caps text-slate-400 text-[10px]">Intelligence Cycles</p>
               <div className="flex items-end gap-2">
                 <span className="text-4xl font-black text-slate-900 tracking-tighter">{stats.sessions}</span>
                 <span className="label-caps text-indigo-500 text-[9px] pb-1.5 font-black">Sessions Recorded</span>
               </div>
            </div>
            <div className="liquid-card p-8 bg-white border-white shadow-xl space-y-4">
               <p className="label-caps text-slate-400 text-[10px]">Vault Inventory</p>
               <div className="flex items-end gap-2">
                 <span className="text-4xl font-black text-slate-900 tracking-tighter">{stats.items}</span>
                 <span className="label-caps text-emerald-500 text-[9px] pb-1.5 font-black">Actionable Nodes</span>
               </div>
            </div>
          </div>

          {/* Archive Section */}
          <section className="space-y-6">
            <div className="flex justify-between items-center px-4">
              <h3 className="label-caps text-slate-400 tracking-widest">Archived Intelligence</h3>
              <span className="text-[10px] font-bold text-rose-500 uppercase tracking-tighter">Held for 15 Days</span>
            </div>
            {archivedConversations.length === 0 ? (
              <div className="p-10 text-center liquid-card bg-slate-50/50 border-dashed border-2 border-slate-100 flex flex-col items-center gap-3">
                <p className="label-caps text-slate-300 text-[10px]">Archive Empty</p>
              </div>
            ) : (
              <div className="space-y-4">
                {archivedConversations.map(conv => (
                  <div key={conv.id} className="liquid-card p-6 bg-white/60 border-white shadow-md flex items-center justify-between gap-6 group hover:bg-white transition-all">
                    <div className="flex-1 space-y-1">
                      <h4 className="text-sm font-black text-slate-800 line-clamp-1">{conv.summary}</h4>
                      <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">
                        Permanent deletion in {getDaysRemaining(conv.archivedAt)} days
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => onRestoreConv(conv.id)}
                        className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                        title="Restore from archive"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                      </button>
                      <button 
                        onClick={() => confirm("Delete permanently now?") && onPermanentDeleteConv(conv.id)}
                        className="p-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                        title="Delete permanently"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </section>

        {/* Preferences Sidebar */}
        <section className="space-y-8">
           <h3 className="label-caps text-slate-400 px-4 tracking-widest">Preferences</h3>
           <div className="liquid-card p-8 space-y-6 bg-white/80 border-white shadow-xl">
             <div className="flex justify-between items-center group cursor-pointer">
               <span className="text-sm font-bold text-slate-700">Client-Side Cipher</span>
               <div className="w-12 h-6 bg-indigo-600 rounded-full p-1 relative shadow-inner">
                 <div className="w-4 h-4 bg-white rounded-full shadow-lg absolute right-1" />
               </div>
             </div>
             <div className="flex justify-between items-center group opacity-50">
               <span className="text-sm font-bold text-slate-700">Diarization v2.1</span>
               <span className="text-[10px] font-black text-slate-400">AUTO</span>
             </div>
             <div className="flex justify-between items-center group opacity-50">
               <span className="text-sm font-bold text-slate-700">Audio Fidelity</span>
               <span className="text-[10px] font-black text-slate-400">HIGH (PCM)</span>
             </div>
             <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
               <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Version</span>
               <span className="text-xs font-black text-slate-800 tracking-widest">P0.SYN-02</span>
             </div>
           </div>

           <button 
             onClick={() => confirm("This will permanently wipe all encrypted cloud records. Continue?") && onClearData()}
             className="w-full liquid-card p-6 flex items-center justify-center gap-4 bg-rose-50/50 border-rose-100 text-rose-500 font-bold hover:bg-rose-500 hover:text-white transition-all group"
           >
             <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
             <span className="label-caps text-[10px]">Purge Workspace</span>
           </button>
        </section>
      </div>

      <section className="space-y-6 max-w-4xl">
        <h3 className="label-caps text-slate-400 px-4 tracking-widest">Privacy Protocol 3.0</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="liquid-card p-10 space-y-4 bg-white shadow-lg border-white">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">AES-GCM Shielding</h4>
            <p className="text-[13px] text-slate-500 leading-relaxed font-medium">Your data is sharded and encrypted before cloud transit. Only this workspace holds the decryption parameters.</p>
          </div>
          <div className="liquid-card p-10 space-y-4 bg-white shadow-lg border-white">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            </div>
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Trust Verification</h4>
            <p className="text-[13px] text-slate-500 leading-relaxed font-medium">Phase 0 operates under a strict "No Judgment" observation mandate. Behavioral metrics are diagnostic, not evaluative.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AccountView;
