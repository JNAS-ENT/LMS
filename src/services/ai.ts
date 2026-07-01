// AI Assistant service — calls the ai-assistant edge function
// The edge function generates structured responses using the topic's notes,
// questions, and resources. No external API key required.

export interface AIChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface RAGSearchResult {
  content: string;
  source: string;
  relevance: number;
}

export interface SemanticSearchResult {
  id: string;
  type: string;
  title: string;
  content: string;
  similarity: number;
}

export type AIAction =
  | 'summarize' | 'explain' | 'interview' | 'mcqs' | 'flashcards'
  | 'revision_notes' | 'missing_topics' | 'learning_path' | 'chat';

export interface AIResponse {
  response: string;
  action: AIAction;
  topicId: string;
}

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;

export async function callAIAssistant(topicId: string, action: AIAction, prompt?: string): Promise<AIResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
  };
  const res = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ topicId, action, prompt }),
  });
  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    throw new Error(`AI assistant request failed (${res.status}): ${errBody}`);
  }
  const data = await res.json();
  if (!data || typeof data.response !== 'string') {
    throw new Error('AI assistant returned an unexpected response shape');
  }
  return { response: data.response, action: data.action, topicId: data.topicId };
}

export const aiService = {
  chat: async (_messages: AIChatMessage[]): Promise<AIChatMessage> => {
    throw new Error('Use callAIAssistant for topic-scoped AI interactions.');
  },

  ragSearch: async (_query: string): Promise<RAGSearchResult[]> => {
    throw new Error('RAG Search not yet implemented.');
  },

  semanticSearch: async (_query: string): Promise<SemanticSearchResult[]> => {
    throw new Error('Semantic Search not yet implemented.');
  },

  generateEmbeddings: async (_texts: string[]): Promise<number[][]> => {
    throw new Error('Embeddings generation not yet implemented.');
  },
};
