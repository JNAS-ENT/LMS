import { X } from 'lucide-react';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
}

export default function TagInput({ tags, onChange }: TagInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = (e.target as HTMLInputElement).value.trim();
      if (val && !tags.includes(val)) {
        onChange([...tags, val]);
        (e.target as HTMLInputElement).value = '';
      }
    }
    if (e.key === 'Backspace' && (e.target as HTMLInputElement).value === '' && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  return (
    <div className="flex flex-wrap gap-1.5 p-2 bg-gray-50 border border-gray-200 rounded-lg min-h-[38px] focus-within:ring-2 focus-within:ring-gray-900/10 focus-within:border-gray-300 transition-all">
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-gray-200 rounded text-xs text-gray-700"
        >
          {tag}
          <button type="button" onClick={() => onChange(tags.filter((t) => t !== tag))} className="text-gray-400 hover:text-gray-600">
            <X size={10} />
          </button>
        </span>
      ))}
      <input
        type="text"
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? 'Add tags (press Enter)' : ''}
        className="flex-1 min-w-[80px] bg-transparent text-sm outline-none placeholder:text-gray-400"
      />
    </div>
  );
}
