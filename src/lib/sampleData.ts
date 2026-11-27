import type { StoredData, Task } from '../types/models';
import { daysAgo, localDateKey } from './dates';

export function createEmptyData(): StoredData {
  return { schemaVersion: 1, tasks: [], projects: [], preferences: { theme: 'system' } };
}

/** Only used when the storage key is absent, never as a parsing fallback. */
export function createSampleData(now = new Date()): StoredData {
  const createdAt = daysAgo(now, 10).toISOString();
  const projects = [
    { id: 'project-platform', name: 'Platform foundations', createdAt, updatedAt: createdAt },
    { id: 'project-design', name: 'Design system', createdAt, updatedAt: createdAt },
    { id: 'project-docs', name: 'Developer experience', createdAt, updatedAt: createdAt },
  ];
  const entries: Array<[string, string, Task['priority'], number | null]> = [
    ['Define API response contracts', 'project-platform', 'high', null],
    ['Review keyboard navigation', 'project-design', 'high', null],
    ['Document local setup', 'project-docs', 'medium', null],
    ['Audit spacing tokens', 'project-design', 'low', null],
    ['Add request validation', 'project-platform', 'high', 0],
    ['Establish typography scale', 'project-design', 'medium', 1],
    ['Write contribution guidelines', 'project-docs', 'low', 1],
    ['Configure strict TypeScript', 'project-platform', 'medium', 3],
    ['Map onboarding flow', 'project-docs', 'medium', 5],
  ];
  return {
    ...createEmptyData(),
    projects,
    tasks: entries.map(([title, projectId, priority, completedDaysAgo], index) => {
      const completedAt = completedDaysAgo === null ? null : daysAgo(now, completedDaysAgo).toISOString();
      return {
        id: `sample-task-${index + 1}`, title, projectId, priority,
        description: '', createdAt, updatedAt: completedAt ?? createdAt,
        dueDate: completedAt ? null : localDateKey(daysAgo(now, -index)),
        status: completedAt ? 'done' : 'todo', completedAt,
      };
    }),
  };
}
