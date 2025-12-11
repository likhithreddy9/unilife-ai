
import React, { useState, useEffect } from 'react';
import { generateEmailDraft, generateEssayOutline, polishNotes } from '../services/geminiService';
import { gamification, XP_VALUES } from '../services/gamificationService';

const AutoPilot: React.FC = () => {
  const [activeMode, setActiveMode] = useState<'email' | 'essay' | 'notes'>('email');
  const [loading, setLoading] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);

  // Email State
  const [recipient, setRecipient] = useState('');
  const [purpose, setPurpose] = useState('');
  const [tone, setTone] = useState('Professional');
  const [emailResult, setEmailResult] = useState<{subject: string, body: string} | null>(null);

  // Essay State
  const [essayTopic, setEssayTopic] = useState('');
  const [essayType, setEssayType] = useState('Argumentative');
  const [essayPoints, setEssayPoints] = useState('');
  const [essayResult, setEssayResult] = useState('');

  // Notes State
  const [rawNotes, setRawNotes] = useState('');
  const [notesResult, setNotesResult] = useState('');

  // Check for incoming intent from TaskMaster
  useEffect(() => {
    try {
      const intentStr = sessionStorage.getItem('autopilot_intent');
      if (intentStr) {
        const intent = JSON.parse(intentStr);
        if (intent.mode) {
          setActiveMode(intent.mode);
          if (intent.mode === 'email' && intent.purpose) {
            setPurpose(intent.purpose);
          } else if (intent.mode === 'essay' && intent.topic) {
            setEssayTopic(intent.topic);
          }
        }
        // Clear it so it doesn't persist on refresh unintentionally
        sessionStorage.removeItem('autopilot_intent');
      }
    } catch (e) {
      console.error("Failed to parse intent", e);
    }
  }, []);

  const triggerReward = (xp: number) => {
    gamification.addXp(xp);
    setXpEarned(xp);
    setShowReward(true);
    setTimeout(() => setShowReward(false), 3000);
  };

  const handleDraftEmail = async () => {
    if (!recipient || !purpose) return;
    setLoading(true);
    setShowReward(false);
    const draft = await generateEmailDraft(recipient, purpose, tone);
    if (draft) {
      setEmailResult(draft);
      triggerReward(XP_VALUES.GENERATE_EMAIL);
    }
    setLoading(false);
  };

  const handleGenerateOutline = async () => {
    if (!essayTopic) return;
    setLoading(true);
    setShowReward(false);
    const outline = await generateEssayOutline(essayTopic, essayType, essayPoints);
    setEssayResult(outline);
    triggerReward(XP_VALUES.GENERATE_OUTLINE);
    setLoading(false);
  };

  const handlePolishNotes = async () => {
    if (!rawNotes) return;
    setLoading(true);
    setShowReward(false);
    const polished = await polishNotes(rawNotes);
    setNotesResult(polished);
    triggerReward(XP_VALUES.POLISH_NOTES);
    setLoading(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const modes = [
    { id: 'email', label: 'Email Drafter', icon: '✉️', color: 'bg-purple-600', hover: 'hover:bg-purple-700', light: 'bg-purple-50 dark:bg-purple-900/30' },
    { id: 'essay', label: 'Essay Architect', icon: '🏛️', color: 'bg-blue-600', hover: 'hover:bg-blue-700', light: 'bg-blue-50 dark:bg-blue-900/30' },
    { id: 'notes', label: 'Notes Polisher', icon: '✨', color: 'bg-emerald-600', hover: 'hover:bg-emerald-700', light: 'bg-emerald-50 dark:bg-emerald-900/30' },
  ];

  const currentTheme = modes.find(m => m.id === activeMode) || modes[0];

  return (
    <div className="p-4 md:p-6 h-full flex flex-col gap-6 relative overflow-hidden">
      {/* Reward Overlay */}
      {showReward && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-indigo-100 dark:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-100 px-6 py-2 rounded-full font-bold shadow-lg animate-bounce-in flex items-center gap-2">
          <span>⚡</span> +{xpEarned} XP Earned!
        </div>
      )}

      {/* Mode Selector */}
      <div className="flex bg-white dark:bg-slate-800 p-1.5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 w-fit mx-auto md:mx-0">
        {modes.map(mode => (
          <button
            key={mode.id}
            onClick={() => setActiveMode(mode.id as any)}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
              activeMode === mode.id 
                ? `${mode.color} text-white shadow-md transform scale-105` 
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <span>{mode.icon}</span>
            <span className="hidden md:inline">{mode.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">
        
        {/* INPUT SECTION */}
        <div className="w-full md:w-1/3 flex flex-col shrink-0 h-full overflow-y-auto">
          <div className={`p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 h-full flex flex-col bg-white dark:bg-slate-800 transition-colors`}>
            
            {activeMode === 'email' && (
              <div className="space-y-4 animate-fade-in">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Email Auto-Pilot</h2>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Who is this for?</label>
                  <select value={recipient} onChange={(e) => setRecipient(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white">
                    <option value="">Select Recipient</option>
                    <option value="Professor">Professor</option>
                    <option value="Academic Advisor">Academic Advisor</option>
                    <option value="Recruiter">Recruiter</option>
                    <option value="Landlord">Landlord</option>
                    <option value="Registrar">Registrar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Goal</label>
                  <textarea value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="e.g. Asking for an extension on the history paper..." className="w-full h-32 px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 resize-none bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Tone</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Formal', 'Casual', 'Persuasive', 'Apologetic'].map(t => (
                      <button key={t} onClick={() => setTone(t)} className={`py-2 text-xs font-bold rounded-lg border transition-colors ${tone === t ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 border-purple-300' : 'border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400'}`}>{t}</button>
                    ))}
                  </div>
                </div>
                <button onClick={handleDraftEmail} disabled={loading || !recipient || !purpose} className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-colors shadow-lg disabled:opacity-50 mt-auto">
                  {loading ? 'Drafting...' : 'Generate Email'}
                </button>
              </div>
            )}

            {activeMode === 'essay' && (
              <div className="space-y-4 animate-fade-in">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Essay Architect</h2>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Topic</label>
                  <input type="text" value={essayTopic} onChange={(e) => setEssayTopic(e.target.value)} placeholder="e.g. The Impact of AI on Education" className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Essay Type</label>
                  <select value={essayType} onChange={(e) => setEssayType(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white">
                    <option value="Argumentative">Argumentative</option>
                    <option value="Expository">Expository</option>
                    <option value="Narrative">Narrative</option>
                    <option value="Descriptive">Descriptive</option>
                    <option value="Research Paper">Research Paper</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Key Points (Optional)</label>
                  <textarea value={essayPoints} onChange={(e) => setEssayPoints(e.target.value)} placeholder="- Ethics&#10;- Automation&#10;- Future job market" className="w-full h-32 px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 resize-none bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white" />
                </div>
                <button onClick={handleGenerateOutline} disabled={loading || !essayTopic} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-lg disabled:opacity-50 mt-auto">
                  {loading ? 'Structuring...' : 'Build Blueprint'}
                </button>
              </div>
            )}

            {activeMode === 'notes' && (
              <div className="space-y-4 animate-fade-in flex flex-col h-full">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Notes Polisher</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Paste messy lecture notes below. AI will format, summarize, and highlight key terms.</p>
                <textarea value={rawNotes} onChange={(e) => setRawNotes(e.target.value)} placeholder="Prof said mitochondria is powerhouse... something about ATP... Krebs cycle inputs are..." className="flex-1 w-full p-4 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-emerald-500 resize-none bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white" />
                <button onClick={handlePolishNotes} disabled={loading || !rawNotes} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors shadow-lg disabled:opacity-50">
                  {loading ? 'Polishing...' : 'Format Notes'}
                </button>
              </div>
            )}

          </div>
        </div>

        {/* OUTPUT SECTION */}
        <div className="w-full md:w-2/3 flex-1 h-full min-h-[400px]">
          <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 h-full flex flex-col relative overflow-hidden">
             
             {/* Email Output */}
             {activeMode === 'email' && (
               emailResult ? (
                 <div className="animate-fade-in flex flex-col h-full">
                   <div className="mb-4 pb-4 border-b border-slate-100 dark:border-slate-700">
                     <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Subject</label>
                     <h3 className="text-lg font-bold text-slate-800 dark:text-white">{emailResult.subject}</h3>
                   </div>
                   <div className="flex-1 overflow-y-auto">
                     <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed text-sm md:text-base">{emailResult.body}</p>
                   </div>
                   <button onClick={() => copyToClipboard(`Subject: ${emailResult.subject}\n\n${emailResult.body}`)} className="absolute top-6 right-6 p-2 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-lg hover:bg-purple-100 hover:text-purple-600 dark:hover:bg-purple-900/30 transition-colors">
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                   </button>
                 </div>
               ) : (
                 <EmptyState icon="✉️" text="Ready to draft your email." />
               )
             )}

             {/* Essay Output */}
             {activeMode === 'essay' && (
               essayResult ? (
                 <div className="animate-fade-in flex flex-col h-full">
                   <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-700">
                      <h3 className="font-bold text-slate-700 dark:text-slate-300">Essay Blueprint</h3>
                      <button onClick={() => copyToClipboard(essayResult)} className="text-xs font-bold text-blue-600 hover:underline">Copy All</button>
                   </div>
                   <div className="flex-1 overflow-y-auto pr-2">
                     <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300">
                        <pre className="whitespace-pre-wrap font-sans">{essayResult}</pre>
                     </div>
                   </div>
                 </div>
               ) : (
                 <EmptyState icon="🏛️" text="Define your topic to generate a structure." />
               )
             )}

             {/* Notes Output */}
             {activeMode === 'notes' && (
               notesResult ? (
                 <div className="animate-fade-in flex flex-col h-full">
                   <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-700">
                      <h3 className="font-bold text-slate-700 dark:text-slate-300">Study Guide</h3>
                      <button onClick={() => copyToClipboard(notesResult)} className="text-xs font-bold text-emerald-600 hover:underline">Copy All</button>
                   </div>
                   <div className="flex-1 overflow-y-auto pr-2">
                     <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300">
                        <pre className="whitespace-pre-wrap font-sans">{notesResult}</pre>
                     </div>
                   </div>
                 </div>
               ) : (
                 <EmptyState icon="📝" text="Paste raw notes to organize them." />
               )
             )}

          </div>
        </div>
      </div>
    </div>
  );
};

const EmptyState = ({ icon, text }: { icon: string, text: string }) => (
  <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 opacity-60">
    <div className="text-6xl mb-4 grayscale opacity-50">{icon}</div>
    <p className="text-lg font-medium">{text}</p>
  </div>
);

export default AutoPilot;
