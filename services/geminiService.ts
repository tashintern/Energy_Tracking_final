
import { GoogleGenAI } from "@google/genai";
import { Activity } from '../types';

export const generateWeeklySummary = async (energizing: Activity[], draining: Activity[]): Promise<string> => {
  if (!process.env.API_KEY) {
    return "Gemini API key not configured. Please add it in the settings to enable AI summaries.";
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const energizingActivities = energizing.map(a => a.title).join(', ') || 'None';
  const drainingActivities = draining.map(a => a.title).join(', ') || 'None';

  const prompt = `
    You are a friendly and insightful productivity coach called 'EnergyMap AI'.
    Based on the following user activity data for the week, provide a concise, encouraging, and actionable summary in one or two sentences.
    Focus on one small, positive change the user can make for the next week.

    Top 5 most energizing activities: ${energizingActivities}
    Top 5 most draining activities: ${drainingActivities}

    Your summary:
  `;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating summary with Gemini:", error);
    return "Could not generate AI summary. There might be an issue with the API key or service.";
  }
};
