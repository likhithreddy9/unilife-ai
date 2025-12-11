
import React, { useState, useEffect, useRef } from 'react';
import { Transaction } from '../types';
import { generateFinancialAdvice, generateFinancialConcept } from '../services/geminiService';
import { gamification, XP_VALUES } from '../services/gamificationService';

const FINANCE_TOPICS_LIST = [
  "Student Loans", "Credit Cards", "Credit Score", "Budgeting", "Investing",
  "Compound Interest", "Taxes", "Roth IRA", "401k", "Emergency Fund",
  "Stocks", "Bonds", "ETFs", "Savings Accounts", "Debt Management",
  "Cryptocurrency", "Inflation", "Insurance", "Financial Aid", "FICO Score"
];

const INITIAL_MISSIONS = [
  { id: 'm1', text: 'Track expenses monthly', xp: 50, completed: false },
  { id: 'm2', text: 'Save at least 10–20% of pocket money', xp: 100, completed: false },
  { id: 'm3', text: 'Learn basic investing (mutual funds, SIP)', xp: 75, completed: false },
  { id: 'm4', text: 'Use UPI / Expense App consistently', xp: 30, completed: false },
];

const FinanceManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'tracker' | 'analytics' | 'learn'>('tracker');
  const [showReward, setShowReward] = useState<{show: boolean, xp: number}>({show: false, xp: 0});
  
  // Persistence: Load from local storage
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem('unilife_wallet_transactions');
      return saved ? JSON.parse(saved) : []; // Default to empty array for 0 balance
    } catch (e) {
      return [];
    }
  });

  const [missions, setMissions] = useState(() => {
    try {
      const saved = localStorage.getItem('unilife_finance_missions');
      return saved ? JSON.parse(saved) : INITIAL_MISSIONS;
    } catch {
      return INITIAL_MISSIONS;
    }
  });

  // Real-time Clock
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Save to local storage whenever transactions/missions change
  useEffect(() => {
    localStorage.setItem('unilife_wallet_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('unilife_finance_missions', JSON.stringify(missions));
  }, [missions]);

  const [newDesc, setNewDesc] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newType, setNewType] = useState<'expense' | 'income'>('expense');
  const [newCategory, setNewCategory] = useState('Food');
  const [goal, setGoal] = useState('');
  const [advice, setAdvice] = useState('');
  const [loadingAdvice, setLoadingAdvice] = useState(false);

  // Learn Tab
  const [concept, setConcept] = useState('Student Loans');
  const [conceptExplanation, setConceptExplanation] = useState('');
  const [loadingConcept, setLoadingConcept] = useState(false);
  
  // Predictions State
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const triggerReward = (xp: number) => {
    gamification.addXp(xp);
    setShowReward({ show: true, xp });
    setTimeout(() => setShowReward({ show: false, xp: 0 }), 3000);
  };

  const handleMissionToggle = (id: string) => {
    const updatedMissions = missions.map((m: any) => {
      if (m.id === id && !m.completed) {
        triggerReward(m.xp);
        return { ...m, completed: true };
      }
      return m;
    });
    setMissions(updatedMissions);
  };

  const handleConceptInput = (val: string) => {
    setConcept(val);
    if (val.length > 0) {
      const filtered = FINANCE_TOPICS_LIST.filter(t => t.toLowerCase().includes(val.toLowerCase()));
      setSuggestions(filtered.slice(0, 5));
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (s: string) => {
    setConcept(s);
    setShowSuggestions(false);
  };

  const addTransaction = () => {
    if (!newDesc || !newAmount) return;
    const t: Transaction = {
      id: Date.now().toString(),
      description: newDesc,
      amount: parseFloat(newAmount),
      type: newType,
      category: newCategory,
      date: new Date().toISOString().split('T')[0] // Real-time date
    };
    setTransactions([t, ...transactions]);
    setNewDesc('');
    setNewAmount('');
    
    // Reward
    gamification.completeQuest('q_finance');
    triggerReward(XP_VALUES.ADD_TRANSACTION);
  };

  const clearData = () => {
    if (confirm("Are you sure you want to reset all data?")) {
      setTransactions([]);
      localStorage.removeItem('unilife_wallet_transactions');
    }
  };

  const getBalance = () => transactions.reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc - t.amount, 0);
  const getExpenses = () => transactions.reduce((acc, t) => t.type === 'expense' ? acc + t.amount : acc, 0);
  const getIncome = () => transactions.reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc, 0);

  const getAdvice = async () => {
    setLoadingAdvice(true);
    const result = await generateFinancialAdvice(JSON.stringify(transactions.slice(0, 5)), goal || "Save money");
    setAdvice(result);
    setLoadingAdvice(false);
    triggerReward(10); // Small reward for analysis
  };

  const handleLearn = async () => {
    setLoadingConcept(true);
    const result = await generateFinancialConcept(concept);
    setConceptExplanation(result);
    setLoadingConcept(false);
    triggerReward(XP_VALUES.READ_RESOURCE);
  };

  // Group transactions by date
  const groupedTransactions = transactions.reduce((groups, transaction) => {
    const date = transaction.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(transaction);
    return groups;
  }, {} as Record<string, Transaction[]>);

  // Sort dates descending
  const sortedDates = Object.keys(groupedTransactions).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  // Analytics Helpers
  const getCategoryData = () => {
    const expenses = transactions.filter(t => t.type === 'expense');
    const categories: Record<string, number> = {};
    let total = 0;
    expenses.forEach(t => {
      categories[t.category] = (categories[t.category] || 0) + t.amount;
      total += t.amount;
    });
    return Object.entries(categories)
      .map(([name, value]) => ({ name, value, percentage: (value / total) * 100 }))
      .sort((a, b) => b.value - a.value);
  };

  // Donut Chart Component
  const DonutChart = ({ data }: { data: { name: string, value: number, percentage: number }[] }) => {
    let cumulativePercent = 0;
    const colors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

    if (data.length === 0) return <div className="h-48 flex items-center justify-center text-slate-400">No data yet</div>;

    return (
      <div className="relative w-48 h-48 mx-auto">
        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
          {data.map((slice, i) => {
            const startPercent = cumulativePercent;
            const endPercent = cumulativePercent + slice.percentage;
            cumulativePercent += slice.percentage;

            const x1 = 50 + 40 * Math.cos(2 * Math.PI * startPercent / 100);
            const y1 = 50 + 40 * Math.sin(2 * Math.PI * startPercent / 100);
            const x2 = 50 + 40 * Math.cos(2 * Math.PI * endPercent / 100);
            const y2 = 50 + 40 * Math.sin(2 * Math.PI * endPercent / 100);

            const largeArc = slice.percentage > 50 ? 1 : 0;

            return (
              <path
                key={i}
                d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                fill={colors[i % colors.length]}
                stroke="white"
                strokeWidth="2"
              />
            );
          })}
          <circle cx="50" cy="50" r="25" fill="currentColor" className="text-white dark:text-slate-800" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
           <span className="text-xs font-bold text-slate-500">Expenses</span>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-8 h-full flex flex-col overflow-y-auto relative" ref={containerRef}>
      
      {/* Reward Overlay */}
      {showReward.show && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-amber-100 dark:bg-amber-900 border border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-100 px-6 py-2 rounded-full font-bold shadow-lg animate-bounce-in flex items-center gap-2">
          <span>⚡</span> +{showReward.xp} XP Earned!
        </div>
      )}

      <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
             <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-1">Wallet Watch 💸</h2>
             <span className="text-xs font-mono bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded shadow-sm flex items-center gap-1 border border-emerald-200 dark:border-emerald-800">
               <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
               ACTIVE
             </span>
          </div>
          <p className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
            <span>{currentTime.toLocaleDateString()}</span>
            <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
            <span className="font-mono text-sm">{currentTime.toLocaleTimeString()}</span>
          </p>
        </div>
        <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg flex text-sm font-medium shrink-0">
          <button onClick={() => setActiveTab('tracker')} className={`px-4 py-2 rounded-md transition-all ${activeTab === 'tracker' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>Tracker</button>
          <button onClick={() => setActiveTab('analytics')} className={`px-4 py-2 rounded-md transition-all ${activeTab === 'analytics' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>Analytics</button>
          <button onClick={() => setActiveTab('learn')} className={`px-4 py-2 rounded-md transition-all ${activeTab === 'learn' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>Learn</button>
        </div>
      </header>

      {activeTab === 'tracker' && (
        <div className="space-y-6">
          {/* Money Missions Section */}
          <div className="bg-amber-50 dark:bg-amber-900/20 p-5 rounded-2xl border border-amber-200 dark:border-amber-800">
             <h3 className="font-bold text-amber-900 dark:text-amber-200 mb-3 flex items-center gap-2">
               <span>🎯</span> Money Missions
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
               {missions.map((m: any) => (
                 <div key={m.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${m.completed ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800' : 'bg-white dark:bg-slate-800 border-amber-100 dark:border-amber-900/50'}`}>
                    <div className="flex items-center gap-3">
                       <input 
                         type="checkbox" 
                         checked={m.completed} 
                         onChange={() => handleMissionToggle(m.id)}
                         disabled={m.completed}
                         className="w-5 h-5 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                       />
                       <span className={`text-sm font-medium ${m.completed ? 'text-emerald-800 dark:text-emerald-200 line-through' : 'text-slate-800 dark:text-slate-200'}`}>{m.text}</span>
                    </div>
                    {m.completed ? (
                      <span className="text-xs font-bold text-emerald-600">Done</span>
                    ) : (
                      <span className="text-xs font-bold text-amber-600">+{m.xp} XP</span>
                    )}
                 </div>
               ))}
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Summary Card */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-900 dark:to-black text-white p-6 rounded-2xl shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                 <svg className="w-32 h-32" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              
              <p className="text-slate-400 font-medium mb-1 text-sm uppercase tracking-widest">Total Balance</p>
              <h3 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">₹{getBalance().toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 backdrop-blur-sm px-4 py-3 rounded-xl border border-white/5">
                  <span className="text-emerald-400 text-xs font-bold uppercase block mb-1">Income</span>
                  <p className="font-bold text-lg">+₹{getIncome().toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm px-4 py-3 rounded-xl border border-white/5">
                  <span className="text-rose-400 text-xs font-bold uppercase block mb-1">Expenses</span>
                  <p className="font-bold text-lg">-₹{getExpenses().toLocaleString('en-IN')}</p>
                </div>
              </div>

              {/* Simulated Live Budget Bar */}
              <div className="mt-6 pt-6 border-t border-white/10">
                 <div className="flex justify-between text-xs text-slate-400 mb-2">
                   <span>Monthly Budget (Est. ₹10,000)</span>
                   <span>{Math.min(100, Math.round((getExpenses() / 10000) * 100))}% Used</span>
                 </div>
                 <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                   <div 
                     className={`h-full rounded-full transition-all duration-500 ${getExpenses() > 10000 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                     style={{ width: `${Math.min(100, (getExpenses() / 10000) * 100)}%` }}
                   ></div>
                 </div>
              </div>
            </div>

            {/* AI Advisor */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm lg:col-span-2 flex flex-col">
               <div className="flex justify-between items-start mb-4">
                  <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400">🤖</div>
                    AI Financial Analysis
                  </h4>
                  <button onClick={clearData} className="text-xs text-slate-400 hover:text-rose-500">Reset Data</button>
               </div>
               
               <div className="flex-1 flex flex-col justify-center mb-4">
                  {advice ? (
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800 animate-fade-in">
                      <p className="text-indigo-900 dark:text-indigo-200 italic font-medium">"{advice}"</p>
                    </div>
                  ) : (
                    <div className="text-center text-slate-400 dark:text-slate-500 py-4">
                      <p className="text-sm">Set a goal to get real-time insights on your spending habits.</p>
                    </div>
                  )}
               </div>

               <div className="flex gap-2 mt-auto">
                 <input 
                   type="text" 
                   value={goal}
                   onChange={(e) => setGoal(e.target.value)}
                   placeholder="Goal: e.g. Save ₹5,000 for spring break..."
                   className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 dark:bg-slate-700 focus:bg-white dark:focus:bg-slate-600 transition-colors text-slate-900 dark:text-white placeholder-slate-400"
                 />
                 <button 
                   onClick={getAdvice}
                   disabled={loadingAdvice}
                   className="px-6 py-2.5 bg-indigo-600 dark:bg-indigo-700 text-white rounded-xl hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors text-sm font-bold disabled:opacity-50 shadow-sm"
                 >
                   {loadingAdvice ? 'Analyzing...' : 'Analyze'}
                 </button>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Add Transaction */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 h-fit">
              <h4 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                <span className="w-2 h-6 bg-slate-800 dark:bg-slate-200 rounded-full"></span>
                Add Transaction
              </h4>
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Description</label>
                  <input 
                    type="text" 
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="e.g. Grocery Run"
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400"
                    onKeyDown={(e) => e.key === 'Enter' && addTransaction()}
                  />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Amount</label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-slate-400 font-bold">₹</span>
                      <input 
                        type="number" 
                        value={newAmount}
                        onChange={(e) => setNewAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-8 pr-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400"
                        onKeyDown={(e) => e.key === 'Enter' && addTransaction()}
                      />
                    </div>
                  </div>
                  <div className="w-1/3">
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Type</label>
                    <select 
                      value={newType}
                      onChange={(e) => setNewType(e.target.value as any)}
                      className="w-full px-3 py-3 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    >
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                    </select>
                  </div>
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Category</label>
                   <select 
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full px-3 py-3 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    >
                      {['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'General'].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                </div>
                <button 
                  onClick={addTransaction}
                  disabled={!newDesc || !newAmount}
                  className="w-full py-3.5 bg-slate-900 dark:bg-slate-700 text-white rounded-xl hover:bg-slate-800 dark:hover:bg-slate-600 transition-all font-bold shadow-lg shadow-slate-200 dark:shadow-none active:scale-95 disabled:opacity-50 disabled:shadow-none"
                >
                  Add Entry (+15 XP)
                </button>
              </div>
            </div>

            {/* History */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 h-[500px] overflow-hidden flex flex-col">
              <h4 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center justify-between">
                <span>History</span>
                <span className="text-xs font-normal text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">{transactions.length} entries</span>
              </h4>
              
              <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                {sortedDates.length > 0 ? sortedDates.map(date => (
                  <div key={date}>
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 sticky top-0 bg-white dark:bg-slate-800 py-1 z-10">
                      {date === new Date().toISOString().split('T')[0] ? 'Today' : 
                       date === new Date(Date.now() - 86400000).toISOString().split('T')[0] ? 'Yesterday' : 
                       new Date(date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                    </h5>
                    <div className="space-y-3">
                      {groupedTransactions[date].map(t => (
                        <div key={t.id} className="group flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-700/50 hover:bg-white dark:hover:bg-slate-700 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-slate-600 hover:shadow-sm transition-all">
                          <div className="flex items-center gap-3">
                             <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${t.type === 'income' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'}`}>
                               {t.type === 'income' ? '💰' : '💸'}
                             </div>
                             <div>
                               <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{t.description}</p>
                               <p className="text-xs text-slate-400">{t.category}</p>
                             </div>
                          </div>
                          <span className={`font-bold ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'}`}>
                            {t.type === 'income' ? '+' : '-'}₹{t.amount.toLocaleString('en-IN')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 opacity-50">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4 text-2xl">🧾</div>
                    <p>No recent transactions</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="max-w-4xl mx-auto w-full space-y-8 animate-fade-in">
           {/* Top Stats */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-center">
                 <h3 className="font-bold text-slate-800 dark:text-white mb-6">Spending Breakdown</h3>
                 <DonutChart data={getCategoryData()} />
                 <div className="mt-6 flex flex-wrap justify-center gap-4">
                    {getCategoryData().slice(0, 4).map((d, i) => (
                       <div key={d.name} className="flex items-center gap-2 text-xs">
                          <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'][i] }}></div>
                          <span className="text-slate-600 dark:text-slate-300">{d.name} ({Math.round(d.percentage)}%)</span>
                       </div>
                    ))}
                 </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                 <h3 className="font-bold text-slate-800 dark:text-white mb-4">Financial Health</h3>
                 
                 <div className="space-y-6">
                    <div>
                       <div className="flex justify-between text-sm mb-2">
                          <span className="text-slate-500">Monthly Savings Rate</span>
                          <span className="font-bold text-emerald-600">{getIncome() > 0 ? Math.round(((getIncome() - getExpenses()) / getIncome()) * 100) : 0}%</span>
                       </div>
                       <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                          <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${getIncome() > 0 ? Math.min(100, Math.max(0, ((getIncome() - getExpenses()) / getIncome()) * 100)) : 0}%` }}></div>
                       </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl">
                       <p className="text-xs font-bold text-slate-400 uppercase mb-1">Projection</p>
                       <p className="text-sm text-slate-600 dark:text-slate-300">
                          Based on your current spending, you can save 
                          <strong className="text-slate-900 dark:text-white"> ₹{(getIncome() - getExpenses()) * 3} </strong> 
                          in the next 3 months.
                       </p>
                    </div>

                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800">
                       <p className="text-xs font-bold text-indigo-400 uppercase mb-1">Recommendation</p>
                       <p className="text-sm text-indigo-800 dark:text-indigo-200">
                          {getCategoryData()[0] ? `Your highest spending is on ${getCategoryData()[0].name}. Try to reduce it by 10% next week.` : "Track more expenses to get personalized tips."}
                       </p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'learn' && (
        <div className="max-w-3xl mx-auto w-full">
           <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 text-center relative z-20">
             <div className="text-5xl mb-4">🎓</div>
             <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Financial Literacy 101</h3>
             <p className="text-slate-600 dark:text-slate-300 mb-8">Understanding money is just as important as your degree.</p>

             <div className="flex flex-wrap gap-2 justify-center mb-8">
                {['Student Loans', 'Credit Cards', 'Investing for Students', 'Taxes', 'Scholarships', 'Emergency Funds'].map(t => (
                  <button 
                    key={t}
                    onClick={() => { setConcept(t); handleLearn(); }}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${concept === t ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-emerald-400 dark:hover:border-emerald-500'}`}
                  >
                    {t}
                  </button>
                ))}
             </div>

             <div className="flex gap-2 max-w-lg mx-auto mb-6 relative">
                <div className="flex-1 relative">
                  <input 
                    type="text" 
                    value={concept}
                    onChange={(e) => handleConceptInput(e.target.value)}
                    onFocus={() => concept && handleConceptInput(concept)}
                    placeholder="Or type any topic..."
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400"
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <ul className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-lg shadow-xl overflow-hidden z-50 animate-fade-in text-left">
                      {suggestions.map((s, i) => (
                        <li key={i} onClick={() => selectSuggestion(s)} className="px-4 py-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 cursor-pointer text-sm text-slate-700 dark:text-slate-200 border-b border-slate-50 dark:border-slate-600 last:border-0">
                          {s}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <button 
                  onClick={handleLearn}
                  disabled={loadingConcept || !concept}
                  className="px-6 py-3 bg-slate-900 dark:bg-slate-700 text-white font-bold rounded-xl hover:bg-slate-800 dark:hover:bg-slate-600"
                >
                  Explain
                </button>
             </div>

             {conceptExplanation && (
               <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-2xl border border-emerald-100 dark:border-emerald-800 text-left animate-fade-in">
                 <h4 className="font-bold text-emerald-900 dark:text-emerald-200 mb-2">{concept}</h4>
                 <div className="prose prose-emerald dark:prose-invert max-w-none text-emerald-800 dark:text-emerald-300 leading-relaxed whitespace-pre-wrap">
                   {conceptExplanation}
                 </div>
               </div>
             )}
           </div>
        </div>
      )}
    </div>
  );
};

export default FinanceManager;
