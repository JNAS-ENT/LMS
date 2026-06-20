// PDF Generation Service
// Creates human-readable PDF backups for Learning Vault

import type { VaultPackage } from '../types';

export interface PDFSummary {
  backupDate: string;
  backupType: string;
  totalSubjects: number;
  totalModules: number;
  totalTopics: number;
  totalNotes: number;
  totalQuestions: number;
  totalResources: number;
  totalHighlights: number;
  totalRevisions: number;
  recentlyStudiedTopics: string[];
  recentlyUpdatedNotes: string[];
  mostUsedTags: string[];
  mostReferencedTopics: string[];
  weeklyLearningStats: {
    totalMinutes: number;
    topicsCovered: number;
    notesCreated: number;
    questionsSolved: number;
  };
}

export interface GeneratedPDF {
  content: string;
  filename: string;
  sizeBytes: number;
}

// PDF Template Generator
// Creates a structured PDF-like document that can be rendered to actual PDF

export async function generatePDFBackup(
  vaultPackage: VaultPackage,
  backupType: 'daily' | 'weekly' | 'monthly' | 'manual'
): Promise<GeneratedPDF> {
  const summary = await extractPDFSummary(vaultPackage, backupType);
  const pdfContent = await buildPDFContent(summary, vaultPackage);
  const filename = generatePDFFilename(backupType);

  return {
    content: pdfContent,
    filename,
    sizeBytes: new Blob([pdfContent]).size
  };
}

async function extractPDFSummary(
  vaultPackage: VaultPackage,
  backupType: string
): Promise<PDFSummary> {
  const entities = vaultPackage.entities;

  // Calculate totals
  const totalSubjects = entities.subjects.length;
  const totalModules = entities.modules.length;
  const totalTopics = entities.topics.length;
  const totalSubtopics = entities.subtopics.length;
  const totalNotes = entities.topic_notes.length;
  const totalQuestions = entities.topic_questions.length;
  const totalResources = entities.topic_resources.length;
  const totalHighlights = entities.topic_highlights.length;
  const totalRevisions = entities.topic_revisions.length;

  // Recently studied topics (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentlyUpdatedTopics = entities.topics
    .filter(t => new Date(t.updated_at) >= sevenDaysAgo)
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 10)
    .map(t => t.name);

  // Recently updated notes
  const recentlyUpdatedNotes = entities.topic_notes
    .filter(n => new Date(n.updated_at) >= sevenDaysAgo)
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 10)
    .map(n => n.title);

  // Most used tags
  const tagCounts: Record<string, number> = {};
  entities.tags.forEach(tag => {
    tagCounts[tag.name] = (tagCounts[tag.name] || 0) + 1;
  });
  for (const note of entities.topic_notes) {
    for (const tag of note.tags || []) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }
  }
  const mostUsedTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name]) => name);

  // Most referenced topics (by relationships)
  const topicRefCount: Record<string, number> = {};
  entities.topic_relationships.forEach(rel => {
    topicRefCount[rel.topic_id_a] = (topicRefCount[rel.topic_id_a] || 0) + 1;
    topicRefCount[rel.topic_id_b] = (topicRefCount[rel.topic_id_b] || 0) + 1;
  });
  const mostReferencedTopicIds = Object.entries(topicRefCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id]) => id);
  const mostReferencedTopics = mostReferencedTopicIds
    .map(id => entities.topics.find(t => t.id === id)?.name)
    .filter(Boolean) as string[];

  // Weekly learning stats
  const weeklyStats = {
    totalMinutes: entities.streak_tracker
      .filter(d => new Date(d.date) >= sevenDaysAgo)
      .reduce((sum, d) => sum + d.minutes_learned, 0),
    topicsCovered: recentlyUpdatedTopics.length,
    notesCreated: recentlyUpdatedNotes.length,
    questionsSolved: entities.topic_questions
      .filter(q => q.status === 'Solved' && new Date(q.updated_at) >= sevenDaysAgo)
      .length
  };

  return {
    backupDate: new Date().toISOString(),
    backupType,
    totalSubjects,
    totalModules,
    totalTopics: totalTopics + totalSubtopics,
    totalNotes,
    totalQuestions,
    totalResources,
    totalHighlights,
    totalRevisions,
    recentlyStudiedTopics: recentlyUpdatedTopics,
    recentlyUpdatedNotes,
    mostUsedTags,
    mostReferencedTopics,
    weeklyLearningStats: weeklyStats
  };
}

