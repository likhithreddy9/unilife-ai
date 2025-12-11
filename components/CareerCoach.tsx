
import React, { useState, useRef, useEffect } from 'react';
import { generateCareerRoadmap, generateMockInterviewQuestion, findStudentJobs, generateCodingProblems, evaluateCode, optimizeResume } from '../services/geminiService';
import { CareerRoadmap, ChatMessage, JobOpportunity, CodingProblem, CodeEvaluation, ProgrammingLanguage, Difficulty } from '../types';
import { gamification, XP_VALUES } from '../services/gamificationService';

const ROLES_LIST = [
  "Software Engineer", "Data Scientist", "Product Manager", "UX Designer", 
  "Digital Marketer", "Graphic Designer", "Content Writer", "Social Media Manager",
  "Tutor", "Research Assistant", "Business Analyst", "Project Manager",
  "Nurse", "Teacher", "Accountant", "Sales Representative", "Customer Support",
  "Barista", "Virtual Assistant", "Video Editor", "Web Developer", "Data Analyst"
];

const LOCATIONS_LIST = [
  "Remote", "New York, NY", "San Francisco, CA", "London, UK", "Toronto, Canada",
  "Bangalore, India", "Mumbai, India", "Delhi, India", "Austin, TX", "Chicago, IL",
  "Los Angeles, CA", "Seattle, WA", "Boston, MA", "Berlin, Germany", "Sydney, Australia"
];

