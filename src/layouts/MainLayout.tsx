import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useWorkspace } from '../contexts/WorkspaceContext'
import { LeftPanel } from '../components/LeftPanel/LeftPanel'
import { RightPanel } from '../components/RightPanel/RightPanel'
import { WorkspaceContent } from '../components/Workspace/WorkspaceContent'
import { EmptyState } from '../components/EmptyState'
import { BookOpen, LogOut, Menu, X } from 'lucide-react'

export function MainLayout() {
  const { user, signOut } = useAuth()
  const { workspaces, currentWorkspace, loading } = useWorkspace()
  const [leftPanelOpen, setLeftPanelOpen] = useState(true)
  const [rightPanelOpen, setRightPanelOpen] = useState(false)

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-secondary-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
          <span className="text-sm text-secondary-500">Loading workspace...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-secondary-50 overflow-hidden">
      {/* Mobile menu button */}
      <button
        onClick={() => setLeftPanelOpen(!leftPanelOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden btn-secondary btn-sm"
      >
        {leftPanelOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>

      {/* Left Panel - Topics/Workspaces List */}
      <div
        className={`
          fixed lg:relative inset-y-0 left-0 z-40 w-72
          transform transition-transform duration-200 ease-in-out
          ${leftPanelOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <LeftPanel onClose={() => setLeftPanelOpen(false)} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-secondary-200">
          <div className="flex items-center gap-3 ml-12 lg:ml-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-secondary-900">JNAS LMS</h1>
              <p className="text-xs text-secondary-500">
                {currentWorkspace ? currentWorkspace.title : 'Learning Workspace'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-secondary-600 hidden sm:block">
              {user?.email}
            </span>
            <button
              onClick={() => setRightPanelOpen(!rightPanelOpen)}
              className="btn-ghost btn-sm lg:hidden"
            >
              {rightPanelOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
            <button
              onClick={signOut}
              className="btn-ghost btn-sm hidden sm:flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </button>
            <button
              onClick={signOut}
              className="btn-ghost btn-sm sm:hidden"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Workspace Content */}
        <main className="flex-1 overflow-auto">
          {workspaces.length === 0 ? (
            <EmptyState />
          ) : currentWorkspace ? (
            <WorkspaceContent />
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-secondary-500">Select a workspace to begin</p>
            </div>
          )}
        </main>
      </div>

      {/* Right Panel - AI Assistant/Quick Notes */}
      <div
        className={`
          fixed lg:relative inset-y-0 right-0 z-40 w-80
          transform transition-transform duration-200 ease-in-out
          ${rightPanelOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0 lg:w-72'}
        `}
      >
        <RightPanel onClose={() => setRightPanelOpen(false)} />
      </div>

      {/* Overlay for mobile */}
      {leftPanelOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={() => setLeftPanelOpen(false)}
        />
      )}
    </div>
  )
}
