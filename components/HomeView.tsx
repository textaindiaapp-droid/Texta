
import React from 'react';
import RecorderView from './RecorderView.tsx';
import { Reminder, ConversationAnalysis, AppState } from '../types.ts';

interface HomeViewProps {
  onStopRecording: (audioBase64: string, mimeType: string) => void;
  pendingReminders: Reminder[];
  recentConversations: ConversationAnalysis[];
  onViewConversation: (id: string) => void;
  onNavigateToHistory: () => void;
}

const HomeView: React.FC<HomeViewProps> = ({ 
  onStopRecording, 
  pendingReminders, 
  recentConversations,
  onViewConversation,
  onNavigateToHistory
}) => {
  return (
    <div className="p-6 md:p-10 pb-44 space-y-12 animate-liquid-reveal scroll-mask">
      <header className="flex justify-between items-center pt-2">
        <div className="space-y-0.5">
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">TEXTA</h1>
          <p className="label-caps text-indigo-500 opacity-80 text-[10px]">Intelligence workspace</p>
        </div>
        <div className="glass-panel px-4 py-2 rounded-full flex items-center gap-2 border-white shadow-sm">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-sm shadow-emerald-500/50" />
          <span className="label-caps text-slate-600 text-[9px]">Secured Node</span>
        </div>
      </header>

      <section className="liquid-card p-10 md:p-14 flex flex-col items-center shadow-xl shadow-indigo-500/5">
        <RecorderView onStop={onStopRecording} state={AppState.IDLE} />
      </section>

      {pendingReminders.length > 0 && (
        <section className="space-y-6">
          <div className="flex justify-between items-center px-2">
            <h3 className="label-caps text-slate-400">Priority Inventory</h3>
            <button onClick={onNavigateToHistory} className="text-[10px] font-bold text-indigo-600 hover:opacity-70 transition-opacity uppercase tracking-wider">Explore Archive →</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingReminders.slice(0, 6).map(rem => (
              <div key={rem.id} className="liquid-card p-5 flex items-center gap-4 group hover:border-indigo-100">
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${rem.priority === 'High' ? 'bg-rose-500' : 'bg-indigo-400'} shadow-sm`} />
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-bold text-slate-800 truncate leading-snug">{rem.text}</p>
                  <p className="label-caps text-slate-400 mt-1 opacity-70 text-[9px]">{rem.priority} Priority</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {recentConversations.length === 0 && (
        <div className="text-center py-24 px-10 liquid-card space-y-6 border-dashed border-2 border-slate-200/50 bg-white/20">
          <div className="w-16 h-16 bg-white/80 rounded-2xl flex items-center justify-center mx-auto text-slate-300 shadow-sm border border-white">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
          </div>
          <div className="space-y-1.5">
            <p className="label-caps text-slate-700">Awaiting Signal</p>
            <p className="text-xs font-medium text-slate-400 max-w-xs mx-auto italic">Intelligence synthesis begins with your first secure recording.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeView;
