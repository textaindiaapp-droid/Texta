
import { GoogleGenAI, Type } from "@google/genai";
import { ConversationAnalysis, ChatMessage, TranscriptLine } from "../types.ts";

export const analyzeConversation = async (audioBase64: string, mimeType: string): Promise<ConversationAnalysis> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    TASK: CONDUCT DEEP BEHAVIORAL AND ACOUSTIC INTELLIGENCE SYNTHESIS.
    
    SYSTEM INSTRUCTION: 
    Act as a high-level Intelligence Node. Analyze the acoustic and linguistic properties of the provided session. 
    Focus on "Structural Honesty" and "Acoustic Integrity".
    
    ANALYSIS REQUIREMENTS:
    1. ACOUSTIC INTEGRITY: Detect if the speech is "REHEARSED" (reading from a script) or "SPONTANEOUS" (natural flow).
    2. PSYCHOMETRICS (0-100%):
       - Transparency: Willingness to share information.
       - Shielding: Active withholding or deflection.
       - Stress: Vocal tension and logical inconsistency.
       - Confidence: Vocal authority.
    3. STRATEGIC NODES: Provide AI-driven strategic suggestions for following up on this session.
    4. VERBATIM TRANSCRIPT: Capture multi-lingual dialogue accurately.

    JSON OUTPUT SCHEMA:
    {
      "summary": "string",
      "meetingPulse": "High Energy|Steady Flow|Tense|Quiet",
      "suggestions": ["string"],
      "topicClusters": [{ "label": "string", "relevance": number, "summary": "string" }],
      "recallCards": [{ "fact": "string", "source": "string", "category": "Commitment|Technical|Financial|Deadline|Concept" }],
      "actionItems": [{ "task": "string", "priority": "Low|Medium|High" }],
      "transcript": [{ 
        "speaker": "string", 
        "text": "string", 
        "integrityFlag": { "type": "Falsehood|Hiding|Inconsistency", "reason": "string", "confidence": number } 
      }],
      "overallTones": [{ 
        "speaker": "string", 
        "tone": "ToneLabel", 
        "interestLevel": "Dominant|Collaborative|Detached|Inquisitive",
        "vibe": "REHEARSED|SPONTANEOUS",
        "cognitiveStyle": "CALCULATED|INTUITIVE|ANALYTICAL",
        "linguisticStyle": "MONOTONE|FRAGMENTED|FLUID|DIRECT",
        "metrics": { 
          "transparency": number, 
          "shielding": number,
          "stress": number,
          "confidence": number 
        },
        "keyObservation": "string",
        "honestyAlerts": ["string"]
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

export const chatWithSession = async (
  query: string, 
  transcript: TranscriptLine[], 
  history: ChatMessage[]
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const context = transcript.map(t => `${t.speaker}: ${t.text}`).join('\n');
  const chatHistoryContext = (history || []).map(h => `${h.role === 'user' ? 'Operator' : 'Intelligence'}: ${h.text}`).join('\n');

  const prompt = `Act as the TEXTA Behavioral Intelligence Node. Provide deep structural answers based on the session logic. CONTEXT: ${context}. HISTORY: ${chatHistoryContext}. QUERY: ${query}`;
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt
  });
  return response.text || "Connection to intelligence node lost.";
};
