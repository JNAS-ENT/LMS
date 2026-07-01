import { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Bold, Italic, Heading1, Heading2, Heading3, List, ListOrdered,
  CheckSquare, Code, Table, Link as LinkIcon, Quote, Image,
  Eye, Edit3, EyeOff,
} from 'lucide-react';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export default function MarkdownEditor({ value, onChange, placeholder = 'Write in Markdown...', minHeight = '240px' }: MarkdownEditorProps) {
  const [mode, setMode] = useState<'edit' | 'preview' | 'split'>('edit');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertAtCursor = useCallback((before: string, after: string = '', placeholderText: string = '') => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = value.slice(start, end) || placeholderText;
    const newVal = value.slice(0, start) + before + selected + after + value.slice(end);
    onChange(newVal);
    requestAnimationFrame(() => {
      ta.focus();
      const cursorPos = start + before.length + selected.length + after.length;
      ta.setSelectionRange(start + before.length, cursorPos - after.length);
    });
  }, [value, onChange]);

  const insertLine = useCallback((prefix: string, placeholderText: string = '') => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const newVal = value.slice(0, lineStart) + prefix + value.slice(lineStart);
    onChange(newVal);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(lineStart + prefix.length, lineStart + prefix.length);
    });
  }, [value, onChange]);

  const tools = [
    { icon: Heading1, title: 'Heading 1', action: () => insertLine('# ', 'Heading') },
    { icon: Heading2, title: 'Heading 2', action: () => insertLine('## ', 'Heading') },
    { icon: Heading3, title: 'Heading 3', action: () => insertLine('### ', 'Heading') },
    { icon: Bold, title: 'Bold', action: () => insertAtCursor('**', '**', 'bold') },
    { icon: Italic, title: 'Italic', action: () => insertAtCursor('*', '*', 'italic') },
    { icon: List, title: 'Bullet List', action: () => insertLine('- ', 'item') },
    { icon: ListOrdered, title: 'Numbered List', action: () => insertLine('1. ', 'item') },
    { icon: CheckSquare, title: 'Checklist', action: () => insertLine('- [ ] ', 'task') },
    { icon: Code, title: 'Code Block', action: () => insertAtCursor('\n```python\n', '\n```\n', 'code') },
    { icon: Quote, title: 'Quote', action: () => insertLine('> ', 'quote') },
    { icon: LinkIcon, title: 'Link', action: () => insertAtCursor('[', '](https://)', 'text') },
    { icon: Image, title: 'Image', action: () => insertAtCursor('![', '](https://)', 'alt text') },
    { icon: Table, title: 'Table', action: () => insertAtCursor('\n| Column 1 | Column 2 |\n| --- | --- |\n| ', ' | |\n', 'cell') },
  ];

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-2 py-1">
        <div className="flex items-center gap-0.5 flex-wrap">
          {tools.map((t, i) => {
            const Icon = t.icon;
            return (
              <button key={i} type="button" title={t.title} onClick={t.action}
                className="p-1.5 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors">
                <Icon size={14} />
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setMode('edit')} title="Edit only"
            className={`p-1.5 rounded transition-colors ${mode === 'edit' ? 'bg-gray-200 text-gray-700' : 'text-gray-400 hover:text-gray-600'}`}>
            <Edit3 size={14} />
          </button>
          <button type="button" onClick={() => setMode('split')} title="Split view"
            className={`p-1.5 rounded transition-colors ${mode === 'split' ? 'bg-gray-200 text-gray-700' : 'text-gray-400 hover:text-gray-600'}`}>
            <EyeOff size={14} />
          </button>
          <button type="button" onClick={() => setMode('preview')} title="Preview only"
            className={`p-1.5 rounded transition-colors ${mode === 'preview' ? 'bg-gray-200 text-gray-700' : 'text-gray-400 hover:text-gray-600'}`}>
            <Eye size={14} />
          </button>
        </div>
      </div>

      {/* Editor / Preview */}
      <div className={`flex ${mode === 'split' ? 'flex-col md:flex-row' : ''}`}>
        {mode !== 'preview' && (
          <div className={mode === 'split' ? 'w-full md:w-1/2 border-b md:border-b-0 md:border-r border-gray-100' : 'w-full'}>
            <textarea
              ref={textareaRef}
              value={value}
              onChange={e => onChange(e.target.value)}
              placeholder={placeholder}
              style={{ minHeight }}
              className="w-full p-3 text-sm font-mono text-gray-800 focus:outline-none resize-y bg-white"
              spellCheck={false}
            />
          </div>
        )}
        {mode !== 'edit' && (
          <div className={`p-3 overflow-auto prose prose-sm max-w-none ${mode === 'split' ? 'w-full md:w-1/2' : 'w-full'}`}
            style={{ minHeight }}>
            {value.trim() ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                // Render checklist items nicely
                li: ({ children, ...props }) => {
                  const text = String(children);
                  if (text.startsWith('[x] ') || text.startsWith('[ ] ')) {
                    const checked = text.startsWith('[x] ');
                    return (
                      <li {...props} className="flex items-start gap-2 list-none">
                        <input type="checkbox" checked={checked} readOnly className="mt-1" />
                        <span>{text.slice(4)}</span>
                      </li>
                    );
                  }
                  return <li {...props}>{children}</li>;
                },
                code: ({ inline, className, children, ...props }: any) => {
                  if (inline) {
                    return <code className="px-1 py-0.5 bg-gray-100 rounded text-xs font-mono text-gray-800" {...props}>{children}</code>;
                  }
                  return (
                    <pre className="bg-gray-900 text-gray-100 rounded-lg p-3 overflow-x-auto my-2">
                      <code className={className} {...props}>{children}</code>
                    </pre>
                  );
                },
              }}>
                {value}
              </ReactMarkdown>
            ) : (
              <p className="text-gray-300 text-sm">Preview will appear here...</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
