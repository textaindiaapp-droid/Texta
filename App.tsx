
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout.tsx';
import HomeView from './components/HomeView.tsx';
import HistoryView from './components/HistoryView.tsx';
import RemindersView from './components/RemindersView.tsx';
import AccountView from './components/AccountView.tsx';
import DetailView from './components/DetailView.tsx';
import BottomNav from './components/BottomNav.tsx';
import ProcessingView from './components/ProcessingView.tsx';
import AuthView from './components/AuthView.tsx';
import { ViewState, ConversationAnalysis, Reminder, TaskProgress } from './types.ts';
import { analyzeConversation } from './services/geminiService.ts';
import { Storage } from './services/storage.ts';
import { auth } from './services/firebase.ts';
import { onAuthStateChanged, User } from 'firebase/auth';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.HOME);
  const [conversations, setConversations] = useState<ConversationAnalysis[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [activeAnalysis, setActiveAnalysis] = useState<ConversationAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        await refreshData();
      } else {
        setConversations([]);
        setReminders([]);
      }
      setIsInitializing(false);
    });
    return () => unsubscribe();
  }, []);

  const refreshData = async () => {
    try {
      const [loadedConversations, loadedReminders] = await Promise.all([
        Storage.fetchConversations(true), // Fetch all, including archived for the Account view
        Storage.fetchReminders()
      ]);
      setConversations(loadedConversations);
      setReminders(loadedReminders);
    } catch (err) {
      console.error("Workspace Data Refresh Error:", err);
    }
  };

  const handleStopRecording = async (audioBase64: string, mimeType: string) => {
    if (!audioBase64) return;
    setCurrentView(ViewState.PROCESSING);
    setError(null);
    try {
      const result = await analyzeConversation(audioBase64, mimeType);
      await Storage.saveConversation(result, audioBase64);
      await refreshData();
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
    await refreshData();
  };

  const handleUpdateReminder = async (id: string, patch: Partial<Reminder>) => {
    await Storage.updateReminder(id, patch);
    await refreshData();
  };

  const handleAddReminder = async (text: string, priority: string) => {
    await Storage.createReminder(text, priority);
    await refreshData();
  };

  const handleDeleteReminder = async (id: string) => {
    await Storage.deleteReminder(id);
    await refreshData();
  };

  const handleDeleteConv = async (id: string) => {
    await Storage.deleteConversation(id); // This now archives
    await refreshData();
    setCurrentView(ViewState.HISTORY);
  };

  const handleRestoreConv = async (id: string) => {
    await Storage.restoreConversation(id);
    await refreshData();
  };

  const handlePermanentDeleteConv = async (id: string) => {
    await Storage.deletePermanently(id);
    await refreshData();
  };

  const handleClearAll = async () => {
    await Storage.clearAll();
    await refreshData();
    setCurrentView(ViewState.HOME);
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center space-y-6 mesh-bg">
        <div className="w-16 h-16 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="label-caps text-indigo-600 animate-pulse tracking-[0.4em]">Calibrating Node</p>
      </div>
    );
  }

  if (!user) {
    return <AuthView />;
  }

  // Filter conversations for different views
  const activeConversations = conversations.filter(c => !c.archivedAt);
  const archivedConversations = conversations.filter(c => !!c.archivedAt);

  const renderView = () => {
    switch (currentView) {
      case ViewState.HOME:
        return (
          <HomeView 
            onStopRecording={handleStopRecording} 
            pendingReminders={reminders.filter(r => r.progress !== 'Completed')}
            recentConversations={activeConversations}
            onViewConversation={(id) => {
              const found = activeConversations.find(c => c.id === id);
              if (found) {
                setActiveAnalysis(found);
                setCurrentView(ViewState.DETAIL);
              }
            }}
            onNavigateToHistory={() => setCurrentView(ViewState.HISTORY)}
          />
        );
      case ViewState.HISTORY:
        return <HistoryView conversations={activeConversations} onSelect={(id) => {
          const found = activeConversations.find(c => c.id === id);
          if (found) { setActiveAnalysis(found); setCurrentView(ViewState.DETAIL); }
        }} />;
      case ViewState.REMINDERS:
        return (
          <RemindersView 
            reminders={reminders} 
            onToggle={handleUpdateProgress} 
            onUpdateReminder={handleUpdateReminder}
            onAddReminder={handleAddReminder}
            onDeleteReminder={handleDeleteReminder}
          />
        );
      case ViewState.ACCOUNT:
        return (
          <AccountView 
            onClearData={handleClearAll} 
            stats={{ sessions: activeConversations.length, items: reminders.length }} 
            archivedConversations={archivedConversations}
            onRestoreConv={handleRestoreConv}
            onPermanentDeleteConv={handlePermanentDeleteConv}
          />
        );
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
