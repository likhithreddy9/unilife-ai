
import { LeaderboardEntry, UserProfile, Quest, UserStats } from "../types";

const STORAGE_KEY_USERS = 'unilife_users_db_v1';
const STORAGE_KEY_SESSION = 'unilife_active_session_v1';
const STORAGE_KEY_COMPETITORS = 'unilife_gamification_competitors_v2';

// Level definitions
export const LEVEL_THRESHOLDS = [
  { level: 1, xp: 0, title: "Freshman" },
  { level: 2, xp: 100, title: "Sophomore" },
  { level: 3, xp: 300, title: "Junior" },
  { level: 4, xp: 600, title: "Senior" },
  { level: 5, xp: 1000, title: "Grad Student" },
  { level: 6, xp: 1500, title: "PhD Candidate" },
  { level: 7, xp: 2200, title: "Professor" },
  { level: 8, xp: 3000, title: "Dean" },
  { level: 9, xp: 4000, title: "Legend" },
];

const STREAK_MILESTONES = [
  { days: 3, reward: "Bronze Badge 🥉 + 100 XP" },
  { days: 7, reward: "Silver Badge 🥈 + 300 XP" },
  { days: 14, reward: "Gold Badge 🥇 + 1000 XP" },
  { days: 30, reward: "Diamond Badge 💎 + 5000 XP" },
  { days: 100, reward: "Titan Badge 🏆 + Lifetime Pro Status" }
];

const DEFAULT_STATS: UserStats = {
  quizzesCompleted: 0,
  correctAnswers: 0,
  tasksOrganized: 0,
  toolsDiscovered: 0,
  codingProblemsSolved: 0
};

const DEFAULT_PROFILE: UserProfile = {
  name: "Student",
  xp: 0,
  level: 1,
  levelTitle: "Freshman",
  streak: 1,
  streakFreezes: 1, // Start with 1 freeze
  lastLogin: new Date().toISOString().split('T')[0],
  badges: [],
  completedQuests: [],
  hasOnboarded: false,
  stats: DEFAULT_STATS
};

interface UserAccount {
  email: string;
  passwordHash: string; // Storing hashed password for basic security simulation
  profile: UserProfile;
}

// Mock Daily Quests
export const DAILY_QUESTS: Quest[] = [
  { id: 'q_login', title: 'Daily Check-in', xpReward: 10, icon: '📅', isCompleted: false, actionType: 'LOGIN' },
  { id: 'q_quiz', title: 'Complete a Quiz', xpReward: 50, icon: '📝', isCompleted: false, actionType: 'QUIZ' },
  { id: 'q_task', title: 'Prioritize Tasks', xpReward: 30, icon: '✅', isCompleted: false, actionType: 'TASK' },
  { id: 'q_finance', title: 'Track an Expense', xpReward: 25, icon: '💰', isCompleted: false, actionType: 'EXPLORE' }, // Re-purposed actionType for general tracking
];

// XP Values for various actions
export const XP_VALUES = {
  ADD_TRANSACTION: 15,
  COMPLETE_MISSION: 50,
  GENERATE_RECIPE: 20,
  FIND_PRODUCT: 10,
  GENERATE_ROADMAP: 40,
  MOCK_INTERVIEW: 30,
  GENERATE_EMAIL: 15,
  GENERATE_OUTLINE: 25,
  POLISH_NOTES: 20,
  GET_SOCIAL_TIP: 20,
  READ_RESOURCE: 10,
  SOLVE_CODE_PROBLEM: 50
};

class GamificationService {
  private users: Record<string, UserAccount> = {};
  private currentUserEmail: string | null = null;
  private profile: UserProfile;
  private competitors: LeaderboardEntry[];
  private listeners: Function[] = [];

