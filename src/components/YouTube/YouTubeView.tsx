import { useState } from 'react'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { Tables } from '../../lib/supabase'
import { Plus, Play, Trash2, FileText, List, BrainCircuit, Clock, ExternalLink } from 'lucide-react'

type Video = Tables<'workspace_videos'>

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

export function YouTubeView() {
  const { videos, createVideo, updateVideo, deleteVideo } = useWorkspace()
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [newUrl, setNewUrl] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [activeTab, setActiveTab] = useState<'summary' | 'transcript' | 'notes'>('summary')

  const handleAddVideo = async () => {
    if (!newUrl.trim()) return
    const videoId = extractYouTubeId(newUrl)
    if (!videoId) {
      alert('Please enter a valid YouTube URL')
      return
    }

    const video = await createVideo(newUrl.trim(), videoId)
    if (video) {
      setSelectedVideo(video)
      setNewUrl('')
      setIsAdding(false)

      // Simulate fetching video metadata
      setTimeout(() => {
        updateVideo(video.id, {
          title: 'YouTube Video',
          thumbnail_url: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          ai_summary: 'AI-generated summary will appear here after processing. This would include key concepts, main points, and important takeaways from the video content.',
          key_points: ['Key point 1', 'Key point 2', 'Key point 3'],
          chapters: [
            { time: '0:00', title: 'Introduction' },
            { time: '2:30', title: 'Main Topic' },
            { time: '10:00', title: 'Conclusion' },
          ],
        })
      }, 1000)
    }
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex h-full">
      {/* Videos List */}
      <div className="w-80 border-r border-secondary-200 bg-white flex flex-col">
        <div className="p-4 border-b border-secondary-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-secondary-900">YouTube</h2>
            <button
              onClick={() => setIsAdding(true)}
              className="btn-primary btn-sm"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {isAdding && (
          <div className="p-3 border-b border-secondary-200 bg-secondary-50">
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              YouTube URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="input text-sm flex-1"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddVideo()
                }}
              />
              <button onClick={handleAddVideo} className="btn-primary btn-sm">
                Add
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {videos.length === 0 ? (
            <div className="p-6 text-center">
              <Play className="h-10 w-10 mx-auto text-secondary-300 mb-3" />
              <p className="text-sm text-secondary-600 mb-1">No videos yet</p>
              <p className="text-xs text-secondary-400">Add a YouTube video to start learning</p>
            </div>
          ) : (
            <div className="divide-y divide-secondary-100">
              {videos.map((video) => (
                <div
                  key={video.id}
                  onClick={() => setSelectedVideo(video)}
                  className={`
                    p-3 cursor-pointer transition-colors
                    ${selectedVideo?.id === video.id
                      ? 'bg-primary-50 border-l-2 border-primary-500'
                      : 'hover:bg-secondary-50'
                    }
                  `}
                >
                  <div className="flex gap-3">
                    {video.thumbnail_url ? (
                      <img
                        src={video.thumbnail_url}
                        alt={video.title || 'Video thumbnail'}
                        className="w-24 h-14 object-cover rounded"
                      />
                    ) : (
                      <div className="w-24 h-14 bg-secondary-200 rounded flex items-center justify-center">
                        <Play className="h-5 w-5 text-secondary-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-secondary-900 text-sm line-clamp-2">
                        {video.title || 'Processing...'}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-xs text-secondary-400">
                        <Clock className="h-3 w-3" />
                        {formatDuration(video.duration)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Video Content */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden">
        {selectedVideo ? (
          <>
            {/* Video Player */}
            <div className="relative bg-black aspect-video max-h-[50vh]">
              <iframe
                src={`https://www.youtube.com/embed/${selectedVideo.video_id}`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 px-4 py-2 border-b border-secondary-200 bg-white">
              {[
                { id: 'summary', label: 'Summary', icon: FileText },
                { id: 'transcript', label: 'Transcript', icon: List },
                { id: 'notes', label: 'Notes', icon: FileText },
              ].map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
                      transition-colors
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

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === 'summary' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-secondary-900 mb-2">AI Summary</h3>
                    <p className="text-secondary-700">
                      {selectedVideo.ai_summary || 'Processing video content...'}
                    </p>
                  </div>

                  {selectedVideo.key_points && Array.isArray(selectedVideo.key_points) && (
                    <div>
                      <h3 className="font-semibold text-secondary-900 mb-2">Key Points</h3>
                      <ul className="space-y-2">
                        {selectedVideo.key_points.map((point, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <div className="h-5 w-5 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                              {i + 1}
                            </div>
                            <span className="text-secondary-700">{point as string}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedVideo.chapters && Array.isArray(selectedVideo.chapters) && (
                    <div>
                      <h3 className="font-semibold text-secondary-900 mb-2">Chapters</h3>
                      <div className="space-y-2">
                        {selectedVideo.chapters.map((chapter, i) => (
                          <div key={i} className="flex items-center gap-3 text-sm">
                            <span className="text-secondary-500 font-mono">{(chapter as { time: string }).time}</span>
                            <span className="text-secondary-700">{(chapter as { title: string }).title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-6 pt-4 border-t border-secondary-200">
                    <button
                      onClick={() => {
                        updateVideo(selectedVideo.id, {
                          learning_notes: selectedVideo.learning_notes || '',
                        })
                        setActiveTab('notes')
                      }}
                      className="btn-accent btn-sm"
                    >
                      <BrainCircuit className="h-4 w-4 mr-1" />
                      Generate Learning Materials
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'transcript' && (
                <div className="prose prose-sm max-w-none">
                  {selectedVideo.transcript || (
                    <p className="text-secondary-500">
                      Transcript will be available after processing. This would show the full video transcript with timestamps.
                    </p>
                  )}
                </div>
              )}

              {activeTab === 'notes' && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-secondary-900">Your Learning Notes</h3>
                  <textarea
                    value={selectedVideo.learning_notes || ''}
                    onChange={(e) => {
                      setSelectedVideo({ ...selectedVideo, learning_notes: e.target.value })
                    }}
                    onBlur={() => {
                      if (selectedVideo.learning_notes !== undefined) {
                        updateVideo(selectedVideo.id, { learning_notes: selectedVideo.learning_notes })
                      }
                    }}
                    placeholder="Add your personal notes about this video..."
                    className="w-full h-64 p-4 border border-secondary-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        // Could create a notebook entry here
                        console.log('Save notes to notebook')
                      }}
                      className="btn-primary btn-sm"
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Save to Notebook
                    </button>
                    <a
                      href={selectedVideo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary btn-sm inline-flex items-center"
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Open on YouTube
                    </a>
                    <button
                      onClick={() => {
                        if (confirm('Delete this video?')) {
                          deleteVideo(selectedVideo.id)
                          setSelectedVideo(null)
                        }
                      }}
                      className="btn-ghost btn-sm text-error-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Play className="h-12 w-12 mx-auto text-secondary-300 mb-4" />
              <p className="text-secondary-600">Select a video to view</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
