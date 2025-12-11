
import React, { useState } from 'react';
import { prioritizeTasks } from '../services/geminiService';
import { Task, TaskPriority, AppView } from '../types';
import { gamification } from '../services/gamificationService';

const TaskMaster: React.FC = () => {
  const [input, setInput] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [showReward, setShowReward] = useState(false);

  const handlePrioritize = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setShowReward(false);
    const result = await prioritizeTasks(input);
    setTasks(result);
    setLoading(false);
    
    if (result.length > 0) {
      gamification.completeQuest('q_task');
      gamification.addXp(30); // 30 XP for organizing life
      gamification.updateStat('tasksOrganized', result.length); // Track stats
      setShowReward(true);
      setTimeout(() => setShowReward(false), 3000);
    }
  };

  const getPriorityColor = (p: TaskPriority) => {
    switch (p) {
      case TaskPriority.HIGH: return 'bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800';
      case TaskPriority.MEDIUM: return 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800';
      case TaskPriority.LOW: return 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800';
    }
  };

  // Helper to detect if task is suitable for Auto Pilot
  const getAutoPilotIntent = (task: Task) => {
    const text = task.title.toLowerCase();
    
    if (text.includes('email') || text.includes('message') || text.includes('write to')) {
      return { mode: 'email', label: 'Draft Email' };
    }
    if (text.includes('essay') || text.includes('paper') || text.includes('article') || text.includes('report')) {
      return { mode: 'essay', label: 'Outline Essay' };
    }
    if (text.includes('notes') || text.includes('study') || text.includes('summarize')) {
      return { mode: 'notes', label: 'Polish Notes' };
    }
    return null;
  };

  const sendToAutoPilot = (task: Task, intent: { mode: string }) => {
    // Save intent to session storage so AutoPilot picks it up
    const data: any = { mode: intent.mode };
    
    if (intent.mode === 'email') {
      data.purpose = task.title;
    } else if (intent.mode === 'essay') {
      data.topic = task.title;
    } else if (intent.mode === 'notes') {
      // Just set mode, user needs to paste notes
    }

    sessionStorage.setItem('autopilot_intent', JSON.stringify(data));
    
    // Trigger navigation event
    window.dispatchEvent(new CustomEvent('navigate-to', { detail: AppView.AUTOMATION }));
  };

  return (
    <div className="p-4 md:p-6 h-full flex flex-col md:flex-row gap-6 md:gap-8 relative">
      {/* Gamification Reward Overlay */}
      {showReward && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-amber-100 dark:bg-amber-900 border border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-100 px-6 py-2 rounded-full font-bold shadow-lg animate-bounce-in flex items-center gap-2">
          <span>⚡</span> +30 XP Earned!
        </div>
      )}

      {/* Input Section */}
      <div className="w-full md:w-1/3 flex flex-col shrink-0">
        <div className="bg-white dark:bg-slate-800 p-5 md:p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 h-full flex flex-col">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            Task Dump
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
            Brain dump everything you need to do. Include loose deadlines (e.g., "History paper due Friday"). The AI will organize it.
          </p>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 w-full p-4 border border-slate-200 dark:border-slate-600 rounded-xl resize-none focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50 dark:bg-slate-700 mb-4 text-sm leading-relaxed min-h-[200px] text-slate-900 dark:text-white placeholder-slate-400"
            placeholder="- Study for Calc exam&#10;- Email Prof about extension&#10;- Write History Essay on WW2"
          />
          <button
            onClick={handlePrioritize}
            disabled={loading || !input.trim()}
            className="w-full py-3 bg-indigo-600 dark:bg-indigo-700 text-white rounded-xl hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors font-medium flex justify-center items-center gap-2 disabled:opacity-50 shadow-sm"
          >
            {loading ? 'Analyzing...' : 'Prioritize My Life'}
            {!loading && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
          </button>
        </div>
      </div>

      {/* Output Section */}
      <div className="w-full md:w-2/3 flex-1 overflow-hidden flex flex-col">
        <div className="h-full overflow-y-auto pb-4">
          {tasks.length > 0 ? (
            <div className="space-y-4">
               <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4">Optimized Schedule</h3>
               {tasks.map((task) => {
                 const intent = getAutoPilotIntent(task);
                 return (
                   <div key={task.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all animate-fade-in group">
                     <div className="flex flex-wrap justify-between items-start mb-2 gap-2">
                       <div className="flex items-center gap-3">
                         <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getPriorityColor(task.priority)}`}>
                           {task.priority}
                         </span>
                         <h4 className="text-lg font-semibold text-slate-800 dark:text-white">{task.title}</h4>
                       </div>
                       <div className="flex items-center gap-2">
                         {task.deadline && (
                           <div className="flex items-center text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 px-2 py-1 rounded">
                             <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                             {task.deadline}
                           </div>
                         )}
                         {/* Auto Pilot Action Button */}
                         {intent && (
                           <button 
                             onClick={() => sendToAutoPilot(task, intent)}
                             className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors border border-indigo-200 dark:border-indigo-800"
                           >
                             <span>⚡</span> {intent.label}
                           </button>
                         )}
                       </div>
                     </div>
                     <p className="text-slate-600 dark:text-slate-300 text-sm mb-3 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                       <span className="font-semibold text-slate-700 dark:text-slate-200">Why? </span> {task.reasoning}
                     </p>
                     {task.estimatedTime && (
                        <div className="flex justify-end">
                          <span className="text-xs text-slate-400 dark:text-slate-500">Est. {task.estimatedTime}</span>
                        </div>
                     )}
                   </div>
                 );
               })}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-800/30 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 min-h-[300px]">
               <svg className="w-20 h-20 mb-4 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
               <p className="font-medium">No tasks yet.</p>
               <p className="text-sm mt-1">Add your chaotic list on the left.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskMaster;
