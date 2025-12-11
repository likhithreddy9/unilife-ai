
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Tool } from '../types';
import { findAiTools } from '../services/geminiService';
import { gamification } from '../services/gamificationService';

const curatedTools: Tool[] = [
  // --- Chatbots ---
  {
    name: "ChatGPT",
    description: "The leading all-purpose AI assistant for writing, coding, brainstorming, and explanations.",
    url: "https://chat.openai.com",
    category: "Chatbots",
    icon: "🤖",
    color: "bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-200",
    tag: "Essential"
  },
  {
    name: "Google Gemini",
    description: "Google's multimodal AI. Excellent for real-time info, reasoning, and Google Workspace integration.",
    url: "https://gemini.google.com",
    category: "Chatbots",
    icon: "✨",
    color: "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200",
    tag: "Essential"
  },
  {
    name: "Claude",
    description: "Known for handling large documents, nuanced writing, and safe, reliable outputs.",
    url: "https://claude.ai",
    category: "Chatbots",
    icon: "🧠",
    color: "bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-200"
  },
  {
    name: "Microsoft Copilot",
    description: "AI powered by GPT-4, integrated with Bing search for up-to-date web answers.",
    url: "https://copilot.microsoft.com",
    category: "Chatbots",
    icon: "🟦",
    color: "bg-sky-100 dark:bg-sky-900/40 text-sky-800 dark:text-sky-200"
  },
  {
    name: "Pi",
    description: "A supportive and empathetic AI designed for venting, advice, and conversation.",
    url: "https://pi.ai",
    category: "Chatbots",
    icon: "🥧",
    color: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200"
  },

  // --- Research ---
  {
    name: "Perplexity",
    description: "A conversational search engine that cites its sources. Perfect for starting research papers.",
    url: "https://www.perplexity.ai",
    category: "Research",
    icon: "🔍",
    color: "bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200",
    tag: "Top Pick"
  },
  {
    name: "Consensus",
    description: "Search engine for scientific papers. Finds answers directly from peer-reviewed studies.",
    url: "https://consensus.app",
    category: "Research",
    icon: "🔬",
    color: "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200"
  },
  {
    name: "Elicit",
    description: "AI research assistant that automates literature reviews and extracts data from papers.",
    url: "https://elicit.com",
    category: "Research",
    icon: "📑",
    color: "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200"
  },
  {
    name: "Scite",
    description: "Helps you see how research publications have been cited (supported, mentioned, or contrasted).",
    url: "https://scite.ai",
    category: "Research",
    icon: "📊",
    color: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
  },
  {
    name: "Scholarcy",
    description: "Reads and summarizes academic articles, breaking them down into bite-sized sections.",
    url: "https://www.scholarcy.com",
    category: "Research",
    icon: "📖",
    color: "bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200"
  },

  // --- Writing ---
  {
    name: "Grammarly",
    description: "Essential grammar, spelling, and tone checker. A must-have for proofreading assignments.",
    url: "https://www.grammarly.com",
    category: "Writing",
    icon: "✅",
    color: "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
  },
  {
    name: "Quillbot",
    description: "Paraphrasing tool to improve fluency and rewrite sentences. (Use ethically!)",
    url: "https://quillbot.com",
    category: "Writing",
    icon: "✍️",
    color: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300"
  },
  {
    name: "Hemingway Editor",
    description: "Highlights complex sentences to help you write boldly and clearly.",
    url: "https://hemingwayapp.com",
    category: "Writing",
    icon: "✒️",
    color: "bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-200"
  },
  {
    name: "DeepL",
    description: "The world's most accurate translator. Great for language students or foreign texts.",
    url: "https://www.deepl.com",
    category: "Writing",
    icon: "🌐",
    color: "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-200"
  },
  {
    name: "Wordtune",
    description: "Rewrites your thoughts into clear, compelling, and authentic writing.",
    url: "https://www.wordtune.com",
    category: "Writing",
    icon: "🟣",
    color: "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300"
  },

  // --- Math & Science ---
  {
    name: "WolframAlpha",
    description: "Computational intelligence. Solves complex math, physics, and chemistry problems step-by-step.",
    url: "https://www.wolframalpha.com",
    category: "Math & Sci",
    icon: "🧮",
    color: "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200",
    tag: "STEM"
  },
  {
    name: "Photomath",
    description: "Scan math problems with your phone to get instant explanations and solutions.",
    url: "https://photomath.com",
    category: "Math & Sci",
    icon: "📸",
    color: "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
  },
  {
    name: "Symbolab",
    description: "Advanced math solver for calculus, algebra, and trigonometry with steps.",
    url: "https://www.symbolab.com",
    category: "Math & Sci",
    icon: "➗",
    color: "bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300"
  },
  {
    name: "Julius AI",
    description: "Analyze data and chat with your spreadsheets/data files. Great for stats classes.",
    url: "https://julius.ai",
    category: "Math & Sci",
    icon: "📉",
    color: "bg-cyan-100 dark:bg-cyan-900/40 text-cyan-800 dark:text-cyan-200"
  },

  // --- Coding ---
  {
    name: "GitHub Copilot",
    description: "AI pair programmer. Suggests code and functions in real-time within your editor.",
    url: "https://github.com/features/copilot",
    category: "Coding",
    icon: "🐙",
    color: "bg-slate-800 text-white"
  },
  {
    name: "Replit",
    description: "Online IDE with built-in AI (Ghostwriter) to help you build software collaboratively.",
    url: "https://replit.com",
    category: "Coding",
    icon: "💻",
    color: "bg-orange-600 text-white"
  },
  {
    name: "Codeium",
    description: "Free AI code completion and chat tool for various IDEs. A solid alternative to Copilot.",
    url: "https://codeium.com",
    category: "Coding",
    icon: "⌨️",
    color: "bg-green-600 text-white"
  },
  {
    name: "Blackbox AI",
    description: "AI designed specifically for coding questions, turning natural language into code.",
    url: "https://www.blackbox.ai",
    category: "Coding",
    icon: "⬛",
    color: "bg-slate-900 text-white"
  },

  // --- Productivity ---
  {
    name: "Notion AI",
    description: "Integrated AI in Notion for summarizing notes, brainstorming, and editing text.",
    url: "https://www.notion.so/product/ai",
    category: "Productivity",
    icon: "📓",
    color: "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
  },
  {
    name: "Otter.ai",
    description: "Records lectures and generates real-time transcripts and summaries.",
    url: "https://otter.ai",
    category: "Productivity",
    icon: "🎙️",
    color: "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-200"
  },
  {
    name: "Goblin Tools",
    description: "Helps neurodivergent students break down overwhelming tasks into small steps.",
    url: "https://goblin.tools",
    category: "Productivity",
    icon: "👺",
    color: "bg-green-200 dark:bg-green-800 text-green-900 dark:text-green-100",
    tag: "Hidden Gem"
  },
  {
    name: "Clockwise",
    description: "AI calendar assistant that optimizes your schedule to create focus time.",
    url: "https://www.getclockwise.com",
    category: "Productivity",
    icon: "🕒",
    color: "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200"
  },

  // --- Presentation ---
  {
    name: "Gamma",
    description: "Generates beautiful slide decks, docs, and webpages from text prompts in seconds.",
    url: "https://gamma.app",
    category: "Presentation",
    icon: "🖼️",
    color: "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200"
  },
  {
    name: "Tome",
    description: "AI-powered storytelling format. Creates presentations with text and images automatically.",
    url: "https://tome.app",
    category: "Presentation",
    icon: "📚",
    color: "bg-pink-100 dark:bg-pink-900/40 text-pink-800 dark:text-pink-200"
  },
  {
    name: "Beautiful.ai",
    description: "Presentation software that uses AI to design your slides so they always look professional.",
    url: "https://www.beautiful.ai",
    category: "Presentation",
    icon: "🎨",
    color: "bg-cyan-50 dark:bg-cyan-900/40 text-cyan-800 dark:text-cyan-200"
  },

  // --- Design & Media ---
  {
    name: "Canva Magic",
    description: "AI tools inside Canva for image editing, text generation, and design layouts.",
    url: "https://www.canva.com/magic",
    category: "Design & Media",
    icon: "🖌️",
    color: "bg-violet-100 dark:bg-violet-900/40 text-violet-800 dark:text-violet-200"
  },
  {
    name: "Midjourney",
    description: "High-quality AI image generator (requires Discord). Great for creative projects.",
    url: "https://www.midjourney.com",
    category: "Design & Media",
    icon: "⛵",
    color: "bg-slate-800 text-white"
  },
  {
    name: "Descript",
    description: "Edit audio and video by editing text. Removes filler words ('um', 'uh') automatically.",
    url: "https://www.descript.com",
    category: "Design & Media",
    icon: "🎬",
    color: "bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100"
  }
];

