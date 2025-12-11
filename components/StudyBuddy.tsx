
import React, { useState, useRef, useEffect } from 'react';
import { generateStudyChat, generateQuiz } from '../services/geminiService';
import { ChatMessage, QuizData } from '../types';
import { gamification } from '../services/gamificationService';

const SUBJECTS_LIST = [
  "Calculus", "Linear Algebra", "Organic Chemistry", "Physics", "Biology",
  "World History", "Microeconomics", "Macroeconomics", "Psychology", "Sociology",
  "Computer Science", "Data Structures", "English Literature", "Philosophy",
  "Art History", "Political Science", "Statistics", "Marketing", "Business Law",
  "Anatomy", "Genetics", "Chemistry", "Engineering", "Anthropology"
];

const StudyBuddy: React.FC = () => {
  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Hi! I can help you study complex topics, create quizzes, or find learning resources. What are you working on?', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Voice State
  const [isListening, setIsListening] = useState(false);

  // Right Panel State
  const [topic, setTopic] = useState('');
  
  // Mobile View State
  const [mobileView, setMobileView] = useState<'chat' | 'tools'>('chat');

  // Quiz State
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);

  // Predictions State
  const [topicSuggestions, setTopicSuggestions] = useState<string[]>([]);
  const [showTopicSuggestions, setShowTopicSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowTopicSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Voice Handling
  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Voice input not supported in this browser.");
      return;
    }

    if (isListening) return;

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const speechToText = event.results[0][0].transcript;
      setInput(speechToText);
      setIsListening(false);
      // Auto send if desired, or let user review
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleTopicInput = (val: string) => {
    setTopic(val);
    if (val.length > 0) {
      const filtered = SUBJECTS_LIST.filter(s => s.toLowerCase().includes(val.toLowerCase()));
      setTopicSuggestions(filtered.slice(0, 5));
      setShowTopicSuggestions(true);
    } else {
      setShowTopicSuggestions(false);
    }
  };

  const selectTopic = (val: string) => {
    setTopic(val);
    setShowTopicSuggestions(false);
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = { role: 'user', text: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const history = messages.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    const responseText = await generateStudyChat(history, userMsg.text);
    
    setMessages(prev => [...prev, { role: 'model', text: responseText, timestamp: new Date() }]);
    setIsLoading(false);
  };

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setShowTopicSuggestions(false);
    
    setQuizLoading(true);
    setQuiz(null);
    setScore(0);
    setCurrentQuestionIdx(0);
    setQuizComplete(false);
    
    const data = await generateQuiz(topic);
    setQuiz(data);
    setQuizLoading(false);
  };

  const handleAnswerClick = (idx: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(idx);
    setShowExplanation(true);
    if (idx === quiz?.questions[currentQuestionIdx].correctAnswerIndex) {
      setScore(prev => prev + 1);
    }
  };

  const nextQuestion = () => {
    if (!quiz) return;
    
    if (currentQuestionIdx < quiz.questions.length - 1) {
      setSelectedAnswer(null);
      setShowExplanation(false);
      setCurrentQuestionIdx(prev => prev + 1);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    setQuizComplete(true);
    
    // --- GAMIFICATION REWARDS ---
    // Only reward based on correct answers. 10 XP per correct answer.
    const totalXp = score * 10; 
    
    if (totalXp > 0) {
      gamification.addXp(totalXp);
      gamification.completeQuest('q_quiz');
    }
    
    // Update Profile Stats
    gamification.updateStat('quizzesCompleted', 1);
    gamification.updateStat('correctAnswers', score);
  };

  const resetQuiz = () => {
    setQuiz(null);
    setTopic('');
    setQuizComplete(false);
    setScore(0);
    setCurrentQuestionIdx(0);
  };

  // Calculate Progress Percentage
  const progressPercentage = quiz ? ((currentQuestionIdx) / quiz.questions.length) * 100 : 0;

  return (
    <div className="flex flex-col lg:flex-row h-full lg:gap-6 lg:p-6 relative">
      
      {/* Mobile Toggle Tabs */}
      <div className="lg:hidden flex border-b border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm">
        <button 
          onClick={() => setMobileView('chat')}
          className={`flex-1 py-3 text-sm font-semibold ${mobileView === 'chat' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' : 'text-slate-500 dark:text-slate-400'}`}
        >
          Chat Tutor
        </button>
        <button 
          onClick={() => setMobileView('tools')}
          className={`flex-1 py-3 text-sm font-semibold ${mobileView === 'tools' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' : 'text-slate-500 dark:text-slate-400'}`}
        >
          Quiz Generator
        </button>
      </div>

      {/* Chat Section */}
      <div className={`${mobileView === 'chat' ? 'flex' : 'hidden'} lg:flex flex-1 flex-col bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm lg:rounded-2xl shadow-sm border-t-0 lg:border border-white/50 dark:border-slate-700/50 overflow-hidden h-full`}>
        <div className="p-4 bg-blue-600 dark:bg-blue-700 text-white font-medium flex items-center gap-2 shadow-sm">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
          Study Chat
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-transparent">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-blue-600 dark:bg-blue-700 text-white rounded-tr-none shadow-md' 
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-600 rounded-tl-none'
              }`}>
                <p className="whitespace-pre-wrap text-sm md:text-base leading-relaxed">{msg.text}</p>
              </div>
            </div>
          ))}
          {isLoading && (
             <div className="flex justify-start">
             <div className="bg-slate-100 dark:bg-slate-700 px-4 py-3 rounded-2xl rounded-tl-none border border-slate-200 dark:border-slate-600 shadow-sm">
               <div className="flex gap-1">
                 <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                 <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-75"></div>
                 <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-150"></div>
               </div>
             </div>
           </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
          <div className="flex gap-2">
            <button
                onClick={handleVoiceInput}
                className={`p-3 rounded-xl transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                title="Voice Input"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
            </button>
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={isListening ? "Listening..." : "Ask a question..."}
              className="flex-1 px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 dark:bg-slate-700 focus:bg-white dark:focus:bg-slate-600 transition-all shadow-inner text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
            />
            <button 
              onClick={handleSendMessage}
              disabled={isLoading || !input.trim()}
              className="px-4 bg-blue-600 dark:bg-blue-700 text-white rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 shadow-md"
            >
              <svg className="w-5 h-5 transform rotate-90" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Tools Section */}
      <div className={`${mobileView === 'tools' ? 'flex' : 'hidden'} lg:flex w-full lg:w-[450px] flex-col gap-6 h-full overflow-y-auto`}>
        
        {/* Quiz Creator */}
        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-white/50 dark:border-slate-700/50 flex flex-col h-full">
           <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
             <span className="bg-amber-100 dark:bg-amber-900/30 p-1.5 rounded-lg text-amber-600 dark:text-amber-400 text-xl">⚡</span> 
             Quiz Generator
           </h3>

           {!quiz ? (
             <div className="flex flex-col flex-1 justify-center" ref={containerRef}>
               <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">Test your knowledge. Enter a subject to generate a rapid-fire quiz.</p>
               <div className="relative mb-4">
                  <input 
                    type="text" 
                    value={topic}
                    onChange={(e) => handleTopicInput(e.target.value)}
                    onFocus={() => topic && handleTopicInput(topic)}
                    placeholder="e.g. Calculus, Art History..."
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all bg-slate-50 dark:bg-slate-700 focus:bg-white dark:focus:bg-slate-600 text-slate-900 dark:text-white placeholder-slate-400"
                  />
                  {showTopicSuggestions && topicSuggestions.length > 0 && (
                    <ul className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl shadow-xl overflow-hidden z-50 animate-fade-in">
                      {topicSuggestions.map((s, i) => (
                        <li key={i} onClick={() => selectTopic(s)} className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-600 cursor-pointer text-sm text-slate-700 dark:text-slate-200 border-b border-slate-50 dark:border-slate-600 last:border-0">
                          {s}
                        </li>
                      ))}
                    </ul>
                  )}
               </div>
               <button 
                 onClick={handleGenerate}
                 disabled={quizLoading || !topic}
                 className="w-full py-3 bg-slate-900 dark:bg-slate-700 text-white font-bold rounded-xl hover:bg-slate-800 dark:hover:bg-slate-600 transition-all shadow-lg disabled:opacity-50 disabled:shadow-none"
               >
                 {quizLoading ? 'Generating...' : 'Start Quiz'}
               </button>
               
               <div className="mt-8 flex flex-wrap gap-2 justify-center">
                 {['History', 'Biology', 'Economics', 'Coding'].map(t => (
                   <button key={t} onClick={() => { setTopic(t); }} className="px-3 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 text-xs font-medium rounded-full transition-colors">{t}</button>
                 ))}
               </div>
             </div>
           ) : !quizComplete ? (
             <div className="flex-1 flex flex-col animate-fade-in">
               <div className="flex justify-between items-center mb-4">
                 <h4 className="font-bold text-slate-800 dark:text-slate-200 text-lg leading-tight mr-2 truncate">{quiz.title}</h4>
                 <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                   {currentQuestionIdx + 1}/{quiz.questions.length}
                 </span>
               </div>

               {/* Progress Bar */}
               <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mb-6 overflow-hidden">
                 <div 
                   className="bg-amber-500 h-2 rounded-full transition-all duration-500 ease-out" 
                   style={{ width: `${progressPercentage}%` }}
                 ></div>
               </div>
               
               <div className="mb-6 flex-1 overflow-y-auto pr-1">
                 <p className="text-lg font-medium text-slate-800 dark:text-slate-100 mb-6 leading-relaxed">{quiz.questions[currentQuestionIdx].question}</p>
                 <div className="space-y-3">
                   {quiz.questions[currentQuestionIdx].options.map((opt, idx) => {
                     let btnClass = "w-full text-left p-4 rounded-xl border transition-all text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300 ";
                     
                     if (selectedAnswer !== null) {
                       if (idx === quiz.questions[currentQuestionIdx].correctAnswerIndex) {
                         btnClass = "w-full text-left p-4 rounded-xl border bg-emerald-100 dark:bg-emerald-900/40 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 shadow-sm ";
                       } else if (idx === selectedAnswer) {
                         btnClass = "w-full text-left p-4 rounded-xl border bg-rose-100 dark:bg-rose-900/40 border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-200 ";
                       } else {
                         btnClass += "border-slate-200 dark:border-slate-700 opacity-50 ";
                       }
                     } else {
                       btnClass += "border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-sm";
                     }

                     return (
                       <button 
                         key={idx}
                         onClick={() => handleAnswerClick(idx)}
                         disabled={selectedAnswer !== null}
                         className={btnClass}
                       >
                         <span className="mr-2 opacity-50 font-bold">{String.fromCharCode(65 + idx)}.</span> {opt}
                       </button>
                     );
                   })}
                 </div>
               </div>

               {showExplanation && (
                 <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-xl border border-blue-100 dark:border-blue-800 mb-4 animate-slide-up">
                   <p className="text-sm text-blue-800 dark:text-blue-200"><span className="font-bold">Explanation:</span> {quiz.questions[currentQuestionIdx].explanation}</p>
                 </div>
               )}

               <div className="flex justify-end">
                 {selectedAnswer !== null && (
                   <button onClick={nextQuestion} className="px-6 py-2 bg-slate-900 dark:bg-slate-700 text-white font-bold rounded-xl hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors shadow-md animate-pulse">
                     {currentQuestionIdx < quiz.questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                   </button>
                 )}
               </div>
             </div>
           ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in relative p-6">
                <button 
                  onClick={resetQuiz}
                  className="absolute top-2 right-2 p-2 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                  title="Close Quiz"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

               <div className="text-6xl mb-4 animate-bounce">🏆</div>
               <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Quiz Complete!</h3>
               <p className="text-slate-600 dark:text-slate-400 mb-6">You scored <span className="font-bold text-slate-900 dark:text-white">{score}/{quiz.questions.length}</span></p>
               
               <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 p-4 rounded-xl mb-8 w-full">
                 <p className="text-amber-800 dark:text-amber-200 text-sm font-bold uppercase tracking-wider mb-1">Rewards Earned</p>
                 <div className="flex items-center justify-center gap-2 text-2xl font-bold text-amber-600 dark:text-amber-400">
                   <span>+{score * 10} XP</span>
                   <span>🔥</span>
                 </div>
                 {score === 0 && <p className="text-xs text-amber-700 dark:text-amber-300 mt-2 opacity-80">Get answers right to earn XP!</p>}
               </div>

               <button onClick={resetQuiz} className="w-full py-3 bg-slate-900 dark:bg-slate-700 text-white font-bold rounded-xl hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors shadow-lg">
                 Start Another Quiz
               </button>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default StudyBuddy;
