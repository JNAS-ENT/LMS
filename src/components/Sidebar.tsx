import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  Code2,
  FileText,
  FolderKanban,
  Map,
  Bookmark,
  StickyNote,
  Search,
  Settings,
  X,
  Brain,
  Archive,
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/knowledge', icon: BookOpen, label: 'Knowledge Base' },
  { to: '/journal', icon: CalendarDays, label: 'Daily Journal' },
  { to: '/code', icon: Code2, label: 'Code Vault' },
  { to: '/papers', icon: FileText, label: 'Research Papers' },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/roadmap', icon: Map, label: 'Learning Roadmap' },
  { to: '/bookmarks', icon: Bookmark, label: 'Bookmarks' },
  { to: '/quick-notes', icon: StickyNote, label: 'Quick Notes' },
  { to: '/search', icon: Search, label: 'Search' },
  { to: '/recycle-bin', icon: Archive, label: 'Recycle Bin' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const location = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white/80 backdrop-blur-xl border-r border-gray-200/60 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
              <Brain className="w-4.5 h-4.5 text-white" size={18} />
            </div>
            <span className="font-semibold text-gray-900 text-[15px] tracking-tight">Learning Vault</span>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 rounded-md hover:bg-gray-100 text-gray-400">
            <X size={18} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {navItems.map((item) => {
            const isActive =
              item.to === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.to);

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive: active }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                    active || isActive
                      ? 'bg-gray-900 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`
                }
              >
                <item.icon size={16} strokeWidth={isActive ? 2 : 1.5} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100">
          <p className="text-[11px] text-gray-400">Personal AI Learning Vault</p>
        </div>
      </aside>
    </>
  );
}
