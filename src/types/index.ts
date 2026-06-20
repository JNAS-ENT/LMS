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
export type EntityType = 'subject' | 'module' | 'topic' | 'subtopic' | 'note' | 'question' | 'resource' | 'highlight' | 'revision' | 'code';

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
  content_hash: string | null;
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
  storage_provider_id: string | null;
  relative_path: string | null;
  content_hash: string | null;
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
  content_hash: string | null;
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

// ─── Storage Abstraction Layer ─────────────────────────────────────

export type StorageProviderType = 'local' | 'supabase' | 's3' | 'gcs' | 'azure' | 'dropbox' | 'google_drive' | 'onedrive' | 'nas' | 'webdav' | 'other';

export interface StorageProvider {
  id: string;
  name: string;
  provider_type: StorageProviderType;
  base_path: string | null;
  external_url_base: string | null;
  credentials_ref: string | null;
  is_default: boolean;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface VaultMetadata {
  id: string;
  key: string;
  value: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type BackupType = 'manual' | 'daily' | 'weekly' | 'monthly';
export type BackupStatus = 'pending' | 'completed' | 'failed';

export interface BackupHistory {
  id: string;
  backup_type: BackupType;
  format: string;
  file_size_bytes: number | null;
  entity_counts: Record<string, number>;
  storage_provider_id: string | null;
  storage_path: string | null;
  checksum_sha256: string | null;
  started_at: string;
  completed_at: string | null;
  status: BackupStatus;
  error_message: string | null;
}

export interface VaultPackage {
  version: string;
  schema_version: string;
  exported_at: string;
  exported_by: string;
  app_name: string;
  checksum: string;
  encryption: 'none' | 'aes-256';
  compression: 'zip';
  entities: {
    subjects: Subject[];
    modules: Module[];
    topics: Topic[];
    subtopics: Subtopic[];
    topic_notes: TopicNote[];
    topic_questions: TopicQuestion[];
    topic_resources: TopicResource[];
    topic_revisions: TopicRevision[];
    topic_code: TopicCode[];
    topic_highlights: TopicHighlight[];
    notes: Note[];
    tags: Tag[];
    topic_relationships: TopicRelationship[];
    storage_providers: StorageProvider[];
    journal_entries: JournalEntry[];
    code_snippets: CodeSnippet[];
    research_papers: ResearchPaper[];
    projects: Project[];
    roadmap_items: RoadmapItem[];
    bookmarks: Bookmark[];
    quick_notes: QuickNote[];
    streak_days: StreakDay[];
    activity_log: ActivityLogEntry[];
  };
  metadata: {
    total_entities: number;
    entity_counts: Record<string, number>;
    vault_version: string;
    export_duration_ms: number;
    warnings: string[];
  };
}

export interface ImportResult {
  success: boolean;
  message: string;
  imported_counts: Record<string, number>;
  warnings: string[];
  errors: string[];
  duration_ms: number;
}

// ─── Google Drive & Backup System Types ─────────────────────────────

export interface GoogleDriveToken {
  id: string;
  user_identifier: string;
  access_token: string;
  refresh_token: string;
  token_expiry: string;
  scope: string | null;
  token_type: string;
  created_at: string;
  updated_at: string;
}

export interface BackupSchedule {
  id: string;
  backup_type: 'daily' | 'weekly' | 'monthly';
  enabled: boolean;
  scheduled_time: string;
  scheduled_day: number;
  last_run_at: string | null;
  next_run_at: string | null;
  retention_count: number;
  created_at: string;
  updated_at: string;
}

export interface GoogleDriveFolder {
  id: string;
  folder_type: 'root' | 'daily' | 'weekly' | 'monthly';
  folder_id: string;
  folder_name: string;
  parent_folder_id: string | null;
  created_at: string;
}

export interface BackupVerification {
  id: string;
  backup_id: string;
  verified_at: string;
  json_exists: boolean;
  pdf_exists: boolean;
  json_valid: boolean;
  pdf_valid: boolean;
  json_size_bytes: number | null;
  pdf_size_bytes: number | null;
  checksum_match: boolean;
  upload_verified: boolean;
  download_test: boolean;
  error_details: Record<string, unknown>;
}

export interface BackupHistoryExtended extends BackupHistory {
  backup_version: string;
  google_drive_file_id: string | null;
  pdf_file_id: string | null;
  json_uploaded: boolean;
  pdf_uploaded: boolean;
}

export interface BackupCenterStats {
  activeProvider: string | null;
  connectionStatus: 'connected' | 'disconnected' | 'error';
  lastSuccessfulBackup: string | null;
  lastFailedBackup: string | null;
  nextScheduledBackup: string | null;
  dailyBackupsCount: number;
  weeklyBackupsCount: number;
  monthlyBackupsCount: number;
  storageUsedBytes: number;
  backupHealthStatus: 'healthy' | 'warning' | 'critical' | 'unknown';
}

export interface BackupPackageV2 extends VaultPackage {
  backup_version: string;
  backup_type: 'daily' | 'weekly' | 'monthly' | 'manual';
  created_at: string;
  entities_extended: {
    streak_tracker: StreakDay[];
    vault_settings: Record<string, unknown>;
  };
  pdf_summary: {
    total_subjects: number;
    total_modules: number;
    total_topics: number;
    total_notes: number;
    total_questions: number;
    total_resources: number;
    total_highlights: number;
    total_revisions: number;
    recently_studied_topics: string[];
    recently_updated_notes: string[];
    most_used_tags: string[];
    most_referenced_topics: string[];
    weekly_learning_stats: {
      total_minutes: number;
      topics_covered: number;
      notes_created: number;
      questions_solved: number;
    };
  };
}