const CareerCoach: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'roadmap' | 'interview' | 'jobs' | 'code_dojo' | 'resume'>('roadmap');
  const [showReward, setShowReward] = useState<{show: boolean, xp: number}>({show: false, xp: 0});
  
  // Roadmap State
  const [role, setRole] = useState('');
  const [roadmap, setRoadmap] = useState<CareerRoadmap | null>(null);
  const [loadingRoadmap, setLoadingRoadmap] = useState(false);

  // Interview State
  const [interviewRole, setInterviewRole] = useState('');
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [interviewMessages, setInterviewMessages] = useState<ChatMessage[]>([]);
  const [interviewInput, setInterviewInput] = useState('');
  const [loadingInterview, setLoadingInterview] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Advanced Job Finder State
  const [jobQuery, setJobQuery] = useState('');
  const [jobLocation, setJobLocation] = useState('');
  const [jobResults, setJobResults] = useState<JobOpportunity[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [savedJobs, setSavedJobs] = useState<JobOpportunity[]>([]);
  
  // Resume Architect State
  const [resumeExp, setResumeExp] = useState('');
  const [resumeJobDesc, setResumeJobDesc] = useState('');
  const [resumeResult, setResumeResult] = useState<{score: number, feedback: string, optimizedPoints: string[]} | null>(null);
  const [loadingResume, setLoadingResume] = useState(false);

  // Income Calculator
  const [hourlyRate, setHourlyRate] = useState(0); 
  const [hoursPerWeek, setHoursPerWeek] = useState(0);

  // Code Dojo State
  const [codingLanguage, setCodingLanguage] = useState<ProgrammingLanguage>('Python');
  const [codingDifficulty, setCodingDifficulty] = useState<Difficulty>('Easy');
  const [codingProblems, setCodingProblems] = useState<CodingProblem[]>([]);
  const [selectedProblem, setSelectedProblem] = useState<CodingProblem | null>(null);
  const [loadingProblems, setLoadingProblems] = useState(false);
  const [userCode, setUserCode] = useState('');
  const [evaluation, setEvaluation] = useState<CodeEvaluation | null>(null);
  const [evaluatingCode, setEvaluatingCode] = useState(false);

  // Prediction States
  const [roleSuggestions, setRoleSuggestions] = useState<string[]>([]);
  const [showRoleSuggestions, setShowRoleSuggestions] = useState<'roadmap' | 'interview' | 'job' | null>(null);
  
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [interviewMessages]);

  // Handle outside clicks for predictions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowRoleSuggestions(null);
        setShowLocationSuggestions(false);
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

  const handleRoleInput = (val: string, type: 'roadmap' | 'interview' | 'job') => {
    if (type === 'roadmap') setRole(val);
    if (type === 'interview') setInterviewRole(val);
    if (type === 'job') setJobQuery(val);

    if (val.length > 0) {
      const filtered = ROLES_LIST.filter(r => r.toLowerCase().includes(val.toLowerCase()));
      setRoleSuggestions(filtered.slice(0, 5));
      setShowRoleSuggestions(type);
    } else {
      setShowRoleSuggestions(null);
    }
  };

  const handleLocationInput = (val: string) => {
    setJobLocation(val);
    if (val.length > 0) {
      const filtered = LOCATIONS_LIST.filter(l => l.toLowerCase().includes(val.toLowerCase()));
      setLocationSuggestions(filtered.slice(0, 5));
      setShowLocationSuggestions(true);
    } else {
      setShowLocationSuggestions(false);
    }
  };

  const selectRole = (val: string, type: 'roadmap' | 'interview' | 'job') => {
    if (type === 'roadmap') setRole(val);
    if (type === 'interview') setInterviewRole(val);
    if (type === 'job') setJobQuery(val);
    setShowRoleSuggestions(null);
  };

  const selectLocation = (val: string) => {
    setJobLocation(val);
    setShowLocationSuggestions(false);
  };

  const handleGenerateRoadmap = async (selectedRole?: string) => {
    const roleToUse = selectedRole || role;
    if (!roleToUse.trim()) return;
    setLoadingRoadmap(true);
    setShowRoleSuggestions(null);
    setRoadmap(null);
    if (selectedRole) setRole(selectedRole);
    const result = await generateCareerRoadmap(roleToUse);
    setRoadmap(result);
    setLoadingRoadmap(false);
    triggerReward(XP_VALUES.GENERATE_ROADMAP);
  };

  const startInterview = async () => {
    if (!interviewRole.trim()) return;
    setInterviewStarted(true);
    setShowRoleSuggestions(null);
    setLoadingInterview(true);
    setInterviewMessages([]);
    const question = await generateMockInterviewQuestion(interviewRole, []);
    setInterviewMessages([{ role: 'model', text: question, timestamp: new Date() }]);
    setLoadingInterview(false);
  };

  const handleSendAnswer = async () => {
    if (!interviewInput.trim()) return;
    const userMsg: ChatMessage = { role: 'user', text: interviewInput, timestamp: new Date() };
    setInterviewMessages(prev => [...prev, userMsg]);
    const currentInput = interviewInput;
    setInterviewInput('');
    setLoadingInterview(true);
    const history = interviewMessages.map(m => ({ role: m.role, parts: [{ text: m.text }] }));
    const response = await generateMockInterviewQuestion(interviewRole, history, currentInput);
    setInterviewMessages(prev => [...prev, { role: 'model', text: response, timestamp: new Date() }]);
    setLoadingInterview(false);
    triggerReward(10); // Reward for answering a question
  };

  const handleJobSearch = async () => {
    if (!jobQuery) return;
    setLoadingJobs(true);
    setShowRoleSuggestions(null);
    setShowLocationSuggestions(false);
    setJobResults([]);
    const results = await findStudentJobs(jobQuery, jobLocation);
    setJobResults(results);
    setLoadingJobs(false);
    triggerReward(15); // Reward for searching jobs
  };

  const handleOptimizeResume = async () => {
    if (!resumeExp || !resumeJobDesc) return;
    setLoadingResume(true);
    setResumeResult(null);
    const result = await optimizeResume(resumeExp, resumeJobDesc);
    setResumeResult(result);
    setLoadingResume(false);
    if (result) triggerReward(40);
  };

  const toggleSaveJob = (job: JobOpportunity) => {
    if (savedJobs.find(j => j.id === job.id)) {
      setSavedJobs(savedJobs.filter(j => j.id !== job.id));
    } else {
      setSavedJobs([...savedJobs, job]);
    }
  };

  // Coding Dojo Handlers
  const handleGenerateProblems = async () => {
    setLoadingProblems(true);
    setSelectedProblem(null);
    setUserCode('');
    setEvaluation(null);
    const problems = await generateCodingProblems(codingLanguage, codingDifficulty);
    setCodingProblems(problems);
    setLoadingProblems(false);
  };

  const handleSelectProblem = (problem: CodingProblem) => {
    setSelectedProblem(problem);
    setUserCode(problem.starterCode);
    setEvaluation(null);
  };

  const handleRunCode = async () => {
    if (!selectedProblem || !userCode) return;
    setEvaluatingCode(true);
    const result = await evaluateCode(selectedProblem, userCode);
    setEvaluation(result);
    setEvaluatingCode(false);
    
    if (result.passed) {
      triggerReward(XP_VALUES.SOLVE_CODE_PROBLEM);
      gamification.updateStat('codingProblemsSolved', 1);
    }
  };

  const suggestions = ["Frontend Developer", "Data Scientist", "Product Manager", "UX Designer", "Digital Marketer"];

  return (
    <div className="p-4 md:p-6 h-full flex flex-col" ref={containerRef}>
      
      {/* Reward Overlay */}
      {showReward.show && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-indigo-100 dark:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-100 px-6 py-2 rounded-full font-bold shadow-lg animate-bounce-in flex items-center gap-2">
          <span>⚡</span> +{showReward.xp} XP Earned!
        </div>
      )}

      <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-1">Career Coach 🚀</h2>
          <p className="text-slate-600 dark:text-slate-400">Plan your future, find gigs, practice interviews, and code.</p>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0 overflow-x-auto">
          <button onClick={() => setActiveTab('roadmap')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${activeTab === 'roadmap' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>Roadmap</button>
          <button onClick={() => setActiveTab('jobs')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${activeTab === 'jobs' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>Find Income</button>
          <button onClick={() => setActiveTab('resume')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${activeTab === 'resume' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>Resume AI</button>
          <button onClick={() => setActiveTab('interview')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${activeTab === 'interview' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>Mock Interview</button>
          <button onClick={() => setActiveTab('code_dojo')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${activeTab === 'code_dojo' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>Code Dojo</button>
        </div>
      </header>

      {activeTab === 'roadmap' && (
        <>
          <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6 max-w-4xl mx-auto w-full relative z-20">
            <div className="flex flex-col md:flex-row gap-3 md:gap-4 mb-4 relative">
              <div className="flex-1 relative">
                <input 
                  type="text" 
                  value={role} 
                  onChange={(e) => handleRoleInput(e.target.value, 'roadmap')} 
                  onFocus={() => role && handleRoleInput(role, 'roadmap')}
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerateRoadmap()} 
                  placeholder="Enter dream role (e.g., Data Scientist)" 
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-base md:text-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400" 
                />
                {showRoleSuggestions === 'roadmap' && roleSuggestions.length > 0 && (
                  <ul className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl shadow-xl overflow-hidden z-50 animate-fade-in">
                    {roleSuggestions.map((s, i) => (
                      <li key={i} onClick={() => selectRole(s, 'roadmap')} className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-600 cursor-pointer text-sm text-slate-700 dark:text-slate-200 border-b border-slate-50 dark:border-slate-600 last:border-0">
                        {s}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <button onClick={() => handleGenerateRoadmap()} disabled={loadingRoadmap || !role.trim()} className="px-6 md:px-8 py-3 bg-indigo-600 dark:bg-indigo-700 text-white font-bold rounded-xl hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-50 transition-colors shadow-sm">{loadingRoadmap ? 'Mapping...' : 'Generate Roadmap'}</button>
            </div>
            <div className="flex flex-wrap gap-2 items-center text-xs md:text-sm text-slate-500 dark:text-slate-400">
              <span className="font-semibold">Trending:</span>
              {suggestions.map(s => (<button key={s} onClick={() => handleGenerateRoadmap(s)} className="px-3 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-full transition-colors">{s}</button>))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-1">
            {roadmap && (
              <div className="max-w-4xl mx-auto pb-10">
                <div className="bg-indigo-50 dark:bg-indigo-900/30 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-800 mb-8 shadow-sm">
                  <h3 className="text-xl md:text-2xl font-bold text-indigo-900 dark:text-indigo-200 mb-2">{roadmap.role}</h3>
                  <p className="text-indigo-800 dark:text-indigo-300 leading-relaxed text-sm md:text-base">{roadmap.summary}</p>
                </div>
                <div className="relative">
                  <div className="absolute left-6 md:left-8 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700"></div>
                  {roadmap.steps.map((step, idx) => (
                    <div key={idx} className="relative pl-16 md:pl-24 pb-12 group last:pb-0">
                      <div className="absolute left-0 w-12 h-12 md:w-16 md:h-16 bg-white dark:bg-slate-800 border-4 border-indigo-100 dark:border-indigo-900 rounded-full flex items-center justify-center font-bold text-lg md:text-xl text-indigo-600 dark:text-indigo-400 shadow-sm z-10">{idx + 1}</div>
                      <div className="bg-white dark:bg-slate-800 p-5 md:p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all">
                        <div className="flex flex-col md:flex-row justify-between items-start mb-3 gap-2">
                          <h4 className="text-lg md:text-xl font-bold text-slate-800 dark:text-white">{step.title}</h4>
                          <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide whitespace-nowrap">{step.duration}</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 mb-5 leading-relaxed text-sm md:text-base">{step.description}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div><h5 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">Skills</h5><div className="flex flex-wrap gap-2">{step.skills.map((skill, i) => (<span key={i} className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs md:text-sm rounded-md font-medium border border-indigo-100 dark:border-indigo-800">{skill}</span>))}</div></div>
                          <div><h5 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">Resources</h5><ul className="space-y-1">{step.resources.map((res, i) => (<li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300"><span className="text-emerald-500 mt-1">●</span><a href={res.url} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline transition-colors">{res.name}</a></li>))}</ul></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'resume' && (
        <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">
           {/* Input Section */}
           <div className="w-full md:w-1/2 flex flex-col gap-4 overflow-y-auto">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                 <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Resume Architect</h3>
                 <div className="space-y-4">
                    <div>
                       <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">Your Rough Experience</label>
                       <textarea 
                         value={resumeExp}
                         onChange={(e) => setResumeExp(e.target.value)}
                         placeholder="e.g. Worked at Starbucks for 2 years. Handled cash, made coffee, trained new staff..."
                         className="w-full h-32 p-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 resize-none"
                       />
                    </div>
                    <div>
                       <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">Target Job Description</label>
                       <textarea 
                         value={resumeJobDesc}
                         onChange={(e) => setResumeJobDesc(e.target.value)}
                         placeholder="Paste the JD here to tailor your resume..."
                         className="w-full h-32 p-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 resize-none"
                       />
                    </div>
                    <button 
                      onClick={handleOptimizeResume}
                      disabled={loadingResume || !resumeExp || !resumeJobDesc}
                      className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg disabled:opacity-50"
                    >
                      {loadingResume ? 'Optimizing...' : 'Generate Professional Bullet Points'}
                    </button>
                 </div>
              </div>
           </div>

           {/* Output Section */}
           <div className="w-full md:w-1/2 h-full">
              {resumeResult ? (
                 <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm h-full flex flex-col animate-fade-in overflow-y-auto">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-700">
                       <h3 className="font-bold text-slate-800 dark:text-white">Optimization Result</h3>
                       <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-400 uppercase">ATS Score</span>
                          <span className={`text-xl font-black ${resumeResult.score > 80 ? 'text-emerald-500' : resumeResult.score > 50 ? 'text-amber-500' : 'text-rose-500'}`}>{resumeResult.score}%</span>
                       </div>
                    </div>
                    
                    <div className="mb-6">
                       <h4 className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-2">AI Feedback</h4>
                       <p className="text-sm text-slate-600 dark:text-slate-300 italic bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg border border-indigo-100 dark:border-indigo-800">
                          "{resumeResult.feedback}"
                       </p>
                    </div>

                    <div className="flex-1">
                       <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-3">Optimized Bullet Points</h4>
                       <div className="space-y-3">
                          {resumeResult.optimizedPoints.map((point, i) => (
                             <div key={i} className="flex gap-3 text-sm text-slate-700 dark:text-slate-200 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700 cursor-copy group" onClick={() => navigator.clipboard.writeText(point)}>
                                <span className="text-emerald-500 font-bold">•</span>
                                <span>{point}</span>
                                <span className="ml-auto opacity-0 group-hover:opacity-100 text-xs text-slate-400">Copy</span>
                             </div>
                          ))}
                       </div>
                    </div>
                 </div>
              ) : (
                 <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                    <span className="text-5xl mb-4 grayscale opacity-50">📄</span>
                    <p className="font-medium">Resume Architect</p>
                    <p className="text-sm opacity-70">Turn rough notes into ATS-ready bullet points.</p>
                 </div>
              )}
           </div>
        </div>
      )}

      {activeTab === 'code_dojo' && (
        <div className="flex flex-col h-full gap-6">
          {/* Top Bar: Filters */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-4">
             <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Language:</span>
                <select 
                  value={codingLanguage}
                  onChange={(e) => setCodingLanguage(e.target.value as ProgrammingLanguage)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="Python">Python</option>
                  <option value="JavaScript">JavaScript</option>
                  <option value="Java">Java</option>
                  <option value="C++">C++</option>
                  <option value="SQL">SQL</option>
                </select>
             </div>
             <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Difficulty:</span>
                <select 
                  value={codingDifficulty}
                  onChange={(e) => setCodingDifficulty(e.target.value as Difficulty)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
             </div>
             <button 
               onClick={handleGenerateProblems}
               disabled={loadingProblems}
               className="ml-auto px-5 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 text-sm flex items-center gap-2"
             >
               {loadingProblems ? 'Generating...' : 'Get New Problems'}
             </button>
          </div>

          {/* Main Workspace */}
          <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">
             
             {/* Problem List (or Selected Problem Description) */}
             <div className="w-full md:w-1/3 flex flex-col gap-4 overflow-y-auto">
               {!selectedProblem ? (
                 codingProblems.length > 0 ? (
                   codingProblems.map(p => (
                     <div 
                       key={p.id}
                       onClick={() => handleSelectProblem(p)}
                       className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 cursor-pointer shadow-sm transition-all group"
                     >
                       <div className="flex justify-between items-start mb-2">
                         <h4 className="font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{p.title}</h4>
                         <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${
                           p.difficulty === 'Easy' ? 'bg-emerald-100 text-emerald-800' :
                           p.difficulty === 'Medium' ? 'bg-amber-100 text-amber-800' :
                           'bg-rose-100 text-rose-800'
                         }`}>{p.difficulty}</span>
                       </div>
                       <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3">{p.description}</p>
                     </div>
                   ))
                 ) : (
                   <div className="flex-1 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                     <span className="text-4xl mb-2">💻</span>
                     <p>Select settings and click "Get New Problems"</p>
                   </div>
                 )
               ) : (
                 <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col h-full">
                    <button onClick={() => setSelectedProblem(null)} className="text-sm text-slate-500 hover:text-indigo-600 mb-4 flex items-center gap-1">
                      ← Back to list
                    </button>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{selectedProblem.title}</h3>
                    <div className="flex gap-2 mb-4">
                      <span className="text-xs font-mono bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">{selectedProblem.language}</span>
                      <span className="text-xs font-bold bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-600 dark:text-slate-300">{selectedProblem.difficulty}</span>
                    </div>
                    <div className="prose prose-sm dark:prose-invert max-w-none mb-6 text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {selectedProblem.description}
                    </div>
                    <div className="mt-auto">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Test Cases</h4>
                      <div className="space-y-2">
                        {selectedProblem.testCases.map((tc, i) => (
                          <div key={i} className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg text-xs font-mono border border-slate-100 dark:border-slate-700">
                             <div className="mb-1"><span className="text-indigo-500">In:</span> {tc.input}</div>
                             <div><span className="text-emerald-500">Out:</span> {tc.output}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                 </div>
               )}
             </div>

             {/* Code Editor Area */}
             <div className="w-full md:w-2/3 flex flex-col h-full bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden relative shadow-lg">
                <div className="bg-slate-800 px-4 py-2 flex justify-between items-center border-b border-slate-700">
                   <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                   </div>
                   <span className="text-xs text-slate-400 font-mono">editor.{codingLanguage.toLowerCase()}</span>
                   <button 
                     onClick={handleRunCode}
                     disabled={!selectedProblem || evaluatingCode}
                     className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded text-xs font-bold transition-colors flex items-center gap-2 disabled:opacity-50"
                   >
                     {evaluatingCode ? 'Running...' : '▶ Run Code'}
                   </button>
                </div>
                
                <textarea 
                  value={userCode}
                  onChange={(e) => setUserCode(e.target.value)}
                  disabled={!selectedProblem}
                  className="flex-1 bg-slate-900 text-slate-200 font-mono text-sm p-4 resize-none focus:outline-none"
                  spellCheck="false"
                  placeholder={!selectedProblem ? "Select a problem to start coding..." : "// Write your solution here..."}
                />

                {/* Output Console */}
                <div className="h-40 bg-black border-t border-slate-700 p-4 font-mono text-xs overflow-y-auto">
                   <div className="text-slate-500 mb-1">Console Output:</div>
                   {evaluation ? (
                     <div>
                        <div className={`mb-2 font-bold ${evaluation.passed ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {evaluation.passed ? '✅ Passed All Test Cases' : '❌ Failed'}
                        </div>
                        <div className="text-slate-300 mb-2 whitespace-pre-wrap">{evaluation.output}</div>
                        <div className="text-slate-400 italic border-t border-slate-800 pt-2">{evaluation.feedback}</div>
                     </div>
                   ) : (
                     <div className="text-slate-600 italic">Run code to see output...</div>
                   )}
                </div>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'jobs' && (
        <div className="flex-1 overflow-y-auto flex flex-col md:flex-row gap-6">
          
          {/* Sidebar: Calculator & Saved */}
          <div className="w-full md:w-80 space-y-6 shrink-0 order-2 md:order-1">
             {/* Income Calculator */}
             <div className="bg-gradient-to-br from-indigo-900 to-slate-800 p-6 rounded-2xl text-white shadow-lg">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                   <span className="text-2xl">💰</span> Side Hustle Simulator
                </h3>
                
                <div className="space-y-4 mb-6">
                   <div>
                      <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-indigo-200 mb-1">
                         <span>Hourly Rate</span>
                         <span>₹{hourlyRate}/hr</span>
                      </div>
                      <input type="range" min="0" max="5000" step="50" value={hourlyRate} onChange={(e) => setHourlyRate(parseInt(e.target.value))} className="w-full accent-emerald-400" />
                   </div>
                   <div>
                      <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-indigo-200 mb-1">
                         <span>Hours / Week</span>
                         <span>{hoursPerWeek} hrs</span>
                      </div>
                      <input type="range" min="0" max="40" step="1" value={hoursPerWeek} onChange={(e) => setHoursPerWeek(parseInt(e.target.value))} className="w-full accent-emerald-400" />
                   </div>
                </div>

                <div className="bg-white/10 rounded-xl p-4 text-center backdrop-blur-sm border border-white/10">
                   <p className="text-indigo-200 text-xs uppercase font-bold tracking-widest mb-1">Potential Semester Earnings</p>
                   {hourlyRate > 0 && hoursPerWeek > 0 ? (
                     <>
                        <p className="text-3xl font-bold text-emerald-400">₹{(hourlyRate * hoursPerWeek * 16).toLocaleString()}</p>
                        <p className="text-[10px] text-indigo-300">(Based on 16 weeks)</p>
                     </>
                   ) : (
                     <p className="text-sm text-indigo-300 py-2">Set rates to calculate</p>
                   )}
                </div>
             </div>

             {/* Saved Jobs */}
             {savedJobs.length > 0 && (
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                   <h3 className="font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                     <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="currentColor" viewBox="0 0 20 20"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" /></svg>
                     Saved Opportunities
                   </h3>
                   <div className="space-y-3">
                      {savedJobs.map(job => (
                         <div key={job.id} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-700 flex justify-between items-center group hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm transition-all">
                            <div>
                               <p className="font-bold text-sm text-slate-800 dark:text-white">{job.title}</p>
                               <p className="text-xs text-slate-500 dark:text-slate-400">{job.company}</p>
                            </div>
                            <button onClick={() => window.open(job.link, '_blank')} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">Apply</button>
                         </div>
                      ))}
                   </div>
                </div>
             )}
          </div>

          {/* Main Search Area */}
          <div className="flex-1 order-1 md:order-2 h-full flex flex-col">
             <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6 relative z-20">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Find Active Opportunities</h3>
                <div className="flex flex-col md:flex-row gap-3">
                   <div className="flex-1 relative">
                      <span className="absolute left-3 top-3 text-slate-400">🔍</span>
                      <input 
                         type="text" 
                         value={jobQuery} 
                         onChange={(e) => handleRoleInput(e.target.value, 'job')} 
                         onFocus={() => jobQuery && handleRoleInput(jobQuery, 'job')}
                         onKeyDown={(e) => e.key === 'Enter' && handleJobSearch()}
                         placeholder="Role or Skill (e.g. Graphic Design, Tutor)" 
                         className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400" 
                      />
                      {showRoleSuggestions === 'job' && roleSuggestions.length > 0 && (
                        <ul className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl shadow-xl overflow-hidden z-50 animate-fade-in">
                          {roleSuggestions.map((s, i) => (
                            <li key={i} onClick={() => selectRole(s, 'job')} className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-600 cursor-pointer text-sm text-slate-700 dark:text-slate-200 border-b border-slate-50 dark:border-slate-600 last:border-0">
                              {s}
                            </li>
                          ))}
                        </ul>
                      )}
                   </div>
                   <div className="w-full md:w-1/3 relative">
                      <span className="absolute left-3 top-3 text-slate-400">📍</span>
                      <input 
                         type="text" 
                         value={jobLocation} 
                         onChange={(e) => handleLocationInput(e.target.value)} 
                         onFocus={() => jobLocation && handleLocationInput(jobLocation)}
                         onKeyDown={(e) => e.key === 'Enter' && handleJobSearch()}
                         placeholder="Location (City or 'Remote')" 
                         className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400" 
                      />
                      {showLocationSuggestions && locationSuggestions.length > 0 && (
                        <ul className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl shadow-xl overflow-hidden z-50 animate-fade-in">
                          {locationSuggestions.map((s, i) => (
                            <li key={i} onClick={() => selectLocation(s)} className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-600 cursor-pointer text-sm text-slate-700 dark:text-slate-200 border-b border-slate-50 dark:border-slate-600 last:border-0">
                              {s}
                            </li>
                          ))}
                        </ul>
                      )}
                   </div>
                   <button 
                      onClick={handleJobSearch} 
                      disabled={loadingJobs || !jobQuery} 
                      className="px-6 py-3 bg-indigo-600 dark:bg-indigo-700 text-white font-bold rounded-xl hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-50 transition-colors shadow-sm whitespace-nowrap"
                   >
                      {loadingJobs ? 'Searching...' : 'Find Jobs'}
                   </button>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-4">
                   {['Campus Brand Ambassador', 'Freelance Writer', 'Math Tutor', 'Virtual Assistant', 'Barista'].map(q => (
                      <button key={q} onClick={() => { setJobQuery(q); handleJobSearch(); }} className="px-3 py-1 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 text-xs font-medium rounded-full border border-slate-200 dark:border-slate-600 transition-colors">
                         {q}
                      </button>
                   ))}
                </div>
             </div>

             <div className="flex-1 overflow-y-auto pb-6">
                {jobResults.length > 0 ? (
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {jobResults.map((job) => (
                         <div key={job.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all flex flex-col animate-fade-in relative group">
                            <div className="flex justify-between items-start mb-3">
                               <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center text-lg font-bold text-indigo-600 dark:text-indigo-400">
                                     {job.company.charAt(0)}
                                  </div>
                                  <div>
                                     <h4 className="font-bold text-slate-800 dark:text-white leading-tight">{job.title}</h4>
                                     <p className="text-sm text-slate-500 dark:text-slate-400">{job.company}</p>
                                  </div>
                               </div>
                               <button onClick={() => toggleSaveJob(job)} className="text-slate-300 dark:text-slate-600 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                  <svg className={`w-6 h-6 ${savedJobs.find(j => j.id === job.id) ? 'fill-indigo-600 dark:fill-indigo-400 text-indigo-600 dark:text-indigo-400' : 'fill-none'}`} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                               </button>
                            </div>
                            
                            <div className="flex flex-wrap gap-2 mb-4">
                               <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-md border border-emerald-100 dark:border-emerald-800">{job.salary || 'Competitive Pay'}</span>
                               <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-md border border-blue-100 dark:border-blue-800">{job.type}</span>
                               <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-600">{job.location}</span>
                            </div>

                            <div className="mt-auto flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700">
                               <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                  {job.postedAt || 'Recently'} via {job.platform}
                               </span>
                               <a 
                                  href={job.link} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="px-4 py-2 bg-indigo-600 dark:bg-indigo-700 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors"
                               >
                                  Apply Now
                               </a>
                            </div>
                         </div>
                      ))}
                   </div>
                ) : (
                   <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 opacity-60 min-h-[300px]">
                      <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-3xl">💼</div>
                      <p className="text-lg font-medium">Search to find active income opportunities.</p>
                      <p className="text-sm">Try searching for "Remote Internship" or "Dog Walker".</p>
                   </div>
                )}
             </div>
          </div>
        </div>
      )}

      {activeTab === 'interview' && (
        <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full h-full bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden relative z-20">
          {!interviewStarted ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-6"><span className="text-4xl">👔</span></div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">Mock Interview Simulator</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md">Practice answering tough questions for your dream job.</p>
              <div className="flex gap-2 w-full max-w-md relative">
                <div className="flex-1 relative">
                  <input 
                    type="text" 
                    value={interviewRole} 
                    onChange={(e) => handleRoleInput(e.target.value, 'interview')} 
                    onFocus={() => interviewRole && handleRoleInput(interviewRole, 'interview')}
                    placeholder="Enter role (e.g. Software Engineer)" 
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400" 
                  />
                  {showRoleSuggestions === 'interview' && roleSuggestions.length > 0 && (
                    <ul className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl shadow-xl overflow-hidden z-50 animate-fade-in text-left">
                      {roleSuggestions.map((s, i) => (
                        <li key={i} onClick={() => selectRole(s, 'interview')} className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-600 cursor-pointer text-sm text-slate-700 dark:text-slate-200 border-b border-slate-50 dark:border-slate-600 last:border-0">
                          {s}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <button onClick={startInterview} disabled={loadingInterview || !interviewRole} className="px-6 py-3 bg-indigo-600 dark:bg-indigo-700 text-white font-bold rounded-xl hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-50 transition-colors">Start</button>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-indigo-600 dark:bg-indigo-800 text-white px-6 py-4 flex justify-between items-center"><span className="font-bold">Interviewing for: {interviewRole}</span><button onClick={() => setInterviewStarted(false)} className="text-xs bg-indigo-800 dark:bg-indigo-900 px-3 py-1 rounded hover:bg-indigo-700 dark:hover:bg-indigo-800">End Interview</button></div>
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 dark:bg-slate-900">
                {interviewMessages.map((msg, i) => (<div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] p-4 rounded-2xl text-sm md:text-base leading-relaxed ${msg.role === 'user' ? 'bg-indigo-600 dark:bg-indigo-700 text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-sm border border-slate-200 dark:border-slate-700 rounded-tl-none'}`}>{msg.text}</div></div>))}
                {loadingInterview && (<div className="flex justify-start"><div className="bg-white dark:bg-slate-800 p-4 rounded-2xl rounded-tl-none shadow-sm border border-slate-200 dark:border-slate-700"><div className="flex gap-1"><div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div><div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-75"></div><div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-150"></div></div></div></div>)}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700"><div className="flex gap-3"><textarea value={interviewInput} onChange={(e) => setInterviewInput(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendAnswer(); } }} placeholder="Type your answer..." className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none h-14 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400" /><button onClick={handleSendAnswer} disabled={loadingInterview || !interviewInput.trim()} className="px-6 bg-indigo-600 dark:bg-indigo-700 text-white font-bold rounded-xl hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-50 transition-colors">Send</button></div></div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CareerCoach;
