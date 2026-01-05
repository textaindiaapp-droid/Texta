
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout.tsx';
import HomeView from './components/HomeView.tsx';
import HistoryView from './components/HistoryView.tsx';
import RemindersView from './components/RemindersView.tsx';
import AccountView from './components/AccountView.tsx';
import DetailView from './components/DetailView.tsx';
import BottomNav from './components/BottomNav.tsx';
import ProcessingView from './components/ProcessingView.tsx';
import { ViewState, ConversationAnalysis, Reminder, TaskProgress } from './types.ts';
import { analyzeConversation } from './services/geminiService.ts';
import { Storage } from './services/storage.ts';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.HOME);
  const [conversations, setConversations] = useState<ConversationAnalysis[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [activeAnalysis, setActiveAnalysis] = useState<ConversationAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [loadedConversations, loadedReminders] = await Promise.all([
          Storage.getConversations(),
          Storage.getReminders()
        ]);
        setConversations(loadedConversations);
        setReminders(loadedReminders);
      } catch (err) {
        console.error("Workspace Init Error:", err);
      } finally {
        setIsInitializing(false);
      }
    };
    loadData();
  }, []);

  const handleStopRecording = async (audioBase64: string, mimeType: string) => {
    if (!audioBase64) return;
    setCurrentView(ViewState.PROCESSING);
    setError(null);
    try {
      const result = await analyzeConversation(audioBase64, mimeType);
      await Storage.saveConversation(result);
      const [updatedConvs, updatedRems] = await Promise.all([
        Storage.getConversations(),
        Storage.getReminders()
      ]);
      setConversations(updatedConvs);
      setReminders(updatedRems);
      setActiveAnalysis(null);
      setCurrentView(ViewState.HISTORY); 
    } catch (err) {
      console.error("Processing Error:", err);
      setError("Intelligence synthesis failed. Audio may be too short or noisy.");
      setCurrentView(ViewState.HOME);
    }
  };

  const handleUpdateProgress = async (id: string, nextProgress: TaskProgress) => {
    await Storage.updateReminderProgress(id, nextProgress);
    const updated = await Storage.getReminders();
    setReminders(updated);
  };

  const handleUpdateReminder = async (id: string, patch: Partial<Reminder>) => {
    await Storage.updateReminder(id, patch);
    const updated = await Storage.getReminders();
    setReminders(updated);
  };

  const handleDeleteConv = async (id: string) => {
    await Storage.deleteConversation(id);
    const [updatedConvs, updatedRems] = await Promise.all([
      Storage.getConversations(),
      Storage.getReminders()
    ]);
    setConversations(updatedConvs);
    setReminders(updatedRems);
    setCurrentView(ViewState.HISTORY);
  };

  const handleClearAll = () => {
    Storage.clearAll();
    setConversations([]);
    setReminders([]);
    setCurrentView(ViewState.HOME);
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center space-y-6 mesh-bg">
        <div className="w-16 h-16 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(99,102,241,0.5)]"></div>
        <p className="label-caps text-white animate-pulse">Initializing Nodes</p>
      </div>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case ViewState.HOME:
        return (
          <HomeView 
            onStopRecording={handleStopRecording} 
            pendingReminders={reminders.filter(r => r.progress !== 'Completed')}
            recentConversations={conversations}
            onViewConversation={(id) => {
              const found = conversations.find(c => c.id === id);
              if (found) {
                setActiveAnalysis(found);
                setCurrentView(ViewState.DETAIL);
              }
            }}
            onNavigateToHistory={() => setCurrentView(ViewState.HISTORY)}
          />
        );
      case ViewState.HISTORY:
        return <HistoryView conversations={conversations} onSelect={(id) => {
          const found = conversations.find(c => c.id === id);
          if (found) { setActiveAnalysis(found); setCurrentView(ViewState.DETAIL); }
        }} />;
      case ViewState.REMINDERS:
        return <RemindersView reminders={reminders} onToggle={handleUpdateProgress} onUpdateReminder={handleUpdateReminder} />;
      case ViewState.ACCOUNT:
        return <AccountView onClearData={handleClearAll} />;
      case ViewState.DETAIL:
        return activeAnalysis ? <DetailView analysis={activeAnalysis} onBack={() => setCurrentView(ViewState.HISTORY)} onDelete={handleDeleteConv} /> : null;
      case ViewState.PROCESSING:
        return <ProcessingView />;
      default: return null;
    }
  };

  return (
    <Layout>
      {error && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[100] glass-panel bg-rose-500/90 text-white p-5 rounded-3xl shadow-2xl flex justify-between items-center animate-liquid-reveal border-rose-400 w-[90%] max-w-lg">
          <span className="text-sm font-bold">{error}</span>
          <button onClick={setError.bind(null, null)} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative scroll-mask no-scrollbar">
        {renderView()}
      </main>
      {currentView !== ViewState.PROCESSING && <BottomNav currentView={currentView} setView={setCurrentView} />}
    </Layout>
  );
};

export default App;
