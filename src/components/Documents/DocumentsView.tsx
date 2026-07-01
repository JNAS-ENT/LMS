import { useState, useRef } from 'react'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { Tables } from '../../lib/supabase'
import { FileText, Trash2, Download, Upload, File, Search, Tag, Clock } from 'lucide-react'

type Document = Tables<'workspace_documents'>

const FILE_ICONS: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'text/plain': 'txt',
  'text/markdown': 'md',
}

const FILE_COLORS: Record<string, string> = {
  pdf: 'bg-red-100 text-red-700',
  doc: 'bg-blue-100 text-blue-700',
  docx: 'bg-blue-100 text-blue-700',
  txt: 'bg-gray-100 text-gray-700',
  md: 'bg-purple-100 text-purple-700',
  default: 'bg-secondary-100 text-secondary-700',
}

export function DocumentsView() {
  const { documents, createDocument, deleteDocument } = useWorkspace()
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filteredDocuments = documents.filter((d) =>
    d.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.keywords && d.keywords.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase())))
  )

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)

    // In production, upload to Supabase storage first
    const mockFilePath = `/documents/${file.name}`

    const doc = await createDocument(file, mockFilePath)

    if (doc) {
      setSelectedDocument(doc)
    }

    setIsUploading(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getFileTypeLabel = (type: string) => {
    return FILE_ICONS[type] || type.split('/')[1]?.toUpperCase() || 'FILE'
  }

  return (
    <div className="flex h-full">
      {/* Documents List */}
      <div className="w-80 border-r border-secondary-200 bg-white flex flex-col">
        <div className="p-4 border-b border-secondary-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-secondary-900">Documents</h2>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-primary btn-sm"
              disabled={isUploading}
            >
              {isUploading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              accept=".pdf,.doc,.docx,.txt,.md,.ppt,.pptx,.xls,.xlsx"
            />
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-400" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input text-sm pl-9"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {filteredDocuments.length === 0 ? (
            <div className="p-6 text-center">
              <File className="h-10 w-10 mx-auto text-secondary-300 mb-3" />
              <p className="text-sm text-secondary-600 mb-1">No documents yet</p>
              <p className="text-xs text-secondary-400">Upload PDFs, documents, or images</p>
            </div>
          ) : (
            <div className="divide-y divide-secondary-100">
              {filteredDocuments.map((doc) => {
                const fileType = getFileTypeLabel(doc.file_type)
                const colorClass = FILE_COLORS[fileType] || FILE_COLORS.default

                return (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDocument(doc)}
                    className={`
                      p-3 cursor-pointer transition-colors
                      ${selectedDocument?.id === doc.id
                        ? 'bg-primary-50 border-l-2 border-primary-500'
                        : 'hover:bg-secondary-50'
                      }
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${colorClass}`}
                      >
                        <span className="text-xs font-bold">{fileType}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-secondary-900 text-sm truncate">
                          {doc.file_name}
                        </h3>
                        <p className="text-xs text-secondary-400 mt-1">
                          {formatFileSize(doc.file_size)}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-secondary-400">
                          <Clock className="h-3 w-3" />
                          {new Date(doc.uploaded_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Document Viewer */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden">
        {selectedDocument ? (
          <>
            <div className="flex items-center justify-between px-6 py-4 border-b border-secondary-200">
              <div>
                <h2 className="text-lg font-semibold text-secondary-900">
                  {selectedDocument.file_name}
                </h2>
                <p className="text-sm text-secondary-500">
                  Uploaded {new Date(selectedDocument.uploaded_at).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button className="btn-secondary btn-sm">
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </button>
                <button
                  onClick={() => {
                    if (confirm('Delete this document?')) {
                      deleteDocument(selectedDocument.id)
                      setSelectedDocument(null)
                    }
                  }}
                  className="btn-ghost btn-sm text-error-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-3xl mx-auto space-y-6">
                {/* Document Info */}
                <div className="card p-4">
                  <h3 className="font-semibold text-secondary-900 mb-3">Document Info</h3>
                  <div className="grid sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-secondary-500">Type:</span>
                      <span className="ml-2 text-secondary-900">{selectedDocument.file_type}</span>
                    </div>
                    <div>
                      <span className="text-secondary-500">Size:</span>
                      <span className="ml-2 text-secondary-900">
                        {formatFileSize(selectedDocument.file_size)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* AI Summary */}
                <div className="card p-4">
                  <h3 className="font-semibold text-secondary-900 mb-3">
                    <span className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary-600" />
                      AI Summary
                    </span>
                  </h3>
                  <p className="text-secondary-700">
                    {selectedDocument.summary || (
                      <span className="text-secondary-400 italic">
                        Processing document content...
                      </span>
                    )}
                  </p>
                </div>

                {/* Keywords */}
                {selectedDocument.keywords && selectedDocument.keywords.length > 0 && (
                  <div className="card p-4">
                    <h3 className="font-semibold text-secondary-900 mb-3 flex items-center gap-2">
                      <Tag className="h-4 w-4 text-primary-600" />
                      Keywords
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedDocument.keywords.map((keyword, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-secondary-100 text-secondary-700 rounded-full text-sm"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Highlights */}
                {selectedDocument.highlights && (
                  <div className="card p-4">
                    <h3 className="font-semibold text-secondary-900 mb-3">Highlights</h3>
                    <div className="prose prose-sm max-w-none">
                      {selectedDocument.highlights}
                    </div>
                  </div>
                )}

                {/* Placeholder for actual file preview */}
                <div className="card p-8 bg-secondary-50">
                  <div className="flex flex-col items-center justify-center text-center">
                    <File className="h-12 w-12 text-secondary-300 mb-4" />
                    <p className="text-secondary-600">
                      Document preview would appear here
                    </p>
                    <p className="text-sm text-secondary-400 mt-1">
                      Full integration with PDF.js for PDF viewing
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <File className="h-12 w-12 mx-auto text-secondary-300 mb-4" />
              <p className="text-secondary-600">Select a document to view</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