async function buildPDFContent(summary: PDFSummary, vaultPackage: VaultPackage): Promise<string> {
  const lines: string[] = [];

  // Header
  lines.push('╔══════════════════════════════════════════════════════════════╗');
  lines.push('║              LEARNING VAULT BACKUP REPORT                    ║');
  lines.push('╚══════════════════════════════════════════════════════════════╝');
  lines.push('');
  lines.push(`Backup Date: ${formatDate(summary.backupDate)}`);
  lines.push(`Backup Type: ${summary.backupType.toUpperCase()}`);
  lines.push(`Vault Version: ${vaultPackage.version}`);
  lines.push(`Schema Version: ${vaultPackage.schema_version}`);
  lines.push('');

  // Statistics Section
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push('                        VAULT STATISTICS                       ');
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push('');
  lines.push(`  Subjects:         ${summary.totalSubjects.toString().padStart(6)}`);
  lines.push(`  Modules:          ${summary.totalModules.toString().padStart(6)}`);
  lines.push(`  Topics:           ${summary.totalTopics.toString().padStart(6)}`);
  lines.push(`  Notes:            ${summary.totalNotes.toString().padStart(6)}`);
  lines.push(`  Questions:        ${summary.totalQuestions.toString().padStart(6)}`);
  lines.push(`  Resources:        ${summary.totalResources.toString().padStart(6)}`);
  lines.push(`  Highlights:       ${summary.totalHighlights.toString().padStart(6)}`);
  lines.push(`  Revisions:        ${summary.totalRevisions.toString().padStart(6)}`);
  lines.push('');

  // Learning Summary
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push('                       LEARNING SUMMARY                        ');
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push('');
  lines.push(`  Weekly Learning Time: ${summary.weeklyLearningStats.totalMinutes} minutes`);
  lines.push(`  Topics Covered (7d):   ${summary.weeklyLearningStats.topicsCovered}`);
  lines.push(`  Notes Created (7d):    ${summary.weeklyLearningStats.notesCreated}`);
  lines.push(`  Questions Solved (7d): ${summary.weeklyLearningStats.questionsSolved}`);
  lines.push('');

  // Recently Studied Topics
  if (summary.recentlyStudiedTopics.length > 0) {
    lines.push('────────────────────────────────────────────────────────────');
    lines.push('Recently Studied Topics:');
    lines.push('────────────────────────────────────────────────────────────');
    summary.recentlyStudiedTopics.forEach((topic, i) => {
      lines.push(`  ${(i + 1).toString().padStart(2)}. ${topic}`);
    });
    lines.push('');
  }

  // Recently Updated Notes
  if (summary.recentlyUpdatedNotes.length > 0) {
    lines.push('────────────────────────────────────────────────────────────');
    lines.push('Recently Updated Notes:');
    lines.push('────────────────────────────────────────────────────────────');
    summary.recentlyUpdatedNotes.forEach((note, i) => {
      lines.push(`  ${(i + 1).toString().padStart(2)}. ${note}`);
    });
    lines.push('');
  }

  // Most Used Tags
  if (summary.mostUsedTags.length > 0) {
    lines.push('────────────────────────────────────────────────────────────');
    lines.push('Most Used Tags:');
    lines.push('────────────────────────────────────────────────────────────');
    summary.mostUsedTags.forEach((tag, i) => {
      lines.push(`  ${(i + 1).toString().padStart(2)}. ${tag}`);
    });
    lines.push('');
  }

  // Most Referenced Topics
  if (summary.mostReferencedTopics.length > 0) {
    lines.push('────────────────────────────────────────────────────────────');
    lines.push('Most Connected Topics:');
    lines.push('────────────────────────────────────────────────────────────');
    summary.mostReferencedTopics.forEach((topic, i) => {
      lines.push(`  ${(i + 1).toString().padStart(2)}. ${topic}`);
    });
    lines.push('');
  }

  // Subject Overview
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push('                      SUBJECT OVERVIEW                         ');
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push('');

  for (const subject of vaultPackage.entities.subjects) {
    lines.push(`■ ${subject.name}`);
    if (subject.description) {
      lines.push(`  ${subject.description}`);
    }

    const modules = vaultPackage.entities.modules.filter(m => m.subject_id === subject.id);
    for (const module of modules) {
      lines.push(`  ├─ ${module.name}`);

      const topics = vaultPackage.entities.topics.filter(t => t.module_id === module.id);
      for (let i = 0; i < topics.length; i++) {
        const topic = topics[i];
        const prefix = i === topics.length - 1 ? '  │  └─' : '  │  ├─';
        lines.push(`${prefix} ${topic.name} [${topic.status}]`);
      }
    }
    lines.push('');
  }

  // Footer
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push('This backup was generated by Learning Vault.');
  lines.push('Restore this backup using: Settings > Backup > Restore');
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  return lines.join('\n');
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function generatePDFFilename(backupType: string): string {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];

  if (backupType === 'daily') {
    return 'learning-vault-latest.pdf';
  }

  if (backupType === 'weekly') {
    const weekNum = getWeekNumber(now);
    return `weekly-${dateStr}-W${weekNum.toString().padStart(2, '0')}.pdf`;
  }

  if (backupType === 'monthly') {
    const month = dateStr.substring(0, 7);
    return `monthly-${month}.pdf`;
  }

  return `manual-${dateStr}.pdf`;
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

// Generate HTML-based PDF for browser rendering
export function generateHTMLPDF(summary: PDFSummary, vaultPackage: VaultPackage): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Learning Vault Backup - ${formatDate(summary.backupDate)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', system-ui, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #3b82f6;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      font-size: 28px;
      color: #1e40af;
      margin-bottom: 10px;
    }
    .meta {
      color: #64748b;
      font-size: 14px;
    }
    .section {
      margin-bottom: 30px;
    }
    .section h2 {
      font-size: 18px;
      color: #1e40af;
      border-left: 4px solid #3b82f6;
      padding-left: 12px;
      margin-bottom: 15px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }
    .stat-item {
      background: #f8fafc;
      padding: 12px 16px;
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
    }
    .stat-value {
      font-weight: 600;
      color: #3b82f6;
    }
    .list-item {
      padding: 8px 12px;
      border-left: 2px solid #e2e8f0;
      margin-bottom: 8px;
    }
    .list-item:hover {
      border-left-color: #3b82f6;
      background: #f8fafc;
    }
    .subject-block {
      margin-bottom: 20px;
      padding: 15px;
      background: #f8fafc;
      border-radius: 8px;
    }
    .subject-name {
      font-weight: 600;
      color: #1e40af;
      font-size: 16px;
      margin-bottom: 10px;
    }
    .module-name {
      color: #475569;
      margin: 8px 0 4px 20px;
    }
    .topic-name {
      color: #64748b;
      font-size: 13px;
      margin: 4px 0 4px 40px;
    }
    .status {
      display: inline-block;
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 4px;
      background: #dbeafe;
      color: #1e40af;
      margin-left: 8px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      color: #64748b;
      font-size: 12px;
      text-align: center;
    }
    @media print {
      body { padding: 20px; }
      .section { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Learning Vault Backup Report</h1>
    <div class="meta">
      <div><strong>Date:</strong> ${formatDate(summary.backupDate)}</div>
      <div><strong>Type:</strong> ${summary.backupType.toUpperCase()} Backup</div>
      <div><strong>Version:</strong> ${vaultPackage.version}</div>
    </div>
  </div>

  <div class="section">
    <h2>Vault Statistics</h2>
    <div class="stats-grid">
      <div class="stat-item"><span>Subjects</span><span class="stat-value">${summary.totalSubjects}</span></div>
      <div class="stat-item"><span>Modules</span><span class="stat-value">${summary.totalModules}</span></div>
      <div class="stat-item"><span>Topics</span><span class="stat-value">${summary.totalTopics}</span></div>
      <div class="stat-item"><span>Notes</span><span class="stat-value">${summary.totalNotes}</span></div>
      <div class="stat-item"><span>Questions</span><span class="stat-value">${summary.totalQuestions}</span></div>
      <div class="stat-item"><span>Resources</span><span class="stat-value">${summary.totalResources}</span></div>
      <div class="stat-item"><span>Highlights</span><span class="stat-value">${summary.totalHighlights}</span></div>
      <div class="stat-item"><span>Revisions</span><span class="stat-value">${summary.totalRevisions}</span></div>
    </div>
  </div>

  <div class="section">
    <h2>Weekly Learning Summary</h2>
    <div class="stats-grid">
      <div class="stat-item"><span>Total Learning Time</span><span class="stat-value">${summary.weeklyLearningStats.totalMinutes} min</span></div>
      <div class="stat-item"><span>Topics Covered</span><span class="stat-value">${summary.weeklyLearningStats.topicsCovered}</span></div>
      <div class="stat-item"><span>Notes Created</span><span class="stat-value">${summary.weeklyLearningStats.notesCreated}</span></div>
      <div class="stat-item"><span>Questions Solved</span><span class="stat-value">${summary.weeklyLearningStats.questionsSolved}</span></div>
    </div>
  </div>

  ${summary.recentlyStudiedTopics.length > 0 ? `
  <div class="section">
    <h2>Recently Studied Topics</h2>
    ${summary.recentlyStudiedTopics.map((t, i) => `<div class="list-item">${i + 1}. ${t}</div>`).join('')}
  </div>
  ` : ''}

  ${summary.mostUsedTags.length > 0 ? `
  <div class="section">
    <h2>Most Used Tags</h2>
    ${summary.mostUsedTags.map((t, i) => `<div class="list-item">${i + 1}. ${t}</div>`).join('')}
  </div>
  ` : ''}

  <div class="section">
    <h2>Subject Overview</h2>
    ${vaultPackage.entities.subjects.map(subject => `
      <div class="subject-block">
        <div class="subject-name">${subject.name}</div>
        ${subject.description ? `<div style="color:#64748b;margin-bottom:10px;">${subject.description}</div>` : ''}
        ${vaultPackage.entities.modules
          .filter(m => m.subject_id === subject.id)
          .map(module => `
            <div class="module-name">├─ ${module.name}</div>
            ${vaultPackage.entities.topics
              .filter(t => t.module_id === module.id)
              .map((topic, i, arr) => `
                <div class="topic-name">${arr.length - 1 === i ? '│  └─' : '│  ├─'} ${topic.name}<span class="status">${topic.status}</span></div>
              `).join('')}
          `).join('')}
      </div>
    `).join('')}
  </div>

  <div class="footer">
    <p>This backup was generated by Learning Vault.</p>
    <p>Restore: Settings > Backup > Restore from Backup</p>
  </div>
</body>
</html>`;
}
