export interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

// ─── Syllabus hierarchy ────────────────────────────────────────

export type LearningStatus = 'Not Started' | 'Learning' | 'Practicing' | 'Completed' | 'Revised' | 'Mastered';

export interface Subject {
  id: string;
  name: string;
  description: string;
  display_order: number;
  tags: string[];
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Module {
  id: string;
  subject_id: string;
  name: string;
  description: string;
  display_order: number;
  tags: string[];
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Topic {
  id: string;
  module_id: string;
  name: string;
  description: string;
  display_order: number;
  status: LearningStatus;
  progress: number;
  notes_content: string;
  tags: string[];
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Subtopic {
  id: string;
  topic_id: string;
  name: string;
  description: string;
  display_order: number;
  status: LearningStatus;
  progress: number;
  notes_content: string;
  tags: string[];
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export type SyllabusNode =
  | { level: 'subject'; data: Subject; children: SyllabusNode[] }
  | { level: 'module'; data: Module; children: SyllabusNode[] }
  | { level: 'topic'; data: Topic; children: SyllabusNode[] }
  | { level: 'subtopic'; data: Subtopic; children?: never };

// ─── Activity Log ──────────────────────────────────────────────

export type ActivityAction = 'create' | 'update' | 'delete' | 'restore' | 'rename' | 'move' | 'solve' | 'revise' | 'add_note' | 'add_question' | 'add_resource' | 'add_highlight';
export type EntityType = 'subject' | 'module' | 'topic' | 'subtopic' | 'note' | 'question' | 'resource' | 'highlight' | 'revision';

export interface ActivityLogEntry {
  id: string;
  entity_type: EntityType;
  entity_id: string;
  entity_name: string;
  action: ActivityAction;
  details: Record<string, unknown>;
  created_at: string;
}

// ─── Topic workspace ──────────────────────────────────────────

export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type QuestionStatus = 'Open' | 'Researching' | 'Solved';
export type ResourceType = 'Google Drive' | 'PDF' | 'YouTube' | 'GitHub' | 'Website' | 'Dataset' | 'Research Paper';
export type HighlightType = 'Key Concept' | 'Formula' | 'Interview Question' | 'Important Note';

export interface TopicNote {
  id: string;
  topic_id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface TopicQuestion {
  id: string;
  topic_id: string;
  question: string;
  answer: string;
  difficulty: Difficulty;
  status: QuestionStatus;
  tags: string[];
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface TopicResource {
  id: string;
  topic_id: string;
  title: string;
  url: string;
  resource_type: ResourceType;
  description: string;
  tags: string[];
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface TopicRevision {
  id: string;
  topic_id: string;
  revision_date: string;
  confidence_score: number;
  revision_notes: string;
  created_at: string;
  updated_at: string;
}

export interface TopicCode {
  id: string;
  topic_id: string;
  title: string;
  code: string;
  language: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface TopicHighlight {
  id: string;
  topic_id: string;
  content: string;
  highlight_type: HighlightType;
  tags: string[];
  display_order: number;
  created_at: string;
  updated_at: string;
}

// ─── Tags & Relationships ──────────────────────────────────────

export interface Tag {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface ItemTag {
  id: string;
  tag_id: string;
  entity_type: EntityType;
  entity_id: string;
  created_at: string;
}

export type RelationshipType = 'related' | 'prerequisite' | 'extension' | 'alternative';

export interface TopicRelationship {
  id: string;
  topic_id_a: string;
  topic_id_b: string;
  relationship_type: RelationshipType;
  created_at: string;
}

export interface RelatedTopic {
  id: string;
  name: string;
  relationship_type: RelationshipType;
  related_topic_id: string;
}

export interface GlobalSearchResult {
  type: 'subject' | 'module' | 'topic' | 'subtopic' | 'note' | 'question' | 'resource' | 'highlight';
  id: string;
  title: string;
  subtitle?: string;
  tags: string[];
  matchedField: string;
  parentPath?: string;
}

export interface JournalEntry {
  id: string;
  entry_date: string;
  topics_learned: string;
  time_spent_minutes: number;
  notes: string;
  key_insights: string;
  action_items: string;
  created_at: string;
  updated_at: string;
}

export interface CodeSnippet {
  id: string;
  title: string;
  code: string;
  language: string;
  description: string;
  tags: string[];
  category: string;
  created_at: string;
  updated_at: string;
}

export interface ResearchPaper {
  id: string;
  title: string;
  authors: string;
  summary: string;
  notes: string;
  pdf_link: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'Planned' | 'Active' | 'Completed';
  technologies: string[];
  notes: string;
  links: string;
  created_at: string;
  updated_at: string;
}

export interface RoadmapItem {
  id: string;
  goal: string;
  milestone: string;
  target_date: string | null;
  completion_status: 'Not Started' | 'In Progress' | 'Completed';
  category: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  category: 'YouTube' | 'GitHub' | 'Courses' | 'Blogs' | 'Documentation';
  tags: string[];
  description: string;
  created_at: string;
  updated_at: string;
}

export interface QuickNote {
  id: string;
  content: string;
  color: string;
  position_x: number;
  position_y: number;
  created_at: string;
  updated_at: string;
}

export interface StreakDay {
  id: string;
  date: string;
  minutes_learned: number;
  created_at: string;
}

export interface DashboardStats {
  totalNotes: number;
  totalCodeSnippets: number;
  totalProjects: number;
  totalPapers: number;
  currentStreak: number;
  totalMinutesLearned: number;
}

// ─── Deleted item for recycle bin ───────────────────────────────

export interface DeletedItem {
  id: string;
  type: EntityType;
  name: string;
  parent_name?: string;
  deleted_at: string;
}
