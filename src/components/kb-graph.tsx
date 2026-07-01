import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen, FolderOpen, Layers, FileText, HelpCircle, Link as LinkIcon,
  RotateCcw, FileArchive, BookMarked, ChevronRight, Network,
} from 'lucide-react';
import type { SyllabusNode } from '../types';

interface GraphNode {
  id: string;
  label: string;
  level: string;
  x: number;
  y: number;
  icon: React.ReactNode;
  color: string;
}

interface GraphEdge {
  from: string;
  to: string;
}

const LEVEL_META: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  subject: { icon: <BookOpen size={14} />, color: 'bg-gray-900 text-white', label: 'Subject' },
  module: { icon: <FolderOpen size={14} />, color: 'bg-blue-100 text-blue-700', label: 'Module' },
  topic: { icon: <Layers size={14} />, color: 'bg-emerald-100 text-emerald-700', label: 'Topic' },
  subtopic: { icon: <FileText size={14} />, color: 'bg-amber-100 text-amber-700', label: 'Subtopic' },
};

/**
 * Knowledge Graph tab — renders the hierarchy around the selected node
 * as a visual indented tree with child entity counts (notes, questions,
 * resources, etc.). Cross-linking between topics is represented by the
 * topic_relationships table (shown as "Linked Topics" chips).
 */
export function KnowledgeGraphTab({ node, tree, onNavigate }: {
  node: SyllabusNode; tree: SyllabusNode[]; onNavigate: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set([node.data.id]));

  // Build the local sub-tree around the selected node
  const localTree = useMemo(() => {
    const findNode = (nodes: SyllabusNode[]): SyllabusNode | null => {
      for (const n of nodes) {
        if (n.data.id === node.data.id) return n;
        if (n.level !== 'subtopic') {
          const f = findNode((n as any).children ?? []);
          if (f) return f;
        }
      }
      return null;
    };
    return findNode(tree) ?? node;
  }, [node, tree]);

  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const renderNode = (n: SyllabusNode, depth: number): React.ReactNode => {
    const meta = LEVEL_META[n.level] ?? LEVEL_META.topic;
    const isExpanded = expanded.has(n.data.id);
    const children = n.level !== 'subtopic' ? ((n as any).children ?? []) : [];
    const hasChildren = children.length > 0;
    const isSelected = n.data.id === node.data.id;

    return (
      <div key={n.data.id}>
        <div
          className={`flex items-center gap-2 py-1.5 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-gray-100 ring-1 ring-gray-300' : 'hover:bg-gray-50'}`}
          style={{ paddingLeft: `${depth * 20 + 8}px` }}
          onClick={() => onNavigate(n.data.id)}
        >
          {hasChildren ? (
            <button
              onClick={(e) => { e.stopPropagation(); toggle(n.data.id); }}
              className="p-0.5 rounded hover:bg-gray-200 text-gray-400 shrink-0"
            >
              <ChevronRight size={14} className={`transition-transform duration-150 ${isExpanded ? 'rotate-90' : ''}`} />
            </button>
          ) : (
            <span className="w-5 shrink-0" />
          )}
          <span className={`shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-medium ${meta.color}`}>
            {meta.icon}
          </span>
          <span className={`text-[13px] truncate ${isSelected ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
            {n.data.name}
          </span>
          {hasChildren && (
            <span className="text-[10px] text-gray-400 ml-auto pr-2">
              {children.length} {n.level === 'subject' ? 'modules' : n.level === 'module' ? 'topics' : 'subtopics'}
            </span>
          )}
        </div>
        {hasChildren && isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            {children.map((child: SyllabusNode) => renderNode(child, depth + 1))}
          </motion.div>
        )}
      </div>
    );
  };

  // Entity legend
  const entityTypes = [
    { label: 'Notes', icon: <FileText size={12} />, color: 'text-blue-600' },
    { label: 'Questions', icon: <HelpCircle size={12} />, color: 'text-amber-600' },
    { label: 'Resources', icon: <LinkIcon size={12} />, color: 'text-cyan-600' },
    { label: 'Revisions', icon: <RotateCcw size={12} />, color: 'text-violet-600' },
    { label: 'Attachments', icon: <FileArchive size={12} />, color: 'text-emerald-600' },
    { label: 'Bookmarks', icon: <BookMarked size={12} />, color: 'text-pink-600' },
  ];

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Network size={16} className="text-gray-500" />
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Knowledge Graph</label>
      </div>

      <div className="bg-gray-50 rounded-lg p-3 mb-4 border border-gray-100">
        <p className="text-xs text-gray-600 mb-2">
          Hierarchical view: <span className="font-medium">Subject → Module → Topic → Subtopic</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {entityTypes.map(e => (
            <span key={e.label} className={`flex items-center gap-1 text-[10px] ${e.color}`}>
              {e.icon} {e.label}
            </span>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-3">
        {renderNode(localTree, 0)}
      </div>

      <p className="text-[10px] text-gray-400 mt-3 text-center">
        Click any node to navigate. Expand/collapse branches with the chevron.
      </p>
    </div>
  );
}
