export type Theme = 'light' | 'dark' | 'system';

export interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string | null;
  status: 'todo' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredData {
  schemaVersion: 1;
  tasks: Task[];
  projects: Project[];
  preferences: { theme: Theme };
}
