
import React, { useState, useEffect } from 'react';

const ProcessingView: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Decoding Audio');

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 98) return 98; 
        const jump = Math.random() * 8 + 3;
        return Math.min(98, prev + jump);
      });
    }, 120);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress > 85) setStatus('Indexing Vault');
    else if (progress > 60) setStatus('Analyzing Dynamics');
    else if (progress > 30) setStatus('Synthesizing Speech');
  }, [progress]);

  const SkeletonCard = () => (
    <div className="w-full glass-card p-7 rounded-[2.5rem] shadow-sm flex justify-between items-center opacity-40">
      <div className="flex-1 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
          <div className="w-20 h-2 bg-slate-200 rounded-full shimmer-overlay" />
        </div>
        <div className="space-y-3">
          <div className="w-3/4 h-5 bg-slate-200 rounded-xl shimmer-overlay" />
          <div className="w-1/2 h-2.5 bg-slate-100 rounded-full shimmer-overlay" />
        </div>
      </div>
      <div className="ml-6 w-12 h-12 bg-slate-50 rounded-[1.2rem] shimmer-overlay" />
    </div>
  );

  return (
    <div className="min-h-screen p-8 bg-slate-50/30 space-y-10 flex flex-col pt-12 animate-fadeIn">
      <header className="space-y-3 px-2">
        <div className="w-40 h-10 bg-slate-200 rounded-2xl shimmer-overlay opacity-50" />
        <div className="w-28 h-4 bg-slate-100 rounded-lg shimmer-overlay opacity-30" />
      </header>

      <div className="space-y-6 flex-1">
        {[...Array(4)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      <div className="pb-16 space-y-6 px-2">
        <div className="flex justify-between items-end">
          <p className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.4em] animate-pulse">
            {status}
          </p>
          <span className="text-3xl font-black text-slate-900 tracking-tighter tabular-nums">
            {Math.floor(progress)}%
          </span>
        </div>
        <div className="h-3 w-full bg-slate-200/50 rounded-full overflow-hidden backdrop-blur-sm border border-white/40">
          <div 
            className="h-full bg-indigo-600 transition-all duration-300 ease-out shadow-[0_0_25px_rgba(79,70,229,0.5)] relative"
            style={{ width: `${progress}%` }}
          >
             <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 shimmer-overlay" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcessingView;
