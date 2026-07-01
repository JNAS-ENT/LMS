import { useState } from 'react'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { Tables } from '../../lib/supabase'
import { Plus, FileText, Clock, Tag, Trash2, Star } from 'lucide-react'

type Notebook = Tables<'workspace_notebooks'>

const IMPORTANCE_COLORS = [
  'text-secondary-400',
  'text-blue-500',
  'text-emerald-500',
  'text-amber-500',
  'text-orange-500',
  'text-red-500',
]

export function NotebookView() {
  const { notebooks, createNotebook, updateNotebook, deleteNotebook } = useWorkspace()
  const [selectedNotebook, setSelectedNotebook] = useState<Notebook | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredNotebooks = notebooks.filter((n) =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleCreate = async () => {
    if (!newTitle.trim()) return
    const notebook = await createNotebook(newTitle.trim())
    if (notebook) {
      setSelectedNotebook(notebook)
      setNewTitle('')
      setIsCreating(false)
    }
  }

  const handleSave = async (notebook: Notebook, updates: Partial<Notebook>) => {
    await updateNotebook(notebook.id, updates)
    if (selectedNotebook?.id === notebook.id) {
      setSelectedNotebook({ ...notebook, ...updates })
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="flex h-full">
      {/* Notes List */}
      <div className="w-80 border-r border-secondary-200 bg-white flex flex-col">
        <div className="p-4 border-b border-secondary-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-secondary-900">Notebooks</h2>
            <button
              onClick={() => setIsCreating(true)}
              className="btn-primary btn-sm"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input text-sm"
          />
        </div>

        {isCreating && (
          <div className="p-3 border-b border-secondary-200 bg-secondary-50">
            <div className="flex gap-2">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Note title..."
                className="input text-sm flex-1"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreate()
                }}
              />
              <button onClick={handleCreate} className="btn-primary btn-sm">
                Add
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {filteredNotebooks.length === 0 ? (
            <div className="p-6 text-center">
              <FileText className="h-10 w-10 mx-auto text-secondary-300 mb-3" />
              <p className="text-sm text-secondary-600 mb-1">No notes yet</p>
              <p className="text-xs text-secondary-400">Create your first note to get started</p>
            </div>
          ) : (
            <div className="divide-y divide-secondary-100">
              {filteredNotebooks.map((notebook) => (
                <div
                  key={notebook.id}
                  onClick={() => setSelectedNotebook(notebook)}
                  className={`
                    p-4 cursor-pointer transition-colors
                    ${selectedNotebook?.id === notebook.id
                      ? 'bg-primary-50 border-l-2 border-primary-500'
                      : 'hover:bg-secondary-50'
                    }
                  `}
                >
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-medium text-secondary-900 line-clamp-1">
                      {notebook.title}
                    </h3>
                    <div className="flex items-center gap-1">
                      {notebook.importance > 0 && (
                        <Star className={`h-3 w-3 ${IMPORTANCE_COLORS[notebook.importance]}`} fill="currentColor" />
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-secondary-500 line-clamp-2 mb-2">
                    {notebook.content.slice(0, 100) || 'No content'}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-secondary-400">
                    <Clock className="h-3 w-3" />
                    {formatDate(notebook.updated_at)}
                  </div>
                  {notebook.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {notebook.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 text-xs bg-secondary-100 text-secondary-600 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Note Editor */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedNotebook ? (
          <>
            <div className="flex items-center justify-between px-6 py-4 border-b border-secondary-200">
              <input
                type="text"
                value={selectedNotebook.title}
                onChange={(e) => {
                  const updated = { ...selectedNotebook, title: e.target.value }
                  setSelectedNotebook(updated)
                }}
                onBlur={() => handleSave(selectedNotebook, { title: selectedNotebook.title })}
                className="text-xl font-semibold text-secondary-900 bg-transparent border-none outline-none focus:ring-0 w-full"
              />
              <div className="flex items-center gap-2">
                <select
                  value={selectedNotebook.importance}
                  onChange={(e) => {
                    const importance = parseInt(e.target.value)
                    setSelectedNotebook({ ...selectedNotebook, importance })
                    handleSave(selectedNotebook, { importance })
                  }}
                  className="input text-sm w-24"
                >
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <option key={i} value={i}>
                      {i === 0 ? 'No priority' : `${i} Star${i > 1 ? 's' : ''}`}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => handleSave(selectedNotebook, { content: selectedNotebook.content })}
                  className="btn-primary btn-sm"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    if (confirm('Delete this note?')) {
                      deleteNotebook(selectedNotebook.id)
                      setSelectedNotebook(null)
                    }
                  }}
                  className="btn-ghost btn-sm text-error-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="px-6 py-3 border-b border-secondary-100">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-secondary-400" />
                <input
                  type="text"
                  placeholder="Add tags (comma separated)"
                  value={selectedNotebook.tags.join(', ')}
                  onChange={(e) => {
                    const tags = e.target.value.split(',').map((t) => t.trim()).filter(Boolean)
                    setSelectedNotebook({ ...selectedNotebook, tags })
                  }}
                  onBlur={() => handleSave(selectedNotebook, { tags: selectedNotebook.tags })}
                  className="input text-sm flex-1"
                />
              </div>
            </div>

            <textarea
              value={selectedNotebook.content}
              onChange={(e) => setSelectedNotebook({ ...selectedNotebook, content: e.target.value })}
              placeholder="Start writing..."
              className="flex-1 p-6 resize-none border-none outline-none focus:ring-0 text-secondary-900"
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <FileText className="h-12 w-12 mx-auto text-secondary-300 mb-4" />
              <p className="text-secondary-600">Select a note to view or edit</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
