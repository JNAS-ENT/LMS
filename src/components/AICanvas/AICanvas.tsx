import { useState } from 'react'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { Sparkles, Type, FileText, List, Table, MessageSquare, CircleHelp as HelpCircle, BrainCircuit, Save, Copy, RefreshCw } from 'lucide-react'

type TransformationType =
  | 'improve'
  | 'rewrite'
  | 'summarize'
  | 'expand'
  | 'simplify'
  | 'explain'
  | 'grammar'
  | 'bullets'
  | 'table'
  | 'examples'
  | 'quiz'
  | 'flashcards'
  | 'questions'
  | 'mindmap'

interface Transformation {
  id: TransformationType
  label: string
  icon: React.ElementType
  description: string
}

const transformations: Transformation[] = [
  { id: 'improve', label: 'Improve', icon: Sparkles, description: 'Enhance clarity and flow' },
  { id: 'rewrite', label: 'Rewrite', icon: Type, description: 'Completely rewrite the text' },
  { id: 'summarize', label: 'Summarize', icon: FileText, description: 'Create a concise summary' },
  { id: 'expand', label: 'Expand', icon: FileText, description: 'Add more detail and examples' },
  { id: 'simplify', label: 'Simplify', icon: Type, description: 'Make it easier to understand' },
  { id: 'explain', label: 'Explain', icon: MessageSquare, description: 'Explain like I\'m 5' },
  { id: 'grammar', label: 'Fix Grammar', icon: Type, description: 'Correct grammar and spelling' },
  { id: 'bullets', label: 'Bullet Points', icon: List, description: 'Convert to bullet list' },
  { id: 'table', label: 'Table', icon: Table, description: 'Convert to a table format' },
  { id: 'examples', label: 'Examples', icon: FileText, description: 'Generate examples' },
  { id: 'quiz', label: 'Quiz', icon: HelpCircle, description: 'Generate quiz questions' },
  { id: 'flashcards', label: 'Flashcards', icon: BrainCircuit, description: 'Create flashcards' },
  { id: 'questions', label: 'Interview Qs', icon: HelpCircle, description: 'Generate interview questions' },
  { id: 'mindmap', label: 'Mind Map', icon: BrainCircuit, description: 'Create mind map structure' },
]

