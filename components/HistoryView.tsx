
import React from 'react';
import { ConversationAnalysis } from '../types.ts';

interface HistoryViewProps {
  conversations: ConversationAnalysis[];
  onSelect: (id: string) => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ conversations, onSelect }) => {
  const getPulseColor = (pulse: string) => {
    switch (pulse) {
      case 'High Energy': return 'bg-emerald-500';
      case 'Tense': return 'bg-rose-500';
      case 'Steady Flow': return 'bg-indigo-500';
      default: return 'bg-slate-400';
    }
  };

  return (
    <div className="p-6 md:p-10 pb-32 space-y-8 animate-liquid-reveal scroll-mask">
      <header className="space-y-1 pt-2">
        <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Timeline</h2>
        <p className="label-caps text-indigo-500 opacity-80">Workspace Archive</p>
      </header>
      
      {conversations.length === 0 ? (
        <div className="py-24 text-center space-y-6 liquid-card border-dashed border-2 border-slate-200/50">
          <div className="w-14 h-14 bg-white/80 rounded-2xl flex items-center justify-center mx-auto text-slate-200">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <p className="label-caps text-[10px] text-slate-400">Archive Offline</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {conversations.sort((a,b) => b.timestamp - a.timestamp).map(conv => (
            <button
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className="w-full liquid-card p-6 text-left relative overflow-hidden group flex flex-col justify-between"
            >
              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getPulseColor(conv.meetingPulse)} animate-pulse shadow-sm`} />
                    <span className="label-caps text-[9px] text-slate-400">
                      {new Date(conv.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <span className="text-[9px] font-black text-indigo-500 bg-white/80 px-2 py-0.5 rounded-full border border-indigo-50">{conv.meetingPulse}</span>
                </div>
                
                <h3 className="text-base font-black text-slate-900 leading-tight line-clamp-2">
                  {conv.summary}
                </h3>
                
                <div className="flex gap-2 pt-1">
                  <span className="text-[9px] font-black text-slate-500 uppercase px-2 py-1 rounded-lg border border-white/50 bg-slate-100/30">
                    {conv.actionItems.length} Actions
                  </span>
                  <span className="text-[9px] font-black text-slate-500 uppercase px-2 py-1 rounded-lg border border-white/50 bg-slate-100/30">
                    {conv.recallCards.length} Facts
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryView;
