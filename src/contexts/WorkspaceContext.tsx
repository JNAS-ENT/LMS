import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Tables } from '../lib/supabase'

type Workspace = Tables<'workspaces'>
type Notebook = Tables<'workspace_notebooks'>
type Video = Tables<'workspace_videos'>
type Document = Tables<'workspace_documents'>

interface WorkspaceContextType {
  workspaces: Workspace[]
  currentWorkspace: Workspace | null
  notebooks: Notebook[]
  videos: Video[]
  documents: Document[]
  loading: boolean
  selectWorkspace: (workspace: Workspace | null) => void
  createWorkspace: (title: string, description?: string, color?: string) => Promise<Workspace | null>
  updateWorkspace: (id: string, updates: Partial<Workspace>) => Promise<void>
  deleteWorkspace: (id: string) => Promise<void>
  createNotebook: (title: string, content?: string) => Promise<Notebook | null>
  updateNotebook: (id: string, updates: Partial<Notebook>) => Promise<void>
  deleteNotebook: (id: string) => Promise<void>
  restoreNotebook: (id: string) => Promise<void>
  fetchNotebookVersions: (notebookId: string) => Promise<Tables<'workspace_notebook_versions'>[]>
  createVideo: (url: string, videoId: string) => Promise<Video | null>
  updateVideo: (id: string, updates: Partial<Video>) => Promise<void>
  deleteVideo: (id: string) => Promise<void>
  createDocument: (file: File, filePath: string) => Promise<Document | null>
  deleteDocument: (id: string) => Promise<void>
  logActivity: (actionType: string, relatedId?: string, durationSeconds?: number, metadata?: Record<string, unknown>) => Promise<void>
  refreshWorkspaces: () => Promise<void>
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)

