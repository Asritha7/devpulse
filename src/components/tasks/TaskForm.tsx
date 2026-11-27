import { useState, type FormEvent } from 'react';
import type { Project, Task } from '../../types/models';
import { isDateKey } from '../../lib/validation';
import { Dialog } from '../ui/Dialog';

export type TaskFields = Pick<Task, 'title' | 'description' | 'priority' | 'dueDate' | 'projectId'>;

export function TaskForm({ task, projects, onSave, onClose }: { task: Task | null; projects: Project[]; onSave: (fields: TaskFields) => void; onClose: () => void }) {
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [priority, setPriority] = useState<Task['priority']>(task?.priority ?? 'medium');
  const [dueDate, setDueDate] = useState(task?.dueDate ?? '');
  const [projectId, setProjectId] = useState(task?.projectId ?? '');
  const [error, setError] = useState('');
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim() || title.length > 160 || description.length > 4000) {
      setError('Enter a title (1–160 characters) and a description of at most 4,000 characters.');
      return;
    }
    if (dueDate && !isDateKey(dueDate)) { setError('Enter a valid due date.'); return; }
    if (projectId && !projects.some(project => project.id === projectId)) { setError('Choose an existing project.'); return; }
    onSave({ title: title.trim(), description: description.trim(), priority, dueDate: dueDate || null, projectId: projectId || null });
  }
  return <Dialog title={task ? 'Edit task' : 'Create task'} onClose={onClose}>
    <form onSubmit={submit} className="editor-form">
      <label>Title<input data-initial-focus required maxLength={160} value={title} onChange={event => setTitle(event.target.value)} /></label>
      <label>Description <span className="muted">(optional)</span><textarea rows={4} maxLength={4000} value={description} onChange={event => setDescription(event.target.value)} /></label>
      <div className="form-grid">
        <label>Priority<select value={priority} onChange={event => { const value = event.target.value; if (value === 'low' || value === 'medium' || value === 'high') setPriority(value); }}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>
        <label>Due date<input type="date" value={dueDate} onChange={event => setDueDate(event.target.value)} /></label>
      </div>
      <label>Project<select value={projectId} onChange={event => setProjectId(event.target.value)}><option value="">No Project</option>{projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
      {error && <p role="alert" className="form-error">{error}</p>}
      <div className="form-actions"><button type="button" onClick={onClose}>Cancel</button><button className="primary-button" type="submit">{task ? 'Save changes' : 'Create task'}</button></div>
    </form>
  </Dialog>;
}
