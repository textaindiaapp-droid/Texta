
import { GoogleGenAI, Type } from "@google/genai";
import { ConversationAnalysis, ChatMessage, TranscriptLine } from "../types.ts";

export const analyzeConversation = async (audioBase64: string, mimeType: string): Promise<ConversationAnalysis> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    DIAGNOSTIC TASK: MULTI-SPEAKER INTELLIGENCE SYNTHESIS (PHASE 0).
    
    INSTRUCTIONS:
    - Diarize all unique speakers ($N$).
    - Generate a verbatim transcript with sub-second precision.
    - BEHAVIORAL METRICS (0-100) - EVALUATE BEYOND VOLUME OR SPEED:
      * Transparency: Evaluate structural logical consistency vs. lexical deflection. Detect "stalling" or "filler-density" shifts.
      * Stress: Monitor micro-tremors in cadence, frequency shifts in vocal pitch, and irregular respiratory pacing.
      * Confidence: Analyze pitch range modulation width, assertive terminal contours, and steady amplitude.
      * Engagement: Measure via interactive mirroring, response latency (natural vs. hesitant), and vocal energy distribution.
      * Stability: Calculate variance in intonation patterns over time. Low stability suggests fluctuating emotional regulation or high cognitive load.
      * Shielding: Detect rhetorical avoidance patterns and lexical hedging (e.g., "technically", "essentially", "I suppose").
    - Map strategic action items and factual recall cards.
    - Identify Speaker Tones (Assertive, Hesitant, Urgent, Inquisitive, etc.) for each major turn.

    JSON SCHEMA:
    {
      "summary": "High-level objective summary of the session.",
      "meetingPulse": "High Energy|Steady Flow|Tense|Quiet",
      "suggestions": ["Strategic paths or advice"],
      "topicClusters": [{ "label": "Topic", "relevance": 0-100, "summary": "Short desc" }],
      "recallCards": [{ "fact": "Data point", "source": "Speaker Name", "category": "Commitment|Technical|Financial|Deadline|Concept" }],
      "actionItems": [{ "task": "Task description", "priority": "Low|Medium|High" }],
      "transcript": [{ "speaker": "Name", "text": "Verbatim text", "integrityFlag": { "type": "Falsehood|Hiding|Inconsistency", "reason": "Reason", "confidence": 0-100 } }],
      "overallTones": [{ 
        "speaker": "Name", 
        "tone": "Neutral|Assertive|Questioning|Concerned|Positive|Urgent|Hesitant",
        "interestLevel": "Dominant|Collaborative|Detached|Inquisitive",
        "vibe": "REHEARSED|SPONTANEOUS",
        "metrics": { 
          "transparency": 0-100, 
          "shielding": 0-100, 
          "stress": 0-100, 
          "confidence": 0-100,
          "engagement": 0-100,
          "stability": 0-100
        },
        "keyObservation": "Nuanced behavioral observation of this speaker.",
        "honestyAlerts": ["Specific anomalies detected in vocal logic"]
      }]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', 
      contents: {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: mimeType || 'audio/webm',
              data: audioBase64
            }
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 2000 }
      }
    });

    const text = response.text || "{}";
    const cleanJson = text.includes('{') ? text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1) : text;
    const parsed = JSON.parse(cleanJson);
    
    return {
      ...parsed,
      id: Math.random().toString(36).substring(7),
      timestamp: Date.now(),
      chatHistory: []
    } as ConversationAnalysis;
  } catch (error) {
    console.error("Intelligence synthesis failed:", error);
    throw error;
  }
};

export const chatWithSession = async (
  query: string, 
  transcript: TranscriptLine[], 
  history: ChatMessage[]
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const context = transcript.map(t => `${t.speaker}: ${t.text}`).join('\n');
  const chatHistoryContext = (history || []).map(h => `${h.role === 'user' ? 'Operator' : 'Intelligence'}: ${h.text}`).join('\n');

  const prompt = `Act as the TEXTA Intelligence Node. Answer the operator query based on the session logic. CONTEXT: ${context}. HISTORY: ${chatHistoryContext}. QUERY: ${query}`;
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt
  });
  return response.text || "Connection to intelligence node lost.";
};
