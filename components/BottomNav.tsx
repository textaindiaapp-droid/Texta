
import React from 'react';
import { ViewState } from '../types.ts';

interface BottomNavProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentView, setView }) => {
  const navItems = [
    { id: ViewState.HOME, label: 'Home', icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
    )},
    { id: ViewState.HISTORY, label: 'Timeline', icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    )},
    { id: ViewState.REMINDERS, label: 'Vault', icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
    )},
    { id: ViewState.ACCOUNT, label: 'Profile', icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
    )},
  ];

  return (
    <div className="absolute bottom-0 left-0 right-0 flex justify-center pb-safe z-50 pointer-events-none p-6 md:p-14">
      <nav className="glass-panel flex justify-around items-center h-20 w-full md:w-[620px] md:rounded-[2.8rem] shadow-[0_30px_90px_-10px_rgba(0,0,0,0.18)] pointer-events-auto p-2.5 transition-all duration-1000 ease-out border-white/60">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`flex flex-col items-center justify-center w-full h-14 rounded-2xl transition-all duration-700 ease-out ${
              currentView === item.id || (item.id === ViewState.HISTORY && currentView === ViewState.DETAIL)
                ? 'bg-indigo-600 text-white shadow-[0_15px_30px_-5px_rgba(99,102,241,0.4)] scale-[1.05]' 
                : 'text-slate-400 hover:text-indigo-600 hover:bg-white/50'
            }`}
          >
            {item.icon}
            <span className="label-caps mt-1 text-[10px] opacity-90">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default BottomNav;
