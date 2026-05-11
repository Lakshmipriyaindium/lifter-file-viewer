import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import UserStoriesView from './UserStoriesView';

import { UserStory, BusinessRule } from './type';

interface UserStoriesViewerProps {
  data: any;
}

const UserStoriesViewer: React.FC<UserStoriesViewerProps> = ({ data }) => {
  const [isExporting, setIsExporting] = useState(false);

  // Support multiple JSON shapes
  const stories: UserStory[] = data?.user_stories ?? data?.stories ?? (Array.isArray(data) ? data : []);
  const businessRules: BusinessRule[] = data?.business_rules ?? data?.businessRules ?? [];
  const language: string = data?.language ?? '';
  const codebasePath: string = data?.codebase_path ?? '';
  const timestamp: string = data?.timestamp ?? '';

  const handleExportMarkdown = () => {
    setIsExporting(true);
    try {
      let md = `# User Stories Report\n\n`;
      md += `**Generated:** ${new Date().toLocaleDateString()}\n`;
      if (language) md += `**Language:** ${language}\n`;
      if (codebasePath) md += `**Codebase:** ${codebasePath}\n`;
      if (timestamp) md += `**Date:** ${timestamp}\n`;
      md += `\n**Total:** ${stories.length} stories\n\n---\n\n`;
      for (const s of stories) {
        md += `## ${s.title ?? s.story_id}\n`;
        md += `**ID:** ${s.story_id}  \n`;
        md += `**Epic:** ${s.epic}  \n`;
        md += `**Priority:** ${s.priority} | **Complexity:** ${s.complexity} | **Points:** ${s.story_points}\n\n`;
        md += `> As a **${s.as_a}**, I want **${s.i_want}**, so that **${s.so_that}**\n\n`;
        if (s.acceptance_criteria?.length) {
          md += `**Acceptance Criteria:**\n`;
          for (const c of s.acceptance_criteria) md += `- ${c}\n`;
          md += '\n';
        }
        md += `---\n\n`;
      }
      const blob = new Blob([md], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user_stories_${Date.now()}.md`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = () => {
    setIsExporting(true);
    try {
      const rows = stories.map(s => ({
        'Story ID': s.story_id,
        'Title': s.title,
        'Epic': s.epic,
        'As A': s.as_a,
        'I Want': s.i_want,
        'So That': s.so_that,
        'Priority': s.priority,
        'Complexity': s.complexity,
        'Story Points': s.story_points,
        'Status': s.status,
        'Acceptance Criteria': (s.acceptance_criteria ?? []).join('; '),
        'Assumptions': (s.assumptions ?? []).join('; '),
        'Test Scenarios': (s.test_scenarios ?? []).join('; '),
        'Depends On': (s.depends_on ?? []).join(', '),
        'Blocks': (s.blocks ?? []).join(', '),
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'User Stories');
      XLSX.writeFile(wb, `user_stories_${Date.now()}.xlsx`);
    } finally {
      setIsExporting(false);
    }
  };

  if (!stories.length) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '12px', color: '#64748b' }}>
        <div style={{ fontSize: '3rem' }}>📋</div>
        <p style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>No user stories found</p>
        <p style={{ fontSize: '14px', margin: 0 }}>The JSON does not contain a <code>user_stories</code> or <code>stories</code> array.</p>
      </div>
    );
  }

  return (
    <UserStoriesView
      stories={stories}
      businessRules={businessRules}
      language={language}
      codebasePath={codebasePath}
      timestamp={timestamp}
      onExportMarkdown={handleExportMarkdown}
      onExportExcel={handleExportExcel}
      isExporting={isExporting}
    />
  );
};

export default UserStoriesViewer;
