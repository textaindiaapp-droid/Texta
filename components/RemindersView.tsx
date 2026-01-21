
import React, { useState } from 'react';
import { Reminder, TaskProgress, Priority } from '../types.ts';

interface RemindersViewProps {
  reminders: Reminder[];
  onToggle: (id: string, nextProgress: TaskProgress) => void;
  onUpdateReminder: (id: string, patch: Partial<Reminder>) => void;
  onAddReminder: (text: string, priority: string) => Promise<void>;
  onDeleteReminder: (id: string) => Promise<void>;
}

const RemindersView: React.FC<RemindersViewProps> = ({ reminders, onToggle, onUpdateReminder, onAddReminder, onDeleteReminder }) => {
  const [filter, setFilter] = useState<'All' | 'Active' | 'Completed'>('Active');
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newText, setNewText] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('Medium');

  const filteredReminders = reminders.filter(r => {
    if (filter === 'All') return true;
    if (filter === 'Active') return r.progress !== 'Completed';
    if (filter === 'Completed') return r.progress === 'Completed';
    return true;
  });

  const handleAdd = async () => {
    if (!newText.trim()) return;
    await onAddReminder(newText, newPriority);
    setNewText('');
    setIsAdding(false);
  };

  const getNextStatus = (current: TaskProgress): TaskProgress => {
    const map: Record<TaskProgress, TaskProgress> = {
      'Not Started': 'In Progress',
      'In Progress': 'Completed',
      'Completed': 'Not Started'
    };
    return map[current];
  };

  const ReminderCard: React.FC<{ item: Reminder }> = ({ item }) => {
    const isCompleted = item.progress === 'Completed';

    return (
      <div className={`liquid-card p-6 transition-all duration-500 border border-white/60 relative group flex flex-col justify-between ${
        isCompleted ? 'opacity-40' : ''
      }`}>
        <div className="space-y-3">
          <div className="flex justify-between items-start">
            <span className={`label-caps px-3 py-1 rounded-full border text-[9px] ${
              item.progress === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 
              item.progress === 'In Progress' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 
              'bg-slate-50 text-slate-500 border-slate-200'
            }`}>
              {item.progress}
            </span>
            <div className="flex gap-2">
              <button onClick={() => setEditingReminder(item)} className="p-2 text-slate-300 hover:text-indigo-600 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
              </button>
            </div>
          </div>
          
          <h4 className={`text-lg font-bold leading-tight tracking-tight ${
            isCompleted ? 'line-through text-slate-400' : 'text-slate-800'
          }`}>
            {item.text}
          </h4>
          
          <div className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${item.priority === 'High' ? 'bg-rose-500' : item.priority === 'Medium' ? 'bg-indigo-400' : 'bg-slate-300'}`} />
            <span className="label-caps text-[9px] text-slate-400">{item.priority} Priority</span>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button 
            onClick={() => onToggle(item.id, getNextStatus(item.progress))}
            className={`flex-1 py-3 rounded-xl label-caps text-[10px] font-black transition-all shadow-sm flex items-center justify-center gap-2 ${
              isCompleted 
                ? 'bg-emerald-500 text-white' 
                : 'bg-white text-indigo-600 border border-indigo-50 hover:border-indigo-200'
            }`}
          >
            {isCompleted ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            )}
            {isCompleted ? 'REVIVE' : 'CYCLE STATUS'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 md:p-14 pb-44 space-y-12 animate-liquid-reveal">
      <header className="flex justify-between items-end pt-2">
        <div className="space-y-1">
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Vault</h2>
          <p className="label-caps text-indigo-500 opacity-80 tracking-widest">Active Intelligence Queue</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="w-14 h-14 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
        </button>
      </header>

      <div className="flex gap-4 p-1.5 bg-slate-100/50 rounded-2xl w-fit">
        {(['Active', 'Completed', 'All'] as const).map(f => (
          <button 
            key={f}
            onClick={() => setFilter(f)}
            className={`px-6 py-2 label-caps text-[10px] rounded-xl transition-all ${filter === f ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredReminders.length === 0 ? (
          <div className="col-span-full py-32 text-center liquid-card border-dashed border-2 bg-white/10">
            <div className="w-16 h-16 bg-white/80 rounded-2xl flex items-center justify-center mx-auto text-slate-200 mb-4 border border-white">
               <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" /></svg>
            </div>
            <p className="label-caps text-slate-400">Inventory Clear</p>
          </div>
        ) : (
          filteredReminders.map(r => <ReminderCard key={r.id} item={r} />)
        )}
      </div>

      {/* Standalone Add Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-xl animate-liquid-reveal">
          <div className="w-full max-w-lg liquid-card p-10 bg-white border-white shadow-2xl space-y-8">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Add Intelligence Node</h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="label-caps text-[9px] text-slate-400 ml-2">Task Description</label>
                <textarea 
                  autoFocus
                  value={newText}
                  onChange={e => setNewText(e.target.value)}
                  className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-slate-800 min-h-[120px]"
                  placeholder="What needs tracking?"
                />
              </div>
              <div className="space-y-2">
                <label className="label-caps text-[9px] text-slate-400 ml-2">Priority Weight</label>
                <div className="flex gap-3">
                  {(['Low', 'Medium', 'High'] as Priority[]).map(p => (
                    <button 
                      key={p} 
                      onClick={() => setNewPriority(p)}
                      className={`flex-1 py-3 label-caps text-[10px] rounded-xl border transition-all ${newPriority === p ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-400 border-slate-100'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setIsAdding(false)} className="flex-1 py-4 label-caps text-[10px] text-slate-400 bg-slate-50 rounded-xl">Discard</button>
              <button onClick={handleAdd} className="flex-1 py-4 label-caps text-[10px] text-white bg-indigo-600 rounded-xl shadow-lg shadow-indigo-100">Commit to Vault</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingReminder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-xl animate-liquid-reveal">
          <div className="w-full max-w-lg liquid-card p-10 bg-white border-white shadow-2xl space-y-8">
            <div className="flex justify-between items-start">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Edit Intelligence Node</h3>
              <button 
                onClick={() => confirm("Purge this node from Vault?") && onDeleteReminder(editingReminder.id).then(() => setEditingReminder(null))}
                className="p-2 text-rose-300 hover:text-rose-500 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="label-caps text-[9px] text-slate-400 ml-2">Task Description</label>
                <textarea 
                  value={editingReminder.text}
                  onChange={e => setEditingReminder({...editingReminder, text: e.target.value})}
                  className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-slate-800 min-h-[120px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="label-caps text-[9px] text-slate-400 ml-2">Priority</label>
                  <select 
                    value={editingReminder.priority}
                    onChange={e => setEditingReminder({...editingReminder, priority: e.target.value as any})}
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-800 text-sm appearance-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="label-caps text-[9px] text-slate-400 ml-2">Progress</label>
                  <select 
                    value={editingReminder.progress}
                    onChange={e => setEditingReminder({...editingReminder, progress: e.target.value as any})}
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-800 text-sm appearance-none"
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setEditingReminder(null)} className="flex-1 py-4 label-caps text-[10px] text-slate-400 bg-slate-50 rounded-xl">Discard</button>
              <button 
                onClick={async () => {
                  await onUpdateReminder(editingReminder.id, { text: editingReminder.text, priority: editingReminder.priority, progress: editingReminder.progress });
                  setEditingReminder(null);
                }} 
                className="flex-1 py-4 label-caps text-[10px] text-white bg-indigo-600 rounded-xl shadow-lg shadow-indigo-100"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RemindersView;
