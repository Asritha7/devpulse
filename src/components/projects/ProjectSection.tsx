import { useState } from 'react';
import { useWorkspace } from '../../app/AppProvider';
import { selectProjectProgress } from '../../lib/selectors';
import type { Project, StoredData } from '../../types/models';
import { ConfirmDialog, Dialog } from '../ui/Dialog';

export function ProjectSection({ data, locked }: { data: StoredData; locked: boolean }) {
  const { mutate } = useWorkspace();
  const [editor, setEditor] = useState<{ project: Project | null; name: string } | null>(null);
  const [deleting, setDeleting] = useState<Project | null>(null);
  const [error, setError] = useState('');
  const [announcement, setAnnouncement] = useState('');
  return <section id="projects" className="panel" aria-labelledby="projects-title">
    <div className="panel-heading"><div><h2 id="projects-title">Projects</h2><p>Small steps. Visible progress.</p></div><button disabled={locked} onClick={() => { setEditor({ project: null, name: '' }); setError(''); }}>New project</button></div>
    <p className="sr-only" role="status">{announcement}</p>
    {data.projects.length === 0 ? <div className="empty-state"><h3>No projects yet.</h3><p>Create a project to group related tasks.</p></div> : <ul className="project-list">{data.projects.map(project => {
      const progress = selectProjectProgress(data, project.id);
      return <li key={project.id}>
        <div className="project-heading"><h3>{project.name}</h3><span>{progress.percent}%</span></div>
        <progress value={progress.completed} max={progress.total || 1} aria-label={`${project.name} progress`} />
        <p className="muted">{progress.total ? `${progress.completed} of ${progress.total} tasks completed` : 'No tasks yet'}</p>
        <div className="row-actions"><button disabled={locked} aria-label={`Rename ${project.name}`} onClick={() => { setEditor({ project, name: project.name }); setError(''); }}>Rename</button><button disabled={locked} aria-label={`Delete project ${project.name}`} onClick={() => setDeleting(project)}>Delete</button></div>
      </li>;
    })}</ul>}
    {!locked && editor && <Dialog title={editor.project ? 'Rename project' : 'Create project'} onClose={() => setEditor(null)}>
      <form className="editor-form" onSubmit={event => {
        event.preventDefault();
        const name = editor.name.trim();
        if (!name || name.length > 80) { setError('Enter a project name of 1–80 characters.'); return; }
        const at = new Date().toISOString();
        if (editor.project) mutate({ type: 'projectRenamed', id: editor.project.id, name, at: at > editor.project.updatedAt ? at : editor.project.updatedAt });
        else mutate({ type: 'projectCreated', project: { id: crypto.randomUUID(), name, createdAt: at, updatedAt: at } });
        setAnnouncement(editor.project ? 'Project renamed.' : 'Project created.');
        setEditor(null);
      }}>
        <label>Project name<input data-initial-focus required maxLength={80} value={editor.name} onChange={event => setEditor({ ...editor, name: event.target.value })} /></label>
        {error && <p role="alert" className="form-error">{error}</p>}
        <div className="form-actions"><button type="button" onClick={() => setEditor(null)}>Cancel</button><button type="submit" className="primary-button">{editor.project ? 'Save name' : 'Create project'}</button></div>
      </form>
    </Dialog>}
    {!locked && deleting && <ConfirmDialog title="Delete project?" onClose={() => setDeleting(null)} onConfirm={() => {
      const at = [new Date().toISOString(), ...data.tasks.filter(task => task.projectId === deleting.id).map(task => task.updatedAt)].sort().at(-1)!;
      mutate({ type: 'projectDeleted', id: deleting.id, at });
      setDeleting(null);
      setAnnouncement('Project deleted. Its tasks are now in No Project.');
    }}>“{deleting.name}” will be deleted. Its {data.tasks.filter(task => task.projectId === deleting.id).length} associated tasks will be kept in No Project. This cannot be undone.</ConfirmDialog>}
  </section>;
}
