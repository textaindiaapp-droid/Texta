
import { GoogleGenAI, Type } from "@google/genai";
import { ConversationAnalysis, ChatMessage, TranscriptLine } from "../types.ts";

/**
 * THE CORE SYNTHESIS ENGINE
 * This function handles the transformation of raw audio into structured behavioral intelligence.
 */
export const analyzeConversation = async (audioBase64: string, mimeType: string): Promise<ConversationAnalysis> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    TASK: CONDUCT DEEP BEHAVIORAL AND ACOUSTIC INTELLIGENCE SYNTHESIS.
    
    SYSTEM ROLE: 
    Act as the TEXTA Intelligence Node. You are a high-precision diagnostic tool designed to extract structural honesty and strategic value from conversation audio.
    
    ANALYSIS FLOW:
    1. VERBATIM EXTRACTION: Generate a multi-speaker transcript.
    2. THEMATIC CLUSTERING: Identify the primary "what" (topics) and "how" (action items).
    3. ACOUSTIC INTEGRITY: Analyze vocal authority and cadence to determine if speech is "REHEARSED" or "SPONTANEOUS".
    4. PSYCHOMETRIC MAPPING: For each speaker, calculate:
       - Transparency: Information openness.
       - Shielding: Active withholding/deflection.
       - Stress: Vocal tension markers.
       - Confidence: Authority and flow.
    5. STRATEGIC NODES: Provide high-level AI suggestions for following up on the discussion.

    STRICT JSON OUTPUT SCHEMA:
    {
      "summary": "One sentence definitive summary of the session core.",
      "meetingPulse": "High Energy|Steady Flow|Tense|Quiet",
      "suggestions": ["Strategic action nodes for the user."],
      "topicClusters": [{ "label": "Topic Name", "relevance": 0-100, "summary": "Short description" }],
      "recallCards": [{ "fact": "Key piece of info", "source": "Speaker Name", "category": "Commitment|Technical|Financial|Deadline|Concept" }],
      "actionItems": [{ "task": "Specific task", "priority": "Low|Medium|High" }],
      "transcript": [{ 
        "speaker": "Name", 
        "text": "Dialogue", 
        "integrityFlag": { "type": "Falsehood|Hiding|Inconsistency", "reason": "Structural reasoning", "confidence": 0-100 } 
      }],
      "overallTones": [{ 
        "speaker": "Name", 
        "interestLevel": "Dominant|Collaborative|Detached|Inquisitive",
        "vibe": "REHEARSED|SPONTANEOUS",
        "cognitiveStyle": "CALCULATED|INTUITIVE|ANALYTICAL",
        "linguisticStyle": "MONOTONE|FRAGMENTED|FLUID|DIRECT",
        "metrics": { 
          "transparency": 0-100, 
          "shielding": 0-100,
          "stress": 0-100,
          "confidence": 0-100 
        },
        "keyObservation": "High-level behavioral observation.",
        "honestyAlerts": ["Specific warnings about information withholding."]
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
        responseMimeType: "application/json"
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

/**
 * CONSULTATION NODE
 * Handles real-time queries against the session context.
 */
export const chatWithSession = async (
  query: string, 
  transcript: TranscriptLine[], 
  history: ChatMessage[]
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const context = transcript.map(t => `${t.speaker}: ${t.text}`).join('\n');
  const chatHistoryContext = (history || []).map(h => `${h.role === 'user' ? 'Operator' : 'Intelligence'}: ${h.text}`).join('\n');

  const prompt = `Act as the TEXTA Intelligence Node. Answer the query based on the session logic and transcript provided. CONTEXT: ${context}. HISTORY: ${chatHistoryContext}. QUERY: ${query}`;
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt
  });
  return response.text || "Connection to intelligence node lost.";
};
