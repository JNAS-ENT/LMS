// AI-ready architecture placeholder
// This module defines the interface for future AI integration

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

export const aiService = {
  chat: async (_messages: AIChatMessage[]): Promise<AIChatMessage> => {
    throw new Error('AI Chat not yet implemented. Configure your AI provider in settings.');
  },

  ragSearch: async (_query: string): Promise<RAGSearchResult[]> => {
    throw new Error('RAG Search not yet implemented. Configure embeddings provider in settings.');
  },

  semanticSearch: async (_query: string): Promise<SemanticSearchResult[]> => {
    throw new Error('Semantic Search not yet implemented. Configure vector database in settings.');
  },

  generateEmbeddings: async (_texts: string[]): Promise<number[][]> => {
    throw new Error('Embeddings generation not yet implemented.');
  },
};
