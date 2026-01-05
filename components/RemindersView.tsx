
import React, { useState } from 'react';
import { Reminder, TaskProgress, Priority } from '../types.ts';

interface RemindersViewProps {
  reminders: Reminder[];
  onToggle: (id: string, nextProgress: TaskProgress) => void;
  onUpdateReminder: (id: string, patch: Partial<Reminder>) => void;
}

const RemindersView: React.FC<RemindersViewProps> = ({ reminders, onToggle, onUpdateReminder }) => {
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);

  const getNextStatus = (current: TaskProgress): TaskProgress => {
    const map: Record<TaskProgress, TaskProgress> = {
      'Not Started': 'In Progress',
      'In Progress': 'Completed',
      'Completed': 'Not Started'
    };
    return map[current];
  };

  const ReminderCard = ({ item }: { item: Reminder }) => {
    const isCompleted = item.progress === 'Completed';

    return (
      <div className={`liquid-card p-5 transition-all duration-500 border border-white/60 relative group h-full flex flex-col ${
        isCompleted ? 'opacity-50 grayscale-[0.2]' : ''
      }`}>
        <div className="flex justify-between items-start gap-4 flex-1">
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center gap-2 mb-1">
              <span className={`label-caps px-2 py-0.5 rounded-full border text-[9px] ${
                item.progress === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 
                item.progress === 'In Progress' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 
                'bg-slate-50 text-slate-500 border-slate-200'
              }`}>
                {item.progress}
              </span>
              {item.priority === 'High' && !isCompleted && (
                <span className="label-caps text-rose-500 text-[9px]">High Impact</span>
              )}
            </div>
            
            <h4 className={`text-base font-bold leading-tight tracking-tight ${
              isCompleted ? 'line-through text-slate-400' : 'text-slate-900'
            }`}>
              {item.text}
            </h4>
          </div>
          
          <button 
            onClick={() => onToggle(item.id, getNextStatus(item.progress))}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm ${
              isCompleted 
                ? 'bg-emerald-500 text-white' 
                : 'bg-white text-indigo-600 border border-indigo-50'
            }`}
          >
            {isCompleted ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            )}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 md:p-10 pb-32 space-y-8 animate-liquid-reveal">
      <header className="space-y-1 pt-2">
        <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Vault</h2>
        <p className="label-caps text-indigo-500 opacity-80">Action Synthesis</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reminders.length === 0 ? (
          <div className="col-span-full py-20 text-center liquid-card bg-white/10 border-dashed border-2">
            <p className="label-caps text-slate-400">No active nodes</p>
          </div>
        ) : (
          reminders
            .sort((a, b) => b.createdAt - a.createdAt)
            .map(r => <ReminderCard key={r.id} item={r} />)
        )}
      </div>
    </div>
  );
};

export default RemindersView;
