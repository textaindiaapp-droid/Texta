
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
  const size = 52;
  const strokeWidth = 3.5;
  const center = size / 2;
  const radius = center - strokeWidth - 1; 
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center flex-1 min-w-[65px] group">
      <div className="relative flex items-center justify-center mb-1.5">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90 overflow-visible">
          <circle cx={center} cy={center} r={radius} fill="transparent" stroke="#f1f5f9" strokeWidth={strokeWidth} />
          <circle
            cx={center} cy={center} r={radius} fill="transparent" stroke="currentColor" strokeWidth={strokeWidth}
            strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
            className={`${color} transition-all duration-1000 ease-out drop-shadow-[0_0_2px_rgba(0,0,0,0.1)]`}
          />
        </svg>
        <span className="absolute text-[10px] font-black text-slate-800 tabular-nums group-hover:scale-110 transition-transform">{Math.round(value)}%</span>
      </div>
      <span className="label-caps text-[6px] text-slate-400 font-black tracking-widest text-center leading-none whitespace-nowrap">{label}</span>
    </div>
  );
};

const DetailView: React.FC<DetailViewProps> = ({ analysis: initialAnalysis, onBack, onDelete }) => {
  const [analysis, setAnalysis] = useState(initialAnalysis);
  const [activeTab, setActiveTab] = useState<'insights' | 'memory' | 'chat' | 'transcript'>('insights');
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

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
    <div className="liquid-card p-6 md:p-8 space-y-6 relative overflow-visible bg-white/95 border-white shadow-xl shadow-slate-200/40 hover:scale-[1.01] transition-transform">
      <div className="absolute top-6 right-6">
        <div className={`px-2.5 py-1 rounded-full border flex items-center gap-2 ${
          speaker.vibe === 'REHEARSED' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'
        }`}>
          <div className={`w-1 h-1 rounded-full ${speaker.vibe === 'REHEARSED' ? 'bg-indigo-500' : 'bg-emerald-500'} animate-pulse`} />
          <span className="label-caps text-[7px] font-black tracking-[0.2em]">{speaker.vibe || 'SPONTANEOUS'}</span>
        </div>
      </div>

      <div className="space-y-1">
        <h4 className="text-xl font-black text-slate-900 tracking-tight line-clamp-1">{speaker.speaker}</h4>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-200" />
          <span className="label-caps text-[8px] text-slate-400 font-bold tracking-widest uppercase">
            {speaker.tone || 'Neutral'} • {speaker.interestLevel || 'COLLABORATIVE'}
          </span>
        </div>
      </div>

      <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100/50">
        <p className="text-[13px] text-slate-600 font-medium leading-[1.6] italic opacity-90">"{speaker.keyObservation}"</p>
      </div>

      <div className="grid grid-cols-3 gap-y-6 gap-x-1 pt-6 border-t border-slate-100/60">
        <CircularProgress value={speaker.metrics?.transparency || 0} label="TRANSPARENCY" color="text-emerald-500" />
        <CircularProgress value={speaker.metrics?.stress || 0} label="STRESS" color="text-rose-500" />
        <CircularProgress value={speaker.metrics?.confidence || 0} label="CONFIDENCE" color="text-indigo-600" />
        <CircularProgress value={speaker.metrics?.engagement || 0} label="ENGAGEMENT" color="text-sky-500" />
        <CircularProgress value={speaker.metrics?.stability || 0} label="STABILITY" color="text-amber-500" />
        <CircularProgress value={speaker.metrics?.shielding || 0} label="SHIELDING" color="text-slate-400" />
      </div>

      {speaker.honestyAlerts && speaker.honestyAlerts.length > 0 && (
        <div className="pt-5 border-t border-slate-100/50 space-y-2.5">
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h5 className="label-caps text-[8px] text-rose-500 font-black tracking-widest">BEHAVIORAL ANOMALIES</h5>
          </div>
          <ul className="space-y-1.5 pl-0.5">
            {speaker.honestyAlerts.map((alert, idx) => (
              <li key={idx} className="flex items-start gap-2 text-[11px] text-slate-600 font-semibold leading-relaxed">
                <div className="w-1 h-1 rounded-full bg-rose-300 mt-1.5 shrink-0" />
                <span>{alert}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-full flex flex-col animate-liquid-reveal bg-white/10">
      <header className="sticky top-0 z-40 glass-panel border-b border-white/80 p-5 md:p-8 px-8 flex justify-between items-center">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-indigo-600 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="text-center">
          <h2 className="label-caps text-indigo-600 text-[11px] tracking-[0.3em]">INTELLIGENCE REPORT</h2>
          <p className="text-[9px] font-bold text-slate-400 opacity-60 mt-0.5 uppercase tracking-tighter">
            {new Date(analysis.timestamp).toLocaleDateString()} • {new Date(analysis.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </p>
        </div>
        <button onClick={() => confirm("Purge synthesis records? It will be held in archive for 15 days.") && onDelete(analysis.id)} className="p-2 -mr-2 text-slate-300 hover:text-rose-500 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
      </header>

      {analysis.audioUrl && (
        <div className="mx-6 mt-6 mb-0 px-8 py-4 liquid-card flex items-center gap-6 bg-white/90 border-white shadow-xl max-w-xl self-center w-full">
          <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-lg animate-pulse">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
          </div>
          <audio ref={audioRef} controls src={analysis.audioUrl} className="flex-1 h-8 opacity-80" />
        </div>
      )}

      <div className="flex p-1.5 bg-slate-100/60 backdrop-blur-3xl m-6 mb-0 rounded-3xl overflow-x-auto no-scrollbar max-w-xl self-center w-full border border-white/60 shadow-inner">
        {(['insights', 'memory', 'chat', 'transcript'] as const).map(tab => (
          <button 
            key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 px-4 label-caps text-[10px] rounded-2xl transition-all duration-500 ${activeTab === tab ? 'bg-white text-indigo-600 shadow-lg scale-[1.02]' : 'text-slate-500 hover:text-slate-800'}`}
          >
            {tab === 'chat' ? 'QUERY' : tab.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-10 pb-40">
        {activeTab === 'insights' && (
          <div className="space-y-12 animate-liquid-reveal max-w-6xl mx-auto">
            <section className="liquid-card p-8 md:p-12 border border-white shadow-xl bg-white/95 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
              <div className="flex justify-between items-center mb-8">
                <h3 className="label-caps text-slate-400 tracking-[0.3em]">CONTEXTUAL PULSE</h3>
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full animate-pulse ${
                    analysis.meetingPulse === 'High Energy' ? 'bg-emerald-500' : 
                    analysis.meetingPulse === 'Tense' ? 'bg-rose-500' : 'bg-indigo-500'
                  }`} />
                  <span className="text-[11px] font-black text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100">{analysis.meetingPulse.toUpperCase()}</span>
                </div>
              </div>
              <p className="text-slate-900 text-xl md:text-3xl font-black leading-tight tracking-tight pl-6 border-l border-slate-100">
                "{analysis.summary}"
              </p>
            </section>

            <section className="space-y-8">
              <div className="flex items-center justify-between px-4">
                <h3 className="label-caps text-slate-400 tracking-widest">SPEAKER ANALYTICS</h3>
                <span className="text-[10px] font-black text-slate-300 uppercase">{analysis.overallTones.length} ENTITIES</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {analysis.overallTones.map((speaker, i) => (
                  <SpeakerCard key={i} speaker={speaker} />
                ))}
              </div>
            </section>

            {analysis.suggestions?.length > 0 && (
              <section className="space-y-6">
                <h3 className="label-caps text-slate-400 px-4 tracking-widest">STRATEGIC INTELLIGENCE</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {analysis.suggestions.map((sug, i) => (
                    <div key={i} className="liquid-card p-8 flex items-start gap-5 border-white bg-white group hover:shadow-indigo-100 transition-all">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-indigo-100 group-hover:scale-110 transition-transform">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      </div>
                      <p className="text-[14px] font-bold text-slate-800 leading-relaxed pt-1">{sug}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {activeTab === 'transcript' && (
          <div className="space-y-8 max-w-3xl mx-auto animate-liquid-reveal">
            <div className="px-6 py-3 liquid-card bg-slate-50 border-slate-100/50 mb-4 flex items-center justify-center">
               <p className="label-caps text-[8px] text-slate-400 tracking-[0.4em]">SECURED VERBATIM ARCHIVE</p>
            </div>
            {analysis.transcript.map((line, i) => (
              <div key={i} className="group space-y-2">
                <div className="flex justify-between items-center px-4">
                  <span className="label-caps text-[10px] text-indigo-500 font-black tracking-widest group-hover:text-indigo-700 transition-colors">{line.speaker}</span>
                  {line.integrityFlag && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-rose-50 text-rose-600 rounded-full border border-rose-100">
                       <span className="text-[8px] font-black tracking-widest uppercase">{line.integrityFlag.type} DETECTED</span>
                    </div>
                  )}
                </div>
                <div className={`liquid-card p-6 text-[14px] font-bold leading-[1.8] shadow-md transition-all ${
                  line.integrityFlag ? 'bg-rose-50/40 border-rose-100 text-rose-900' : 'text-slate-700 bg-white border-white'
                }`}>
                  {line.text}
                  {line.integrityFlag && (
                    <div className="mt-3 pt-3 border-t border-rose-100/50 flex items-start gap-2">
                      <svg className="w-3 h-3 text-rose-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                      <p className="text-[11px] text-rose-600/80 font-medium italic">{line.integrityFlag.reason}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'memory' && (
          <div className="space-y-12 animate-liquid-reveal max-w-5xl mx-auto">
             <section className="space-y-6">
              <h3 className="label-caps text-slate-400 px-4 tracking-widest">THEMATIC ARCHIVE</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {analysis.topicClusters.map((topic, i) => (
                  <div key={i} className="liquid-card p-8 space-y-4 bg-white shadow-xl hover:shadow-indigo-50 transition-all border-white">
                    <div className="flex justify-between items-center">
                      <h4 className="text-[13px] font-black text-slate-900 uppercase tracking-tight">{topic.label}</h4>
                      <div className="flex items-center gap-2">
                         <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500" style={{ width: `${topic.relevance}%` }} />
                         </div>
                         <span className="text-[9px] font-black text-indigo-500 w-6">{topic.relevance}%</span>
                      </div>
                    </div>
                    <p className="text-[13px] text-slate-500 leading-relaxed font-medium">{topic.summary}</p>
                  </div>
                ))}
              </div>
            </section>

            {analysis.recallCards?.length > 0 && (
              <section className="space-y-6">
                <h3 className="label-caps text-slate-400 px-4 tracking-widest">FACTUAL RECALL</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysis.recallCards.map((card, i) => (
                    <div key={i} className="liquid-card p-6 bg-white border-l-4 border-indigo-500 shadow-lg flex flex-col justify-between gap-4">
                      <div className="space-y-2">
                         <div className="flex items-center gap-2">
                           <span className="label-caps text-[8px] text-indigo-500 bg-indigo-50 px-2.5 py-1 rounded-md uppercase tracking-widest">{card.category}</span>
                         </div>
                         <p className="text-base font-black text-slate-800 tracking-tight leading-snug">{card.fact}</p>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                         <span className="label-caps text-[8px] text-slate-300">SOURCE ENTITY</span>
                         <span className="text-[10px] font-black text-slate-500 uppercase">{card.source}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="flex flex-col h-full max-w-3xl mx-auto space-y-10 animate-liquid-reveal pb-24">
            <div className="flex-1 space-y-10 min-h-[400px]">
              {(analysis.chatHistory || []).map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`flex items-center gap-2 mb-2 px-6 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <span className="label-caps text-[9px] text-slate-300 tracking-[0.2em] font-black">{msg.role === 'user' ? 'OPERATOR' : 'TEXTA INTELLIGENCE'}</span>
                  </div>
                  <div className={`max-w-[85%] p-6 rounded-3xl text-[14px] leading-relaxed font-bold shadow-lg transition-all ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-tr-none' 
                      : 'liquid-card text-slate-800 rounded-tl-none bg-white border-white'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isChatting && (
                <div className="flex items-center gap-3 p-4 px-6 liquid-card rounded-2xl w-fit animate-pulse bg-white border-white shadow-sm">
                   <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                   </div>
                   <span className="label-caps text-[8px] text-slate-400 tracking-widest uppercase">Synthesizing</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            
            <div className="fixed bottom-32 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6 z-50">
              <div className="flex items-center gap-4 liquid-card p-2 rounded-full border-white shadow-2xl bg-white/90 backdrop-blur-2xl ring-4 ring-indigo-50/30">
                <input 
                  value={chatInput} 
                  onChange={e => setChatInput(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && handleSendChat()} 
                  placeholder="Query behavioral logic nodes..." 
                  className="flex-1 bg-transparent border-none focus:ring-0 text-[14px] font-bold p-4 pl-8" 
                />
                <button 
                  onClick={handleSendChat} 
                  disabled={!chatInput.trim() || isChatting}
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-xl transition-all ${
                    !chatInput.trim() || isChatting ? 'bg-slate-200 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-105 active:scale-95'
                  }`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DetailView;
