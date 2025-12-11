
import { GoogleGenAI } from "@google/genai";
import {
  CampusItem, Recipe, Task, CareerRoadmap, JobOpportunity,
  CodingProblem, CodeEvaluation, DashboardUpdate, Tool,
  WorkoutRoutine, DynamicResource, AcademicYear, MarketplaceItem,
  QuizData, ProgrammingLanguage, Difficulty
} from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const parseJSONFromText = (text: string): any => {
  try {
    let cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const firstBrace = cleanText.indexOf('{');
    const firstBracket = cleanText.indexOf('[');
    
    let start = 0;
    if (firstBrace > -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
        start = firstBrace;
    } else if (firstBracket > -1) {
        start = firstBracket;
    }
    
    const lastBrace = cleanText.lastIndexOf('}');
    const lastBracket = cleanText.lastIndexOf(']');
    
    let end = cleanText.length;
    if (lastBrace > -1 && (lastBracket === -1 || lastBrace > lastBracket)) {
        end = lastBrace + 1;
    } else if (lastBracket > -1) {
        end = lastBracket + 1;
    }
    
    cleanText = cleanText.substring(start, end);
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("Failed to parse JSON", e);
    return null;
  }
};

const ensureUrl = (url: string | undefined, query: string): string => {
  if (url && (url.startsWith('http') || url.startsWith('www'))) return url;
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
};

export const generateStudyChat = async (history: any[], message: string): Promise<string> => {
  const model = 'gemini-2.5-flash';
  const chat = ai.chats.create({
      model,
      config: {
          systemInstruction: "You are a helpful and encouraging student tutor. Keep answers concise but informative.",
      },
      history: history
  });
  const result = await chat.sendMessage({ message });
  return result.text || "I'm having trouble thinking right now.";
};

export const generateQuiz = async (topic: string): Promise<QuizData | null> => {
  const prompt = `Generate a quiz about "${topic}".
  Return JSON with:
  {
    "title": "Quiz Title",
    "questions": [
      {
        "id": 1,
        "question": "Question text",
        "options": ["A", "B", "C", "D"],
        "correctAnswerIndex": 0,
        "explanation": "Why it is correct"
      }
    ]
  }
  Generate 5 questions.`;
  
  const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
  });
  
  return parseJSONFromText(response.text);
};

export const generateRecipes = async (ingredients: string, budget: string, dietary: string): Promise<Recipe[]> => {
    const prompt = `Suggest 3 recipes using ingredients: ${ingredients}. Budget constraint: ${budget}. Dietary: ${dietary}.
    Return JSON array of recipes: [{name, description, ingredients: [{name, amount}], instructions: [steps], estimatedCost, prepTime, calories}]`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });
    
    const res = parseJSONFromText(response.text);
    return Array.isArray(res) ? res : [];
};

export const prioritizeTasks = async (input: string): Promise<Task[]> => {
    const prompt = `Analyze these tasks and prioritize them (High, Medium, Low).
    Input: "${input}"
    Return JSON array: [{id: "1", title, priority, deadline, estimatedTime, reasoning}]`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });
    
    const res = parseJSONFromText(response.text);
    return Array.isArray(res) ? res : [];
};

export const getDashboardUpdates = async (): Promise<DashboardUpdate[]> => {
    const prompt = `Find 4 recent (last week) trending news, tools, or opportunities relevant to college students (Tech, Career, Life).
    Use Google Search.
    Return JSON array: [{id, category: "Job"|"Tool"|"Product"|"News", title, description, link, timeAgo}]`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { tools: [{ googleSearch: {} }] }
    });

    const res = parseJSONFromText(response.text);
    if(Array.isArray(res)) {
        return res.map((item: any, idx: number) => ({
            ...item,
            id: item.id || idx.toString(),
            link: ensureUrl(item.link, item.title)
        }));
    }
    return [];
};

export const generateCareerRoadmap = async (role: string): Promise<CareerRoadmap | null> => {
    const prompt = `Create a step-by-step career roadmap for a "${role}".
    Return JSON: {role, summary, steps: [{title, duration, description, skills: [], resources: [{name, url}]}]}`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });
    
    return parseJSONFromText(response.text);
};

export const generateMockInterviewQuestion = async (role: string, history: any[], currentMessage?: string): Promise<string> => {
    if (!currentMessage && history.length === 0) {
        const prompt = `You are an interviewer for a ${role} position. Ask me a relevant technical or behavioral interview question. Just the question.`;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });
        return response.text || "Tell me about yourself.";
    }

    const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        history: history,
        config: { systemInstruction: `You are an interviewer for a ${role} position. Evaluate the candidate's answer and ask a follow-up or a new question.`}
    });
    
    const msg = currentMessage || "Ready.";
    const result = await chat.sendMessage({ message: msg });
    return result.text || "Let's continue.";
};

