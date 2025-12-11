
import React, { useState, useEffect, useRef } from 'react';
import { generateSocialTips, getCampusRealTimeInfo, getDashboardUpdates } from '../services/geminiService';
import { CampusItem, DashboardUpdate } from '../types';
import { gamification, XP_VALUES } from '../services/gamificationService';

const SocialHub: React.FC = () => {
  const [context, setContext] = useState('');
  const [tips, setTips] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'networking' | 'campus' | 'safety'>('campus');
  const [showReward, setShowReward] = useState<{show: boolean, xp: number}>({show: false, xp: 0});

  // Campus Life State
  const [activeSection, setActiveSection] = useState<string>('clubs'); // Default to clubs
  const [sectionData, setSectionData] = useState<Record<string, CampusItem[]>>({});
  const [loadingSection, setLoadingSection] = useState(false);
  const [interestedItems, setInterestedItems] = useState<Set<string>>(new Set());
  
  // Trending State
  const [trendingItem, setTrendingItem] = useState<DashboardUpdate | null>(null);

  // Filters State
  const [filterLocation, setFilterLocation] = useState('');
  const [filterMode, setFilterMode] = useState<'Any' | 'Online' | 'Offline'>('Any');
  const [filterTime, setFilterTime] = useState<'Anytime' | 'This Week' | 'This Month'>('Anytime');

  // Safety Toolkit State
  const [locationShared, setLocationShared] = useState(false);
  const [sirenActive, setSirenActive] = useState(false);
  const [fakeCallTimer, setFakeCallTimer] = useState<number | null>(null);
  const [showFakeCallScreen, setShowFakeCallScreen] = useState(false);

  useEffect(() => {
    let interval: any;
    if (fakeCallTimer !== null && fakeCallTimer > 0) {
      interval = setInterval(() => setFakeCallTimer(prev => (prev ? prev - 1 : 0)), 1000);
    } else if (fakeCallTimer === 0) {
      setFakeCallTimer(null);
      setShowFakeCallScreen(true);
    }
    return () => clearInterval(interval);
  }, [fakeCallTimer]);

  // Load initial campus data on mount if tab is campus
  useEffect(() => {
    if (activeTab === 'campus') {
      if(activeSection && !sectionData[activeSection]) {
        fetchCampusData();
      }
      // Fetch trending item if not loaded
      if(!trendingItem) {
        getDashboardUpdates().then(updates => {
          if (updates && updates.length > 0) {
            setTrendingItem(updates[0]);
          }
        });
      }
    }
  }, [activeTab]);

  const triggerReward = (xp: number) => {
    gamification.addXp(xp);
    setShowReward({ show: true, xp });
    setTimeout(() => setShowReward({ show: false, xp: 0 }), 3000);
  };

  const handleGenerate = async () => {
    if (!context) return;
    setLoading(true);
    const result = await generateSocialTips(context);
    setTips(result);
    setLoading(false);
    triggerReward(XP_VALUES.GET_SOCIAL_TIP);
  };

  const toggleInterest = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSet = new Set(interestedItems);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
      triggerReward(5);
    }
    setInterestedItems(newSet);
  };

  const startFakeCall = () => {
    setFakeCallTimer(10); // 10 seconds
  };

  const campusSections = [
    {
      id: 'clubs',
      title: 'Clubs & Tribes',
      query: 'Best international college student clubs to join 2025',
      icon: '🚀',
      color: 'from-indigo-500 to-blue-500',
      description: 'Find communities.'
    },
    {
      id: 'workshops',
      title: 'Events & Fests',
      query: 'Major student hackathons and cultural fests 2025',
      icon: '🎟️',
      color: 'from-purple-500 to-pink-500',
      description: 'Seminars & fests.'
    },
    {
      id: 'volunteering',
      title: 'Volunteering',
      query: 'Student volunteering opportunities NGO',
      icon: '❤️',
      color: 'from-rose-500 to-orange-500',
      description: 'Community service.'
    },
    {
      id: 'sports',
      title: 'Sports & Rec',
      query: 'College sports tournaments and intramurals',
      icon: '🏆',
      color: 'from-emerald-500 to-teal-500',
      description: 'Leagues & fitness.'
    }
  ];

  const getQueryForSection = (id: string) => campusSections.find(s => s.id === id)?.query || '';

  const fetchCampusData = async (forceRefresh = false) => {
    if (!forceRefresh && sectionData[activeSection]) return;

    setLoadingSection(true);
    // Clear current data to show loading state if forcing refresh
    if (forceRefresh) {
        setSectionData(prev => ({ ...prev, [activeSection]: [] }));
    }

    try {
      const baseQuery = getQueryForSection(activeSection);
      const items = await getCampusRealTimeInfo(baseQuery, {
        location: filterLocation,
        mode: filterMode,
        time: filterTime
      });
      setSectionData(prev => ({ ...prev, [activeSection]: items }));
      triggerReward(5); 
    } catch (e) {
      console.error("Failed to load section data", e);
    } finally {
      setLoadingSection(false);
    }
  };

  const handleSectionClick = (sectionId: string) => {
    setActiveSection(sectionId);
    // We use useEffect to trigger fetch when activeSection changes, 
    // but here we might want to ensure we fetch if data is missing.
    // However, the existing logic in render checks data.
    // To handle the visual update immediately:
    if (activeSection !== sectionId) {
       // logic is handled by the render/effect combination or direct call
       // Let's rely on a direct call for smoother UX
       if (!sectionData[sectionId]) {
           // We need to wait for state update, so passing ID manually or using effect
           // Simpler: just set ID, the effect below will catch it if we add [activeSection] dependency
       }
    }
  };

  // Trigger fetch when activeSection changes
  useEffect(() => {
      if (activeTab === 'campus' && !sectionData[activeSection]) {
          fetchCampusData();
      }
  }, [activeSection]);

  const renderCampusContent = () => {
    const items = sectionData[activeSection] || [];
    const isLoading = loadingSection && items.length === 0;

    if (isLoading) {
      return (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-4 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
              <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-xl shrink-0"></div>
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
          <span className="text-4xl mb-3 opacity-50">📡</span>
          <p className="text-slate-500 dark:text-slate-400 font-medium">No updates found for this criteria.</p>
          <button 
            onClick={() => fetchCampusData(true)}
            className="mt-3 text-indigo-600 dark:text-indigo-400 text-sm font-bold hover:underline"
          >
            Try Again
          </button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-4 animate-fade-in">
        {items.map(item => (
          <div 
            key={item.id} 
            className="flex flex-col md:flex-row gap-4 p-5 bg-white dark:bg-slate-800 hover:shadow-lg transition-all rounded-2xl border border-slate-100 dark:border-slate-700 group relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 transform -translate-x-1 group-hover:translate-x-0 transition-transform"></div>
            
            <div className="flex-1">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold px-2 py-1 rounded bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                  {item.type}
                </span>
                <span className="text-xs text-slate-400 font-mono">{item.date || 'Recent'}</span>
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2 leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {item.title}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 line-clamp-2">
                {item.description}
              </p>
              
              <div className="flex items-center gap-4">
                <a 
                  href={item.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-slate-900 dark:bg-slate-700 text-white text-xs font-bold rounded-lg hover:bg-indigo-600 dark:hover:bg-indigo-600 transition-colors"
                >
                  View Details
                </a>
                <button 
                  onClick={(e) => toggleInterest(item.id, e)} 
                  className={`flex items-center gap-1 text-xs font-bold transition-colors ${interestedItems.has(item.id) ? 'text-rose-500' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                >
                  <svg className={`w-4 h-4 ${interestedItems.has(item.id) ? 'fill-current' : 'fill-none'}`} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                  {interestedItems.has(item.id) ? 'Interested' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-4 md:p-8 h-full flex flex-col overflow-y-auto relative custom-scrollbar">
      
      {/* Fake Call Overlay */}
      {showFakeCallScreen && (
        <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col items-center justify-between py-20 text-white animate-fade-in">
           <div className="flex flex-col items-center">
              <div className="w-24 h-24 bg-slate-700 rounded-full flex items-center justify-center text-4xl mb-6">👤</div>
              <h2 className="text-3xl font-medium">Mom</h2>
              <p className="text-slate-400 mt-2">Mobile</p>
           </div>
           <div className="flex w-full justify-around px-12">
              <button onClick={() => setShowFakeCallScreen(false)} className="flex flex-col items-center gap-2">
                 <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-2xl shadow-lg hover:scale-110 transition-transform">📞</div>
                 <span className="text-sm font-medium">Decline</span>
              </button>
              <button onClick={() => setShowFakeCallScreen(false)} className="flex flex-col items-center gap-2">
                 <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-2xl shadow-lg hover:scale-110 transition-transform animate-pulse">📞</div>
                 <span className="text-sm font-medium">Accept</span>
              </button>
           </div>
        </div>
      )}

      {/* Reward Overlay */}
      {showReward.show && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-indigo-100 dark:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-100 px-6 py-2 rounded-full font-bold shadow-lg animate-bounce-in flex items-center gap-2">
          <span>⚡</span> +{showReward.xp} XP Earned!
        </div>
      )}

      <header className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Campus Connect 🤝</h2>
        <p className="text-slate-600 dark:text-slate-400">Master networking, find your tribe, and stay safe.</p>
      </header>

      <div className="flex gap-6 flex-col lg:flex-row h-full">
        {/* Tool Section */}
        <div className="flex-1 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col min-h-[600px]">
          <div className="flex gap-2 mb-6 p-1 bg-slate-100 dark:bg-slate-700/50 rounded-xl w-fit">
            <button onClick={() => setActiveTab('campus')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'campus' ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-300 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}>Campus Life</button>
            <button onClick={() => setActiveTab('networking')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'networking' ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-300 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}>Social Coach</button>
            <button onClick={() => setActiveTab('safety')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'safety' ? 'bg-white dark:bg-slate-600 text-red-600 dark:text-red-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}>Safety & Support</button>
          </div>

          {activeTab === 'networking' && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-800 mb-6">
                 <h3 className="font-bold text-indigo-900 dark:text-indigo-200 mb-2 text-lg">Social Situation Solver</h3>
                 <p className="text-sm text-indigo-700 dark:text-indigo-300">Don't know what to say? Let AI break the ice.</p>
              </div>
              
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Context / Scenario</label>
              <textarea 
                value={context} 
                onChange={(e) => setContext(e.target.value)} 
                placeholder="e.g. I want to ask a professor for a research opportunity but I've never spoken to them..." 
                className="w-full h-32 px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400" 
              />
              
              <div className="flex justify-end">
                <button onClick={handleGenerate} disabled={loading || !context} className="px-6 py-3 bg-indigo-600 dark:bg-indigo-700 text-white rounded-xl font-bold hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors disabled:opacity-50 flex items-center gap-2">
                  {loading ? 'Analyzing...' : <><span>✨</span> Get Advice</>}
                </button>
              </div>

              {tips && (
                <div className="mt-6 p-6 bg-white dark:bg-slate-800 rounded-2xl border border-indigo-100 dark:border-indigo-800 shadow-lg animate-slide-up relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                  <h4 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <span className="bg-indigo-100 dark:bg-indigo-900/50 p-1.5 rounded-lg text-lg">💡</span> Expert Tips
                  </h4>
                  <div className="prose prose-sm dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {tips}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'campus' && (
             <div className="animate-fade-in flex flex-col h-full">
               
               {/* Trending Bar (Dynamic) */}
               {trendingItem && (
                 <div className="mb-6 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 p-[2px] rounded-2xl shrink-0 cursor-pointer" onClick={() => window.open(trendingItem.link, '_blank')}>
                   <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 flex items-center justify-between hover:bg-opacity-95 transition-colors">
                      <div className="flex items-center gap-3">
                         <span className="text-2xl animate-pulse">🔥</span>
                         <div>
                            <h4 className="font-bold text-slate-800 dark:text-white text-sm">Trending on Campus</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{trendingItem.title}</p>
                         </div>
                      </div>
                      <div className="text-xs font-bold text-pink-600 dark:text-pink-400 hover:underline flex items-center gap-1">
                        View <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                      </div>
                   </div>
                 </div>
               )}

               {/* Category Navigation (Horizontal Scroll on Mobile, Grid on Desktop) */}
               <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 shrink-0">
                 {campusSections.map((section) => (
                   <button 
                     key={section.id}
                     onClick={() => handleSectionClick(section.id)}
                     className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                       activeSection === section.id 
                         ? `bg-gradient-to-br ${section.color} text-white shadow-md border-transparent scale-105` 
                         : 'bg-slate-50 dark:bg-slate-700/50 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                     }`}
                   >
                     <span className="text-2xl mb-2">{section.icon}</span>
                     <span className="text-xs font-bold text-center leading-tight">{section.title}</span>
                   </button>
                 ))}
               </div>

               {/* Filters Bar */}
               <div className="mb-4 bg-slate-50 dark:bg-slate-700/30 p-3 rounded-xl border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row gap-3 items-center">
                  <div className="flex-1 w-full md:w-auto relative">
                    <span className="absolute left-3 top-2.5 text-slate-400">📍</span>
                    <input 
                      type="text" 
                      value={filterLocation}
                      onChange={(e) => setFilterLocation(e.target.value)}
                      placeholder="City or Campus (e.g. NYC)"
                      className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400"
                    />
                  </div>
                  <div className="w-full md:w-auto">
                    <select 
                      value={filterMode}
                      onChange={(e) => setFilterMode(e.target.value as any)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="Any">Mode: Any</option>
                      <option value="Offline">Offline / In-Person</option>
                      <option value="Online">Online / Virtual</option>
                    </select>
                  </div>
                  <div className="w-full md:w-auto">
                    <select 
                      value={filterTime}
                      onChange={(e) => setFilterTime(e.target.value as any)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="Anytime">Time: Anytime</option>
                      <option value="This Week">This Week</option>
                      <option value="This Month">This Month</option>
                    </select>
                  </div>
                  <button 
                    onClick={() => fetchCampusData(true)}
                    className="w-full md:w-auto px-6 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm whitespace-nowrap"
                  >
                    Apply Filters
                  </button>
               </div>

               {/* Results Area */}
               <div className="flex-1 bg-slate-50 dark:bg-slate-700/20 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 md:p-6 overflow-y-auto min-h-[300px]">
                 <div className="flex justify-between items-center mb-4">
                   <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                     <span>{campusSections.find(s => s.id === activeSection)?.icon}</span>
                     {campusSections.find(s => s.id === activeSection)?.title} Results
                   </h3>
                   {sectionData[activeSection] && (
                     <button 
                       onClick={() => fetchCampusData(true)}
                       className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                     >
                       <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                       Refresh
                     </button>
                   )}
                 </div>
                 
                 {renderCampusContent()}
               </div>
             </div>
          )}

          {activeTab === 'safety' && (
            <div className="space-y-6 animate-fade-in pb-10">
               {/* Quick Emergency Action */}
               <button className="w-full bg-red-600 hover:bg-red-700 text-white p-6 rounded-3xl shadow-xl shadow-red-200 dark:shadow-none transition-transform active:scale-95 flex items-center justify-between group">
                  <div className="text-left">
                    <h3 className="text-2xl font-black uppercase tracking-wider">Emergency</h3>
                    <p className="text-red-100 text-sm font-medium">Call Campus Security Immediately</p>
                  </div>
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-3xl group-hover:animate-ping">
                    📞
                  </div>
               </button>

               {/* Toolkit Grid */}
               <div>
                 <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Safety Toolkit</h4>
                 <div className="grid grid-cols-2 gap-4">
                    {/* Fake Call Tool */}
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center text-center">
                       <button 
                         onClick={() => { if(!fakeCallTimer) startFakeCall(); }}
                         className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl mb-3 transition-all ${fakeCallTimer ? 'bg-amber-100 text-amber-600 animate-pulse' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                       >
                         📱
                       </button>
                       <h5 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Fake Call</h5>
                       <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-2">Triggers in 10s</p>
                       {fakeCallTimer ? (
                         <span className="text-xs font-bold text-amber-600">Ring in {fakeCallTimer}s</span>
                       ) : (
                         <button onClick={startFakeCall} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">Start Timer</button>
                       )}
                    </div>

                    {/* Location Share Tool */}
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center text-center">
                       <button 
                         onClick={() => setLocationShared(!locationShared)}
                         className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl mb-3 transition-all ${locationShared ? 'bg-green-100 text-green-600 border-2 border-green-500' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                       >
                         📍
                       </button>
                       <h5 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Share Location</h5>
                       <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-2">With trusted contacts</p>
                       <span className={`text-xs font-bold ${locationShared ? 'text-green-600' : 'text-slate-400'}`}>
                         {locationShared ? 'Live Tracking On' : 'Off'}
                       </span>
                    </div>

                    {/* Siren Tool */}
                    <div className={`col-span-2 bg-white dark:bg-slate-800 p-4 rounded-2xl border transition-all shadow-sm flex items-center justify-between cursor-pointer ${sirenActive ? 'border-red-500 ring-4 ring-red-100 dark:ring-red-900/30' : 'border-slate-200 dark:border-slate-700'}`} onClick={() => setSirenActive(!sirenActive)}>
                       <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all ${sirenActive ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                            🚨
                          </div>
                          <div className="text-left">
                             <h5 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Visual Siren</h5>
                             <p className="text-[10px] text-slate-500 dark:text-slate-400">Flashing screen alert</p>
                          </div>
                       </div>
                       <div className={`w-12 h-6 rounded-full p-1 transition-colors ${sirenActive ? 'bg-red-500' : 'bg-slate-200 dark:bg-slate-600'}`}>
                          <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${sirenActive ? 'translate-x-6' : ''}`}></div>
                       </div>
                    </div>
                 </div>
               </div>

               {/* Resources List */}
               <div className="bg-slate-50 dark:bg-slate-700/30 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <h4 className="font-bold text-slate-800 dark:text-white mb-3 text-sm">Quick Contacts</h4>
                  <ul className="space-y-3">
                     <li className="flex items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-600 shadow-sm">
                        <div className="flex items-center gap-3">
                           <span className="text-xl">🏥</span>
                           <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Health Center</span>
                        </div>
                        <button className="text-xs bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 px-3 py-1.5 rounded-lg font-bold text-slate-600 dark:text-slate-300">Call</button>
                     </li>
                     <li className="flex items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-600 shadow-sm">
                        <div className="flex items-center gap-3">
                           <span className="text-xl">🛡️</span>
                           <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Title IX Office</span>
                        </div>
                        <button className="text-xs bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 px-3 py-1.5 rounded-lg font-bold text-slate-600 dark:text-slate-300">Visit</button>
                     </li>
                     <li className="flex items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-600 shadow-sm">
                        <div className="flex items-center gap-3">
                           <span className="text-xl">🚌</span>
                           <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Safe Ride</span>
                        </div>
                        <button className="text-xs bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 px-3 py-1.5 rounded-lg font-bold text-slate-600 dark:text-slate-300">Book</button>
                     </li>
                  </ul>
               </div>
            </div>
          )}
        </div>

        {/* Side Column (Desktop) */}
        <div className="hidden lg:block w-80 space-y-6">
           {/* Daily Tip Card */}
           <div className="bg-gradient-to-br from-purple-600 to-indigo-700 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">🤝</div>
             <h3 className="font-bold text-lg mb-2 relative z-10">Networking Pro Tip</h3>
             <p className="text-sm opacity-90 relative z-10 leading-relaxed mb-4">
               "When meeting someone new, ask for their advice, not a job. People love to help when they feel their expertise is valued."
             </p>
             <button className="text-xs font-bold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors">Read More</button>
           </div>

           {/* Upcoming Events Mini Calendar */}
           <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
             <h3 className="font-bold text-slate-800 dark:text-white mb-4 text-sm uppercase tracking-wider">Your Calendar</h3>
             <div className="space-y-4">
               <div className="flex gap-4 items-center group cursor-pointer">
                 <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex flex-col items-center justify-center text-blue-600 dark:text-blue-400 font-bold border border-blue-100 dark:border-blue-800 group-hover:scale-110 transition-transform">
                   <span className="text-[10px] uppercase">Oct</span>
                   <span className="text-lg leading-none">15</span>
                 </div>
                 <div>
                   <h4 className="font-bold text-slate-800 dark:text-white text-sm group-hover:text-blue-600 transition-colors">Career Fair</h4>
                   <p className="text-xs text-slate-500 dark:text-slate-400">Student Center • 10 AM</p>
                 </div>
               </div>
               <div className="flex gap-4 items-center group cursor-pointer">
                 <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/30 rounded-2xl flex flex-col items-center justify-center text-orange-600 dark:text-orange-400 font-bold border border-orange-100 dark:border-orange-800 group-hover:scale-110 transition-transform">
                   <span className="text-[10px] uppercase">Oct</span>
                   <span className="text-lg leading-none">18</span>
                 </div>
                 <div>
                   <h4 className="font-bold text-slate-800 dark:text-white text-sm group-hover:text-orange-600 transition-colors">Debate Club</h4>
                   <p className="text-xs text-slate-500 dark:text-slate-400">Room 304 • 5 PM</p>
                 </div>
               </div>
             </div>
             <button className="w-full mt-6 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 border border-dashed border-slate-300 dark:border-slate-600 rounded-xl hover:border-indigo-300 transition-all">
               + Add Event
             </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SocialHub;
