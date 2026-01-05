
import { GoogleGenAI, Type } from "@google/genai";
import { ConversationAnalysis, ChatMessage, TranscriptLine } from "../types.ts";

export const analyzeConversation = async (audioBase64: string, mimeType: string): Promise<ConversationAnalysis> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    TRANSCRIPTION AND MEMORY SYNTHESIS TASK:
    1. VERBATIM TRANSCRIPT: Transcribe audio exactly with speaker IDs.
    2. TOPIC CLUSTERS: Group parts of the conversation into 3-5 major thematic areas (Thematic Nodes).
    3. RECALL CARDS: Extract specific factual statements, commitments, or dates.
    4. INTERACTION PATTERNS: Analyze who influenced who and what was left hanging.
    5. SPEAKER METRICS: Evaluate psychological markers (Transparency, Confidence, Engagement).

    JSON SCHEMA OUTPUT:
    {
      "summary": "string",
      "meetingPulse": "High Energy|Steady Flow|Tense|Quiet",
      "actionItems": [{ "task": "string", "priority": "Low|Medium|High" }],
      "topicClusters": [{ "label": "string", "relevance": number, "summary": "string" }],
      "recallCards": [{ "fact": "string", "source": "string", "category": "Commitment|Technical|Financial|Deadline|Concept" }],
      "interactionPatterns": [{
        "speakers": ["string"],
        "type": "Question-Answer|Clarification|Interruption|Agreement|Concern-Reassurance|Unresolved|Brief Exchange",
        "description": "string",
        "toneDynamic": "string"
      }],
      "suggestions": ["string"],
      "transcript": [{ "speaker": "string", "text": "string" }],
      "overallTones": [{ 
        "speaker": "string", 
        "tone": "ToneLabel", 
        "interestLevel": "Dominant|Collaborative|Detached|Inquisitive|Passive Observer",
        "metrics": { "intensity": number, "confidence": number, "stability": number, "transparency": number, "engagement": number },
        "keyObservation": "string"
      }]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
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
        thinkingConfig: { thinkingBudget: 0 } 
      }
    });

    const text = response.text || "{}";
    const cleanJson = text.includes('{') ? text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1) : text;
    const parsed = JSON.parse(cleanJson);
    
    return {
      summary: parsed.summary || "No summary generated.",
      meetingPulse: parsed.meetingPulse || "Steady Flow",
      actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
      topicClusters: Array.isArray(parsed.topicClusters) ? parsed.topicClusters : [],
      recallCards: Array.isArray(parsed.recallCards) ? parsed.recallCards : [],
      interactionPatterns: Array.isArray(parsed.interactionPatterns) ? parsed.interactionPatterns : [],
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
      transcript: Array.isArray(parsed.transcript) ? parsed.transcript : [{ speaker: "System", text: "No speech detected." }],
      overallTones: Array.isArray(parsed.overallTones) ? parsed.overallTones : [],
      id: Math.random().toString(36).substring(7),
      timestamp: Date.now(),
      chatHistory: []
    } as ConversationAnalysis;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
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
  const chatHistoryContext = (history || []).map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.text}`).join('\n');

  const prompt = `Answer directly based on this conversation. TRANSCRIPT: ${context}. HISTORY: ${chatHistoryContext}. QUERY: ${query}`;
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: { thinkingConfig: { thinkingBudget: 0 } }
  });
  return response.text || "No intelligence found.";
};
