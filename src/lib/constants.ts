export const VAULT_SECRET = 'vault-a8f7k2m9x1';

export const KB_CATEGORIES = [
  'Python',
  'SQL',
  'Machine Learning',
  'Deep Learning',
  'Generative AI',
  'LLM Engineering',
  'MLOps',
  'Data Engineering',
  'Cloud Computing',
  'System Design',
  'Career Development',
  'Leadership',
  'Business',
] as const;

export type KBCategory = (typeof KB_CATEGORIES)[number];

export const CODE_LANGUAGES = ['Python', 'SQL', 'JavaScript', 'Bash', 'PowerShell'] as const;
export type CodeLanguage = (typeof CODE_LANGUAGES)[number];

export const PROJECT_STATUSES = ['Planned', 'Active', 'Completed'] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const ROADMAP_STATUSES = ['Not Started', 'In Progress', 'Completed'] as const;
export type RoadmapStatus = (typeof ROADMAP_STATUSES)[number];

export const BOOKMARK_CATEGORIES = ['YouTube', 'GitHub', 'Courses', 'Blogs', 'Documentation'] as const;
export type BookmarkCategory = (typeof BOOKMARK_CATEGORIES)[number];

export const NOTE_COLORS = [
  { name: 'White', value: '#FFFFFF' },
  { name: 'Yellow', value: '#FEF3C7' },
  { name: 'Green', value: '#D1FAE5' },
  { name: 'Blue', value: '#DBEAFE' },
  { name: 'Pink', value: '#FCE7F3' },
  { name: 'Purple', value: '#EDE9FE' },
  { name: 'Orange', value: '#FFEDD5' },
];
