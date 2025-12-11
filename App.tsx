
import React, { useState, useEffect, Suspense } from 'react';
import AuthPage from './components/AuthPage'; // Keep AuthPage static for fast initial load
import { AppView, DashboardUpdate, UserProfile, LeaderboardEntry } from './types';
import { getDashboardUpdates } from './services/geminiService';
import { gamification } from './services/gamificationService';

// Lazy load components
const StudyBuddy = React.lazy(() => import('./components/StudyBuddy'));
const LifestyleManager = React.lazy(() => import('./components/LifestyleManager'));
const TaskMaster = React.lazy(() => import('./components/TaskMaster'));
const CareerCoach = React.lazy(() => import('./components/CareerCoach'));
const AutoPilot = React.lazy(() => import('./components/AutoPilot'));
const ExternalTools = React.lazy(() => import('./components/ExternalTools'));
const FinanceManager = React.lazy(() => import('./components/FinanceManager'));
const WellnessCenter = React.lazy(() => import('./components/WellnessCenter'));
const SocialHub = React.lazy(() => import('./components/SocialHub'));
const StudentPlaybook = React.lazy(() => import('./components/StudentPlaybook'));

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [updates, setUpdates] = useState<DashboardUpdate[]>([]);
  const [loadingUpdates, setLoadingUpdates] = useState(false);
  
  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
    }
    return 'light';
  });

  // Gamification State
  const [profile, setProfile] = useState<UserProfile>(gamification.getProfile());
  const [isAuthenticated, setIsAuthenticated] = useState(gamification.isAuthenticated());
  
  const [showProfileModal, setShowProfileModal] = useState(false); 
  const [profileTab, setProfileTab] = useState<'progress' | 'leaderboard' | 'settings'>('progress');
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showStreakCelebration, setShowStreakCelebration] = useState(false);
  
  // Streak Info
  const streakInfo = gamification.getStreakInfo();

  // Apply Theme
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    // Listen for custom navigation events from components
    const handleNavigation = (e: CustomEvent) => {
      if (e.detail && Object.values(AppView).includes(e.detail)) {
        setCurrentView(e.detail);
      }
    };

    window.addEventListener('navigate-to', handleNavigation as EventListener);

    // Subscribe to gamification updates
    const unsubscribe = gamification.subscribe((newProfile: UserProfile) => {
      // Check auth state change
      const isAuthed = gamification.isAuthenticated();
      setIsAuthenticated(isAuthed);
      
      // Check for level up only if we are authenticated and it's a real update
      if (isAuthed && newProfile.level > profile.level && profile.level > 0) {
        setShowLevelUp(true);
        setTimeout(() => setShowLevelUp(false), 5000);
      }
      setProfile(newProfile);
    });

    // Initial check
    setIsAuthenticated(gamification.isAuthenticated());

    if (gamification.isAuthenticated()) {
        const fetchUpdates = async () => {
          setLoadingUpdates(true);
          const data = await getDashboardUpdates();
          setUpdates(data);
          setLoadingUpdates(false);
        };

        if (currentView === AppView.DASHBOARD) {
          fetchUpdates();
        }
        
        // Check streaks on load
        const streakIncreased = gamification.checkStreak();
        if (streakIncreased) {
            setShowStreakCelebration(true);
        }
    }

    return () => {
      unsubscribe();
      window.removeEventListener('navigate-to', handleNavigation as EventListener);
    };
  }, [currentView]); 

  // --- RENDERING ---

  // If not authenticated, show the AuthPage
  if (!isAuthenticated) {
    return <AuthPage />;
  }

  const renderContent = () => {
    switch (currentView) {
      case AppView.PLAYBOOK: return <StudentPlaybook />;
      case AppView.STUDY: return <StudyBuddy />;
      case AppView.TASKS: return <TaskMaster />;
      case AppView.EXTERNAL_TOOLS: return <ExternalTools />;
      case AppView.CAREER: return <CareerCoach />;
      case AppView.AUTOMATION: return <AutoPilot />;
      case AppView.FINANCE: return <FinanceManager />;
      case AppView.LIFESTYLE: return <LifestyleManager />;
      case AppView.WELLNESS: return <WellnessCenter />;
      case AppView.SOCIAL: return <SocialHub />;
      case AppView.DASHBOARD:
      default:
        return (
          <div className="p-6 md:p-10 h-full overflow-y-auto scrollbar-hide">
            <header className="mb-8 md:mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">Welcome, {profile.name} 🎓</h1>
                <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
                  Your holistic student companion. Let's make today productive.
                </p>
              </div>
            </header>

            {/* Daily Quests Section */}
            <div className="mb-10 animate-fade-in">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                <span>⚡</span> Daily Quests
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {gamification.getDailyQuests().map((quest) => (
                   <div key={quest.id} className={`p-4 rounded-xl border transition-all ${quest.isCompleted ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 opacity-80' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-md'}`}>
                      <div className="flex justify-between items-start mb-2">
                         <span className="text-2xl">{quest.icon}</span>
                         {quest.isCompleted ? (
                           <span className="bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-100 text-[10px] font-bold px-2 py-1 rounded-full uppercase">Done</span>
                         ) : (
                           <span className="bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-100 text-[10px] font-bold px-2 py-1 rounded-full uppercase">+{quest.xpReward} XP</span>
                         )}
                      </div>
                      <h3 className={`font-bold text-sm ${quest.isCompleted ? 'text-emerald-900 dark:text-emerald-100' : 'text-slate-800 dark:text-slate-200'}`}>{quest.title}</h3>
                      <button 
                        onClick={() => {
                          if (quest.actionType === 'QUIZ') setCurrentView(AppView.STUDY);
                          if (quest.actionType === 'TASK') setCurrentView(AppView.TASKS);
                          if (quest.actionType === 'EXPLORE') setCurrentView(AppView.EXTERNAL_TOOLS);
                        }}
                        className={`text-xs mt-2 font-semibold hover:underline ${quest.isCompleted ? 'hidden' : 'text-indigo-600 dark:text-indigo-400'}`}
                      >
                        Go Now &rarr;
                      </button>
                   </div>
                ))}
              </div>
            </div>

            {/* Quick Access Grid */}
            <div className="mb-12">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4">Start Here</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <DashboardCard 
                  title="Student Playbook" 
                  desc="The Ultimate Guide & Roadmap." 
                  iconColor="text-rose-600 dark:text-rose-400" 
                  bgColor="bg-rose-100 dark:bg-rose-900/30" 
                  borderColor="group-hover:border-rose-300 dark:group-hover:border-rose-700"
                  onClick={() => setCurrentView(AppView.PLAYBOOK)}
                  svgPath={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />}
                />
                <DashboardCard 
                  title="Study Buddy" 
                  desc="Tutor, Quiz & Focus." 
                  iconColor="text-indigo-600 dark:text-indigo-400" 
                  bgColor="bg-indigo-100 dark:bg-indigo-900/30" 
                  borderColor="group-hover:border-indigo-300 dark:group-hover:border-indigo-700"
                  onClick={() => setCurrentView(AppView.STUDY)}
                  svgPath={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />}
                />
                <DashboardCard 
                  title="Lifestyle Lounge" 
                  desc="Food, Housing & Tech." 
                  iconColor="text-emerald-600 dark:text-emerald-400" 
                  bgColor="bg-emerald-100 dark:bg-emerald-900/30" 
                  borderColor="group-hover:border-emerald-300 dark:group-hover:border-emerald-700"
                  onClick={() => setCurrentView(AppView.LIFESTYLE)}
                  svgPath={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />}
                />
                <DashboardCard 
                  title="Career Coach" 
                  desc="Jobs & Interviews." 
                  iconColor="text-blue-600 dark:text-blue-400" 
                  bgColor="bg-blue-100 dark:bg-blue-900/30" 
                  borderColor="group-hover:border-blue-300 dark:group-hover:border-blue-700"
                  onClick={() => setCurrentView(AppView.CAREER)}
                  svgPath={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />}
                />
              </div>
            </div>

            {/* Live Updates Section */}
            <div className="mb-8 animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                 <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                   <span className="relative flex h-3 w-3">
                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                     <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                   </span>
                   Live Campus Pulse
                 </h2>
                 <button onClick={() => { setLoadingUpdates(true); getDashboardUpdates().then(d => { setUpdates(d); setLoadingUpdates(false); }); }} className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">Refresh</button>
              </div>

              {loadingUpdates && updates.length === 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse"></div>)}
                 </div>
              ) : updates.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {updates.map(update => (
                     <a href={update.link} target="_blank" rel="noopener noreferrer" key={update.id} className="group bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${
                           update.category === 'Job' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                           update.category === 'Tool' ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' :
                           update.category === 'Product' ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' :
                           'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                        }`}>
                           {update.category === 'Job' ? '💼' : update.category === 'Tool' ? '🛠️' : update.category === 'Product' ? '🛍️' : '📰'}
                        </div>
                        <div>
                           <div className="flex items-center gap-2 mb-1">
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                 update.category === 'Job' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200' :
                                 update.category === 'Tool' ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200' :
                                 update.category === 'Product' ? 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-200' :
                                 'bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-200'
                              }`}>
                                 {update.category}
                              </span>
                              <span className="text-xs text-slate-400">{update.timeAgo}</span>
                           </div>
                           <h3 className="font-bold text-slate-900 dark:text-white leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-1">{update.title}</h3>
                           <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{update.description}</p>
                        </div>
                     </a>
                   ))}
                 </div>
              ) : (
                <div className="p-8 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                  Updates currently unavailable. Check back soon.
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  const NavItem = ({ view, icon, label }: { view: AppView, icon: React.ReactNode, label: string }) => (
    <button
      onClick={() => {
        setCurrentView(view);
        setIsMobileMenuOpen(false);
      }}
      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${
        currentView === view 
          ? 'bg-teal-600 text-white shadow-md' 
          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
      }`}
    >
      {icon}
      <span className="font-medium text-sm">{label}</span>
    </button>
  );

  const sidebarLinks = (
    <>
      <NavItem 
        view={AppView.DASHBOARD} 
        label="Dashboard" 
        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>}
      />
      
      <div className="pt-4 pb-2">
        <p className="px-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Guide</p>
      </div>
      <NavItem 
        view={AppView.PLAYBOOK} 
        label="Student Playbook" 
        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
      />

      {/* ACADEMIC */}
      <div className="pt-4 pb-2">
        <p className="px-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Academic</p>
      </div>
      <NavItem 
        view={AppView.STUDY} 
        label="Study Buddy" 
        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
      />
      <NavItem 
        view={AppView.TASKS} 
        label="Task Master" 
        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
      />
      <NavItem 
        view={AppView.EXTERNAL_TOOLS} 
        label="AI Directory" 
        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>}
      />

      {/* CAREER */}
      <div className="pt-4 pb-2">
        <p className="px-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Future & Career</p>
      </div>
      <NavItem 
        view={AppView.CAREER} 
        label="Career Coach" 
        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
      />
      <NavItem 
        view={AppView.AUTOMATION} 
        label="Auto-Pilot" 
        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>}
      />

      {/* LIFE */}
      <div className="pt-4 pb-2">
        <p className="px-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Life & Balance</p>
      </div>
      <NavItem 
        view={AppView.FINANCE} 
        label="Wallet Watch" 
        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
      />
      <NavItem 
        view={AppView.LIFESTYLE} 
        label="Lifestyle Lounge" 
        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>}
      />
      <NavItem 
        view={AppView.WELLNESS} 
        label="Wellness Center" 
        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>}
      />
      <NavItem 
        view={AppView.SOCIAL} 
        label="Social Hub" 
        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
      />
    </>
  );

  return (
    <div className="flex h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 overflow-hidden font-sans transition-colors duration-500">
      
      {/* Streak Celebration Overlay */}
      {showStreakCelebration && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center pointer-events-none">
          <div className="bg-orange-500/90 backdrop-blur-md p-8 rounded-3xl shadow-2xl border-4 border-orange-300 text-center animate-bounce-in pointer-events-auto text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/fire.png')] opacity-20"></div>
            <div className="text-7xl mb-4 animate-pulse">🔥</div>
            <h2 className="text-4xl font-black mb-2 uppercase tracking-wider">Streak Ignited!</h2>
            <p className="text-xl font-bold opacity-90">You're on fire!</p>
            <p className="text-6xl font-black mt-4">{profile.streak} <span className="text-3xl">DAYS</span></p>
            <button onClick={() => setShowStreakCelebration(false)} className="mt-8 px-8 py-3 bg-white text-orange-600 font-bold rounded-full hover:bg-orange-50 transition-colors shadow-lg">Keep it up!</button>
          </div>
        </div>
      )}

      {/* Level Up Overlay */}
      {showLevelUp && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none">
          <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border-4 border-yellow-400 text-center animate-bounce-in pointer-events-auto">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-orange-500 mb-2">LEVEL UP!</h2>
            <p className="text-slate-600 dark:text-slate-300 text-lg font-bold">You are now a</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{profile.levelTitle}</p>
          </div>
        </div>
      )}

      {/* User Hub Modal (New Profile/Progress View) */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowProfileModal(false)}>
           <div className="bg-white dark:bg-slate-800 w-full max-w-2xl h-[80vh] rounded-3xl overflow-hidden shadow-2xl animate-slide-up flex flex-col" onClick={e => e.stopPropagation()}>
              
              {/* Header Profile Section */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 md:p-8 text-white relative shrink-0">
                 <button onClick={() => setShowProfileModal(false)} className="absolute top-4 right-4 text-white/70 hover:text-white p-2 bg-black/10 rounded-full">✕</button>
                 
                 <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="w-20 h-20 md:w-24 md:h-24 bg-white rounded-full flex items-center justify-center text-4xl shadow-lg border-4 border-white/20">
                       🎓
                    </div>
                    <div className="text-center md:text-left">
                       <h2 className="text-3xl font-bold mb-1">{profile.name}</h2>
                       <p className="text-indigo-100 text-lg">{profile.levelTitle} • Level {profile.level}</p>
                       
                       {/* Level Progress Bar */}
                       <div className="mt-3 w-48 md:w-64 bg-black/20 rounded-full h-2.5 mx-auto md:mx-0">
                          <div 
                             className="bg-yellow-400 h-2.5 rounded-full transition-all duration-1000" 
                             style={{ width: `${gamification.getLevelProgress()}%` }}
                          ></div>
                       </div>
                       <p className="text-xs mt-1 text-indigo-200">{gamification.getNextLevelXp()} XP to next level</p>
                    </div>
                    <div className="ml-auto flex flex-col items-center bg-white/10 p-3 rounded-xl border border-white/10 backdrop-blur-sm">
                       <span className="text-3xl">🔥</span>
                       <span className="font-bold text-xl">{profile.streak}</span>
                       <span className="text-xs uppercase opacity-80">Day Streak</span>
                    </div>
                 </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-slate-100 dark:border-slate-700 shrink-0">
                 <button 
                    onClick={() => setProfileTab('progress')}
                    className={`flex-1 py-4 font-bold text-sm uppercase tracking-wide transition-colors ${profileTab === 'progress' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                 >
                    My Progress
                 </button>
                 <button 
                    onClick={() => setProfileTab('leaderboard')}
                    className={`flex-1 py-4 font-bold text-sm uppercase tracking-wide transition-colors ${profileTab === 'leaderboard' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                 >
                    Leaderboard
                 </button>
                 <button 
                    onClick={() => setProfileTab('settings')}
                    className={`flex-1 py-4 font-bold text-sm uppercase tracking-wide transition-colors ${profileTab === 'settings' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                 >
                    Settings
                 </button>
              </div>
              
              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-900">
                 {profileTab === 'progress' && (
                    <div className="space-y-6">
                       {/* Stats Grid */}
                       <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                             <div className="text-2xl mb-1">🧠</div>
                             <p className="text-2xl font-bold text-slate-800 dark:text-white">{profile.stats?.quizzesCompleted || 0}</p>
                             <p className="text-xs text-slate-400 uppercase font-bold">Quizzes Taken</p>
                          </div>
                          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                             <div className="text-2xl mb-1">🎯</div>
                             <p className="text-2xl font-bold text-slate-800 dark:text-white">{profile.stats?.correctAnswers || 0}</p>
                             <p className="text-xs text-slate-400 uppercase font-bold">Correct Answers</p>
                          </div>
                          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                             <div className="text-2xl mb-1">✅</div>
                             <p className="text-2xl font-bold text-slate-800 dark:text-white">{profile.stats?.tasksOrganized || 0}</p>
                             <p className="text-xs text-slate-400 uppercase font-bold">Tasks Organized</p>
                          </div>
                          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                             <div className="text-2xl mb-1">⚡</div>
                             <p className="text-2xl font-bold text-slate-800 dark:text-white">{profile.xp}</p>
                             <p className="text-xs text-slate-400 uppercase font-bold">Total XP</p>
                          </div>
                       </div>

                       {/* Daily Quests List */}
                       <div>
                          <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-3 px-1">Daily Quests</h4>
                          <div className="space-y-2">
                             {gamification.getDailyQuests().map((quest) => (
                                <div key={quest.id} className={`flex items-center justify-between p-3 rounded-xl border ${quest.isCompleted ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'}`}>
                                   <div className="flex items-center gap-3">
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${quest.isCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                         {quest.isCompleted ? '✓' : quest.icon}
                                      </div>
                                      <span className={`text-sm font-medium ${quest.isCompleted ? 'text-emerald-800 dark:text-emerald-200 line-through' : 'text-slate-700 dark:text-slate-200'}`}>{quest.title}</span>
                                   </div>
                                   <span className="text-xs font-bold text-slate-400">+{quest.xpReward} XP</span>
                                </div>
                             ))}
                          </div>
                       </div>
                    </div>
                 )}

                 {profileTab === 'leaderboard' && (
                    <div className="space-y-2">
                       {/* Challenge Banner */}
                       <div className="bg-orange-50 dark:bg-orange-900/30 border border-orange-100 dark:border-orange-800/50 rounded-2xl p-4 mb-6 relative overflow-hidden shadow-sm">
                          <div className="flex justify-between items-end mb-2 relative z-10">
                             <div>
                                <h3 className="font-bold text-orange-900 dark:text-orange-200 flex items-center gap-2">
                                   <span className="text-xl">🔥</span> Streak Challenge
                                </h3>
                                <p className="text-orange-700 dark:text-orange-300 text-xs mt-1 font-medium">Keep your streak alive!</p>
                             </div>
                             <div className="text-right">
                                <span className="text-2xl font-black text-orange-600 dark:text-orange-400">{streakInfo.current} / {streakInfo.target} Days</span>
                             </div>
                          </div>
                          <div className="w-full bg-white dark:bg-slate-700 rounded-full h-2 relative z-10 overflow-hidden">
                             <div className="bg-orange-500 h-full rounded-full" style={{ width: `${streakInfo.progress}%` }}></div>
                          </div>
                       </div>

                       {/* List */}
                       {gamification.getLeaderboard().map((entry, index) => (
                          <div key={entry.id} className={`flex items-center gap-4 p-4 rounded-xl ${entry.isUser ? 'bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-700 shadow-sm' : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700'}`}>
                             <div className={`w-8 font-bold text-center ${index === 0 ? 'text-yellow-500 text-xl' : index === 1 ? 'text-slate-400 text-lg' : index === 2 ? 'text-amber-600 text-lg' : 'text-slate-400'}`}>
                                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                             </div>
                             <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-xl">
                                {entry.avatar}
                             </div>
                             <div className="flex-1">
                                <h4 className={`font-bold ${entry.isUser ? 'text-indigo-900 dark:text-indigo-200' : 'text-slate-700 dark:text-slate-200'}`}>{entry.name} {entry.isUser && '(You)'}</h4>
                                <div className="text-xs text-slate-400 flex items-center gap-1">
                                   <span className="text-orange-500">🔥</span> {entry.streak} day streak
                                </div>
                             </div>
                             <div className="font-bold text-slate-800 dark:text-slate-200">{entry.xp} XP</div>
                          </div>
                       ))}
                    </div>
                 )}

                 {profileTab === 'settings' && (
                    <div className="space-y-4">
                       <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 flex justify-between items-center">
                          <span className="font-medium text-slate-700 dark:text-slate-200">Dark Mode</span>
                          <button 
                            onClick={toggleTheme}
                            className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${theme === 'dark' ? 'bg-indigo-600' : 'bg-slate-200'}`}
                          >
                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${theme === 'dark' ? 'translate-x-6' : ''}`}></div>
                          </button>
                       </div>
                       
                       <button 
                         onClick={() => {
                           gamification.logout();
                           setShowProfileModal(false);
                         }}
                         className="w-full p-4 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-100 dark:border-slate-600 text-left font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors flex justify-between items-center"
                       >
                          <span>Log Out</span>
                          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                       </button>
                       
                       <button 
                         onClick={() => {
                           if(confirm('Are you sure you want to reset all data for this browser? This cannot be undone.')) {
                             localStorage.clear();
                             window.location.reload();
                           }
                         }}
                         className="w-full p-4 bg-rose-50 dark:bg-rose-900/20 rounded-xl border border-rose-100 dark:border-rose-800 text-left font-medium text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
                       >
                          Reset App Data (Debug)
                       </button>
                    </div>
                 )}
              </div>
           </div>
        </div>
      )}

      {/* Sidebar for Desktop */}
      <aside className="w-64 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-r border-white/50 dark:border-slate-800 flex flex-col p-6 hidden md:flex shadow-sm z-20">
        <div className="flex items-center gap-2 mb-8 px-2 cursor-pointer" onClick={() => setCurrentView(AppView.DASHBOARD)}>
          <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center shadow-teal-300 dark:shadow-teal-900 shadow-md">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
          </div>
          <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">UniLife AI</span>
        </div>

        <nav className="space-y-0.5 flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {sidebarLinks}
        </nav>

        {/* Theme Toggle in Sidebar */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 mt-2">
          <button 
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {theme === 'dark' ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                <span className="font-medium text-sm">Light Mode</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                <span className="font-medium text-sm">Dark Mode</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="absolute top-0 left-0 w-3/4 max-w-xs h-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xl p-6 flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                  </div>
                  <span className="text-xl font-bold text-slate-900 dark:text-white">UniLife AI</span>
               </div>
               <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
            </div>
            <nav className="space-y-0.5 flex-1 overflow-y-auto">
              {sidebarLinks}
            </nav>
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <button 
                onClick={toggleTheme}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {theme === 'dark' ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    <span className="font-medium text-sm">Light Mode</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                    <span className="font-medium text-sm">Dark Mode</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 h-full overflow-hidden relative flex flex-col bg-transparent">
        
        {/* GAMIFICATION HUD (Top Bar) */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-white/50 dark:border-slate-800 px-4 py-3 flex items-center justify-between z-10 sticky top-0 shadow-sm transition-colors duration-300">
          
          {/* Left Side (Mobile Toggle / Breadcrumb) */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 md:hidden text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <span className="hidden md:block font-bold text-slate-400 dark:text-slate-500 text-sm uppercase tracking-wider">{currentView.replace('_', ' ')}</span>
          </div>

          {/* Right Side (HUD) */}
          <div className="flex items-center gap-3 md:gap-6">
            
            {/* Streak */}
            <div 
              onClick={() => setShowProfileModal(true)}
              className="flex items-center gap-1.5 bg-orange-50 dark:bg-orange-900/20 px-3 py-1.5 rounded-full border border-orange-100 dark:border-orange-800/50 cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors"
            >
              <span className="text-lg">🔥</span>
              <span className="text-sm font-bold text-orange-600 dark:text-orange-400">{profile.streak}</span>
            </div>

            {/* Level & XP */}
            <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setShowProfileModal(true)}>
               <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Level {profile.level}</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-none">{profile.levelTitle}</p>
               </div>
               
               <div className="relative w-10 h-10 md:w-12 md:h-12 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="50%" cy="50%" r="18" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-100 dark:text-slate-700" />
                    <circle 
                      cx="50%" cy="50%" r="18" 
                      stroke="currentColor" strokeWidth="4" fill="transparent" 
                      className="text-indigo-600 dark:text-indigo-400 transition-all duration-1000 ease-out" 
                      strokeDasharray="113" 
                      strokeDashoffset={113 - (113 * gamification.getLevelProgress()) / 100} 
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-indigo-700 dark:text-indigo-300">
                     {profile.level}
                  </div>
               </div>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-hidden relative">
          <Suspense fallback={
            <div className="flex h-full items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
            </div>
          }>
            {renderContent()}
          </Suspense>
        </div>
      </main>
    </div>
  );
};

// Helper component for dashboard cards
const DashboardCard = ({ title, desc, iconColor, bgColor, borderColor, onClick, svgPath }: any) => (
  <div 
    onClick={onClick}
    className={`group bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 md:p-8 rounded-3xl shadow-sm border border-white/50 dark:border-slate-700/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer relative overflow-hidden ${borderColor ? `hover:border-${borderColor.split('-')[2]}` : ''}`}
  >
    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
      <svg className={`w-32 h-32 ${iconColor}`} fill="currentColor" viewBox="0 0 24 24">{svgPath}</svg>
    </div>
    <div className={`w-12 h-12 ${bgColor} rounded-2xl flex items-center justify-center mb-6 ${iconColor}`}>
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">{svgPath}</svg>
    </div>
    <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
    <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">{desc}</p>
    <span className={`${iconColor} font-semibold text-sm md:text-base group-hover:translate-x-2 transition-transform inline-block`}>Open Guide &rarr;</span>
  </div>
);

export default App;