export function AICanvas() {
  const { createNotebook, logActivity } = useWorkspace()
  const [inputText, setInputText] = useState('')
  const [outputText, setOutputText] = useState('')
  const [selectedTransformation, setSelectedTransformation] = useState<TransformationType | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [, setHistory] = useState<Array<{
    input: string
    output: string
    type: string
  }>>([])

  const handleTransform = async () => {
    if (!inputText.trim() || !selectedTransformation) return

    setIsProcessing(true)

    // Simulated AI transformation (in production, this would call an edge function)
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const transformation = transformations.find((t) => t.id === selectedTransformation)
    let result = ''

    switch (selectedTransformation) {
      case 'summarize':
        result = `[Summary]\n\nThis is a summarized version of your content. Key points include the main themes and concepts from your input text.\n\n• Main point 1\n• Main point 2\n• Main point 3`
        break
      case 'bullets':
        result = `• Point 1: First key concept\n• Point 2: Second key concept\n• Point 3: Third key concept\n• Point 4: Supporting detail\n• Point 5: Conclusion`
        break
      case 'expand':
        result = `${inputText}\n\n[Expanded Content]\n\nHere is additional detail and context for the concepts above...\n\nExample 1: Detailed explanation with examples.\n\nExample 2: Further elaboration on key points.`
        break
      case 'simplify':
        result = `[Simplified]\n\nHere's a simpler explanation:\n\n1. First concept explained simply\n2. Second concept made easy to understand\n3. Third concept broken down step by step`
        break
      case 'quiz':
        result = `[Quiz Questions]\n\n1. What is the main concept discussed?\n   a) Option A\n   b) Option B\n   c) Option C\n   d) Option D\n\n2. Which of the following best describes...?\n   a) Choice A\n   b) Choice B\n   c) Choice C\n\n3. True or False: [Statement about the content]`
        break
      case 'flashcards':
        result = `[Flashcards]\n\nFront: What is concept 1?\nBack: Definition and explanation of concept 1.\n\n---\n\nFront: Explain concept 2.\nBack: Detailed explanation of concept 2.\n\n---\n\nFront: Key term: [Term]\nBack: [Definition]`
        break
      case 'questions':
        result = `[Interview Questions]\n\n1. Can you explain the concept of X?\n\n2. How would you apply X in a real-world scenario?\n\n3. What are the advantages and disadvantages of X?\n\n4. Compare and contrast X with Y.\n\n5. What challenges might you face when implementing X?`
        break
      default:
        result = `[${transformation?.label || 'Transformed'}]\n\n${inputText}\n\n[AI-enhanced version of your content]`
    }

    setOutputText(result)
    setHistory((prev) => [
      { input: inputText, output: result, type: selectedTransformation },
      ...prev,
    ])
    setIsProcessing(false)
    await logActivity('ai_transformation', undefined, undefined, { type: selectedTransformation })
  }

  const handleSaveAsNote = async () => {
    if (!outputText.trim()) return
    const transformation = transformations.find((t) => t.id === selectedTransformation)
    await createNotebook(
      `AI ${transformation?.label || 'Output'} - ${new Date().toLocaleDateString()}`,
      outputText
    )
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(outputText)
  }

  return (
    <div className="flex h-full">
      {/* Left: Transformation Menu */}
      <div className="w-48 border-r border-secondary-200 bg-white overflow-y-auto scrollbar-thin">
        <div className="p-3 border-b border-secondary-200">
          <h3 className="text-sm font-semibold text-secondary-900">Transformations</h3>
        </div>
        <div className="p-2 space-y-1">
          {transformations.map((t) => {
            const Icon = t.icon
            return (
              <button
                key={t.id}
                onClick={() => setSelectedTransformation(t.id)}
                className={`
                  w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm
                  transition-colors
                  ${selectedTransformation === t.id
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-secondary-600 hover:bg-secondary-50'
                  }
                `}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <div>
                  <p className="font-medium">{t.label}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Center: Input/Output */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-secondary-200 bg-white">
          <h2 className="text-lg font-semibold text-secondary-900">AI Canvas</h2>
          <p className="text-sm text-secondary-500">
            Transform your text with AI-powered tools. Every output can be saved as a note.
          </p>
        </div>

        <div className="flex-1 grid grid-cols-2 divide-x divide-secondary-200">
          {/* Input */}
          <div className="flex flex-col bg-white">
            <div className="px-4 py-2 border-b border-secondary-200 text-sm font-medium text-secondary-700">
              Input
            </div>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste or type your text here..."
              className="flex-1 p-4 resize-none border-none outline-none focus:ring-0 text-secondary-900"
            />
          </div>

          {/* Output */}
          <div className="flex flex-col bg-secondary-50">
            <div className="flex items-center justify-between px-4 py-2 border-b border-secondary-200">
              <span className="text-sm font-medium text-secondary-700">Output</span>
              {outputText && (
                <div className="flex items-center gap-1">
                  <button onClick={handleCopy} className="btn-ghost btn-sm">
                    <Copy className="h-3 w-3" />
                  </button>
                  <button onClick={handleSaveAsNote} className="btn-primary btn-sm">
                    <Save className="h-3 w-3 mr-1" />
                    Save as Note
                  </button>
                </div>
              )}
            </div>
            <div className="flex-1 p-4 overflow-auto whitespace-pre-wrap text-secondary-900">
              {isProcessing ? (
                <div className="flex items-center justify-center h-full">
                  <div className="flex flex-col items-center gap-2">
                    <RefreshCw className="h-6 w-6 animate-spin text-primary-600" />
                    <p className="text-sm text-secondary-500">Processing...</p>
                  </div>
                </div>
              ) : outputText ? (
                outputText
              ) : (
                <p className="text-secondary-400">Output will appear here...</p>
              )}
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-secondary-200 bg-white">
          <p className="text-sm text-secondary-500">
            {selectedTransformation
              ? `Selected: ${transformations.find((t) => t.id === selectedTransformation)?.label}`
              : 'Select a transformation'}
          </p>
          <button
            onClick={handleTransform}
            disabled={!inputText.trim() || !selectedTransformation || isProcessing}
            className="btn-accent btn-md disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Transform
          </button>
        </div>
      </div>
    </div>
  )
}
