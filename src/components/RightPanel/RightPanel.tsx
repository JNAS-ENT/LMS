import { useState, useEffect } from 'react'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { supabase } from '../../lib/supabase'
import { Tables } from '../../lib/supabase'
import { X, Plus, CircleCheck as CheckCircle, Circle, Zap, ListTodo, Activity, ChevronRight } from 'lucide-react'

interface RightPanelProps {
  onClose?: () => void
}

type Task = Tables<'workspace_tasks'>
type Capture = Tables<'workspace_captures'>

export function RightPanel({ onClose }: RightPanelProps) {
  const { currentWorkspace, logActivity } = useWorkspace()
  const [activeTab, setActiveTab] = useState<'capture' | 'tasks' | 'activity'>('capture')
  const [tasks, setTasks] = useState<Task[]>([])
  const [captures, setCaptures] = useState<Capture[]>([])
  const [history, setHistory] = useState<Array<{
    id: string
    action_type: string
    created_at: string
    workspace_id: string | null
  }>>([])
  const [newTask, setNewTask] = useState('')
  const [newCapture, setNewCapture] = useState('')
  const [, setLoading] = useState(false)

  useEffect(() => {
    fetchData()
  }, [currentWorkspace])

  const fetchData = async () => {
    setLoading(true)

    const [tasksRes, capturesRes, historyRes] = await Promise.all([
      supabase
        .from('workspace_tasks')
        .select('*')
        .eq('workspace_id', currentWorkspace?.id || '')
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('workspace_captures')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('workspace_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20),
    ])

    if (tasksRes.data) setTasks(tasksRes.data)
    if (capturesRes.data) setCaptures(capturesRes.data)
    if (historyRes.data) setHistory(historyRes.data)

    setLoading(false)
  }

  const handleAddTask = async () => {
    if (!newTask.trim() || !currentWorkspace) return

    const { data, error } = await supabase
      .from('workspace_tasks')
      .insert({
        title: newTask.trim(),
        workspace_id: currentWorkspace.id,
      })
      .select()
      .single()

    if (!error && data) {
      setTasks([data, ...tasks])
      setNewTask('')
    }
  }

  const handleToggleTask = async (task: Task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed'

    const { error } = await supabase
      .from('workspace_tasks')
      .update({ status: newStatus })
      .eq('id', task.id)

    if (!error) {
      setTasks(tasks.map((t) =>
        t.id === task.id ? { ...t, status: newStatus } : t
      ))
    }
  }

  const handleAddCapture = async () => {
    if (!newCapture.trim()) return

    const { data, error } = await supabase
      .from('workspace_captures')
      .insert({
        content: newCapture.trim(),
        capture_type: 'text',
        workspace_id: currentWorkspace?.id,
      })
      .select()
      .single()

    if (!error && data) {
      setCaptures([data, ...captures])
      setNewCapture('')
      await logActivity('quick_capture', data.id)
    }
  }

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  const ACTION_LABELS: Record<string, string> = {
    note_created: 'Created a note',
    video_added: 'Added a video',
    document_uploaded: 'Uploaded a document',
    ai_transformation: 'AI transformation',
    quick_capture: 'Quick capture',
  }

  return (
    <div className="flex h-full flex-col bg-white border-l border-secondary-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-secondary-200">
        <div className="flex items-center gap-1">
          {[
            { id: 'capture', icon: Zap, label: 'Capture' },
            { id: 'tasks', icon: ListTodo, label: 'Tasks' },
            { id: 'activity', icon: Activity, label: 'Activity' },
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`
                  p-2 rounded-lg transition-colors
                  ${activeTab === tab.id
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-secondary-500 hover:bg-secondary-100'
                  }
                `}
                title={tab.label}
              >
                <Icon className="h-4 w-4" />
              </button>
            )
          })}
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden btn-ghost btn-sm">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {activeTab === 'capture' && (
          <div className="p-3 space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={newCapture}
                onChange={(e) => setNewCapture(e.target.value)}
                placeholder="Quick capture..."
                className="input text-sm flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddCapture()
                }}
              />
              <button onClick={handleAddCapture} className="btn-primary btn-sm">
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              {captures.length === 0 ? (
                <div className="p-4 text-center">
                  <Zap className="h-6 w-6 mx-auto text-secondary-300 mb-2" />
                  <p className="text-xs text-secondary-500">
                    Capture ideas, notes, or thoughts quickly
                  </p>
                </div>
              ) : (
                captures.map((capture) => (
                  <div
                    key={capture.id}
                    className="p-2 bg-secondary-50 rounded-lg text-sm"
                  >
                    <p className="text-secondary-700">{capture.content}</p>
                    <p className="text-xs text-secondary-400 mt-1">
                      {formatTimeAgo(capture.created_at)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="p-3 space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="Add a task..."
                className="input text-sm flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddTask()
                }}
              />
              <button onClick={handleAddTask} className="btn-primary btn-sm">
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              {tasks.length === 0 ? (
                <div className="p-4 text-center">
                  <ListTodo className="h-6 w-6 mx-auto text-secondary-300 mb-2" />
                  <p className="text-xs text-secondary-500">No tasks yet</p>
                </div>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => handleToggleTask(task)}
                    className={`
                      flex items-start gap-2 p-2 rounded-lg cursor-pointer
                      transition-colors hover:bg-secondary-50
                      ${task.status === 'completed' ? 'opacity-50' : ''}
                    `}
                  >
                    {task.status === 'completed' ? (
                      <CheckCircle className="h-4 w-4 text-success-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="h-4 w-4 text-secondary-400 flex-shrink-0 mt-0.5" />
                    )}
                    <span className={`
                      text-sm
                      ${task.status === 'completed' ? 'line-through text-secondary-500' : 'text-secondary-700'}
                    `}>
                      {task.title}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="p-3 space-y-2">
            {history.length === 0 ? (
              <div className="p-4 text-center">
                <Activity className="h-6 w-6 mx-auto text-secondary-300 mb-2" />
                <p className="text-xs text-secondary-500">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-2">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-2 p-2 text-sm"
                  >
                    <ChevronRight className="h-4 w-4 text-secondary-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-secondary-700">
                        {ACTION_LABELS[item.action_type] || item.action_type}
                      </p>
                      <p className="text-xs text-secondary-400">
                        {formatTimeAgo(item.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-secondary-200 bg-secondary-50">
        <p className="text-xs text-secondary-400 text-center">
          {currentWorkspace ? currentWorkspace.title : 'No workspace selected'}
        </p>
      </div>
    </div>
  )
}
