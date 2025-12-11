
export enum AppView {
  DASHBOARD = 'DASHBOARD',
  PLAYBOOK = 'PLAYBOOK',
  STUDY = 'STUDY',
  TASKS = 'TASKS',
  EXTERNAL_TOOLS = 'EXTERNAL_TOOLS',
  CAREER = 'CAREER',
  AUTOMATION = 'AUTOMATION',
  FINANCE = 'FINANCE',
  LIFESTYLE = 'LIFESTYLE',
  WELLNESS = 'WELLNESS',
  SOCIAL = 'SOCIAL'
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

// Quiz Types
export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswerIndex: number; // 0-3
  explanation: string;
}

export interface QuizData {
  title: string;
  questions: QuizQuestion[];
}

// Study Resources Types
export interface StudyResource {
  title: string;
  type: 'Video' | 'Book' | 'Article' | 'Course';
  description: string;
  link?: string;
}

// Recipe Types
export interface Ingredient {
  name: string;
  amount: string;
  unit?: string;
}

export interface Recipe {
  name: string;
  description: string;
  ingredients: Ingredient[];
  instructions: string[];
  estimatedCost: string;
  prepTime: string;
  calories: string;
}

// Task Types
export enum TaskPriority {
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low'
}

export interface Task {
  id: string;
  title: string;
  priority: TaskPriority;
  deadline?: string;
  estimatedTime?: string;
  reasoning?: string;
}

// Career Types
export interface CareerRoadmap {
  role: string;
  summary: string;
  steps: Array<{
    title: string;
    duration: string;
    description: string;
    skills: string[];
    resources: Array<{ name: string; url: string }>;
  }>;
}

// Academic Roadmap (Branch Specific)
export interface AcademicYear {
  year: string; // "Year 1"
  title: string; // "Foundation & Core"
  description: string;
  subjects: string[]; // Specific subjects for that branch
  skills: string[]; // Practical skills
  resources: Array<{ name: string; url: string; type: string }>;
}

export interface JobOpportunity {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary?: string;
  link: string;
  platform: string;
  postedAt: string;
}

// Email Types
export interface EmailDraft {
  subject: string;
  body: string;
}

// Search Types
export interface SearchSource {
  title: string;
  url: string;
}

export interface SearchResult {
  text: string;
  sources: SearchSource[];
}

// Marketplace Types
export interface MarketplaceItem {
  id: string;
  name: string;
  price: string;
  vendor: string;
  rating: number;
  description: string;
  features: string[];
  link: string;
  imageUrl: string;
  delivery?: string;
  discount?: string;
  category?: string;
}

export interface CartItem extends MarketplaceItem {
  quantity: number;
}

// Tool Types
export interface Tool {
  name: string;
  description: string;
  url: string;
  category: string;
  icon: string;
  color: string;
  tag?: string;
}

// Dashboard Update
export interface DashboardUpdate {
  id: string;
  category: string;
  title: string;
  description: string;
  link: string;
  timeAgo: string;
}

// Dynamic Resource (Playbook)
export interface DynamicResource {
  id: string;
  title: string;
  url: string;
  type: string;
  source: string;
  description: string;
}

// Workout Routine
export interface WorkoutRoutine {
  title: string;
  difficulty: string;
  estimatedTime: string;
  exercises: Array<{
    name: string;
    durationOrReps: string;
    instructions: string;
  }>;
}

// Campus Item
export interface CampusItem {
  id: string;
  title: string;
  description: string;
  link: string;
  date?: string;
  type: string;
}

// Transaction
export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
}

// Gamification Types
export interface UserStats {
  quizzesCompleted: number;
  correctAnswers: number;
  tasksOrganized: number;
  toolsDiscovered: number;
  codingProblemsSolved?: number;
}

export interface Quest {
  id: string;
  title: string;
  xpReward: number;
  icon: string;
  isCompleted: boolean;
  actionType: string;
}

export interface UserProfile {
  name: string;
  xp: number;
  level: number;
  levelTitle: string;
  streak: number;
  streakFreezes: number;
  lastLogin: string;
  badges: string[];
  completedQuests: string[];
  hasOnboarded: boolean;
  stats: UserStats;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  xp: number;
  avatar: string;
  isUser: boolean;
  streak?: number;
}

// --- CODING DOJO TYPES ---
export type ProgrammingLanguage = 'Python' | 'JavaScript' | 'Java' | 'C++' | 'SQL';
export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface CodingProblem {
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  language: ProgrammingLanguage;
  starterCode: string;
  testCases: Array<{input: string, output: string}>;
  solution?: string;
  hints?: string[];
}

export interface CodeEvaluation {
  passed: boolean;
  feedback: string;
  output: string;
  xpEarned?: number;
}
