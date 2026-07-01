import { useState } from 'react'
import { useWorkspace } from '../contexts/WorkspaceContext'
import { FolderOpen, Plus, Sparkles, BookOpen, Video, FileText } from 'lucide-react'

export function EmptyState() {
  const { createWorkspace } = useWorkspace()
  const [title, setTitle] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const handleCreate = async () => {
    if (!title.trim()) return
    await createWorkspace(title.trim())
    setTitle('')
    setIsCreating(false)
  }

  const features = [
    {
      icon: BookOpen,
      title: 'Notebooks',
      description: 'Unlimited notes with tags, version history, and references',
    },
    {
      icon: Sparkles,
      title: 'AI Canvas',
      description: 'Transform text with AI: summarize, expand, generate quizzes',
    },
    {
      icon: Video,
      title: 'YouTube Learning',
      description: 'Extract transcripts, summaries, and flashcards from videos',
    },
    {
      icon: FileText,
      title: 'Documents',
      description: 'Upload PDFs and documents with AI-powered summaries',
    },
  ]

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-4 py-12">
      <div className="max-w-lg w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100">
              <FolderOpen className="h-8 w-8 text-primary-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-secondary-900 mb-2">
            Welcome to JNAS LMS
          </h2>
          <p className="text-secondary-600">
            Create your first learning workspace to begin your journey
          </p>
        </div>

        {!isCreating ? (
          <div className="text-center">
            <button
              onClick={() => setIsCreating(true)}
              className="btn-primary btn-lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Your First Workspace
            </button>
          </div>
        ) : (
          <div className="card p-4">
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Workspace Name
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Machine Learning, Web Development..."
                className="input flex-1"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreate()
                }}
              />
              <button onClick={handleCreate} className="btn-primary btn-md">
                Create
              </button>
            </div>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="card p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary-50">
                  <feature.icon className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-medium text-secondary-900">{feature.title}</h3>
                  <p className="text-sm text-secondary-600">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
