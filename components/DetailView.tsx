
import React, { useState, useRef, useEffect } from 'react';
import { ConversationAnalysis, ChatMessage, SpeakerInsight, TranscriptLine } from '../types.ts';
import { chatWithSession } from '../services/geminiService.ts';
import { Storage } from '../services/storage.ts';

interface DetailViewProps {
  analysis: ConversationAnalysis;
  onBack: () => void;
  onDelete: (id: string) => void;
}

const CircularProgress: React.FC<{ value: number, label: string, color: string }> = ({ value, label, color }) => {
  const size = 72;
  const strokeWidth = 5;
  const center = size / 2;
  const radius = center - strokeWidth - 2; 
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center flex-1 min-w-0">
      <div className="relative flex items-center justify-center mb-3">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90 overflow-visible">
          <circle cx={center} cy={center} r={radius} fill="transparent" stroke="#f8fafc" strokeWidth={strokeWidth} />
          <circle
            cx={center} cy={center} r={radius} fill="transparent" stroke="currentColor" strokeWidth={strokeWidth}
            strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
            className={`${color} transition-all duration-1000 ease-out`}
          />
        </svg>
        <span className="absolute text-[14px] font-black text-slate-800 tabular-nums">{Math.round(value)}%</span>
      </div>
      <span className="label-caps text-[8px] text-slate-400 font-black tracking-widest text-center">{label}</span>
    </div>
  );
};

const DetailView: React.FC<DetailViewProps> = ({ analysis: initialAnalysis, onBack, onDelete }) => {
  const [analysis, setAnalysis] = useState(initialAnalysis);
  const [activeTab, setActiveTab] = useState<'insights' | 'memory' | 'chat' | 'transcript'>('insights');
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [analysis.chatHistory, activeTab]);

  const handleSendChat = async () => {
    if (!chatInput.trim() || isChatting) return;
    const userMsg: ChatMessage = { role: 'user', text: chatInput, timestamp: Date.now() };
    const updatedHistory = [...(analysis.chatHistory || []), userMsg];
    setAnalysis(prev => ({ ...prev, chatHistory: updatedHistory }));
    setChatInput('');
    setIsChatting(true);
    try {
      const response = await chatWithSession(chatInput, analysis.transcript, updatedHistory);
      const assistantMsg: ChatMessage = { role: 'assistant', text: response, timestamp: Date.now() };
      const finalHistory = [...updatedHistory, assistantMsg];
      setAnalysis(prev => ({ ...prev, chatHistory: finalHistory }));
      await Storage.updateConversationChat(analysis.id, finalHistory);
    } catch (err) {
      console.error("Consultation Error:", err);
    } finally {
      setIsChatting(false);
    }
  };

  const SpeakerCard: React.FC<{ speaker: SpeakerInsight }> = ({ speaker }) => (
    <div className="liquid-card p-10 space-y-10 relative overflow-visible bg-white/95 border-white shadow-2xl shadow-slate-200/40 animate-liquid-reveal">
      <div className="absolute top-10 right-10">
        <div className={`px-4 py-1.5 rounded-lg border flex items-center gap-2 ${
          speaker.vibe === 'REHEARSED' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${speaker.vibe === 'REHEARSED' ? 'bg-indigo-500' : 'bg-emerald-500'} animate-pulse`} />
          <span className="label-caps text-[9px] font-black tracking-[0.25em]">{speaker.vibe || 'SPONTANEOUS'}</span>
        </div>
      </div>

      <div className="space-y-2 pt-2">
        <h4 className="text-3xl font-black text-slate-900 tracking-tighter">{speaker.speaker}</h4>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-slate-200" />
          <span className="label-caps text-[11px] text-slate-400 font-bold tracking-widest uppercase">
            {speaker.linguisticStyle || 'DIRECT'} • {speaker.interestLevel || 'DOMINANT'}
          </span>
        </div>
      </div>

      <div className="bg-slate-50/70 rounded-[2.5rem] p-8 border border-slate-100/50">
        <p className="text-[15px] text-slate-600 font-medium leading-[1.8] italic opacity-90">"{speaker.keyObservation}"</p>
      </div>

      <div className="grid grid-cols-4 gap-2 pt-10 border-t border-slate-100/80 overflow-visible">
        <CircularProgress value={speaker.metrics.transparency} label="TRANSPARENCY" color="text-emerald-500" />
        <CircularProgress value={speaker.metrics.shielding} label="SHIELDING" color="text-rose-500" />
        <CircularProgress value={speaker.metrics.stress} label="STRESS" color="text-amber-500" />
        <CircularProgress value={speaker.metrics.confidence} label="CONFIDENCE" color="text-indigo-600" />
      </div>
    </div>
  );

  return (
    <div className="min-h-full flex flex-col animate-liquid-reveal bg-white/10">
      <header className="sticky top-0 z-40 glass-panel border-b border-white p-6 md:p-10 px-10 flex justify-between items-center">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-indigo-600 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="text-center">
          <h2 className="label-caps text-indigo-600 text-[12px] tracking-[0.3em]">INTELLIGENCE REPORT</h2>
          <p className="text-[10px] font-bold text-slate-400 opacity-60 mt-1">{new Date(analysis.timestamp).toLocaleTimeString()}</p>
        </div>
        <button onClick={() => confirm("Purge synthesis records?") && onDelete(analysis.id)} className="p-2 -mr-2 text-slate-300 hover:text-rose-500 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
      </header>

      <div className="flex p-2.5 bg-slate-200/40 backdrop-blur-3xl m-8 mb-0 rounded-[2.5rem] overflow-x-auto no-scrollbar max-w-2xl self-center w-[94%] border border-white/60 shadow-inner">
        {(['insights', 'memory', 'chat', 'transcript'] as const).map(tab => (
          <button 
            key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-4 px-6 label-caps text-[11px] rounded-[1.6rem] transition-all duration-700 ${activeTab === tab ? 'bg-white text-indigo-600 shadow-2xl scale-[1.04]' : 'text-slate-500 hover:text-slate-800'}`}
          >
            {tab === 'chat' ? 'QUERY' : tab.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-14 pb-48">
        {activeTab === 'insights' && (
          <div className="space-y-16 animate-liquid-reveal max-w-5xl mx-auto">
            <section className="liquid-card p-12 md:p-16 border border-white shadow-2xl bg-white">
              <div className="flex justify-between items-center mb-10">
                <h3 className="label-caps text-slate-400 tracking-[0.4em]">CONTEXTUAL