export const findStudentJobs = async (query: string, location: string): Promise<JobOpportunity[]> => {
    const prompt = `Find 5 ACTIVE and RECENTLY POSTED (last 7 days) part-time jobs, internships, or gigs for students related to "${query}" in "${location}".
    Use Google Search to find real, live job listings.
    Return JSON array: [{id, title, company, location, type, salary, link, platform, postedAt}]`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { tools: [{ googleSearch: {} }] }
    });
    
    const res = parseJSONFromText(response.text);
    if(Array.isArray(res)) {
        return res.map((item: any, idx: number) => ({
            ...item,
            id: item.id || idx.toString(),
            link: ensureUrl(item.link, item.title)
        }));
    }
    return [];
};

export const generateCodingProblems = async (language: ProgrammingLanguage, difficulty: Difficulty): Promise<CodingProblem[]> => {
    const prompt = `Generate 3 coding problems for ${language} at ${difficulty} level.
    Return JSON array: [{id, title, description, difficulty, language, starterCode, testCases: [{input, output}], solution, hints: []}]`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });
    
    const res = parseJSONFromText(response.text);
    return Array.isArray(res) ? res : [];
};

export const evaluateCode = async (problem: CodingProblem, userCode: string): Promise<CodeEvaluation> => {
    const prompt = `Evaluate this ${problem.language} code for the problem: "${problem.description}".
    User Code:
    ${userCode}
    
    Check against these test cases: ${JSON.stringify(problem.testCases)}.
    Return JSON: {passed: boolean, feedback: string, output: string, xpEarned: number (0 or 50)}`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });
    
    return parseJSONFromText(response.text) || { passed: false, feedback: "Error evaluating", output: "" };
};

export const optimizeResume = async (experience: string, jobDescription: string): Promise<{score: number, feedback: string, optimizedPoints: string[]} | null> => {
    const prompt = `You are an expert Resume Writer and ATS system.
    Task: Analyze the user's rough experience and optimize it for the target Job Description.
    
    User Experience: "${experience}"
    Target Job Description: "${jobDescription}"
    
    Return JSON:
    {
      "score": number (0-100, how well the *optimized* version matches),
      "feedback": "Short advice on missing keywords or skills",
      "optimizedPoints": ["Bullet point 1 (Action Verb + Metric)", "Bullet point 2", ...]
    }`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });
    
    return parseJSONFromText(response.text);
};

export const generateEmailDraft = async (recipient: string, purpose: string, tone: string): Promise<{subject: string, body: string} | null> => {
    const prompt = `Write a ${tone} email to ${recipient} about: ${purpose}.
    Return JSON: {subject, body}`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });
    
    return parseJSONFromText(response.text);
};

export const generateEssayOutline = async (topic: string, type: string, points: string): Promise<string> => {
    const prompt = `Create a detailed essay outline for a "${type}" essay on the topic: "${topic}".
    Key points to include: ${points}.
    Format the output as a clean Markdown outline with:
    - Title Suggestion
    - Introduction (Hook, Background, Thesis Statement)
    - Body Paragraphs (Topic Sentence, Supporting Details)
    - Conclusion (Restate Thesis, Final Thought)
    
    Do not add any preamble, just the markdown.`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });
    return response.text || "Could not generate outline.";
};

