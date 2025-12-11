
import React, { useState, useRef, useEffect } from 'react';
import { findPlaybookResources, generateAcademicRoadmap } from '../services/geminiService';
import { DynamicResource, AcademicYear } from '../types';
import { gamification, XP_VALUES } from '../services/gamificationService';

const StudentPlaybook: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'roadmap' | 'essentials' | 'mastery'>('mastery');
  const [showReward, setShowReward] = useState<{show: boolean, xp: number}>({show: false, xp: 0});

  // --- Dynamic State ---
  const [userSubject, setUserSubject] = useState('');
  const [userUniversity, setUserUniversity] = useState('');
  const [resourceType, setResourceType] = useState<'NOTES' | 'PYQ'>('NOTES');
  
  const [masteryResources, setMasteryResources] = useState<DynamicResource[]>([]);
  const [loadingMastery, setLoadingMastery] = useState(false);

  // Roadmap Dynamic State
  const [branchQuery, setBranchQuery] = useState('');
  const [roadmap, setRoadmap] = useState<AcademicYear[]>([]);
  const [loadingRoadmap, setLoadingRoadmap] = useState(false);
  const [expandedYear, setExpandedYear] = useState<string | null>(null);

  const [essentialsDeals, setEssentialsDeals] = useState<DynamicResource[]>([]);
  const [loadingDeals, setLoadingDeals] = useState(false);

  // --- Suggestions State ---
  const [branchSuggestions, setBranchSuggestions] = useState<string[]>([]);
  const [showBranchSuggestions, setShowBranchSuggestions] = useState(false);
  const branchContainerRef = useRef<HTMLDivElement>(null);

  const COMMON_BRANCHES = [
    "Computer Science & Engineering (CSE)",
    "CSE - Artificial Intelligence & ML",
    "CSE - Data Science",
    "CSE - Cyber Security",
    "Mechanical Engineering",
    "Civil Engineering",
    "Electronics & Communication (ECE)",
    "Electrical & Electronics (EEE)",
    "Biotechnology",
    "Chemical Engineering",
    "Information Technology (IT)"
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (branchContainerRef.current && !branchContainerRef.current.contains(event.target as Node)) {
        setShowBranchSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBranchInput = (val: string) => {
    setBranchQuery(val);
    if (val.length > 0) {
      const filtered = COMMON_BRANCHES.filter(b => b.toLowerCase().includes(val.toLowerCase()));
      setBranchSuggestions(filtered.length > 0 ? filtered : []);
      setShowBranchSuggestions(true);
    } else {
      setShowBranchSuggestions(false);
    }
  };

  const selectBranch = (val: string) => {
    setBranchQuery(val);
    setShowBranchSuggestions(false);
  };

  // --- Handlers ---

  const triggerReward = (xp: number) => {
    gamification.addXp(xp);
    setShowReward({ show: true, xp });
    setTimeout(() => setShowReward({ show: false, xp: 0 }), 3000);
  };

  const handleFetchMastery = async () => {
    if (!userSubject.trim()) return;
    setLoadingMastery(true);
    
    // Construct a rich query based on inputs
    const uniPart = userUniversity ? `at ${userUniversity}` : '';
    const typePart = resourceType === 'PYQ' 
      ? 'Previous Year Question Papers (PYQs), Model Papers, and Exam Banks' 
      : 'Lecture Notes, Study Materials, and Textbooks';
    
    const query = `Latest ${typePart} for ${userSubject} ${uniPart}`;
    
    const resources = await findPlaybookResources(
      query,
      'Academic Mastery',
      resourceType
    );
    setMasteryResources(resources);
    setLoadingMastery(false);
    triggerReward(15);
  };

  const handleGenerateRoadmap = async () => {
    if (!branchQuery.trim()) return;
    setLoadingRoadmap(true);
    setRoadmap([]); // Clear previous
    setShowBranchSuggestions(false);
    
    const result = await generateAcademicRoadmap(branchQuery);
    setRoadmap(result);
    setLoadingRoadmap(false);
    if (result.length > 0) {
      triggerReward(XP_VALUES.GENERATE_ROADMAP);
    }
  };

  const handleFetchDeals = async () => {
    setLoadingDeals(true);
    const resources = await findPlaybookResources(
      "Best student discounts and deals on laptops, dorm essentials, and software right now in India",
      "Student Deals"
    );
    setEssentialsDeals(resources);
    setLoadingDeals(false);
    triggerReward(10);
  };

  // --- Data for Essentials Kit (Static Checklist) ---
  const essentialsData = {
    academics: [
      { item: "Laptop + Charger", important: true },
      { item: "Notebooks, Pens, Markers", important: true },
      { item: "Backpack (Waterproof preferred)", important: false },
      { item: "Scientific Calculator", important: false },
      { item: "Power Bank", important: true },
      { item: "Pen Drive / External HDD", important: false },
      { item: "Noise-canceling Headphones", important: false },
    ],
    hostel: [
      { item: "Bedsheet, Pillow, Blanket", important: true },
      { item: "Bucket + Mug", important: true },
      { item: "Toiletries (Soap, Shampoo, Razor)", important: true },
      { item: "Laundry Bag", important: false },
      { item: "Lock + Keys (Duplicate set)", important: true },
      { item: "Basic Medicines (First Aid)", important: true },
      { item: "Room Freshener", important: false },
      { item: "Extension Cord", important: true },
    ],
    personal: [
      { item: "Shoes (Casual + Sports)", important: true },
      { item: "Slippers / Flip-flops", important: true },
      { item: "Umbrella / Raincoat", important: false },
      { item: "Skincare Basics", important: false },
      { item: "Small Tool Kit", important: false },
    ],
    digital: [
      { item: "Notion / Obsidian", desc: "For notes & life management", important: true },
      { item: "Google Drive / OneDrive", desc: "Cloud backup is mandatory", important: true },
      { item: "Expense Tracker", desc: "Track every penny", important: true },
      { item: "Password Manager", desc: "Bitwarden or 1Password", important: true },
    ]
  };

  // --- Productivity Stack Data ---
  const productivityStack = [
    { name: "Notion", tag: "Life OS", url: "https://www.notion.so/product/students", icon: "📓" },
    { name: "Google Calendar", tag: "Time Blocking", url: "https://calendar.google.com", icon: "📅" },
    { name: "Obsidian", tag: "Second Brain", url: "https://obsidian.md", icon: "🧠" },
    { name: "Anki", tag: "Flashcards", url: "https://apps.ankiweb.net", icon: "🗂️" }
  ];

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto bg-slate-50 dark:bg-slate-900 relative">
      
      {/* Reward Overlay */}
      {showReward.show && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-indigo-100 dark:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-100 px-6 py-2 rounded-full font-bold shadow-lg animate-bounce-in flex items-center gap-2">
          <span>⚡</span> +{showReward.xp} XP Earned!
        </div>
      )}

      {/* Header */}
      <header className="mb-8 max-w-5xl mx-auto text-center md:text-left">
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-4">The Student Playbook 📘</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl">
          The ultimate manual for surviving and thriving in college. Find papers, notes, roadmap and essentials.
        </p>
      </header>

      {/* Tabs */}
      <div className="max-w-5xl mx-auto mb-8">
        <div className="flex p-1 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('mastery')} 
            className={`flex-1 py-3 px-6 rounded-lg font-bold text-sm md:text-base transition-all whitespace-nowrap flex items-center justify-center gap-2 ${activeTab === 'mastery' ? 'bg-slate-900 dark:bg-slate-700 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
          >
            <span>🧠</span> Academic Mastery
          </button>
          <button 
            onClick={() => setActiveTab('roadmap')} 
            className={`flex-1 py-3 px-6 rounded-lg font-bold text-sm md:text-base transition-all whitespace-nowrap flex items-center justify-center gap-2 ${activeTab === 'roadmap' ? 'bg-indigo-600 dark:bg-indigo-700 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
          >
            <span>🗺️</span> 4-Year Roadmap
          </button>
          <button 
            onClick={() => setActiveTab('essentials')} 
            className={`flex-1 py-3 px-6 rounded-lg font-bold text-sm md:text-base transition-all whitespace-nowrap flex items-center justify-center gap-2 ${activeTab === 'essentials' ? 'bg-emerald-600 dark:bg-emerald-700 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
          >
            <span>🎒</span> Essentials Kit
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-5xl mx-auto pb-10">
        
        {/* --- TAB: ACADEMIC MASTERY --- */}
        {activeTab === 'mastery' && (
          <div className="space-y-8 animate-fade-in">
            
            {/* Live Resource Hub */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 md:p-8 rounded-3xl shadow-lg text-white">
               <h3 className="text-2xl font-bold mb-2">🚀 Academic Archive</h3>
               <p className="text-indigo-100 mb-6">Find Previous Year Question Papers (PYQs), Syllabus copies, and Notes for your specific university.</p>
               
               <div className="flex flex-col gap-4 mb-6">
                 {/* Search Type Toggle */}
                 <div className="flex bg-white/20 p-1 rounded-lg w-fit backdrop-blur-sm">
                    <button 
                      onClick={() => setResourceType('NOTES')}
                      className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${resourceType === 'NOTES' ? 'bg-white text-indigo-700 shadow-sm' : 'text-indigo-100 hover:bg-white/10'}`}
                    >
                      📚 Notes & Material
                    </button>
                    <button 
                      onClick={() => setResourceType('PYQ')}
                      className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${resourceType === 'PYQ' ? 'bg-white text-indigo-700 shadow-sm' : 'text-indigo-100 hover:bg-white/10'}`}
                    >
                      📝 Question Papers (PYQs)
                    </button>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input 
                      type="text" 
                      value={userSubject}
                      onChange={(e) => setUserSubject(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleFetchMastery()}
                      placeholder="Subject / Topic (e.g. Data Structures, B.Tech 1st Year)" 
                      className="w-full px-4 py-3 rounded-xl text-slate-900 border-0 focus:ring-2 focus:ring-white/50 bg-white/95"
                    />
                    <input 
                      type="text" 
                      value={userUniversity}
                      onChange={(e) => setUserUniversity(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleFetchMastery()}
                      placeholder="University / College Name (Optional but Recommended)" 
                      className="w-full px-4 py-3 rounded-xl text-slate-900 border-0 focus:ring-2 focus:ring-white/50 bg-white/95"
                    />
                 </div>
                 
                 <button 
                   onClick={handleFetchMastery}
                   disabled={loadingMastery || !userSubject}
                   className="w-full md:w-auto px-8 py-3 bg-amber-400 hover:bg-amber-500 text-amber-900 font-bold rounded-xl transition-colors shadow-lg disabled:opacity-70 disabled:cursor-not-allowed whitespace-nowrap self-start"
                 >
                   {loadingMastery ? 'Searching Archives...' : `Find ${resourceType === 'PYQ' ? 'Papers' : 'Materials'}`}
                 </button>
               </div>

               {masteryResources.length > 0 && (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-slide-up">
                   {masteryResources.map((res) => (
                     <ResourceCard key={res.id} resource={res} />
                   ))}
                 </div>
               )}
            </div>

            {/* Habits Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all">
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center text-2xl mb-4">📅</div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">The Golden Routine</h3>
                <ul className="space-y-3 text-slate-600 dark:text-slate-400 text-sm md:text-base">
                  <li className="flex items-start gap-2"><span className="text-amber-500 font-bold">1.</span> <span><strong>Attend Classes:</strong> Even if boring, being there builds subconscious memory.</span></li>
                  <li className="flex items-start gap-2"><span className="text-amber-500 font-bold">2.</span> <span><strong>Semester Planner:</strong> Map out all exams and assignments on Day 1.</span></li>
                  <li className="flex items-start gap-2"><span className="text-amber-500 font-bold">3.</span> <span><strong>Weekly Revision:</strong> Spend Sunday evening reviewing the week's notes.</span></li>
                  <li className="flex items-start gap-2"><span className="text-amber-500 font-bold">4.</span> <span><strong>Hybrid Notes:</strong> Use digital for storage, handwriting for memorization.</span></li>
                </ul>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-2xl mb-4">🛠️</div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Digital Productivity Stack</h3>
                <ul className="space-y-3 text-slate-600 dark:text-slate-400 text-sm md:text-base">
                  {productivityStack.map((tool, idx) => (
                    <li key={idx}>
                      <a 
                        href={tool.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{tool.icon}</span>
                          <span className="font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{tool.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-slate-200 dark:bg-slate-600 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">{tool.tag}</span>
                          <svg className="w-4 h-4 text-slate-300 group-hover:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        </div>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* --- TAB: 4-YEAR ROADMAP (Dynamic) --- */}
        {activeTab === 'roadmap' && (
          <div className="animate-fade-in relative flex flex-col h-full" ref={branchContainerRef}>
            
            {/* Input Section */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mb-8 max-w-3xl mx-auto w-full relative z-20">
               <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Select Your Branch</h3>
               <div className="flex flex-col md:flex-row gap-3 relative">
                  <div className="flex-1 relative">
                    <input 
                      type="text"
                      value={branchQuery}
                      onChange={(e) => handleBranchInput(e.target.value)}
                      onFocus={() => branchQuery && handleBranchInput(branchQuery)}
                      onKeyDown={(e) => e.key === 'Enter' && handleGenerateRoadmap()}
                      placeholder="e.g. CSE (AI & ML), Mechanical, Civil..."
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400"
                    />
                    {showBranchSuggestions && branchSuggestions.length > 0 && (
                      <ul className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl shadow-xl overflow-hidden z-50 animate-fade-in max-h-60 overflow-y-auto">
                        {branchSuggestions.map((s, i) => (
                          <li key={i} onClick={() => selectBranch(s)} className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-600 cursor-pointer text-sm text-slate-700 dark:text-slate-200 border-b border-slate-50 dark:border-slate-600 last:border-0">
                            {s}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <button 
                    onClick={handleGenerateRoadmap}
                    disabled={loadingRoadmap || !branchQuery.trim()}
                    className="px-6 py-3 bg-indigo-600 dark:bg-indigo-700 text-white font-bold rounded-xl hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-50 transition-colors shadow-sm whitespace-nowrap"
                  >
                    {loadingRoadmap ? 'Generating...' : 'Get Roadmap'}
                  </button>
               </div>
            </div>

            {/* Timeline Display */}
            {roadmap.length > 0 ? (
              <div className="space-y-12">
                <div className="absolute left-8 md:left-1/2 top-20 bottom-0 w-0.5 bg-indigo-200 dark:bg-indigo-900 hidden md:block transform -translate-x-1/2"></div>
                <div className="absolute left-6 top-20 bottom-0 w-0.5 bg-indigo-200 dark:bg-indigo-900 md:hidden"></div>
                
                {roadmap.map((year, idx) => {
                  const isExpanded = expandedYear === year.year;
                  const colorClass = idx === 0 ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100" :
                                     idx === 1 ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100" :
                                     idx === 2 ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-100" :
                                     "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-100";
                  
                  const icon = idx === 0 ? "🌱" : idx === 1 ? "🔨" : idx === 2 ? "🚀" : "🎓";

                  return (
                    <div key={idx} className={`relative flex flex-col md:flex-row gap-8 ${idx % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
                      
                      {/* Timeline Dot */}
                      <div className="absolute left-6 md:left-1/2 w-4 h-4 rounded-full bg-indigo-600 dark:bg-indigo-500 border-4 border-white dark:border-slate-900 shadow-sm transform -translate-x-1/2 mt-6 z-10"></div>
                      
                      {/* Content Card */}
                      <div className="flex-1 ml-12 md:ml-0">
                         <div className={`p-6 md:p-8 rounded-2xl border shadow-sm transition-all bg-white dark:bg-slate-800 hover:shadow-md`}>
                            <div className="flex items-center gap-3 mb-4">
                               <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm ${colorClass.split(' ')[0]}`}>
                                 {icon}
                               </div>
                               <div>
                                 <span className="text-xs font-bold uppercase tracking-wider opacity-70 text-slate-700 dark:text-slate-300">{year.year}</span>
                                 <h3 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white">{year.title}</h3>
                               </div>
                            </div>
                            
                            <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">{year.description}</p>
                            
                            <div className="space-y-4">
                               {/* Subjects */}
                               <div>
                                 <h5 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Key Subjects</h5>
                                 <div className="flex flex-wrap gap-2">
                                   {year.subjects.map((subj, i) => (
                                     <span key={i} className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs rounded-md border border-slate-200 dark:border-slate-600">{subj}</span>
                                   ))}
                                 </div>
                               </div>

                               {/* Skills */}
                               <div>
                                 <h5 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Skills to Master</h5>
                                 <div className="flex flex-wrap gap-2">
                                   {year.skills.map((skill, i) => (
                                     <span key={i} className={`px-2.5 py-1 text-xs rounded-md border font-bold ${colorClass.split(' ')[0]} ${colorClass.split(' ')[2]}`}>{skill}</span>
                                   ))}
                                 </div>
                               </div>

                               {/* Resources Toggle */}
                               <div>
                                 <button 
                                   onClick={() => setExpandedYear(isExpanded ? null : year.year)}
                                   className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 mt-2"
                                 >
                                   {isExpanded ? 'Hide Resources' : 'View Recommended Resources'}
                                   <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                 </button>
                                 
                                 {isExpanded && (
                                   <div className="mt-4 grid grid-cols-1 gap-2 animate-slide-down">
                                     {year.resources.map((res, i) => (
                                       <a key={i} href={res.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600 hover:border-indigo-300 dark:hover:border-indigo-500 transition-all group">
                                          <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-600 flex items-center justify-center text-lg shadow-sm">
                                            {res.type.toLowerCase().includes('video') ? '▶️' : '📚'}
                                          </div>
                                          <div className="flex-1">
                                            <h6 className="text-sm font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{res.name}</h6>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{res.type}</p>
                                          </div>
                                          <svg className="w-4 h-4 text-slate-300 group-hover:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                       </a>
                                     ))}
                                   </div>
                                 )}
                               </div>
                            </div>
                         </div>
                      </div>
                      
                      {/* Spacer for the other side of timeline */}
                      <div className="flex-1 hidden md:block"></div>
                    </div>
                  );
                })}
              </div>
            ) : (
              !loadingRoadmap && (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-500 opacity-60">
                   <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-4xl grayscale">
                     🗺️
                   </div>
                   <p className="text-lg font-medium">Select your branch to generate a roadmap.</p>
                </div>
              )
            )}
            
            {loadingRoadmap && (
               <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                  <p className="text-indigo-600 dark:text-indigo-400 font-bold animate-pulse">Designing your future...</p>
               </div>
            )}
          </div>
        )}

        {/* --- TAB: ESSENTIALS KIT --- */}
        {activeTab === 'essentials' && (
          <div className="animate-fade-in space-y-8">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 rounded-r-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
               <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                 <strong>Pro Tip:</strong> Don't buy everything at once. Buy the essentials first, then see what you actually need after 2 weeks on campus.
               </p>
               <button 
                 onClick={handleFetchDeals}
                 disabled={loadingDeals}
                 className="px-4 py-2 bg-yellow-400 text-yellow-900 font-bold rounded-lg text-sm hover:bg-yellow-500 transition-colors shadow-sm whitespace-nowrap"
               >
                 {loadingDeals ? 'Scanning...' : '💰 Find Student Deals'}
               </button>
            </div>

            {/* Dynamic Deals Section */}
            {essentialsDeals.length > 0 && (
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-800 dark:text-white">
                   <span>🔥</span> Live Student Deals
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                   {essentialsDeals.map(res => (
                     <ResourceCard key={res.id} resource={res} />
                   ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {/* Academics Kit */}
               <KitCard title="Academics" icon="🎒" items={essentialsData.academics} color="blue" />
               {/* Hostel Kit */}
               <KitCard title="Hostel / Dorm" icon="🛏️" items={essentialsData.hostel} color="orange" />
               {/* Personal Kit */}
               <KitCard title="Personal Care" icon="🧴" items={essentialsData.personal} color="teal" />
               {/* Digital Kit */}
               <KitCard title="Digital Survival" icon="💾" items={essentialsData.digital} color="purple" />
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

// Helper Component for Resource Cards
const ResourceCard: React.FC<{ resource: DynamicResource }> = ({ resource }) => (
  <a 
    href={resource.url} 
    target="_blank" 
    rel="noopener noreferrer" 
    className="block bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 hover:border-indigo-300 dark:hover:border-indigo-500 rounded-xl p-4 transition-all hover:shadow-md group h-full flex flex-col"
  >
    <div className="flex items-start justify-between mb-2">
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
        resource.type === 'Video' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
        resource.type === 'Course' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' :
        resource.type === 'Deal' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
        resource.type === 'PYQ' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300' :
        'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
      }`}>
        {resource.type}
      </span>
      <span className="text-[10px] text-slate-400">{resource.source}</span>
    </div>
    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-1 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 line-clamp-2">{resource.title}</h4>
    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 flex-1">{resource.description}</p>
    <div className="mt-3 text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 group-hover:gap-2 transition-all">
       {resource.type === 'PYQ' ? 'Download/View' : 'Visit'} <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
    </div>
  </a>
);

// Helper Component for Kit Cards
const KitCard: React.FC<{ title: string, icon: string, items: any[], color: string }> = ({ title, icon, items, color }) => {
  // Map color strings to Tailwind classes
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-200",
    orange: "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-900 text-orange-900 dark:text-orange-200",
    teal: "bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-900 text-teal-900 dark:text-teal-200",
    purple: "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-900 text-purple-900 dark:text-purple-200",
  };
  
  const checkboxColor: Record<string, string> = {
    blue: "text-blue-600 focus:ring-blue-500",
    orange: "text-orange-600 focus:ring-orange-500",
    teal: "text-teal-600 focus:ring-teal-500",
    purple: "text-purple-600 focus:ring-purple-500",
  };

  return (
    <div className={`rounded-2xl border p-6 ${colorClasses[color]} shadow-sm`}>
      <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
        <span>{icon}</span> {title}
      </h3>
      <ul className="space-y-3">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-3">
            <input type="checkbox" className={`mt-1 rounded border-gray-300 dark:border-gray-600 ${checkboxColor[color]} dark:bg-slate-800`} />
            <div>
              <span className={`text-sm md:text-base font-medium ${item.important ? 'font-bold' : ''}`}>
                {item.item}
              </span>
              {item.important && <span className="ml-2 text-[10px] uppercase font-bold bg-white dark:bg-black/20 px-1.5 py-0.5 rounded border border-current opacity-70">Must Have</span>}
              {item.desc && <p className="text-xs opacity-70">{item.desc}</p>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default StudentPlaybook;
