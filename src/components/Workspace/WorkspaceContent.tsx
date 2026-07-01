import { useState } from 'react'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { NotebookView } from '../Notebook/NotebookView'
import { AICanvas } from '../AICanvas/AICanvas'
import { YouTubeView } from '../YouTube/YouTubeView'
import { DocumentsView } from '../Documents/DocumentsView'
import { BookOpen, Sparkles, Video, FileText, History, LayoutGrid } from 'lucide-react'

type TabType = 'overview' | 'notebook' | 'canvas' | 'youtube' | 'documents' | 'history'

interface Tab {
  id: TabType
  label: string
  icon: React.ElementType
}

const tabs: Tab[] = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'notebook', label: 'Notebook', icon: BookOpen },
  { id: 'canvas', label: 'AI Canvas', icon: Sparkles },
  { id: 'youtube', label: 'YouTube', icon: Video },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'history', label: 'History', icon: History },
]

export function WorkspaceContent() {
  const { currentWorkspace, notebooks, videos, documents } = useWorkspace()
  const [activeTab, setActiveTab] = useState<TabType>('overview')

  if (!currentWorkspace) return null

  const stats = [
    { label: 'Notes', count: notebooks.length },
    { label: 'Videos', count: videos.length },
    { label: 'Documents', count: documents.length },
  ]

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-secondary-900 mb-2">
                {currentWorkspace.title}
              </h2>
              {currentWorkspace.description && (
                <p className="text-secondary-600">{currentWorkspace.description}</p>
              )}
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              {stats.map((stat) => (
                <div key={stat.label} className="card p-4">
                  <p className="text-2xl font-bold text-secondary-900">{stat.count}</p>
                  <p className="text-sm text-secondary-600">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {tabs
                .filter((t) => t.id !== 'overview')
                .map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="card p-4 hover:shadow-md transition-shadow text-left"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
                        <tab.icon className="h-5 w-5 text-primary-600" />
                      </div>
                      <span className="font-medium text-secondary-900">{tab.label}</span>
                    </div>
                    <p className="text-sm text-secondary-600">
                      {tab.id === 'notebook' && `${notebooks.length} notes`}
                      {tab.id === 'youtube' && `${videos.length} videos`}
                      {tab.id === 'documents' && `${documents.length} documents`}
                      {tab.id === 'canvas' && 'AI-powered transformations'}
                      {tab.id === 'history' && 'View learning activity'}
                    </p>
                  </button>
                ))}
            </div>

            {notebooks.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-secondary-900 mb-3">Recent Notes</h3>
                <div className="space-y-2">
                  {notebooks.slice(0, 3).map((notebook) => (
                    <div
                      key={notebook.id}
                      className="card p-3 hover:shadow-sm cursor-pointer"
                      onClick={() => setActiveTab('notebook')}
                    >
                      <p className="font-medium text-secondary-900">{notebook.title}</p>
                      <p className="text-sm text-secondary-500 line-clamp-1">
                        {notebook.content.slice(0, 100) || 'No content'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      case 'notebook':
        return <NotebookView />
      case 'canvas':
        return <AICanvas />
      case 'youtube':
        return <YouTubeView />
      case 'documents':
        return <DocumentsView />
      case 'history':
        return <HistoryView workspaceId={currentWorkspace.id} />
      default:
        return null
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Tab Navigation */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-secondary-200 bg-white overflow-x-auto scrollbar-thin">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
                transition-colors duration-150 whitespace-nowrap
                ${activeTab === tab.id
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-secondary-600 hover:bg-secondary-100'
                }
              `}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {renderContent()}
      </div>
    </div>
  )
}

function HistoryView({ }: { workspaceId: string }) {
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-secondary-900 mb-4">Learning History</h2>
      <p className="text-secondary-600">Your learning activities will appear here as you use the workspace.</p>
    </div>
  )
}
