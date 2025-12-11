
import React, { useState } from 'react';
import { gamification } from '../services/gamificationService';

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate network delay for effect
    await new Promise(resolve => setTimeout(resolve, 800));

    if (isLogin) {
      const result = gamification.login(email, password);
      if (!result.success) {
        setError(result.message || 'Login failed');
        setIsLoading(false);
      }
      // On success, App.tsx will re-render due to state change
    } else {
      if (!name) {
        setError('Name is required');
        setIsLoading(false);
        return;
      }
      const result = gamification.signup(name, email, password);
      if (!result.success) {
        setError(result.message || 'Signup failed');
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-900 transition-colors duration-500">
      
      {/* Left Side - Hero / Visuals */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-indigo-600 dark:bg-indigo-900 items-center justify-center">
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-600/90 to-purple-800/90 z-10"></div>
        
        <div className="relative z-20 text-white p-12 max-w-lg">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-4xl mb-8 border border-white/30 shadow-xl">
            🎓
          </div>
          <h1 className="text-5xl font-extrabold mb-6 leading-tight">Master Your Student Life.</h1>
          <p className="text-lg text-indigo-100 mb-8 leading-relaxed">
            The all-in-one companion for academics, career, finance, and wellness. Join thousands of students leveling up their future.
          </p>
          
          <div className="flex gap-4">
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20">
              <span className="text-2xl block mb-1">🤖</span>
              <span className="text-xs font-bold uppercase tracking-wider opacity-80">AI Tutor</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20">
              <span className="text-2xl block mb-1">💸</span>
              <span className="text-xs font-bold uppercase tracking-wider opacity-80">Finance</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20">
              <span className="text-2xl block mb-1">🚀</span>
              <span className="text-xs font-bold uppercase tracking-wider opacity-80">Career</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md space-y-8 bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700">
          
          {/* Header */}
          <div className="text-center">
            <div className="lg:hidden w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-2xl mx-auto mb-4 text-white shadow-lg">
              🎓
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {isLogin ? 'Enter your credentials to access your dashboard.' : 'Start your journey to better grades and balance.'}
            </p>
          </div>

          {/* Form */}
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              {!isLogin && (
                <div className="relative group">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
                  <input
                    type="text"
                    required={!isLogin}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="appearance-none relative block w-full px-4 py-3 border border-slate-300 dark:border-slate-600 placeholder-slate-400 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm bg-slate-50 dark:bg-slate-700 transition-all"
                    placeholder="e.g. Alex Smith"
                    autoComplete="name"
                  />
                </div>
              )}
              
              <div className="relative group">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none relative block w-full px-4 py-3 border border-slate-300 dark:border-slate-600 placeholder-slate-400 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm bg-slate-50 dark:bg-slate-700 transition-all"
                  placeholder="student@university.edu"
                  autoComplete="email"
                />
              </div>

              <div className="relative group">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none relative block w-full px-4 py-3 border border-slate-300 dark:border-slate-600 placeholder-slate-400 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm bg-slate-50 dark:bg-slate-700 transition-all"
                  placeholder="••••••••"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                />
              </div>
            </div>

            {error && (
              <div className="text-sm text-rose-600 bg-rose-50 dark:bg-rose-900/30 p-3 rounded-lg border border-rose-100 dark:border-rose-800 text-center animate-shake">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all shadow-lg shadow-indigo-200 dark:shadow-none hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100"
              >
                {isLoading ? (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : null}
                {isLogin ? 'Sign In' : 'Create Account'}
              </button>
            </div>
          </form>

          {/* Toggle */}
          <div className="text-center mt-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => { setIsLogin(!isLogin); setError(''); }}
                className="font-bold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 transition-colors"
              >
                {isLogin ? 'Sign up' : 'Log in'}
              </button>
            </p>
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700 text-center">
             <p className="text-xs text-slate-400">
               By continuing, you agree to UniLife's Terms of Service and Privacy Policy.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
