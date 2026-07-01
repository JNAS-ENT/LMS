import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          color: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          title: string
          description?: string | null
          color?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          color?: string
          created_at?: string
          updated_at?: string
        }
      }
      workspace_notebooks: {
        Row: {
          id: string
          workspace_id: string
          title: string
          content: string
          tags: string[]
          importance: number
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          workspace_id: string
          title: string
          content?: string
          tags?: string[]
          importance?: number
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          workspace_id?: string
          title?: string
          content?: string
          tags?: string[]
          importance?: number
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      workspace_notebook_versions: {
        Row: {
          id: string
          notebook_id: string
          title: string
          content: string
          version_number: number
          created_at: string
        }
        Insert: {
          id?: string
          notebook_id: string
          title: string
          content: string
          version_number: number
          created_at?: string
        }
        Update: {
          id?: string
          notebook_id?: string
          title?: string
          content?: string
          version_number?: number
          created_at?: string
        }
      }
      workspace_videos: {
        Row: {
          id: string
          workspace_id: string
          url: string
          video_id: string
          title: string | null
          thumbnail_url: string | null
          duration: number | null
          transcript: string | null
          ai_summary: string | null
          key_points: Json | null
          chapters: Json | null
          quotes: Json | null
          questions: Json | null
          flashcards: Json | null
          action_items: Json | null
          learning_notes: string | null
          added_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          url: string
          video_id: string
          title?: string | null
          thumbnail_url?: string | null
          duration?: number | null
          transcript?: string | null
          ai_summary?: string | null
          key_points?: Json | null
          chapters?: Json | null
          quotes?: Json | null
          questions?: Json | null
          flashcards?: Json | null
          action_items?: Json | null
          learning_notes?: string | null
          added_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          url?: string
          video_id?: string
          title?: string | null
          thumbnail_url?: string | null
          duration?: number | null
          transcript?: string | null
          ai_summary?: string | null
          key_points?: Json | null
          chapters?: Json | null
          quotes?: Json | null
          questions?: Json | null
          flashcards?: Json | null
          action_items?: Json | null
          learning_notes?: string | null
          added_at?: string
          updated_at?: string
        }
      }
      workspace_documents: {
        Row: {
          id: string
          workspace_id: string
          file_name: string
          file_type: string
          file_path: string
          file_size: number
          metadata: Json | null
          summary: string | null
          highlights: string | null
          keywords: string[] | null
          uploaded_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          file_name: string
          file_type: string
          file_path: string
          file_size: number
          metadata?: Json | null
          summary?: string | null
          highlights?: string | null
          keywords?: string[] | null
          uploaded_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          file_name?: string
          file_type?: string
          file_path?: string
          file_size?: number
          metadata?: Json | null
          summary?: string | null
          highlights?: string | null
          keywords?: string[] | null
          uploaded_at?: string
          updated_at?: string
        }
      }
      workspace_captures: {
        Row: {
          id: string
          user_id: string
          workspace_id: string | null
          capture_type: 'text' | 'url' | 'code' | 'image'
          content: string
          metadata: Json | null
          processed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          workspace_id?: string | null
          capture_type: 'text' | 'url' | 'code' | 'image'
          content: string
          metadata?: Json | null
          processed?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          workspace_id?: string | null
          capture_type?: 'text' | 'url' | 'code' | 'image'
          content?: string
          metadata?: Json | null
          processed?: boolean
          created_at?: string
        }
      }
      workspace_history: {
        Row: {
          id: string
          user_id: string
          action_type: string
          workspace_id: string | null
          related_id: string | null
          duration_seconds: number | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          action_type: string
          workspace_id?: string | null
          related_id?: string | null
          duration_seconds?: number | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          action_type?: string
          workspace_id?: string | null
          related_id?: string | null
          duration_seconds?: number | null
          metadata?: Json | null
          created_at?: string
        }
      }
      workspace_tasks: {
        Row: {
          id: string
          user_id: string
          workspace_id: string | null
          title: string
          description: string | null
          status: 'pending' | 'in_progress' | 'completed'
          priority: 'low' | 'medium' | 'high'
          due_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          workspace_id?: string | null
          title: string
          description?: string | null
          status?: 'pending' | 'in_progress' | 'completed'
          priority?: 'low' | 'medium' | 'high'
          due_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          workspace_id?: string | null
          title?: string
          description?: string | null
          status?: 'pending' | 'in_progress' | 'completed'
          priority?: 'low' | 'medium' | 'high'
          due_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      workspace_ai_outputs: {
        Row: {
          id: string
          user_id: string
          workspace_id: string | null
          input_text: string
          transformation_type: string
          output_text: string
          model_used: string | null
          saved_as_notebook_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          workspace_id?: string | null
          input_text: string
          transformation_type: string
          output_text: string
          model_used?: string | null
          saved_as_notebook_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          workspace_id?: string | null
          input_text?: string
          transformation_type?: string
          output_text?: string
          model_used?: string | null
          saved_as_notebook_id?: string | null
          created_at?: string
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
