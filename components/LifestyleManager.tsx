
import React, { useState, useEffect, useRef } from 'react';
import { generateRecipes, searchMarketplace } from '../services/geminiService';
import { Recipe, MarketplaceItem, CartItem } from '../types';
import { gamification, XP_VALUES } from '../services/gamificationService';

// Helper component for loading images with fallback
const ProductImage = ({ src, alt, fallbackIcon, className, fitMode = 'cover' }: { src?: string, alt: string, fallbackIcon: string, className?: string, fitMode?: 'cover' | 'contain' }) => {
  const [error, setError] = useState(!src);
  
  useEffect(() => {
    setError(!src);
  }, [src]);
  
  if (error || !src) {
    return (
      <div className={`flex items-center justify-center bg-opacity-10 ${className}`}>
        <span className="text-6xl transition-transform duration-500 group-hover:scale-110">{fallbackIcon}</span>
      </div>
    );
  }
  
  return (
    <img 
      src={src} 
      alt={alt} 
      className={`w-full h-full object-${fitMode} transition-transform duration-500 group-hover:scale-105 ${className}`}
      onError={() => setError(true)}
    />
  );
};

// Search Predictions Data
const PREDICTIONS: Record<string, string[]> = {
  food: ['Pizza', 'Biryani', 'Burger', 'Sushi', 'Pasta', 'Fried Rice', 'Tacos', 'Sandwich', 'Salad', 'Ice Cream', 'Cake', 'Donuts', 'Momos', 'Shawarma', 'Coffee', 'Boba Tea', 'Burrito', 'Waffles'],
  grocery: ['Milk', 'Bread', 'Eggs', 'Rice', 'Potatoes', 'Onions', 'Tomatoes', 'Chicken', 'Maggi', 'Ramen', 'Yogurt', 'Cheese', 'Butter', 'Shampoo', 'Soap', 'Toothpaste', 'Laundry Detergent', 'Snacks', 'Chips', 'Chocolate'],
  clothing: ['Hoodie', 'Jeans', 'T-Shirt', 'Sneakers', 'Jacket', 'Sweatpants', 'Dress', 'Shorts', 'Socks', 'Backpack', 'Cap', 'Sunglasses', 'Formal Shirt', 'Blazer', 'Running Shoes'],
  gadgets: ['Headphones', 'Earbuds', 'Laptop', 'Phone Case', 'Charger', 'Power Bank', 'Monitor', 'Keyboard', 'Mouse', 'Tablet', 'Smart Watch', 'Speaker', 'HDMI Cable', 'Webcam'],
  housing: ['Desk Lamp', 'BedSheet', 'Pillows', 'Curtains', 'Storage Box', 'Rug', 'Mirror', 'Plant', 'Laundry Basket', 'Chair', 'Desk', 'Trash Can', 'Hangers', 'Extension Cord'],
  commute: ['Bus Ticket', 'Train Ticket', 'Flight', 'Taxi', 'Uber', 'Lyft', 'Bike Rental', 'Metro Pass', 'Suitcase', 'Travel Pillow', 'Backpack']
};

const LifestyleManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'food' | 'grocery' | 'housing' | 'commute' | 'gadgets' | 'clothing'>('food');
  const [showReward, setShowReward] = useState<{show: boolean, xp: number}>({show: false, xp: 0});

  // Food State
  const [ingredients, setIngredients] = useState('');
  const [budget, setBudget] = useState('');
  const [dietary, setDietary] = useState('');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);

  // Marketplace State
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [filterDiscount, setFilterDiscount] = useState(false);
  
  // Predictive Search State
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  
  // Cart & Favorites
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showCart, setShowCart] = useState(false);
  
  // Product Detail Modal State
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);

  // Handle clicks outside search to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    
    if (val.length > 0) {
      const filtered = PREDICTIONS[activeTab].filter(item => 
        item.toLowerCase().includes(val.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 6)); // Limit to 6 suggestions
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    handleMarketplaceSearch(suggestion);
  };

  const handleRecipeSearch = async () => {
    setLoadingRecipes(true);
    setRecipes([]);
    const results = await generateRecipes(ingredients, budget, dietary);
    setRecipes(results);
    setLoadingRecipes(false);
    triggerReward(XP_VALUES.GENERATE_RECIPE);
  };

  const handleMarketplaceSearch = async (overrideQuery?: string) => {
    const q = overrideQuery || query;
    if (!q) return;
    
    setShowSuggestions(false); // Close suggestions on search
    setLoadingSearch(true);
    setItems([]);
    const results = await searchMarketplace(activeTab, q);
    setItems(results);
    setLoadingSearch(false);
    triggerReward(XP_VALUES.FIND_PRODUCT);
  };

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (favorites.includes(id)) {
      setFavorites(favorites.filter(fid => fid !== id));
    } else {
      setFavorites([...favorites, id]);
    }
  };

  const addToCart = (item: MarketplaceItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const existing = cart.find(c => c.id === item.id);
    if (existing) {
      setCart(cart.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
    setShowCart(true);
    triggerReward(5); // Small reward for adding to cart
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(c => c.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(cart.map(c => {
      if (c.id === id) {
        return { ...c, quantity: Math.max(1, c.quantity + delta) };
      }
      return c;
    }));
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      // Remove symbols and commas to parse number correctly
      const price = parseFloat(item.price.replace(/[^0-9.]/g, '')) || 0;
      return total + (price * item.quantity);
    }, 0);
  };

  const getTheme = () => {
    switch(activeTab) {
      case 'food': return { 
        primary: 'bg-orange-500', 
        light: 'bg-orange-50 dark:bg-orange-900/30', 
        text: 'text-orange-600 dark:text-orange-400', 
        border: 'border-orange-200 dark:border-orange-800',
        placeholder: "Search for Pizza, Sushi...",
        title: "Food Delivery",
        icon: '🍔',
        imageFit: 'cover' as const
      };
      case 'grocery': return { 
        primary: 'bg-green-600', 
        light: 'bg-green-50 dark:bg-green-900/30', 
        text: 'text-green-700 dark:text-green-400', 
        border: 'border-green-200 dark:border-green-800',
        placeholder: "Search Milk, Bread, Eggs...",
        title: "Grocery",
        icon: '🥦',
        imageFit: 'contain' as const
      };
      case 'commute': return { 
        primary: 'bg-red-600', 
        light: 'bg-red-50 dark:bg-red-900/30', 
        text: 'text-red-700 dark:text-red-400', 
        border: 'border-red-200 dark:border-red-800',
        placeholder: "Search Bus, Train, Flight...",
        title: "Travel",
        icon: '✈️',
        imageFit: 'cover' as const
      };
      case 'clothing': return { 
        primary: 'bg-pink-600', 
        light: 'bg-pink-50 dark:bg-pink-900/30', 
        text: 'text-pink-600 dark:text-pink-400', 
        border: 'border-pink-200 dark:border-pink-800',
        placeholder: "Search Hoodie, Jeans, Sneakers...",
        title: "Fashion",
        icon: '👕',
        imageFit: 'cover' as const
      };
      case 'gadgets': return { 
        primary: 'bg-slate-800 dark:bg-slate-700', 
        light: 'bg-slate-100 dark:bg-slate-700/50', 
        text: 'text-slate-800 dark:text-slate-300', 
        border: 'border-slate-200 dark:border-slate-600',
        placeholder: "Search Headphones, Laptop...",
        title: "Electronics",
        icon: '💻',
        imageFit: 'contain' as const
      };
      case 'housing': return { 
        primary: 'bg-blue-600', 
        light: 'bg-blue-50 dark:bg-blue-900/30', 
        text: 'text-blue-700 dark:text-blue-400', 
        border: 'border-blue-200 dark:border-blue-800',
        placeholder: "Search Desk, Lamp, Sheets...",
        title: "Housing",
        icon: '🏠',
        imageFit: 'cover' as const
      };
      default: return { primary: 'bg-slate-800', light: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-200', placeholder: "Search...", title: "Shop", icon: '🛍️', imageFit: 'cover' as const };
    }
  };

  const theme = getTheme();

  return (
    <div className="h-full flex flex-col relative bg-slate-50 dark:bg-slate-900 overflow-hidden">
      {/* Reward Overlay */}
      {showReward.show && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-indigo-100 dark:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-100 px-6 py-2 rounded-full font-bold shadow-lg animate-bounce-in flex items-center gap-2">
          <span>⚡</span> +{showReward.xp} XP Earned!
        </div>
      )}

      {/* Top Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
           <h2 className="text-2xl font-bold text-slate-800 dark:text-white hidden md:block">Lifestyle Lounge</h2>
           <div className="h-6 w-px bg-slate-300 dark:bg-slate-600 hidden md:block"></div>
           {/* Tab Selector Pill */}
           <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-xl overflow-x-auto no-scrollbar max-w-[200px] md:max-w-none">
              {[
                { id: 'food', emoji: '🍔' },
                { id: 'grocery', emoji: '🥦' },
                { id: 'clothing', emoji: '👕' },
                { id: 'gadgets', emoji: '💻' },
                { id: 'housing', emoji: '🏠' },
                { id: 'commute', emoji: '✈️' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => { setActiveTab(t.id as any); setItems([]); setQuery(''); setSuggestions([]); }}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all ${activeTab === t.id ? 'bg-white dark:bg-slate-600 shadow-sm scale-105' : 'text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                >
                  {t.emoji}
                </button>
              ))}
           </div>
        </div>

        <div className="flex items-center gap-4">
           {/* Search Bar Container */}
           <div ref={searchContainerRef} className={`hidden md:block relative z-50`}>
             <div className={`flex items-center ${theme.light} px-4 py-2 rounded-full border ${theme.border} w-64 lg:w-96 transition-colors`}>
                <svg className={`w-5 h-5 ${theme.text} opacity-50 mr-2`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input 
                  type="text" 
                  value={query}
                  onChange={handleInputChange}
                  onFocus={() => { if(query) setShowSuggestions(true); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleMarketplaceSearch()}
                  placeholder={theme.placeholder}
                  className="bg-transparent border-none focus:outline-none text-sm w-full placeholder-slate-400 dark:placeholder-slate-500 text-slate-900 dark:text-white"
                />
             </div>
             
             {/* Suggestions Dropdown */}
             {showSuggestions && suggestions.length > 0 && (
               <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden animate-fade-in">
                  <ul>
                    {suggestions.map((s, idx) => (
                      <li 
                        key={idx}
                        onClick={() => handleSuggestionClick(s)}
                        className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200 transition-colors border-b border-slate-50 dark:border-slate-700 last:border-0"
                      >
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        <span dangerouslySetInnerHTML={{ __html: s.replace(new RegExp(query, "gi"), (match) => `<span class="font-bold text-slate-900 dark:text-white">${match}</span>`) }} />
                      </li>
                    ))}
                  </ul>
               </div>
             )}
           </div>

           {/* Actions */}
           <div className="flex gap-2">
             <button className="p-2 text-slate-400 hover:text-rose-500 transition-colors relative">
               <svg className="w-6 h-6" fill={favorites.length > 0 ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
               {favorites.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full"></span>}
             </button>
             <button 
               onClick={() => setShowCart(true)}
               className={`p-2 ${cart.length > 0 ? theme.text : 'text-slate-400'} hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors relative`}
             >
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
               {cart.length > 0 && (
                 <span className={`absolute top-0 right-0 ${theme.primary} text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white dark:border-slate-800`}>
                   {cart.reduce((a, b) => a + b.quantity, 0)}
                 </span>
               )}
             </button>
           </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
        
        {/* Filters Sidebar (Desktop) */}
        <aside className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 p-6 hidden md:flex flex-col overflow-y-auto">
           <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
             <span className="text-xl">{theme.icon}</span> Filters
           </h3>
           
           <div className="space-y-6">
             <div>
               <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Sort By</h4>
               <div className="space-y-2">
                 {['Relevance', 'Price: Low to High', 'Rating', 'Delivery Time'].map(f => (
                   <label key={f} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-white">
                     <input type="radio" name="sort" className={`text-${theme.text.split('-')[1]}-600 focus:ring-${theme.text.split('-')[1]}-500`} />
                     {f}
                   </label>
                 ))}
               </div>
             </div>

             <div>
               <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Special</h4>
               <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
                 <input 
                   type="checkbox" 
                   checked={filterDiscount} 
                   onChange={() => setFilterDiscount(!filterDiscount)}
                   className="rounded text-indigo-600" 
                 />
                 <span>Discounts Only</span>
               </label>
               {activeTab === 'food' && (
                 <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer mt-2">
                   <input type="checkbox" className="rounded text-green-600" />
                   <span>Pure Veg</span>
                 </label>
               )}
               {activeTab === 'commute' && (
                 <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer mt-2">
                   <input type="checkbox" className="rounded text-blue-600" />
                   <span>Non-Stop Flights</span>
                 </label>
               )}
             </div>

             {/* Quick Suggestions based on tab */}
             <div>
               <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Quick Search</h4>
               <div className="flex flex-wrap gap-2">
                  {(activeTab === 'food' ? ['Pizza', 'Biryani', 'Cake', 'Burger'] :
                    activeTab === 'grocery' ? ['Milk', 'Bread', 'Vegetables', 'Snacks'] :
                    activeTab === 'clothing' ? ['Shoes', 'T-Shirts', 'Jeans', 'Watches'] :
                    activeTab === 'gadgets' ? ['Headphones', 'Laptop', 'Phone', 'Cable'] :
                    ['Best Sellers', 'New Arrivals']).map(tag => (
                      <button 
                        key={tag}
                        onClick={() => { setQuery(tag); handleMarketplaceSearch(tag); }}
                        className="px-3 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full text-xs text-slate-600 dark:text-slate-300 transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
               </div>
             </div>
           </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 relative">
          
          {/* Mobile Search (visible only on mobile) */}
          <div className="md:hidden mb-4 relative z-40" ref={searchContainerRef}>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={query}
                onChange={handleInputChange}
                onFocus={() => { if(query) setShowSuggestions(true); }}
                onKeyDown={(e) => e.key === 'Enter' && handleMarketplaceSearch()}
                placeholder={theme.placeholder}
                className={`flex-1 px-4 py-2 border ${theme.border} rounded-xl focus:outline-none shadow-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white`}
              />
              <button 
                onClick={() => handleMarketplaceSearch()}
                className={`${theme.primary} text-white px-4 rounded-xl shadow-sm`}
              >
                🔍
              </button>
            </div>
             {/* Suggestions Dropdown Mobile */}
             {showSuggestions && suggestions.length > 0 && (
               <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden animate-fade-in z-50">
                  <ul>
                    {suggestions.map((s, idx) => (
                      <li 
                        key={idx}
                        onClick={() => handleSuggestionClick(s)}
                        className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200 transition-colors border-b border-slate-50 dark:border-slate-700 last:border-0"
                      >
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        <span dangerouslySetInnerHTML={{ __html: s.replace(new RegExp(query, "gi"), (match) => `<span class="font-bold text-slate-900 dark:text-white">${match}</span>`) }} />
                      </li>
                    ))}
                  </ul>
               </div>
             )}
          </div>

          {/* Recipe Generator for Food Tab */}
          {activeTab === 'food' && (
            <div className="mb-8">
              <button 
                onClick={() => document.getElementById('budget-bites')?.classList.toggle('hidden')}
                className="flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 mb-4"
              >
                <span>✨</span> Toggle Budget Bites (Recipe Generator)
              </button>
              <div id="budget-bites" className="hidden bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 p-6 rounded-2xl border border-orange-100 dark:border-orange-800 mb-8">
                  <h3 className="font-bold text-lg mb-4 text-orange-900 dark:text-orange-200 flex items-center gap-2">
                    <span className="text-2xl">🍳</span> Recipe Generator
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input type="text" placeholder="Ingredients" value={ingredients} onChange={(e) => setIngredients(e.target.value)} className="w-full px-4 py-2 border border-orange-200 dark:border-orange-800 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500" />
                    <input type="text" placeholder="Constraints (e.g. ₹200)" value={budget} onChange={(e) => setBudget(e.target.value)} className="w-full px-4 py-2 border border-orange-200 dark:border-orange-800 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500" />
                    <button onClick={handleRecipeSearch} disabled={loadingRecipes} className="bg-orange-600 text-white font-bold rounded-lg">{loadingRecipes ? 'Cooking...' : 'Find Recipes'}</button>
                  </div>
                  {recipes.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                      {recipes.map((r, i) => (
                        <div key={i} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-orange-100 dark:border-orange-900/50">
                          <h4 className="font-bold text-slate-800 dark:text-white">{r.name}</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{r.description}</p>
                          <button onClick={() => alert(r.instructions.join('\n'))} className="text-xs font-bold text-orange-600 dark:text-orange-400 mt-2">View Recipe</button>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            </div>
          )}

          {/* Results Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
             {items.filter(i => !filterDiscount || i.discount).map((item, idx) => (
               <div 
                 key={idx} 
                 onClick={() => setSelectedItem(item)}
                 className="group bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col h-full relative"
               >
                 {/* Favorite Button */}
                 <button 
                   onClick={(e) => toggleFavorite(item.id, e)}
                   className="absolute top-3 right-3 z-10 p-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full shadow-sm hover:scale-110 transition-transform"
                 >
                   <svg className={`w-5 h-5 ${favorites.includes(item.id) ? 'text-rose-500 fill-current' : 'text-slate-400'}`} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                 </button>

                 {/* Discount Tag */}
                 {item.discount && (
                   <div className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm z-10">
                     {item.discount}
                   </div>
                 )}

                 {/* Image Area with ProductImage Component */}
                 <div className={`h-48 ${theme.light} relative overflow-hidden group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors`}>
                    <ProductImage 
                      src={item.imageUrl} 
                      alt={item.name} 
                      fallbackIcon={theme.icon}
                      fitMode={theme.imageFit}
                      className="absolute inset-0"
                    />
                    
                    {item.delivery && (
                      <div className="absolute bottom-2 left-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1 shadow-sm z-10">
                        <span>⚡</span> {item.delivery}
                      </div>
                    )}
                 </div>

                 <div className="p-4 flex-1 flex flex-col">
                   <div className="flex justify-between items-start mb-1">
                     <p className="text-xs font-bold text-slate-400 uppercase">{item.vendor}</p>
                     <div className="flex items-center bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded text-[10px] font-bold text-green-700 dark:text-green-300">
                       {item.rating} ★
                     </div>
                   </div>
                   
                   <h4 className="font-bold text-slate-900 dark:text-white leading-tight line-clamp-2 mb-1">{item.name}</h4>
                   <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mb-3">{item.description}</p>
                   
                   <div className="mt-auto flex items-center justify-between">
                     <span className="text-lg font-bold text-slate-900 dark:text-white">{item.price}</span>
                     <button 
                       onClick={(e) => addToCart(item, e)}
                       className={`px-4 py-2 ${theme.primary} text-white text-xs font-bold rounded-lg hover:brightness-110 transition-all shadow-sm active:scale-95`}
                     >
                       ADD +
                     </button>
                   </div>
                 </div>
               </div>
             ))}

             {loadingSearch && [1,2,3,4].map(i => (
               <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 h-80 p-4 animate-pulse">
                 <div className="bg-slate-100 dark:bg-slate-700 h-40 rounded-xl mb-4"></div>
                 <div className="bg-slate-100 dark:bg-slate-700 h-4 w-3/4 rounded mb-2"></div>
                 <div className="bg-slate-100 dark:bg-slate-700 h-4 w-1/2 rounded mb-4"></div>
                 <div className="bg-slate-100 dark:bg-slate-700 h-8 w-full rounded mt-auto"></div>
               </div>
             ))}
             
             {!loadingSearch && items.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400 opacity-60">
                   <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-4xl grayscale">
                     {theme.icon}
                   </div>
                   <p className="text-lg font-medium">Search for {activeTab}...</p>
                   <p className="text-sm">Try "{theme.placeholder}"</p>
                </div>
             )}
          </div>
        </main>
      </div>

      {/* Cart Drawer */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowCart(false)}></div>
          <div className="relative w-full max-w-md bg-white dark:bg-slate-800 h-full shadow-2xl flex flex-col animate-slide-in-right">
             <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
               <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                 <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                 Your Cart ({cart.reduce((a, b) => a + b.quantity, 0)})
               </h3>
               <button onClick={() => setShowCart(false)} className="text-slate-400 hover:text-slate-600">
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
             </div>
             
             <div className="flex-1 overflow-y-auto p-5 space-y-4">
               {cart.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center text-slate-400">
                   <span className="text-6xl mb-4 grayscale opacity-50">🛒</span>
                   <p>Your cart is empty.</p>
                   <button onClick={() => setShowCart(false)} className="mt-4 px-6 py-2 bg-slate-900 dark:bg-slate-700 text-white rounded-lg text-sm font-bold">Start Shopping</button>
                 </div>
               ) : (
                 cart.map(item => (
                   <div key={item.id} className="flex gap-4 items-start border-b border-slate-50 dark:border-slate-700 pb-4 last:border-0">
                     <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center text-2xl shrink-0 overflow-hidden">
                       <ProductImage src={item.imageUrl} alt={item.name} fallbackIcon={item.category?.includes('Food') ? '🍔' : '🛍️'} fitMode="cover" />
                     </div>
                     <div className="flex-1">
                       <h4 className="font-bold text-slate-800 dark:text-white text-sm line-clamp-2">{item.name}</h4>
                       <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{item.price} • {item.vendor}</p>
                       <div className="flex items-center gap-3">
                         <div className="flex items-center border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden">
                           <button onClick={() => updateQuantity(item.id, -1)} className="px-2 py-1 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400">-</button>
                           <span className="px-2 py-1 text-xs font-bold text-slate-800 dark:text-white">{item.quantity}</span>
                           <button onClick={() => updateQuantity(item.id, 1)} className="px-2 py-1 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400">+</button>
                         </div>
                         <button onClick={() => removeFromCart(item.id)} className="text-xs text-rose-500 hover:underline">Remove</button>
                       </div>
                     </div>
                     <div className="text-right">
                       <p className="font-bold text-slate-900 dark:text-white">₹{(parseFloat(item.price.replace(/[^0-9.]/g, '')) * item.quantity).toFixed(2)}</p>
                     </div>
                   </div>
                 ))
               )}
             </div>
             
             {cart.length > 0 && (
               <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                 <div className="flex justify-between items-center mb-2">
                   <span className="text-slate-500 dark:text-slate-400 text-sm">Subtotal</span>
                   <span className="font-bold text-slate-900 dark:text-white">₹{getCartTotal().toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between items-center mb-6">
                   <span className="text-slate-500 dark:text-slate-400 text-sm">Delivery</span>
                   <span className="font-bold text-green-600">Free</span>
                 </div>
                 <button className="w-full py-4 bg-slate-900 dark:bg-slate-700 text-white font-bold rounded-xl hover:bg-slate-800 dark:hover:bg-slate-600 transition-all shadow-lg flex justify-between px-6">
                   <span>Checkout</span>
                   <span>₹{getCartTotal().toFixed(2)}</span>
                 </button>
                 <p className="text-[10px] text-center text-slate-400 mt-3">Secure checkout powered by Stripe (Demo)</p>
               </div>
             )}
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedItem(null)}>
           <div className="bg-white dark:bg-slate-800 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row" onClick={e => e.stopPropagation()}>
              
              {/* Image Side */}
              <div className={`w-full md:w-1/2 ${theme.light} flex items-center justify-center p-12 relative border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-700 overflow-hidden`}>
                  <ProductImage 
                    src={selectedItem.imageUrl} 
                    alt={selectedItem.name} 
                    fallbackIcon={theme.icon}
                    fitMode={theme.imageFit}
                    className="absolute inset-0"
                  />
                  <div className="absolute top-4 left-4 bg-white dark:bg-slate-700 px-3 py-1.5 rounded-full text-xs font-bold border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300 z-10">
                    {selectedItem.vendor}
                  </div>
              </div>

              {/* Content Side */}
              <div className="w-full md:w-1/2 p-8 md:p-10 flex flex-col overflow-y-auto">
                 <div className="flex justify-between items-start mb-2">
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white leading-tight">{selectedItem.name}</h2>
                    <button onClick={() => setSelectedItem(null)} className="text-slate-400 hover:text-slate-600 p-1">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                 </div>

                 <div className="flex items-center gap-2 mb-6">
                    <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{selectedItem.price}</span>
                    <div className="h-4 w-px bg-slate-300 mx-2"></div>
                    <div className="flex text-amber-400 text-sm">
                       {'★'.repeat(Math.round(selectedItem.rating))}
                       <span className="text-slate-500 dark:text-slate-400 ml-1">({selectedItem.rating} Rating)</span>
                    </div>
                 </div>

                 <div className="space-y-6 flex-1">
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</h4>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{selectedItem.description}</p>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Key Features</h4>
                      <ul className="space-y-2">
                        {selectedItem.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                            <span className={`${theme.text.replace('text-', 'text-')} mt-0.5`}>✓</span> {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                 </div>

                 <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700 flex gap-4">
                    <button 
                      onClick={(e) => { addToCart(selectedItem, e); setSelectedItem(null); }}
                      className={`flex-1 py-4 ${theme.primary} text-white font-bold rounded-xl hover:brightness-110 transition-all shadow-lg flex items-center justify-center gap-2`}
                    >
                      Add to Cart
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    </button>
                    <button 
                       onClick={() => window.open(selectedItem.link, '_blank')}
                       className="px-6 py-4 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      Visit Store
                    </button>
                 </div>
                 <p className="text-xs text-center text-slate-400 mt-3">Prices and availability subject to change on {selectedItem.vendor}</p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default LifestyleManager;
