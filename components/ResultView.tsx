
import React, { useState } from 'react';
import { ConversationAnalysis } from '../types.ts';

interface ResultViewProps {
  analysis: ConversationAnalysis;
  onReset: () => void;
}

const ResultView: React.FC<ResultViewProps> = ({ analysis, onReset }) => {
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [transcriptOpen, setTranscriptOpen] = useState(false);

  return (
    <div className="flex flex-col h-full max-h-[80vh] overflow-hidden">
      <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-white sticky top-0 z-10">
        <h2 className="text-xl font-semibold text-slate-800">Conversation Insights</h2>
        <button 
          onClick={onReset}
          className="text-slate-500 hover:text-indigo-600 text-sm font-medium flex items-center transition-colors"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 8.959 8.959 0 01-9 9m9-9H3" />
          </svg>
          New Recording
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-12">
        {/* 1. Summary */}
        <section>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">Summary</h3>
          <p className="text-slate-700 leading-relaxed text-lg italic">
            "{analysis.summary}"
          </p>
        </section>

        {/* 2. Action Items */}
        <section>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">Action Items</h3>
          <ul className="space-y-2">
            {analysis.actionItems.map((item, idx) => (
              <li key={idx} className="flex items-start">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mr-3 mt-0.5">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                </span>
                {/* Fixed: Accessed item.task instead of rendering the whole item object */}
                <span className="text-slate-700">{item.task}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* 3. AI Suggestions (Collapsed by default) */}
        <section className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
          <button 
            onClick={() => setSuggestionsOpen(!suggestionsOpen)}
            className="w-full p-4 flex justify-between items-center text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <div className="flex items-center">
              <span className="mr-2 text-indigo-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </span>
              <span className="font-semibold">AI Suggestions</span>
            </div>
            <svg 
              className={`w-5 h-5 transition-transform duration-300 ${suggestionsOpen ? 'rotate-180' : ''}`} 
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {suggestionsOpen && (
            <div className="p-4 pt-0 space-y-4 animate-fadeIn">
              <p className="text-xs text-slate-400 italic mb-2">
                AI-generated: Suggestions are optional and based on structural conversation patterns.
              </p>
              
              {/* Interaction Analysis */}
              <div className="mb-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Patterns Noted</h4>
                <ul className="space-y-1">
                  {analysis.interactionPatterns.map((pattern, idx) => (
                    <li key={idx} className="text-sm text-slate-600 flex items-center">
                      <span className="w-1 h-1 bg-slate-300 rounded-full mr-2"></span>
                      {/* Fixed: Accessed pattern.description instead of rendering the whole object */}
                      {pattern.description}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Suggestions List */}
              <div className="space-y-3">
                {/* Fix: Directly rendering the suggestion string instead of trying to access .type or .text */}
                {analysis.suggestions.map((sug, idx) => (
                  <div key={idx} className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm flex items-start gap-2">
                    <span className="text-indigo-500 mt-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </span>
                    <p className="text-sm text-slate-700 leading-snug">{sug}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* 4. Full Transcript (Collapsed by default) */}
        <section className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <button 
            onClick={() => setTranscriptOpen(!transcriptOpen)}
            className="w-full p-4 flex justify-between items-center text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <span className="font-semibold">Full Transcript</span>
            <svg 
              className={`w-5 h-5 transition-transform duration-300 ${transcriptOpen ? 'rotate-180' : ''}`} 
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {transcriptOpen && (
            <div className="p-4 pt-0 space-y-4 max-h-64 overflow-y-auto">
              <div className="mb-4 flex flex-wrap gap-2">
                {analysis.overallTones.map(({ speaker, tone }) => (
                  <span key={speaker} className="px-2 py-1 bg-slate-100 text-slate-500 rounded text-[10px] font-medium">
                    {speaker}: {tone} (approx.)
                  </span>
                ))}
              </div>
              {analysis.transcript.map((line, idx) => (
                <div key={idx} className="flex gap-4 items-start">
                  <span className="w-20 flex-shrink-0 text-xs font-bold text-slate-400 mt-1">{line.speaker}</span>
                  <p className="text-sm text-slate-600 leading-relaxed">{line.text}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <button 
          onClick={() => {
            if(confirm("Permanently delete this recording and analysis?")) {
              onReset();
            }
          }}
          className="text-xs text-red-400 hover:text-red-600 font-medium uppercase tracking-tighter"
        >
          Delete All Data
        </button>
        <span className="text-[10px] text-slate-400 uppercase">Trust-first, Privacy-Always</span>
      </div>
    </div>
  );
};

export default ResultView;