export const polishNotes = async (rawNotes: string): Promise<string> => {
    const prompt = `Rewrite these rough student notes into a structured, easy-to-read study guide using Markdown.
    - Use clear headings.
    - Use bullet points.
    - Bold key terms.
    - Fix grammar and clarity.
    
    Raw Notes:
    "${rawNotes}"
    
    Do not add preamble, just the markdown.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });
    return response.text || "Could not polish notes.";
};

export const findAiTools = async (category: string, query: string): Promise<Tool[]> => {
    const prompt = `Find 5 AI tools for students related to "${category}" ${query ? `matching "${query}"` : ''}.
    Use Google Search.
    Return JSON array: [{name, description, url, category, icon (emoji), color (tailwind class like bg-blue-100), tag}]`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { tools: [{ googleSearch: {} }] }
    });

    const res = parseJSONFromText(response.text);
    if(Array.isArray(res)) {
        return res.map((item: any) => ({
            ...item,
            url: ensureUrl(item.url, item.name),
            color: item.color || "bg-slate-100 dark:bg-slate-700"
        }));
    }
    return [];
};

export const generateFinancialAdvice = async (transactions: string, goal: string): Promise<string> => {
    const prompt = `Analyze these student transactions: ${transactions}. Goal: ${goal}. Give 1 short, actionable advice sentence.`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });
    return response.text || "Save more than you spend.";
};

export const generateFinancialConcept = async (concept: string): Promise<string> => {
    const prompt = `Explain "${concept}" to a college student simply in 3-4 sentences.`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });
    return response.text || "Financial literacy is key.";
};

export const generateWellnessChat = async (history: any[], message: string): Promise<string> => {
    const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: "You are an empathetic wellness companion for students. Listen, validate, and offer gentle support. Keep it conversational.",
        },
        history
    });
    const result = await chat.sendMessage({ message });
    return result.text || "I'm here for you.";
};

export const generateWorkoutRoutine = async (focus: string, time: string, equipment: string): Promise<WorkoutRoutine | null> => {
    const prompt = `Create a ${time} ${focus} workout routine using ${equipment}.
    Return JSON: {title, difficulty, estimatedTime, exercises: [{name, durationOrReps, instructions}]}`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });
    
    return parseJSONFromText(response.text);
};

export const generateSocialTips = async (context: string): Promise<string> => {
    const prompt = `Give social advice for a student in this situation: "${context}". Keep it practical and encouraging.`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });
    return response.text || "Be yourself and smile.";
};

export const getCampusRealTimeInfo = async (category: string, filters?: { location?: string, mode?: string, time?: string }): Promise<CampusItem[]> => {
  try {
    const locationPart = filters?.location ? `near ${filters.location}` : 'globally or suitable for students (prioritize online/remote if no location specified)';
    const modePart = filters?.mode && filters.mode !== 'Any' ? `Mode constraint: MUST be ${filters.mode}` : '';
    const timePart = filters?.time && filters.time !== 'Anytime' ? `Timeframe: Happening ${filters.time}` : 'Timeframe: Upcoming';

    const prompt = `
    Find 4 active, real-time opportunities, events, or resources for college students related to: "${category}".
    Context: ${locationPart}. ${modePart}. ${timePart}.
    Use Google Search to find actual links and names.
    Return JSON array: [{id, title, description, link, date, type: "Event"|"Club"|"Tip"|"Resource"|"Competition"}]
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const items = parseJSONFromText(response.text);
    if (Array.isArray(items) && items.length > 0) {
      return items.map((i: any, idx: number) => ({
        ...i,
        id: i.id || idx.toString(),
        link: ensureUrl(i.link, `${i.title} ${category}`)
      })) as CampusItem[];
    }
    return [];
  } catch (error) {
    console.error("Campus Info Fetch Error", error);
    return [];
  }
};

export const searchMarketplace = async (category: string, query: string): Promise<MarketplaceItem[]> => {
    const prompt = `Find 5 ACTIVE student-friendly products for "${category}" matching "${query}".
    Use Google Search to find real purchase links (Amazon, Flipkart, etc.).
    Return JSON array: [{id, name, price, vendor, rating, description, features: [], link, imageUrl, delivery, discount, category}]`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { tools: [{ googleSearch: {} }] }
    });
    
    const res = parseJSONFromText(response.text);
    if(Array.isArray(res)) {
        return res.map((item: any, idx: number) => ({
            ...item,
            id: item.id || idx.toString(),
            link: ensureUrl(item.link, item.name)
        }));
    }
    return [];
};

export const findPlaybookResources = async (query: string, type: string, resourceType?: string): Promise<DynamicResource[]> => {
    const prompt = `Find 4 ${resourceType || ''} resources for students: "${query}".
    Use Google Search to find REAL, ACTIVE links to deals, pdfs, or pages.
    Return JSON array: [{id, title, url, type: "${type}", source, description}]`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { tools: [{ googleSearch: {} }] }
    });
    
    const res = parseJSONFromText(response.text);
    if(Array.isArray(res)) {
        return res.map((item: any, idx: number) => ({
            ...item,
            id: item.id || idx.toString(),
            url: ensureUrl(item.url, item.title)
        }));
    }
    return [];
};

export const generateAcademicRoadmap = async (branch: string): Promise<AcademicYear[]> => {
    const prompt = `Create a 4-year academic roadmap for "${branch}" engineering/degree.
    Return JSON array (4 items): [{year: "Year 1", title, description, subjects: [], skills: [], resources: [{name, url, type}]}]`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });
    
    const res = parseJSONFromText(response.text);
    return Array.isArray(res) ? res : [];
};
