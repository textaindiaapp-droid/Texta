
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
  const size = 72; // Increased to ensure no clipping
  const strokeWidth = 5;
  const center = size / 2;
  const radius = center - strokeWidth - 2; 
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center flex-1 min-w-0">
      <div className="relative flex items-center justify-center mb-3">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90 overflow-visible">
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="#f8fafc"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={`${color} transition-all duration-1000 ease-out`}
          />
        </svg>
        <span className="absolute text-[14px] font-black text-slate-800 tabular-nums">
          {Math.round(value)}%
        </span>
      </div>
      <span className="label-caps text-[8px] text-slate-400 font-black tracking-widest text-center">
        {label}
      </span>
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
    <div className="liquid-card p-10 space-y-10 relative overflow-visible bg-white/95 border-white shadow-2xl shadow-slate-200/40">
      {/* Vibe Badge */}
      <div className="absolute top-10 right-10">
        <div className={`px-4 py-1.5 rounded-lg border flex items-center gap-2 ${
          speaker.vibe === 'REHEARSED' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${speaker.vibe === 'REHEARSED' ? 'bg-indigo-500' : 'bg-emerald-500'} animate-pulse`} />
          <span className="label-caps text-[9px] font-black tracking-[0.25em]">{speaker.vibe || 'SPONTANEOUS'}</span>
        </div>
      </div>

      {/* Profile Info */}
      <div className="space-y-2 pt-2">
        <h4 className="text-3xl font-black text-slate-900 tracking-tighter">{speaker.speaker}</h4>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-slate-200" />
          <span className="label-caps text-[11px] text-slate-400 font-bold tracking-widest flex items-center gap-2">
            {speaker.linguisticStyle?.toUpperCase() || 'DIRECT'} 
            <span className="text-slate-200">•</span> 
            {speaker.interestLevel?.toUpperCase() || 'DOMINANT'}
          </span>
        </div>
      </div>

      {/* Observation Recess */}
      <div className="bg-slate-50/70 rounded-[2.5rem] p-8 border border-slate-100/50">
        <p className="text-[15px] text-slate-600 font-medium leading-[1.8] italic opacity-90">
          "{speaker.keyObservation}"
        </p>
      </div>

      {/* Cognitive Pills */}
      <div className="flex flex-wrap gap-4">
        <div className="px-6 py-3 rounded-2xl border border-slate-100 bg-white shadow-sm flex items-center gap-3">
          <span className="label-caps text-[9px] text-slate-400 font-bold uppercase">Think:</span>
          <span className="label-caps text-[11px] text-slate-800 font-black tracking-widest">{speaker.cognitiveStyle || 'CALCULATED'}</span>
        </div>
        <div className="px-6 py-3 rounded-2xl border border-slate-100 bg-white shadow-sm flex items-center gap-3">
          <span className="label-caps text-[9px] text-slate-400 font-bold uppercase">Speak:</span>
          <span className="label-caps text-[11px] text-slate-800 font-black tracking-widest">{speaker.linguisticStyle || 'FRAGMENTED'}</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-4 gap-2 pt-10 border-t border-slate-100/80 overflow-visible">
        <CircularProgress value={speaker.metrics.transparency} label="TRANSPARENCY" color="text-emerald-500" />
        <CircularProgress value={speaker.metrics.shielding} label="SHIELDING" color="text-rose-500" />
        <CircularProgress value={speaker.metrics.stress} label="STRESS" color="text-amber-500" />
        <CircularProgress value={speaker.metrics.confidence} label="CONFIDENCE" color="text-indigo-600" />
      </div>
    </div>
  );

  return (
    <div className="min-h-full flex flex-col animate-liquid-reveal scroll-mask bg-white/10">
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
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-4 px-6 label-caps text-[11px] rounded-[1.6rem] transition-all duration-700 ${activeTab === tab ? 'bg-white text-indigo-600 shadow-2xl scale-[1.04]' : 'text-slate-500 hover:text-slate-800'}`}
          >
            {tab === 'chat' ? 'QUERY' : tab.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-14 pb-48">
        {activeTab === 'insights' && (
          <div className="space-y-16 animate-liquid-reveal max-w-5xl mx-auto">
            <section className="liquid-card p-12 md:p-16 border border-white shadow-2xl shadow-indigo-100/50 bg-white">
              <div className="flex justify-between items-center mb-10">
                <h3 className="label-caps text-slate-400 tracking-[0.4em]">CONTEXTUAL PULSE</h3>
                <div className="flex items-center gap-4">
                  <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(99,102,241,0.6)]" />
                  <span className="text-[12px] font-black text-indigo-600 bg-indigo-50 px-5 py-2.5 rounded-2xl border border-indigo-100">{analysis.meetingPulse.toUpperCase()}</span>
                </div>
              </div>
              <p className="text-slate-900 text-2xl md:text-4xl font-black leading-tight border-l-[6px] border-indigo-500 pl-10 tracking-tighter">
                "{analysis.summary}"
              </p>
            </section>

            {analysis.suggestions?.length > 0 && (
              <section className="space-y-8">
                <h3 className="label-caps text-slate-400 px-8 tracking-widest">STRATEGIC INTELLIGENCE</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {analysis.suggestions.map((sug, i) => (
                    <div key={i} className="liquid-card p-10 flex items-start gap-6 border-indigo-50 bg-white group hover:scale-[1.03] transition-all duration-700">
                      <div className="w-12 h-12 rounded-[1.4rem] bg-indigo-600 flex items-center justify-center text-white flex-shrink-0 shadow-2xl group-hover:shadow-indigo-500/50 transition-all">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      </div>
                      <p className="text-[15px] font-bold text-slate-800 leading-relaxed pt-1.5">{sug}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="space-y-10">
              <h3 className="label-caps text-slate-400 px-8 tracking-widest">SPEAKER ANALYTICS</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {analysis.overallTones.map((speaker, i) => (
                  <SpeakerCard key={i} speaker={speaker} />
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'transcript' && (
          <div className="space-y-10 max-w-3xl mx-auto animate-liquid-reveal">
            {analysis.transcript.map((line, i) => (
              <div key={i} className={`flex flex-col gap-4 ${line.integrityFlag ? 'scale-[1.04]' : ''}`}>
                <div className="flex justify-between items-center px-8">
                  <span className="label-caps text-[11px] text-slate-400 font-black tracking-widest">{line.speaker}</span>
                  {line.integrityFlag && (
                    <div className="flex items-center gap-2.5 px-4 py-1.5 bg-rose-50 text-rose-600 rounded-full border border-rose-100 shadow-xl">
                       <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                       <span className="label-caps text-[9px] font-black tracking-tighter">{line.integrityFlag.type} DETECTED</span>
                    </div>
                  )}
                </div>
                <div className={`liquid-card p-8 text-[15px] font-bold leading-[1.7] shadow-xl transition-all duration-700 ${
                  line.integrityFlag ? 'bg-rose-50/70 border-rose-200 text-rose-900' : 'text-slate-700 bg-white'
                }`}>
                  {line.text}
                  {line.integrityFlag && (
                    <div className="mt-5 pt-5 border-t border-rose-200/50 text-[12px] italic font-medium opacity-80">
                      Intelligence logic: {line.integrityFlag.reason}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'memory' && (
          <div className="space-y-16 animate-liquid-reveal max-w-5xl mx-auto">
             <section className="space-y-8">
              <h3 className="label-caps text-slate-400 px-8 tracking-widest">THEMATIC ARCHIVE</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {analysis.topicClusters.map((topic, i) => (
                  <div key={i} className="liquid-card p-12 space-y-6 bg-white shadow-2xl">
                    <div className="flex justify-between items-center">
                      <h4 className="text-[15px] font-black text-slate-900 uppercase tracking-tight">{topic.label}</h4>
                      <span className="text-[11px] font-black text-indigo-600 px-4 py-2 bg-indigo-50 rounded-2xl border border-indigo-100">{topic.relevance}% RELEVANCE</span>
                    </div>
                    <p className="text-[15px] text-slate-500 leading-relaxed font-medium">{topic.summary}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="flex flex-col h-full max-w-3xl mx-auto space-y-12 animate-liquid-reveal">
            <div className="flex-1 space-y-12 min-h-[500px]">
              {(analysis.chatHistory || []).map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-4 mb-4 px-8">
                    <span className="label-caps text-[10px] text-slate-400 tracking-[0.3em] font-black">{msg.role === 'user' ? 'OPERATOR' : 'INTELLIGENCE'}</span>
                    <div className={`w-1.5 h-1.5 rounded-full ${msg.role === 'user' ? 'bg-indigo-200' : 'bg-indigo-500 animate-pulse'}`} />
                  </div>
                  <div className={`max-w-[88%] p-8 rounded-[2.5rem] text-[15px] leading-relaxed font-bold shadow-2xl transition-all duration-700 ${
                    msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'liquid-card text-slate-800 rounded-tl-none bg-white'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isChatting && <div className="flex items-center gap-3 p-6 liquid-card rounded-[2rem] w-fit animate-pulse bg-white/80 border-indigo-100"><div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce" /></div>}
              <div ref={chatEndRef} />
            </div>
            <div className="sticky bottom-0 pt-10">
              <div className="flex items-center gap-5 liquid-card p-3 rounded-[3rem] border-white shadow-[0_50px_120px_-30px_rgba(0,0,0,0.2)] bg-white/95 backdrop-blur-3xl transition-all duration-700">
                <input 
                  value={chatInput} 
                  onChange={e => setChatInput(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && handleSendChat()} 
                  placeholder="Query behavioral logic nodes..." 
                  className="flex-1 bg-transparent border-none focus:ring-0 text-[15px] font-bold p-5 pl-10 placeholder:text-slate-300" 
                />
                <button onClick={handleSendChat} className="w-16 h-16 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl hover:bg-indigo-700 hover:scale-110 active:scale-95 transition-all duration-700"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg></button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DetailView;
