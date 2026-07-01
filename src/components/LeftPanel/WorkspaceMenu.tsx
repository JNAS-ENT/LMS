import { useState } from 'react'
import { MoveHorizontal as MoreHorizontal, Trash2 } from 'lucide-react'

interface WorkspaceMenuProps {
  onDelete: () => void
}

export function WorkspaceMenu({ onDelete }: WorkspaceMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-secondary-200 transition-opacity"
      >
        <MoreHorizontal className="h-4 w-4 text-secondary-400" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1 z-20 w-40 py-1 bg-white rounded-lg shadow-lg border border-secondary-200">
            <button
              onClick={() => {
                setIsOpen(false)
                onDelete()
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-error-600 hover:bg-error-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete workspace
            </button>
          </div>
        </>
      )}
    </div>
  )
}
