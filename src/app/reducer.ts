import { validateStoredData } from '../lib/validation';
import type { StoredData, Theme, Task, Project } from '../types/models';

export type WorkspaceState =
  | { phase: 'loading' }
  | { phase: 'recovery'; message: string }
  | { phase: 'ready'; data: StoredData; dirty: boolean; persistence: 'saved' | 'memory' | 'conflict'; message: string | null };

export type MutationAction =
  | { type: 'taskCreated'; task: Task }
  | { type: 'taskEdited'; id: string; changes: Pick<Task, 'title' | 'description' | 'priority' | 'dueDate' | 'projectId'>; at: string }
  | { type: 'taskDeleted'; id: string }
  | { type: 'taskStatusChanged'; id: string; done: boolean; at: string }
  | { type: 'projectCreated'; project: Project }
  | { type: 'projectRenamed'; id: string; name: string; at: string }
  | { type: 'projectDeleted'; id: string; at: string };

export type WorkspaceAction = MutationAction
  | { type: 'loaded'; data: StoredData; memoryOnly?: boolean; message?: string }
  | { type: 'recovery'; message: string }
  | { type: 'themeChanged'; theme: Theme }
  | { type: 'saved' }
  | { type: 'saveFailed'; message: string; conflict: boolean };

export function workspaceReducer(state: WorkspaceState, action: WorkspaceAction): WorkspaceState {
  if (['taskCreated', 'taskEdited', 'taskDeleted', 'taskStatusChanged', 'projectCreated', 'projectRenamed', 'projectDeleted'].includes(action.type)) {
    if (state.phase !== 'ready' || state.persistence === 'conflict') return state;
    let data = state.data;
    if ('id' in action) {
      const records = action.type.startsWith('task') ? data.tasks : data.projects;
      if (!records.some(record => record.id === action.id)) return state;
    }
    if (action.type === 'taskStatusChanged' && data.tasks.find(task => task.id === action.id)?.status === (action.done ? 'done' : 'todo')) return state;
    switch (action.type) {
      case 'taskCreated': data = { ...data, tasks: [action.task, ...data.tasks] }; break;
      case 'taskEdited': data = { ...data, tasks: data.tasks.map(task => task.id === action.id ? { ...task, ...action.changes, updatedAt: action.at } : task) }; break;
      case 'taskDeleted': data = { ...data, tasks: data.tasks.filter(task => task.id !== action.id) }; break;
      case 'taskStatusChanged': data = { ...data, tasks: data.tasks.map(task => task.id === action.id && (task.status === 'done') !== action.done ? { ...task, status: action.done ? 'done' : 'todo', completedAt: action.done ? action.at : null, updatedAt: action.at } : task) }; break;
      case 'projectCreated': data = { ...data, projects: [...data.projects, action.project] }; break;
      case 'projectRenamed': data = { ...data, projects: data.projects.map(project => project.id === action.id ? { ...project, name: action.name, updatedAt: action.at } : project) }; break;
      case 'projectDeleted': data = { ...data, projects: data.projects.filter(project => project.id !== action.id), tasks: data.tasks.map(task => task.projectId === action.id ? { ...task, projectId: null, updatedAt: action.at } : task) }; break;
    }
    if (!validateStoredData(data).ok) return state;
    return { ...state, data, dirty: true };
  }
  switch (action.type) {
    case 'loaded': return { phase: 'ready', data: action.data, dirty: false, persistence: action.memoryOnly ? 'memory' : 'saved', message: action.message ?? null };
    case 'recovery': return { phase: 'recovery', message: action.message };
    case 'themeChanged':
      if (state.phase !== 'ready' || state.persistence === 'conflict' || state.data.preferences.theme === action.theme) return state;
      return { ...state, dirty: true, data: { ...state.data, preferences: { theme: action.theme } } };
    default: return state;
    case 'saved': return state.phase === 'ready' ? { ...state, dirty: false, persistence: 'saved', message: null } : state;
    case 'saveFailed': return state.phase === 'ready' ? { ...state, dirty: false, persistence: action.conflict ? 'conflict' : 'memory', message: action.message } : state;
  }
}
