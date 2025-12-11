
import React, { useState, useRef, useEffect } from 'react';
import { generateWellnessChat, generateWorkoutRoutine, searchMarketplace } from '../services/geminiService';
import { ChatMessage, WorkoutRoutine, MarketplaceItem } from '../types';

const WellnessCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'chat' | 'focus' | 'library' | 'fitness' | 'clinic'>('chat');
  
  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: "Hi, I'm Vent Buddy. I'm here to listen without judgment. How are you feeling today?", timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Focus Timer
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [timerActive, setTimerActive] = useState(false);

  // Audio simulation
  const [audioPlaying, setAudioPlaying] = useState(false);

  // Fitness State
  const [fitnessFocus, setFitnessFocus] = useState('Full Body');
  const [fitnessTime, setFitnessTime] = useState('20 minutes');
  const [fitnessEquipment, setFitnessEquipment] = useState('No Equipment');
  const [workoutRoutine, setWorkoutRoutine] = useState<WorkoutRoutine | null>(null);
  const [loadingWorkout, setLoadingWorkout] = useState(false);

  // Clinic State
  const [clinicQuery, setClinicQuery] = useState('');
  const [clinicItems, setClinicItems] = useState<MarketplaceItem[]>([]);
  const [loadingClinic, setLoadingClinic] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    let interval: any = null;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = { role: 'user', text: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    const history = messages.map(m => ({ role: m.role, parts: [{ text: m.text }] }));
    const response = await generateWellnessChat(history, userMsg.text);
    setMessages(prev => [...prev, { role: 'model', text: response, timestamp: new Date() }]);
    setLoading(false);
  };

  const handleGenerateWorkout = async () => {
    setLoadingWorkout(true);
    setWorkoutRoutine(null);
    const routine = await generateWorkoutRoutine(fitnessFocus, fitnessTime, fitnessEquipment);
    setWorkoutRoutine(routine);
    setLoadingWorkout(false);
  };

  const handleClinicSearch = async (override?: string) => {
    const q = override || clinicQuery;
    if(!q) return;
    setLoadingClinic(true);
    setClinicItems([]);
    const results = await searchMarketplace('Health & Pharmacy', q);
    setClinicItems(results);
    setLoadingClinic(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="h-full flex flex-col md:flex-row gap-6 p-4 md:p-8 overflow-y-auto">
      {/* Sidebar */}
      <div className="w-full md:w-64 shrink-0 space-y-4">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
           <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Mind & Body 🌿</h2>
           <div className="space-y-2">
             <button onClick={() => setActiveTab('chat')} className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'chat' ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border border-teal-100 dark:border-teal-800' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>💬 Vent Buddy</button>
             <button onClick={() => setActiveTab('focus')} className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'focus' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>🧘 Focus Zone</button>
             <button onClick={() => setActiveTab('library')} className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'library' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-100 dark:border-amber-800' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>📚 Virtual Library</button>
             <button onClick={() => setActiveTab('fitness')} className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'fitness' ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border border-rose-100 dark:border-rose-800' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>💪 Fitness Studio</button>
             <button onClick={() => setActiveTab('clinic')} className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'clinic' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>🏥 Campus Clinic</button>
           </div>
        </div>

        <div className="bg-gradient-to-br from-teal-500 to-emerald-600 p-6 rounded-2xl text-white shadow-lg">
          <h3 className="font-bold text-lg mb-2">Self-Care Tip</h3>
          <p className="text-sm opacity-90 leading-relaxed">"Sleep is not optional. Aim for 7-8 hours to consolidate memory!"</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col h-[600px] md:h-auto relative">
        {activeTab === 'chat' && (
          <>
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
              <span className="font-semibold text-slate-700 dark:text-slate-200">Safe Space Chat</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">Private & Confidential</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30 dark:bg-slate-900/30">
              {messages.map((msg, i) => (<div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-teal-600 text-white rounded-tr-none' : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-sm border border-slate-100 dark:border-slate-600 rounded-tl-none'}`}>{msg.text}</div></div>))}
              {loading && <div className="text-xs text-slate-400 ml-4">Vent Buddy is thinking...</div>}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800"><div className="flex gap-2"><input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Tell me what's on your mind..." className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" /><button onClick={handleSend} disabled={loading || !input.trim()} className="p-2 bg-teal-600 text-white rounded-full hover:bg-teal-700 transition-colors disabled:opacity-50"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" /></svg></button></div></div>
          </>
        )}
        
        {activeTab === 'focus' && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-indigo-50/30 dark:bg-indigo-900/10">
            <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Focus Mode</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8">Block out distractions and study.</p>
            <div className="w-64 h-64 rounded-full border-8 border-indigo-100 dark:border-indigo-900 flex items-center justify-center bg-white dark:bg-slate-800 shadow-xl mb-8 relative">
              <span className="text-6xl font-mono font-bold text-indigo-600 dark:text-indigo-400">{formatTime(timeLeft)}</span>
              {timerActive && (<div className="absolute inset-0 rounded-full border-8 border-indigo-500 border-t-transparent animate-spin-slow opacity-30"></div>)}
            </div>
            <div className="flex gap-4">
              <button onClick={() => setTimerActive(!timerActive)} className={`px-8 py-3 rounded-xl font-bold text-lg transition-all shadow-md ${timerActive ? 'bg-rose-500 text-white hover:bg-rose-600' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>{timerActive ? 'Pause' : 'Start Focus'}</button>
              <button onClick={() => { setTimerActive(false); setTimeLeft(25 * 60); }} className="px-6 py-3 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors">Reset</button>
            </div>
          </div>
        )}

        {activeTab === 'library' && (
           <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden bg-amber-50 dark:bg-amber-900/20">
             <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1507842217121-4e9517a35213?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-10"></div>
             <div className="relative z-10 bg-white/80 dark:bg-slate-800/80 p-8 rounded-3xl backdrop-blur-md shadow-xl border border-amber-100 dark:border-amber-900/50 max-w-md">
                <h3 className="text-2xl font-bold text-amber-900 dark:text-amber-100 mb-2">Quiet Study Space</h3>
                <p className="text-amber-800 dark:text-amber-200/80 mb-6">Simulate a library environment to boost concentration.</p>
                
                <div className="flex justify-center gap-4 mb-6">
                   <button onClick={() => setAudioPlaying(!audioPlaying)} className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-md transition-all ${audioPlaying ? 'bg-amber-600 text-white scale-110' : 'bg-white dark:bg-slate-700 text-amber-600'}`}>
                      {audioPlaying ? '⏸' : '▶'}
                   </button>
                </div>
                {audioPlaying && (
                  <div className="text-sm text-amber-600 dark:text-amber-400 font-medium animate-pulse">
                    Playing: 🎧 Library Ambience (White Noise)
                  </div>
                )}
                {!audioPlaying && <p className="text-xs text-slate-400">Click play to focus</p>}
             </div>
           </div>
        )}

        {activeTab === 'fitness' && (
          <div className="flex-1 flex flex-col p-6 overflow-y-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">Fitness Studio 💪</h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm">Generate quick, effective workouts for your dorm room.</p>
            </div>

            <div className="bg-rose-50 dark:bg-rose-900/20 p-6 rounded-2xl border border-rose-100 dark:border-rose-900/50 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-bold text-rose-800 dark:text-rose-200 uppercase tracking-wider mb-2">Focus Area</label>
                  <select 
                    value={fitnessFocus}
                    onChange={(e) => setFitnessFocus(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-rose-200 dark:border-rose-800 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option>Full Body</option>
                    <option>Core & Abs</option>
                    <option>Upper Body</option>
                    <option>Lower Body</option>
                    <option>Cardio / HIIT</option>
                    <option>Yoga / Stretch</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-rose-800 dark:text-rose-200 uppercase tracking-wider mb-2">Time</label>
                  <select 
                    value={fitnessTime}
                    onChange={(e) => setFitnessTime(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-rose-200 dark:border-rose-800 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option>10 minutes</option>
                    <option>15 minutes</option>
                    <option>20 minutes</option>
                    <option>30 minutes</option>
                    <option>45 minutes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-rose-800 dark:text-rose-200 uppercase tracking-wider mb-2">Equipment</label>
                  <select 
                    value={fitnessEquipment}
                    onChange={(e) => setFitnessEquipment(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-rose-200 dark:border-rose-800 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option>No Equipment</option>
                    <option>Dumbbells</option>
                    <option>Resistance Bands</option>
                    <option>Chair / Desk</option>
                  </select>
                </div>
              </div>
              <button 
                onClick={handleGenerateWorkout}
                disabled={loadingWorkout}
                className="w-full py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-colors shadow-sm disabled:opacity-50"
              >
                {loadingWorkout ? 'Generating Workout...' : 'Generate Workout Plan'}
              </button>
            </div>

            {workoutRoutine && (
              <div className="animate-fade-in space-y-4">
                <div className="flex justify-between items-end border-b border-slate-100 dark:border-slate-700 pb-2">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">{workoutRoutine.title}</h3>
                    <div className="flex gap-2 mt-1">
                      <span className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300 font-medium">{workoutRoutine.estimatedTime}</span>
                      <span className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300 font-medium">{workoutRoutine.difficulty}</span>
                    </div>
                  </div>
                  <button onClick={() => setWorkoutRoutine(null)} className="text-sm text-rose-600 hover:underline">Clear</button>
                </div>

                <div className="space-y-3">
                  {workoutRoutine.exercises.map((exercise, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-start gap-4">
                      <div className="w-8 h-8 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center text-rose-600 dark:text-rose-400 font-bold shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <h4 className="font-bold text-slate-800 dark:text-white">{exercise.name}</h4>
                          <span className="text-sm font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 px-2 py-0.5 rounded">{exercise.durationOrReps}</span>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{exercise.instructions}</p>
                      </div>
                      <input type="checkbox" className="w-6 h-6 rounded border-slate-300 dark:border-slate-600 text-rose-600 focus:ring-rose-500 mt-1 cursor-pointer" />
                    </div>
                  ))}
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl text-center text-sm text-slate-500 dark:text-slate-400 mt-4">
                  ⚠️ Always warm up before starting and stay hydrated!
                </div>
              </div>
            )}
            
            {!workoutRoutine && !loadingWorkout && (
               <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                  <span className="text-4xl mb-2 opacity-50">🏃‍♂️</span>
                  <p>Ready to move? Generate a custom plan above.</p>
               </div>
            )}
          </div>
        )}

        {activeTab === 'clinic' && (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Header / Appointment Banner */}
                <div className="p-6 bg-gradient-to-r from-emerald-500 to-teal-600 text-white shrink-0">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold mb-1">Student Health Center</h2>
                            <p className="opacity-90 text-sm">Professional care & pharmacy essentials.</p>
                        </div>
                        <button onClick={() => setShowBookingModal(true)} className="bg-white text-emerald-600 px-4 py-2 rounded-lg font-bold text-sm shadow-md hover:bg-emerald-50 transition-colors">
                            📅 Book Appointment
                        </button>
                    </div>
                </div>

                {/* Pharmacy Search */}
                <div className="p-6 flex-1 overflow-y-auto">
                    <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <span>💊</span> Campus Pharmacy
                    </h3>
                    
                    <div className="flex gap-2 mb-6">
                        <input 
                            type="text" 
                            value={clinicQuery}
                            onChange={(e) => setClinicQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleClinicSearch()}
                            placeholder="Search for medicines, vitamins, first aid..."
                            className="flex-1 px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                        <button 
                            onClick={() => handleClinicSearch()}
                            disabled={loadingClinic}
                            className="px-6 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                        >
                            {loadingClinic ? 'Searching...' : 'Find'}
                        </button>
                    </div>

                    {/* Quick Categories */}
                    <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
                        {['Cold & Flu', 'Pain Relief', 'First Aid', 'Vitamins', 'Skincare', 'Protein'].map(cat => (
                            <button 
                                key={cat}
                                onClick={() => { setClinicQuery(cat); handleClinicSearch(cat); }}
                                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 rounded-lg text-sm font-medium whitespace-nowrap transition-colors"
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Results */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {loadingClinic && [1,2,3].map(i => (
                            <div key={i} className="h-64 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse"></div>
                        ))}
                        
                        {clinicItems.map((item, idx) => (
                            <div key={idx} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden hover:shadow-lg transition-all group">
                                <div className="h-32 bg-slate-100 dark:bg-slate-700 relative overflow-hidden flex items-center justify-center">
                                     <img 
                                        src={item.imageUrl} 
                                        alt={item.name}
                                        className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden'); }}
                                     />
                                     <div className="hidden absolute inset-0 flex items-center justify-center text-4xl">💊</div>
                                </div>
                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="font-bold text-slate-800 dark:text-white text-sm line-clamp-2">{item.name}</h4>
                                        <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs px-2 py-0.5 rounded font-bold">{item.price}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">{item.description}</p>
                                    <a href={item.link} target="_blank" rel="noreferrer" className="block w-full py-2 bg-slate-900 dark:bg-slate-700 text-white text-center text-xs font-bold rounded-lg hover:bg-emerald-600 transition-colors">
                                        View Item
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    {!loadingClinic && clinicItems.length === 0 && (
                        <div className="text-center py-10 text-slate-400">
                            <span className="text-4xl block mb-2">🏥</span>
                            <p>Search for medical essentials or book an appointment.</p>
                        </div>
                    )}
                </div>
                
                {/* Booking Modal */}
                {showBookingModal && (
                    <div className="absolute inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-fade-in">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Book Appointment</h3>
                            <div className="space-y-3 mb-6">
                                <button className="w-full p-3 text-left border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                    <div className="font-bold text-slate-800 dark:text-white">General Physician</div>
                                    <div className="text-xs text-slate-500">Available Today, 2:00 PM</div>
                                </button>
                                <button className="w-full p-3 text-left border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                    <div className="font-bold text-slate-800 dark:text-white">Mental Health Counselor</div>
                                    <div className="text-xs text-slate-500">Available Tomorrow, 10:00 AM</div>
                                </button>
                            </div>
                            <button onClick={() => { alert('Appointment Request Sent!'); setShowBookingModal(false); }} className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 mb-2">Confirm Booking</button>
                            <button onClick={() => setShowBookingModal(false)} className="w-full py-3 text-slate-500 hover:text-slate-700 text-sm font-bold">Cancel</button>
                        </div>
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default WellnessCenter;