const ExternalTools: React.FC = () => {
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Suggestion State
  const [suggestions, setSuggestions] = useState<Tool[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Dynamic Discovery State
  const [dynamicTools, setDynamicTools] = useState<Tool[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [showReward, setShowReward] = useState(false);
  
  const categories = ['All', 'Chatbots', 'Research', 'Writing', 'Math & Sci', 'Coding', 'Productivity', 'Presentation', 'Design & Media'];

  const handleDiscover = async () => {
    setIsDiscovering(true);
    setShowReward(false);
    // If filtering by a specific category, find tools for that category. Otherwise, general trending.
    const categoryToSearch = filter === 'All' ? 'Student Productivity' : filter;
    const newTools = await findAiTools(categoryToSearch, searchQuery);
    setDynamicTools(newTools);
    setIsDiscovering(false);

    if (newTools.length > 0) {
      gamification.completeQuest('q_explore');
      gamification.addXp(20);
      setShowReward(true);
      setTimeout(() => setShowReward(false), 3000);
    }
  };

  const filteredTools = useMemo(() => {
    // Merge curated and dynamic tools
    const allTools = [...dynamicTools, ...curatedTools];
    
    // Remove duplicates based on URL
    const uniqueTools = Array.from(new Map(allTools.map(item => [item.url, item])).values());

    return uniqueTools.filter(t => {
      const matchesCategory = filter === 'All' || t.category === filter || (t.category as string) === filter;
      const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           t.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [filter, searchQuery, dynamicTools]);

  // Handle outside click to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    
    if (val.length > 0) {
      const matched = curatedTools.filter(t => t.name.toLowerCase().includes(val.toLowerCase()));
      setSuggestions(matched.slice(0, 5));
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (tool: Tool) => {
    setSearchQuery(tool.name);
    setShowSuggestions(false);
  };

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto relative bg-transparent">
      {/* Gamification Reward Overlay */}
      {showReward && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-indigo-100 dark:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-100 px-6 py-2 rounded-full font-bold shadow-lg animate-bounce-in flex items-center gap-2">
          <span>⚡</span> +20 XP Earned!
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <header className="mb-8 text-center md:text-left flex flex-col md:flex-row justify-between items-end gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">AI Tool Directory 🌐</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              A comprehensive library of AI tools to supercharge every aspect of your student life.
            </p>
          </div>
          <button 
            onClick={handleDiscover} 
            disabled={isDiscovering}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition-all disabled:opacity-70 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isDiscovering ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Searching Web...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                Discover New Tools
              </>
            )}
          </button>
        </header>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 justify-between items-center sticky top-0 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 pt-2 pb-4 z-10 backdrop-blur-sm bg-opacity-90 dark:bg-opacity-90 md:bg-opacity-0">
          {/* Categories */}
          <div className="flex flex-wrap gap-2 justify-center md:justify-start flex-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-semibold transition-all whitespace-nowrap ${
                  filter === cat 
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md transform scale-105' 
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search with Autocomplete */}
          <div className="relative w-full md:w-64 shrink-0" ref={containerRef}>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={handleInputChange}
              onFocus={() => { if(searchQuery) setShowSuggestions(true); }}
              placeholder="Search tools..."
              className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl leading-5 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm shadow-sm"
            />
            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 overflow-hidden z-20 animate-fade-in">
                <ul>
                  {suggestions.map((tool, idx) => (
                    <li 
                      key={idx} 
                      onClick={() => selectSuggestion(tool)}
                      className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer flex items-center gap-3 border-b border-slate-50 dark:border-slate-700 last:border-0"
                    >
                      <span className="text-xl">{tool.icon}</span>
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{tool.name}</p>
                        <p className="text-xs text-slate-400 truncate w-40">{tool.category}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
          {filteredTools.map((tool, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all flex flex-col h-full animate-fade-in group">
              <div className="flex justify-between items-start mb-4">
                 <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${tool.color.includes('bg-') ? tool.color : 'bg-slate-100 text-slate-600'}`}>
                    {tool.icon}
                 </div>
                 {tool.tag && (
                   <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                     {tool.tag}
                   </span>
                 )}
              </div>
              
              <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {tool.name}
              </h3>
              
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-3 flex-1 leading-relaxed">
                {tool.description}
              </p>
              
              <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                 <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{tool.category}</span>
                 <a 
                   href={tool.url} 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                 >
                   Open <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                 </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExternalTools;
