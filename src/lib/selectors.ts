import type { StoredData } from '../types/models';
import { daysAgo, localDateKey } from './dates';

export function selectStatistics(data: StoredData, now = new Date()) {
  const today = localDateKey(now);
  const completed = data.tasks.filter(task => task.status === 'done').length;
  return {
    total: data.tasks.length,
    completed,
    open: data.tasks.length - completed,
    overdue: data.tasks.filter(task => task.status === 'todo' && task.dueDate !== null && task.dueDate < today).length,
  };
}

export function selectProjectProgress(data: StoredData, projectId: string) {
  const tasks = data.tasks.filter(task => task.projectId === projectId);
  const completed = tasks.filter(task => task.status === 'done').length;
  return { total: tasks.length, completed, percent: tasks.length === 0 ? 0 : Math.round(completed / tasks.length * 100) };
}

export function selectActivity(data: StoredData, now = new Date()) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = localDateKey(daysAgo(now, 6 - index));
    return {
      date,
      completed: data.tasks.filter(task => task.status === 'done' && task.completedAt !== null && localDateKey(new Date(task.completedAt)) === date).length,
    };
  });
}

export interface TaskFilters {
  search: string;
  status: string;
  priority: string;
  project: string;
}

// A colon cannot occur in validated project IDs, so this cannot collide with a project.
export const NO_PROJECT_FILTER = ':none';

export const emptyFilters: TaskFilters = { search: '', status: '', priority: '', project: '' };

export function selectFilteredTasks(data: StoredData, filters: TaskFilters) {
  const query = filters.search.trim().toLocaleLowerCase();
  return data.tasks.filter(task =>
    (!query || `${task.title} ${task.description}`.toLocaleLowerCase().includes(query)) &&
    (!filters.status || task.status === filters.status) &&
    (!filters.priority || task.priority === filters.priority) &&
    (!filters.project || (filters.project === NO_PROJECT_FILTER ? task.projectId === null : task.projectId === filters.project)),
  );
}
