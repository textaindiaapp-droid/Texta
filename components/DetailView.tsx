
import React, { useState, useRef, useEffect } from 'react';
import { ConversationAnalysis, ToneLabel, ChatMessage, SpeakerInsight, RecallCard, TopicCluster } from '../types.ts';
import { chatWithSession } from '../services/geminiService.ts';
import { Storage } from '../services/storage.ts';

interface DetailViewProps {
  analysis: ConversationAnalysis;
  onBack: () => void;
  onDelete: (id: string) => void;
}

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
      console.error("Chat Error:", err);
    } finally {
      setIsChatting(false);
    }
  };

  const getToneColor = (tone: ToneLabel) => {
    const colors: Record<string, string> = {
      'Positive': 'bg-emerald-500', 'Urgent': 'bg-rose-500', 'Concerned': 'bg-amber-500',
      'Hesitant': 'bg-indigo-400', 'Neutral': 'bg-slate-400', 'Assertive': 'bg-indigo-600',
      'Questioning': 'bg-sky-500'
    };
    return colors[tone] || 'bg-slate-400';
  };

  const MetricBar = ({ label, value, color }: { label: string, value: number, color: string }) => (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center px-0.5">
        <span className="label-caps text-[9px] text-slate-400">{label}</span>
        <span className="text-[10px] font-bold text-slate-600">{value}%</span>
      </div>
      <div className="h-1.5 bg-slate-100/50 rounded-full overflow-hidden border border-white">
        <div className={`h-full ${color} rounded-full transition-all duration-1000 ease-out shadow-sm`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );

  const SpeakerCard = ({ speaker }: { speaker: SpeakerInsight }) => (
    <div className="liquid-card p-6 space-y-4 group">
      <div className="flex justify-between items-start">
        <div className="space-y-0.5">
          <h4 className="text-base font-black text-slate-900 tracking-tight">{speaker.speaker}</h4>
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${getToneColor(speaker.tone)}`} />
            <span className="label-caps text-[9px] text-slate-500">{speaker.tone}</span>
          </div>
        </div>
        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100">
          {speaker.interestLevel}
        </span>
      </div>
      <p className="text-xs font-medium text-slate-600 leading-relaxed bg-slate-50/50 p-3 rounded-xl italic border border-white">"{speaker.keyObservation}"</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-1">
        <MetricBar label="Engagement" value={speaker.metrics.engagement} color="bg-emerald-500" />
        <MetricBar label="Confidence" value={speaker.metrics.confidence} color="bg-indigo-600" />
      </div>
    </div>
  );

  return (
    <div className="min-h-full flex flex-col animate-liquid-reveal scroll-mask">
      <header className="sticky top-0 z-40 glass-panel border-b border-white p-4 md:p-6 px-6 flex justify-between items-center">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-indigo-600 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="text-center">
          <h2 className="label-caps text-indigo-600 text-[10px]">Node ID: {analysis.id}</h2>
          <p className="text-[10px] font-bold text-slate-400 opacity-60 mt-0.5">{new Date(analysis.timestamp).toLocaleDateString()}</p>
        </div>
        <button onClick={() => confirm("Delete this synthesis?") && onDelete(analysis.id)} className="p-2 -mr-2 text-slate-300 hover:text-rose-500 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
      </header>

      <div className="flex p-1 bg-slate-200/30 backdrop-blur-xl m-6 mb-0 rounded-2xl overflow-x-auto no-scrollbar max-w-xl self-center w-[90%] border border-white/50 shadow-sm">
        {(['insights', 'memory', 'chat', 'transcript'] as const).map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 px-4 label-caps text-[9px] rounded-xl transition-all duration-500 ${activeTab === tab ? 'bg-white text-indigo-600 shadow-md scale-[1.02]' : 'text-slate-500 hover:text-slate-800'}`}
          >
            {tab === 'chat' ? 'Query' : tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-10 pb-40">
        {activeTab === 'insights' && (
          <div className="space-y-10 animate-liquid-reveal">
            <section className="liquid-card p-8 md:p-10 border border-white shadow-xl shadow-indigo-500/5">
              <div className="flex justify-between items-center mb-5">
                <h3 className="label-caps text-slate-400">Contextual Pulse</h3>
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">{analysis.meetingPulse}</span>
              </div>
              <p className="text-slate-800 text-base md:text-lg font-bold leading-relaxed italic border-l-2 border-indigo-200 pl-5">"{analysis.summary}"</p>
            </section>

            <section className="space-y-6">
              <h3 className="label-caps text-slate-400 px-2">Speaker Analytics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {analysis.overallTones.map((speaker, i) => (
                  <SpeakerCard key={i} speaker={speaker} />
                ))}
              </div>
            </section>

            <section className="space-y-6">
              <h3 className="label-caps text-slate-400 px-2">Relational Dynamics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {analysis.interactionPatterns.map((pattern, i) => (
                  <div key={i} className="liquid-card p-6 space-y-5 relative overflow-hidden group">
                    <div className={`absolute top-0 right-0 px-4 h-8 flex items-center label-caps text-[9px] text-white rounded-bl-xl shadow-sm ${
                      pattern.type === 'Unresolved' ? 'bg-rose-500' : 'bg-emerald-500'
                    }`}>
                      {pattern.type === 'Unresolved' ? 'Open' : 'Closed'}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50/50 flex items-center justify-center text-indigo-600 border border-white">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                      </div>
                      <div className="pt-0.5">
                        <h4 className="text-xs font-black text-slate-800 tracking-tight uppercase">{pattern.type}</h4>
                        <p className="label-caps text-[9px] text-slate-400 mt-0.5">{pattern.speakers.join(' • ')}</p>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-slate-600 leading-relaxed italic">"{pattern.description}"</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'memory' && (
          <div className="space-y-10 animate-liquid-reveal">
            <section className="space-y-6">
              <h3 className="label-caps text-slate-400 px-2">Thematic Nodes</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {analysis.topicClusters.map((topic, i) => (
                  <div key={i} className="liquid-card p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-black text-slate-900 truncate pr-4">{topic.label}</h4>
                      <div className="flex-shrink-0 text-[10px] font-bold text-indigo-600 px-2 py-0.5 bg-indigo-50 rounded-full">{topic.relevance}%</div>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">{topic.summary}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-6">
              <h3 className="label-caps text-slate-400 px-2">Factual Anchors</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {analysis.recallCards.map((card, i) => (
                  <div key={i} className="liquid-card p-5 space-y-3 relative group">
                    <div className="flex items-center gap-2">
                       <span className="text-[9px] font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full border border-slate-200/50 uppercase">{card.category}</span>
                       <span className="text-[9px] font-bold text-indigo-400 opacity-60">via {card.source}</span>
                    </div>
                    <p className="text-sm font-bold text-slate-800 leading-tight">{card.fact}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="flex flex-col h-full max-w-2xl mx-auto space-y-6 animate-liquid-reveal">
            <div className="flex-1 space-y-6 min-h-[400px]">
              {(analysis.chatHistory || []).map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <span className="label-caps text-[9px] text-slate-400 mb-2 px-3">{msg.role === 'user' ? 'You' : 'Assistant'}</span>
                  <div className={`max-w-[88%] p-5 rounded-2xl text-sm leading-relaxed font-bold shadow-sm ${
                    msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none shadow-indigo-100' : 'liquid-card text-slate-800 rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isChatting && <div className="flex items-center gap-2 p-4 liquid-card rounded-2xl w-fit animate-pulse"><div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" /></div>}
              <div ref={chatEndRef} />
            </div>
            <div className="sticky bottom-0 pt-6">
              <div className="flex items-center gap-2 liquid-card p-2 rounded-[1.8rem] border-white shadow-xl">
                <input 
                  value={chatInput} 
                  onChange={e => setChatInput(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && handleSendChat()} 
                  placeholder="Query synthesis..." 
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-bold p-3 pl-5" 
                />
                <button onClick={handleSendChat} className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg></button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'transcript' && (
          <div className="space-y-6 max-w-2xl mx-auto animate-liquid-reveal">
            {analysis.transcript.map((line, i) => (
              <div key={i} className="flex flex-col gap-2 group">
                <span className="label-caps text-[9px] text-slate-400 px-4 group-hover:text-indigo-500 transition-colors">{line.speaker}</span>
                <div className="liquid-card p-5 text-sm font-bold text-slate-700 leading-relaxed shadow-sm">
                  {line.text}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DetailView;
