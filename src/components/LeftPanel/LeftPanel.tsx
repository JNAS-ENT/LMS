import { useState } from 'react'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { Plus, Folder, Check, X } from 'lucide-react'
import { WorkspaceMenu } from './WorkspaceMenu'

interface LeftPanelProps {
  onClose?: () => void
}

const COLOR_MAP: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-700 border-blue-200',
  emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  amber: 'bg-amber-100 text-amber-700 border-amber-200',
  rose: 'bg-rose-100 text-rose-700 border-rose-200',
  violet: 'bg-violet-100 text-violet-700 border-violet-200',
  cyan: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  orange: 'bg-orange-100 text-orange-700 border-orange-200',
  pink: 'bg-pink-100 text-pink-700 border-pink-200',
  slate: 'bg-slate-100 text-slate-700 border-slate-200',
}

export function LeftPanel({ onClose }: LeftPanelProps) {
  const {
    workspaces,
    currentWorkspace,
    selectWorkspace,
    createWorkspace,
    deleteWorkspace
  } = useWorkspace()

  const [isCreating, setIsCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')

  const handleCreate = async () => {
    if (!newTitle.trim()) return
    const workspace = await createWorkspace(newTitle.trim())
    if (workspace) {
      selectWorkspace(workspace)
      setNewTitle('')
      setIsCreating(false)
      onClose?.()
    }
  }

  const handleSelect = (workspace: typeof currentWorkspace) => {
    if (workspace) {
      selectWorkspace(workspace)
      onClose?.()
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Delete this workspace? All notebooks, videos, and documents will be lost.')) {
      await deleteWorkspace(id)
    }
  }

  const workspaceCount = workspaces.length

  return (
    <div className="flex h-full flex-col bg-white border-r border-secondary-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-secondary-200">
        <div>
          <h2 className="text-sm font-semibold text-secondary-900">Workspaces</h2>
          <p className="text-xs text-secondary-500">{workspaceCount} learning spaces</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="btn-primary btn-sm"
          title="Create new workspace"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Create New Workspace */}
      {isCreating && (
        <div className="px-3 py-2 border-b border-secondary-200">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Workspace name..."
              className="input text-sm py-1.5"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate()
                if (e.key === 'Escape') {
                  setIsCreating(false)
                  setNewTitle('')
                }
              }}
            />
            <button onClick={handleCreate} className="btn-accent btn-sm">
              <Check className="h-3 w-3" />
            </button>
            <button
              onClick={() => {
                setIsCreating(false)
                setNewTitle('')
              }}
              className="btn-ghost btn-sm"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {/* Workspaces List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin py-2">
        {workspaces.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Folder className="h-10 w-10 mx-auto text-secondary-300 mb-3" />
            <p className="text-sm text-secondary-600 mb-1">No workspaces yet</p>
            <p className="text-xs text-secondary-400">Create one to start learning</p>
          </div>
        ) : (
          <div className="space-y-1 px-2">
            {workspaces.map((workspace) => (
              <div
                key={workspace.id}
                className={`
                  group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer
                  transition-colors duration-150
                  ${currentWorkspace?.id === workspace.id
                    ? 'bg-primary-50 border border-primary-200'
                    : 'hover:bg-secondary-50 border border-transparent'
                  }
                `}
                onClick={() => handleSelect(workspace)}
              >
                <div
                  className={`
                    flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-sm font-medium
                    ${COLOR_MAP[workspace.color] || COLOR_MAP.blue}
                  `}
                >
                  {workspace.title.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-secondary-900 truncate">
                    {workspace.title}
                  </p>
                  {workspace.description && (
                    <p className="text-xs text-secondary-500 truncate">
                      {workspace.description}
                    </p>
                  )}
                </div>
                <WorkspaceMenu
                  onDelete={() => handleDelete(workspace.id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-secondary-200 bg-secondary-50">
        <p className="text-xs text-secondary-500 text-center">
          JNAS Learning Workspace
        </p>
      </div>
    </div>
  )
}
