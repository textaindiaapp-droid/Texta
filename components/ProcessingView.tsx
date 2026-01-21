
import React from 'react';

const ProcessingView: React.FC = () => {
  const SkeletonCard = ({ delay }: { delay: number }) => (
    <div 
      className="w-full liquid-card p-8 flex justify-between items-center opacity-40 animate-pulse"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex-1 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-indigo-300" />
          <div className="w-24 h-2 bg-slate-200 rounded-full" />
        </div>
        <div className="space-y-2">
          <div className="w-5/6 h-4 bg-slate-200 rounded-lg" />
          <div className="w-1/2 h-2 bg-slate-100 rounded-full" />
        </div>
      </div>
      <div className="ml-6 w-14 h-14 bg-slate-50 rounded-3xl" />
    </div>
  );

  return (
    <div className="min-h-screen p-8 bg-white/10 space-y-10 flex flex-col pt-16 animate-liquid-reveal">
      <header className="space-y-4 px-4 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin mb-4" />
        <h2 className="label-caps text-indigo-600 tracking-[0.5em] text-sm animate-pulse">Intelligence Synthesis</h2>
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest max-w-xs opacity-60">
          Diarizing multi-speaker acoustics and committing to encrypted vault...
        </p>
      </header>

      <div className="space-y-6 flex-1 max-w-2xl mx-auto w-full">
        <SkeletonCard delay={0} />
        <SkeletonCard delay={200} />
        <SkeletonCard delay={400} />
        <SkeletonCard delay={600} />
      </div>

      <div className="pb-24 flex justify-center">
        <div className="flex items-center gap-4 px-6 py-3 glass-panel border-white/80 rounded-full shadow-xl">
           <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
           <span className="label-caps text-[9px] text-slate-500 font-bold">Encrypted Cloud Sync Active</span>
        </div>
      </div>
    </div>
  );
};

export default ProcessingView;