  constructor() {
    this.users = this.loadUsers();
    this.competitors = this.loadCompetitors();
    
    // Check for active session
    const sessionEmail = localStorage.getItem(STORAGE_KEY_SESSION);
    if (sessionEmail && this.users[sessionEmail]) {
      this.currentUserEmail = sessionEmail;
      this.profile = this.users[sessionEmail].profile;
      // Ensure streakFreezes exists for existing users
      if (this.profile.streakFreezes === undefined) {
        this.profile.streakFreezes = 1;
      }
    } else {
      this.profile = { ...DEFAULT_PROFILE }; // Empty default profile for non-authed state
    }
  }

  // --- AUTHENTICATION METHODS ---

  private loadUsers(): Record<string, UserAccount> {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_USERS);
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      return {};
    }
  }

  private hashPassword(password: string): string {
    // Simple mock hash (Base64) to demonstrate secure storage concepts
    // In production, use a real hashing library like bcrypt
    try {
        return btoa(password);
    } catch (e) {
        return password; // Fallback for special chars
    }
  }

  public isAuthenticated(): boolean {
    return !!this.currentUserEmail;
  }

  public signup(name: string, email: string, password: string): { success: boolean, message?: string } {
    if (this.users[email]) {
      return { success: false, message: 'Email already registered.' };
    }

    const newProfile: UserProfile = {
      ...DEFAULT_PROFILE,
      name: name,
      hasOnboarded: true,
      lastLogin: new Date().toISOString().split('T')[0]
    };

    this.users[email] = {
      email,
      passwordHash: this.hashPassword(password),
      profile: newProfile
    };

    this.saveUsers();
    return this.login(email, password); // Auto login after signup
  }

  public login(email: string, password: string): { success: boolean, message?: string } {
    const user = this.users[email];
    if (user && user.passwordHash === this.hashPassword(password)) {
      this.currentUserEmail = email;
      this.profile = user.profile;
      if (this.profile.streakFreezes === undefined) this.profile.streakFreezes = 1;
      
      localStorage.setItem(STORAGE_KEY_SESSION, email);
      this.checkStreak(); // Check streak on login
      this.notifyListeners();
      return { success: true };
    }
    return { success: false, message: 'Invalid credentials.' };
  }

  public logout() {
    this.currentUserEmail = null;
    this.profile = { ...DEFAULT_PROFILE };
    localStorage.removeItem(STORAGE_KEY_SESSION);
    this.notifyListeners();
  }

  // --- DATA PERSISTENCE ---

  private saveUsers() {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(this.users));
  }

  private saveCompetitors() {
    localStorage.setItem(STORAGE_KEY_COMPETITORS, JSON.stringify(this.competitors));
  }

  private saveData() {
    if (this.currentUserEmail && this.users[this.currentUserEmail]) {
      this.users[this.currentUserEmail].profile = this.profile;
      this.saveUsers();
    }
    this.notifyListeners();
  }

  private loadCompetitors(): LeaderboardEntry[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_COMPETITORS);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }

  // --- GAMIFICATION LOGIC ---

  public subscribe(listener: Function) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(l => l(this.profile));
  }

  public getProfile(): UserProfile {
    return { ...this.profile };
  }

  public getLevelProgress(): number {
    const currentLvl = LEVEL_THRESHOLDS.find(l => l.level === this.profile.level) || LEVEL_THRESHOLDS[0];
    const nextLvl = LEVEL_THRESHOLDS.find(l => l.level === this.profile.level + 1);
    
    if (!nextLvl) return 100;

    const xpNeeded = nextLvl.xp - currentLvl.xp;
    const xpGained = this.profile.xp - currentLvl.xp;
    return Math.min(100, Math.max(0, (xpGained / xpNeeded) * 100));
  }

  public getNextLevelXp(): number {
    const nextLvl = LEVEL_THRESHOLDS.find(l => l.level === this.profile.level + 1);
    return nextLvl ? nextLvl.xp - this.profile.xp : 0;
  }

  public getStreakInfo() {
    const current = this.profile.streak;
    const next = STREAK_MILESTONES.find(m => m.days > current) || STREAK_MILESTONES[STREAK_MILESTONES.length - 1];
    
    if (current >= STREAK_MILESTONES[STREAK_MILESTONES.length - 1].days) {
        return {
            current,
            target: current,
            reward: "Max Streak Rewards Unlocked!",
            progress: 100
        }
    }

    const progress = Math.min(100, (current / next.days) * 100);

    return {
      current,
      target: next.days,
      reward: next.reward,
      progress
    };
  }

  public checkStreak(): boolean {
    if (!this.currentUserEmail) return false;

    const today = new Date().toISOString().split('T')[0];
    const lastLogin = this.profile.lastLogin;
    let streakIncreased = false;

    if (today !== lastLogin) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      
      if (lastLogin === yesterday) {
        this.profile.streak += 1;
        streakIncreased = true;
      } else {
        // Missed a day logic
        if (this.profile.streakFreezes > 0) {
          // Use freeze to save streak
          this.profile.streakFreezes -= 1;
          // Streak stays same, doesn't increment but doesn't reset
        } else {
          // No freezes left, reset
          this.profile.streak = 1;
        }
      }
      
      // Reset daily quests
      this.profile.completedQuests = [];
      this.profile.lastLogin = today;
      
      this.saveData();
    }
    return streakIncreased;
  }

  public addXp(amount: number) {
    if (!this.currentUserEmail) return;
    if (amount <= 0) return;
    this.profile.xp += amount;
    
    // Check Level Up
    const nextLvl = LEVEL_THRESHOLDS.find(l => l.level === this.profile.level + 1);
    if (nextLvl && this.profile.xp >= nextLvl.xp) {
      this.profile.level = nextLvl.level;
      this.profile.levelTitle = nextLvl.title;
    }

    // Award streak freeze for activity if haven't earned one today (limited to 1 bonus per day logic via quest or random)
    // For simplicity based on prompt: "if user completes any task... he gets 'streak freeze'"
    // We'll limit max freezes to 3 to prevent abuse, and award 1 if they don't have max.
    if (this.profile.streakFreezes < 3 && Math.random() > 0.7) {
       this.profile.streakFreezes += 1;
    }

    // Simulate competitor activity
    if (this.competitors.length > 0) {
      this.competitors = this.competitors.map(comp => {
        if (Math.random() > 0.3) {
          const variance = (Math.random() * 1.0) + 0.5; 
          const compGain = Math.floor(amount * variance);
          return { ...comp, xp: comp.xp + compGain };
        }
        return comp;
      });
      this.saveCompetitors();
    }

    this.saveData();
  }

  public completeQuest(questId: string) {
    if (!this.currentUserEmail) return;
    if (this.profile.completedQuests.includes(questId)) return;

    const quest = DAILY_QUESTS.find(q => q.id === questId);
    if (quest) {
      this.profile.completedQuests.push(questId);
      this.addXp(quest.xpReward);
      // Guarantee a freeze on completing a daily quest
      if (this.profile.streakFreezes < 3) {
        this.profile.streakFreezes += 1;
      }
    }
  }

  public updateStat(key: keyof UserStats, value: number) {
    if (!this.currentUserEmail) return;
    if (!this.profile.stats) {
      this.profile.stats = { ...DEFAULT_STATS };
    }
    this.profile.stats[key] = (this.profile.stats[key] || 0) + value;
    this.saveData();
  }

  public getDailyQuests(): Quest[] {
    return DAILY_QUESTS.map(q => ({
      ...q,
      isCompleted: this.profile.completedQuests.includes(q.id)
    }));
  }

  public getLeaderboard(): LeaderboardEntry[] {
    if (!this.currentUserEmail) return [];

    const userEntry: LeaderboardEntry = {
      id: 'user',
      name: this.profile.name,
      xp: this.profile.xp,
      avatar: "🎓",
      isUser: true,
      streak: this.profile.streak
    };

    return [...this.competitors, userEntry].sort((a, b) => b.xp - a.xp);
  }
}

export const gamification = new GamificationService();
