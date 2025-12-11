
import React, { useState, useRef, useEffect } from 'react';
import { generateRecipes } from '../services/geminiService';
import { Recipe } from '../types';

const INGREDIENTS_LIST = [
  "Chicken", "Rice", "Eggs", "Pasta", "Tomatoes", "Potatoes", "Cheese", 
  "Onions", "Spinach", "Bread", "Milk", "Beans", "Garlic", "Butter",
  "Ground Beef", "Tuna", "Peppers", "Broccoli", "Carrots", "Yogurt",
  "Avocado", "Mushrooms", "Tofu", "Lentils", "Chickpeas"
];

const BudgetBites: React.FC = () => {
  const [ingredients, setIngredients] = useState('');
  const [budget, setBudget] = useState('');
  const [dietary, setDietary] = useState('');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Predictive State
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

  const handleIngredientInput = (val: string) => {
    setIngredients(val);
    if (val.length > 0) {
      // Very simple logic: if input has comma, predict for the last term, otherwise predict for the whole string if no commas
      const terms = val.split(',').map(t => t.trim());
      const currentTerm = terms[terms.length - 1];
      
      if (currentTerm.length > 0) {
        const filtered = INGREDIENTS_LIST.filter(i => i.toLowerCase().includes(currentTerm.toLowerCase()));
        setSuggestions(filtered.slice(0, 5));
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (s: string) => {
    const terms = ingredients.split(',');
    terms.pop(); // remove incomplete term
    terms.push(s);
    setIngredients(terms.join(', ') + ', ');
    setShowSuggestions(false);
  };

  const handleSearch = async () => {
    setLoading(true);
    setShowSuggestions(false);
    setRecipes([]);
    const results = await generateRecipes(ingredients, budget, dietary);
    setRecipes(results);
    setLoading(false);
  };

  return (
    <div className="p-4 md:p-6 h-full flex flex-col" ref={containerRef}>
      <div className="mb-6 md:mb-8 text-center max-w-2xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">Budget Bites 🍳</h2>
        <p className="text-sm md:text-base text-slate-600">Got random ingredients and $5? Let AI suggest a meal.</p>
      </div>

      <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-200 mb-8 max-w-4xl mx-auto w-full relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <label className="block text-sm font-medium text-slate-700 mb-1">Ingredients</label>
            <input 
              type="text" 
              placeholder="Rice, eggs..." 
              value={ingredients}
              onChange={(e) => handleIngredientInput(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white text-slate-900"
            />
            {showSuggestions && suggestions.length > 0 && (
              <ul className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-100 rounded-lg shadow-xl overflow-hidden z-50 animate-fade-in">
                {suggestions.map((s, i) => (
                  <li key={i} onClick={() => selectSuggestion(s)} className="px-4 py-2 hover:bg-emerald-50 cursor-pointer text-sm text-slate-700 border-b border-slate-50 last:border-0">
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Constraints</label>
            <input 
              type="text" 
              placeholder="<$10, 20 mins" 
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white text-slate-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Dietary</label>
            <select 
              value={dietary} 
              onChange={(e) => setDietary(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white text-slate-900"
            >
              <option value="">None</option>
              <option value="Vegetarian">Vegetarian</option>
              <option value="Vegan">Vegan</option>
              <option value="Gluten-Free">Gluten-Free</option>
              <option value="High Protein">High Protein</option>
            </select>
          </div>
        </div>
        <button 
          onClick={handleSearch}
          disabled={loading}
          className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Cooking up ideas...
            </>
          ) : 'Find Recipes'}
        </button>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto pb-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {recipes.map((recipe, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow animate-fade-in">
              <div className="p-1 bg-gradient-to-r from-emerald-400 to-teal-500 h-2"></div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-slate-800 leading-tight">{recipe.name}</h3>
                  <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ml-2">
                    {recipe.estimatedCost}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mb-4 line-clamp-2">{recipe.description}</p>
                
                <div className="flex gap-4 text-xs text-slate-500 mb-4">
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {recipe.prepTime}
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {recipe.calories}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 mt-auto">
                  <h4 className="font-semibold text-sm text-slate-800 mb-2">Ingredients</h4>
                  <ul className="text-sm text-slate-600 space-y-1 mb-4">
                    {recipe.ingredients.slice(0, 5).map((ing, i) => (
                      <li key={i} className="flex justify-between">
                        <span>{ing.name}</span>
                        <span className="text-slate-400">{ing.amount}</span>
                      </li>
                    ))}
                    {recipe.ingredients.length > 5 && <li className="text-xs text-slate-400 italic">and {recipe.ingredients.length - 5} more...</li>}
                  </ul>
                </div>
                
                <button 
                  onClick={() => alert(recipe.instructions.join('\n\n'))}
                  className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-medium rounded-lg transition-colors"
                >
                  View Instructions
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {recipes.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-48 md:h-64 text-slate-400">
             <svg className="w-12 h-12 md:w-16 md:h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
             <p className="text-sm md:text-base">No recipes yet. Enter your ingredients to start cooking!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BudgetBites;