const WORKSPACE_COLORS = [
  'blue', 'emerald', 'amber', 'rose', 'violet', 'cyan', 'orange', 'pink', 'slate'
]

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null)
  const [notebooks, setNotebooks] = useState<Notebook[]>([])
  const [videos, setVideos] = useState<Video[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)

  const fetchWorkspaces = useCallback(async () => {
    const { data, error } = await supabase
      .from('workspaces')
      .select('*')
      .order('updated_at', { ascending: false })

    if (!error && data) {
      setWorkspaces(data)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchWorkspaces()
  }, [fetchWorkspaces])

  useEffect(() => {
    if (workspaces.length > 0 && !currentWorkspace) {
      setCurrentWorkspace(workspaces[0])
    }
  }, [workspaces, currentWorkspace])

  useEffect(() => {
    if (!currentWorkspace) {
      setNotebooks([])
      setVideos([])
      setDocuments([])
      return
    }

    const fetchWorkspaceData = async () => {
      const [notebooksRes, videosRes, documentsRes] = await Promise.all([
        supabase
          .from('workspace_notebooks')
          .select('*')
          .eq('workspace_id', currentWorkspace.id)
          .is('deleted_at', null)
          .order('updated_at', { ascending: false }),
        supabase
          .from('workspace_videos')
          .select('*')
          .eq('workspace_id', currentWorkspace.id)
          .order('added_at', { ascending: false }),
        supabase
          .from('workspace_documents')
          .select('*')
          .eq('workspace_id', currentWorkspace.id)
          .order('uploaded_at', { ascending: false }),
      ])

      if (notebooksRes.data) setNotebooks(notebooksRes.data)
      if (videosRes.data) setVideos(videosRes.data)
      if (documentsRes.data) setDocuments(documentsRes.data)
    }

    fetchWorkspaceData()
  }, [currentWorkspace])

  const selectWorkspace = (workspace: Workspace | null) => {
    setCurrentWorkspace(workspace)
  }

  const createWorkspace = async (title: string, description?: string, color?: string): Promise<Workspace | null> => {
    const { data, error } = await supabase
      .from('workspaces')
      .insert({
        title,
        description,
        color: color || WORKSPACE_COLORS[Math.floor(Math.random() * WORKSPACE_COLORS.length)],
      })
      .select()
      .single()

    if (!error && data) {
      setWorkspaces((prev) => [data, ...prev])
      return data
    }
    return null
  }

  const updateWorkspace = async (id: string, updates: Partial<Workspace>) => {
    const { error } = await supabase
      .from('workspaces')
      .update(updates)
      .eq('id', id)

    if (!error) {
      setWorkspaces((prev) =>
        prev.map((w) => (w.id === id ? { ...w, ...updates } : w))
      )
      if (currentWorkspace?.id === id) {
        setCurrentWorkspace({ ...currentWorkspace, ...updates })
      }
    }
  }

  const deleteWorkspace = async (id: string) => {
    const { error } = await supabase
      .from('workspaces')
      .delete()
      .eq('id', id)

    if (!error) {
      setWorkspaces((prev) => prev.filter((w) => w.id !== id))
      if (currentWorkspace?.id === id) {
        setCurrentWorkspace(workspaces.find((w) => w.id !== id) || null)
      }
    }
  }

  const createNotebook = async (title: string, content = ''): Promise<Notebook | null> => {
    if (!currentWorkspace) return null

    const { data, error } = await supabase
      .from('workspace_notebooks')
      .insert({
        workspace_id: currentWorkspace.id,
        title,
        content,
      })
      .select()
      .single()

    if (!error && data) {
      setNotebooks((prev) => [data, ...prev])
      await logActivity('note_created', data.id)
      return data
    }
    return null
  }

  const updateNotebook = async (id: string, updates: Partial<Notebook>) => {
    if (!currentWorkspace) return

    const notebook = notebooks.find((n) => n.id === id)
    if (!notebook) return

    const versionCount = await supabase
      .from('workspace_notebook_versions')
      .select('version_number', { count: 'exact' })
      .eq('notebook_id', id)

    const nextVersion = (versionCount.count || 0) + 1

    await supabase.from('workspace_notebook_versions').insert({
      notebook_id: id,
      title: notebook.title,
      content: notebook.content,
      version_number: nextVersion,
    })

    const { error } = await supabase
      .from('workspace_notebooks')
      .update(updates)
      .eq('id', id)

    if (!error) {
      setNotebooks((prev) =>
        prev.map((n) => (n.id === id ? { ...n, ...updates } : n))
      )
    }
  }

  const deleteNotebook = async (id: string) => {
    const { error } = await supabase
      .from('workspace_notebooks')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (!error) {
      setNotebooks((prev) => prev.filter((n) => n.id !== id))
    }
  }

  const restoreNotebook = async (id: string) => {
    const { error } = await supabase
      .from('workspace_notebooks')
      .update({ deleted_at: null })
      .eq('id', id)

    if (!error) {
      const { data } = await supabase
        .from('workspace_notebooks')
        .select('*')
        .eq('id', id)
        .single()

      if (data) {
        setNotebooks((prev) => [data, ...prev])
      }
    }
  }

  const fetchNotebookVersions = async (notebookId: string) => {
    const { data } = await supabase
      .from('workspace_notebook_versions')
      .select('*')
      .eq('notebook_id', notebookId)
      .order('version_number', { ascending: false })

    return data || []
  }

  const createVideo = async (url: string, videoId: string): Promise<Video | null> => {
    if (!currentWorkspace) return null

    const { data, error } = await supabase
      .from('workspace_videos')
      .insert({
        workspace_id: currentWorkspace.id,
        url,
        video_id: videoId,
      })
      .select()
      .single()

    if (!error && data) {
      setVideos((prev) => [data, ...prev])
      await logActivity('video_added', data.id)
      return data
    }
    return null
  }

  const updateVideo = async (id: string, updates: Partial<Video>) => {
    const { error } = await supabase
      .from('workspace_videos')
      .update(updates)
      .eq('id', id)

    if (!error) {
      setVideos((prev) =>
        prev.map((v) => (v.id === id ? { ...v, ...updates } : v))
      )
    }
  }

  const deleteVideo = async (id: string) => {
    const { error } = await supabase
      .from('workspace_videos')
      .delete()
      .eq('id', id)

    if (!error) {
      setVideos((prev) => prev.filter((v) => v.id !== id))
    }
  }

  const createDocument = async (file: File, filePath: string): Promise<Document | null> => {
    if (!currentWorkspace) return null

    const { data, error } = await supabase
      .from('workspace_documents')
      .insert({
        workspace_id: currentWorkspace.id,
        file_name: file.name,
        file_type: file.type,
        file_path: filePath,
        file_size: file.size,
      })
      .select()
      .single()

    if (!error && data) {
      setDocuments((prev) => [data, ...prev])
      await logActivity('document_uploaded', data.id)
      return data
    }
    return null
  }

  const deleteDocument = async (id: string) => {
    const { error } = await supabase
      .from('workspace_documents')
      .delete()
      .eq('id', id)

    if (!error) {
      setDocuments((prev) => prev.filter((d) => d.id !== id))
    }
  }

  const logActivity = async (
    actionType: string,
    relatedId?: string,
    durationSeconds?: number,
    metadata?: Record<string, unknown>
  ) => {
    await supabase.from('workspace_history').insert({
      action_type: actionType,
      workspace_id: currentWorkspace?.id,
      related_id: relatedId,
      duration_seconds: durationSeconds,
      metadata,
    })
  }

  const refreshWorkspaces = async () => {
    await fetchWorkspaces()
  }

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        currentWorkspace,
        notebooks,
        videos,
        documents,
        loading,
        selectWorkspace,
        createWorkspace,
        updateWorkspace,
        deleteWorkspace,
        createNotebook,
        updateNotebook,
        deleteNotebook,
        restoreNotebook,
        fetchNotebookVersions,
        createVideo,
        updateVideo,
        deleteVideo,
        createDocument,
        deleteDocument,
        logActivity,
        refreshWorkspaces,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider')
  }
  return context
}
