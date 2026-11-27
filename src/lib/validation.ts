import type { Project, StoredData, Task } from '../types/models';

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const isText = (value: unknown, max: number) => typeof value === 'string' && value.trim().length > 0 && value.length <= max;
const isId = (value: unknown): value is string => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(value);
const isTimestamp = (value: unknown): value is string => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;

export function isDateKey(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function hasOnlyKeys(value: Record<string, unknown>, keys: string[]) {
  return Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
}

function isProject(value: unknown): value is Project {
  return isRecord(value) && hasOnlyKeys(value, ['id', 'name', 'createdAt', 'updatedAt']) &&
    isId(value.id) && isText(value.name, 80) && isTimestamp(value.createdAt) &&
    isTimestamp(value.updatedAt) && value.updatedAt >= value.createdAt;
}

function isTask(value: unknown): value is Task {
  if (!isRecord(value) || !hasOnlyKeys(value, ['id', 'title', 'description', 'projectId', 'status', 'priority', 'dueDate', 'createdAt', 'updatedAt', 'completedAt'])) return false;
  return isId(value.id) && isText(value.title, 160) && typeof value.description === 'string' && value.description.length <= 4000 &&
    (value.projectId === null || isId(value.projectId)) && typeof value.priority === 'string' && ['low', 'medium', 'high'].includes(value.priority) &&
    (value.dueDate === null || isDateKey(value.dueDate)) && isTimestamp(value.createdAt) && isTimestamp(value.updatedAt) &&
    value.updatedAt >= value.createdAt &&
    ((value.status === 'todo' && value.completedAt === null) ||
      (value.status === 'done' && isTimestamp(value.completedAt) && value.completedAt >= value.createdAt && value.completedAt <= value.updatedAt));
}

export type ValidationResult = { ok: true; data: StoredData } | { ok: false; reason: string };

export function validateStoredData(value: unknown): ValidationResult {
  if (!isRecord(value)) return { ok: false, reason: 'Saved data is not a workspace object.' };
  if (value.schemaVersion !== 1) return { ok: false, reason: 'This workspace uses an unsupported data version.' };
  if (!hasOnlyKeys(value, ['schemaVersion', 'tasks', 'projects', 'preferences']) ||
    !Array.isArray(value.tasks) || !value.tasks.every(isTask) ||
    !Array.isArray(value.projects) || !value.projects.every(isProject) ||
    !isRecord(value.preferences) || !hasOnlyKeys(value.preferences, ['theme']) ||
    typeof value.preferences.theme !== 'string' || !['light', 'dark', 'system'].includes(value.preferences.theme)) {
    return { ok: false, reason: 'Saved data contains missing or invalid fields.' };
  }
  const tasks = value.tasks as Task[];
  const projects = value.projects as Project[];
  const projectIds = new Set(projects.map(project => project.id));
  if (projectIds.size !== projects.length || new Set(tasks.map(task => task.id)).size !== tasks.length ||
    tasks.some(task => task.projectId !== null && !projectIds.has(task.projectId))) {
    return { ok: false, reason: 'Saved data contains duplicate IDs or missing project references.' };
  }
  return { ok: true, data: { schemaVersion: 1, tasks, projects, preferences: { theme: value.preferences.theme as StoredData['preferences']['theme'] } } };
}

export function parseStoredData(raw: string): ValidationResult {
  try { return validateStoredData(JSON.parse(raw) as unknown); }
  catch { return { ok: false, reason: 'Saved data could not be read as JSON.' }; }
}
