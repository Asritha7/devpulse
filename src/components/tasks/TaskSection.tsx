import { useState } from 'react';
import { useWorkspace } from '../../app/AppProvider';
import { emptyFilters, NO_PROJECT_FILTER, selectFilteredTasks } from '../../lib/selectors';
import { localDateKey } from '../../lib/dates';
import type { StoredData, Task } from '../../types/models';
import { ConfirmDialog } from '../ui/Dialog';
import { TaskForm, type TaskFields } from './TaskForm';

export function TaskSection({ data, locked, now }: { data: StoredData; locked: boolean; now: Date }) {
  const { mutate } = useWorkspace();
  const [filters, setFilters] = useState(emptyFilters);
  const [editor, setEditor] = useState<{ task: Task | null } | null>(null);
  const [deleting, setDeleting] = useState<Task | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const currentFilters = filters.project && filters.project !== NO_PROJECT_FILTER && !data.projects.some(project => project.id === filters.project)
    ? { ...filters, project: NO_PROJECT_FILTER } : filters;
  const tasks = selectFilteredTasks(data, currentFilters);
  function save(fields: TaskFields) {
    if (locked) return;
    const at = new Date().toISOString();
    if (editor?.task) mutate({ type: 'taskEdited', id: editor.task.id, changes: fields, at: at > editor.task.updatedAt ? at : editor.task.updatedAt });
    else mutate({ type: 'taskCreated', task: { ...fields, id: crypto.randomUUID(), status: 'todo', createdAt: at, updatedAt: at, completedAt: null } });
    setAnnouncement(editor?.task ? 'Task updated.' : 'Task created.');
    setEditor(null);
  }
  return <section id="tasks" className="panel task-section" aria-labelledby="tasks-title">
    <div className="panel-heading"><div><h2 id="tasks-title">Tasks</h2><p>Keep your next steps in focus.</p></div><button className="primary-button" disabled={locked} onClick={() => setEditor({ task: null })}>New task</button></div>
    <div className="filters">
      <label className="search-field">Search<input type="search" placeholder="Search titles and descriptions" value={filters.search} onChange={event => setFilters({ ...filters, search: event.target.value })} /></label>
      <label>Status<select value={filters.status} onChange={event => setFilters({ ...filters, status: event.target.value })}><option value="">All statuses</option><option value="todo">Open</option><option value="done">Completed</option></select></label>
      <label>Priority<select value={filters.priority} onChange={event => setFilters({ ...filters, priority: event.target.value })}><option value="">All priorities</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></label>
      <label>Project<select value={currentFilters.project} onChange={event => setFilters({ ...filters, project: event.target.value })}><option value="">All projects</option><option value={NO_PROJECT_FILTER}>No Project</option>{data.projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
      <button onClick={() => setFilters(emptyFilters)}>Clear filters</button>
    </div>
    <p className="result-count" role="status">{tasks.length} of {data.tasks.length} tasks</p>
    <p className="sr-only" role="status">{announcement}</p>
    {tasks.length === 0 ? <div className="empty-state"><h3>{data.tasks.length ? 'No matching tasks.' : 'A fresh start.'}</h3><p>{data.tasks.length ? 'Adjust your search or clear the filters.' : 'Create a task to start planning your work.'}</p></div> : <ul className="task-list">{tasks.map(task => {
      const overdue = task.status === 'todo' && task.dueDate !== null && task.dueDate < localDateKey(now);
      return <li key={task.id}>
        <input type="checkbox" checked={task.status === 'done'} disabled={locked} aria-label={`${task.status === 'done' ? 'Reopen' : 'Complete'} ${task.title}`} onChange={event => {
          const at = new Date().toISOString();
          mutate({ type: 'taskStatusChanged', id: task.id, done: event.target.checked, at: at > task.updatedAt ? at : task.updatedAt });
          setAnnouncement(event.target.checked ? 'Task completed.' : 'Task reopened.');
        }} />
        <div className="task-details"><strong className={task.status === 'done' ? 'completed-title' : ''}>{task.title}</strong>{task.description && <p className="task-description">{task.description}</p>}
          <div className="task-metadata"><span>{data.projects.find(project => project.id === task.projectId)?.name ?? 'No Project'}</span><span className={`priority ${task.priority}`}>{task.priority}</span><span>{task.status === 'done' ? 'Completed' : 'Open'}</span>{task.dueDate && <span className={overdue ? 'form-error' : ''}>{overdue ? 'Overdue · ' : 'Due '}<time dateTime={task.dueDate}>{task.dueDate}</time></span>}</div>
        </div>
        <div className="row-actions"><button disabled={locked} aria-label={`Edit ${task.title}`} onClick={() => setEditor({ task })}>Edit</button><button disabled={locked} aria-label={`Delete ${task.title}`} onClick={() => setDeleting(task)}>Delete</button></div>
      </li>;
    })}</ul>}
    {!locked && editor && <TaskForm task={editor.task} projects={data.projects} onSave={save} onClose={() => setEditor(null)} />}
    {!locked && deleting && <ConfirmDialog title="Delete task?" onClose={() => setDeleting(null)} onConfirm={() => { mutate({ type: 'taskDeleted', id: deleting.id }); setDeleting(null); setAnnouncement('Task deleted.'); }}>“{deleting.title}” will be permanently deleted. This cannot be undone.</ConfirmDialog>}
  </section>;
}
