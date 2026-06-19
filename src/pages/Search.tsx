import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search as SearchIcon, BookOpen, Layers, FolderOpen, FileText, HelpCircle, Link, Check, Tag } from 'lucide-react';
import { globalSearch } from '../services/vault';
import type { GlobalSearchResult } from '../types';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  subject: <BookOpen size={16} className="text-gray-600" />,
  module: <FolderOpen size={16} className="text-blue-500" />,
  topic: <Layers size={16} className="text-emerald-500" />,
  subtopic: <FileText size={16} className="text-amber-500" />,
  note: <BookOpen size={16} className="text-blue-500" />,
  question: <HelpCircle size={16} className="text-amber-500" />,
  resource: <Link size={16} className="text-cyan-500" />,
  highlight: <Check size={16} className="text-pink-500" />,
};

const TYPE_LABELS: Record<string, string> = {
  subject: 'Subject',
  module: 'Module',
  topic: 'Topic',
  subtopic: 'Subtopic',
  note: 'Note',
  question: 'Question',
  resource: 'Resource',
  highlight: 'Highlight',
};

export default function Search() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await globalSearch(query);
        setResults(data);
      } catch {
        setResults([]);
      }
      setLoading(false);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const handleClickResult = (result: GlobalSearchResult) => {
    // Navigate to knowledge base for syllabus items
    if (['subject', 'module', 'topic', 'subtopic'].includes(result.type)) {
      navigate('/knowledge');
    }
  };

  const groupedResults = results.reduce((acc, r) => {
    if (!acc[r.type]) acc[r.type] = [];
    acc[r.type].push(r);
    return acc;
  }, {} as Record<string, GlobalSearchResult[]>);

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <h1 className="text-xl font-semibold text-gray-900 tracking-tight mb-6">Global Knowledge Search</h1>

      <div className="relative mb-6">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search subjects, topics, notes, questions, resources, highlights..."
          className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-all shadow-sm"
          autoFocus
        />
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
        </div>
      )}

      {!loading && query && results.length === 0 && (
        <div className="text-center py-12">
          <p className="text-sm text-gray-500">No results found for "{query}"</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-4">
          <p className="text-xs text-gray-400">{results.length} result{results.length !== 1 ? 's' : ''}</p>
          {Object.entries(groupedResults).map(([type, items]) => (
            <div key={type} className="space-y-1">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-2">
                {TYPE_ICONS[type]}
                {TYPE_LABELS[type]} ({items.length})
              </h3>
              <AnimatePresence>
                {items.map((r, i) => (
                  <motion.button
                    key={`${r.type}-${r.id}`}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => handleClickResult(r)}
                    className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-white hover:shadow-sm transition-all cursor-pointer border border-transparent hover:border-gray-200/60 text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 mt-0.5">
                      {TYPE_ICONS[r.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{r.title}</p>
                      {r.subtitle && <p className="text-xs text-gray-500 truncate">{r.subtitle}</p>}
                      {r.parentPath && <p className="text-[10px] text-gray-400 truncate">{r.parentPath}</p>}
                      {r.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {r.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full flex items-center gap-0.5">
                              <Tag size={8} />{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="text-[11px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded shrink-0">{TYPE_LABELS[r.type]}</span>
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}

      {!query && (
        <div className="text-center py-16">
          <SearchIcon className="text-gray-300 mx-auto mb-4" size={40} />
          <p className="text-sm text-gray-500">Search across your entire knowledge network</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {['subjects', 'modules', 'topics', 'notes', 'questions', 'resources', 'highlights'].map((type) => (
              <span key={type} className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded-full capitalize">{type}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
