import { describe, expect, it } from 'vitest';
import { createEmptyData } from '../lib/sampleData';
import { workspaceReducer, type WorkspaceState } from './reducer';

const ready = (): WorkspaceState => workspaceReducer({ phase: 'loading' }, { type: 'loaded', data: createEmptyData() });

describe('workspace reducer', () => {
  it('hydrates without marking existing data for a rewrite', () => {
    expect(ready()).toMatchObject({ phase: 'ready', dirty: false, persistence: 'saved' });
  });
  it('changes theme immutably while retaining tasks and projects', () => {
    const before = ready();
    const after = workspaceReducer(before, { type: 'themeChanged', theme: 'dark' });
    expect(after).toMatchObject({ dirty: true, data: { preferences: { theme: 'dark' } } });
    expect(before).toMatchObject({ dirty: false, data: { preferences: { theme: 'system' } } });
    if (before.phase === 'ready' && after.phase === 'ready') expect(after.data.tasks).toBe(before.data.tasks);
  });
  it('does not save a theme that is already selected', () => {
    const state = ready();
    expect(workspaceReducer(state, { type: 'themeChanged', theme: 'system' })).toBe(state);
  });
  it('blocks preference changes during recovery or conflict', () => {
    const recovery: WorkspaceState = { phase: 'recovery', message: 'Invalid data' };
    expect(workspaceReducer(recovery, { type: 'themeChanged', theme: 'dark' })).toBe(recovery);
    const conflict = workspaceReducer(ready(), { type: 'saveFailed', conflict: true, message: 'Reload' });
    expect(workspaceReducer(conflict, { type: 'themeChanged', theme: 'dark' })).toBe(conflict);
  });
  it('keeps unsaved changes available and clears warnings after retry succeeds', () => {
    const changed = workspaceReducer(ready(), { type: 'themeChanged', theme: 'dark' });
    const failed = workspaceReducer(changed, { type: 'saveFailed', conflict: false, message: 'Full' });
    expect(failed).toMatchObject({ persistence: 'memory', data: { preferences: { theme: 'dark' } }, message: 'Full' });
    expect(workspaceReducer(failed, { type: 'saved' })).toMatchObject({ persistence: 'saved', dirty: false, message: null });
  });
});

const at = '2026-11-27T10:00:00.000Z';
const later = '2026-11-28T10:00:00.000Z';
const project = { id: 'project-one', name: 'Platform', createdAt: at, updatedAt: at };
const task = {
  id: 'task-one', title: 'Review contracts', description: 'Check error responses',
  projectId: project.id, priority: 'high' as const, dueDate: '2026-11-27',
  status: 'todo' as const, createdAt: at, updatedAt: at, completedAt: null,
};
function populated() {
  const withProject = workspaceReducer(ready(), { type: 'projectCreated', project });
  return workspaceReducer(withProject, { type: 'taskCreated', task });
}
function dataOf(state: WorkspaceState) {
  if (state.phase !== 'ready') throw new Error('Expected ready workspace');
  return state.data;
}

describe('task and project mutations', () => {
  it('creates and edits task fields without changing creation metadata', () => {
    const state = populated();
    const changes = { title: 'Revised review', description: 'Updated notes', priority: 'low' as const, dueDate: null, projectId: null };
    const updated = workspaceReducer(state, { type: 'taskEdited', id: task.id, changes, at: later });
    expect(dataOf(updated).tasks[0]).toEqual({ ...task, ...changes, updatedAt: later });
    expect(dataOf(state).tasks[0]).toEqual(task);
    expect(updated).toMatchObject({ dirty: true });
  });
  it('completes, reopens and recompletes with appropriate completion timestamps', () => {
    const completed = workspaceReducer(populated(), { type: 'taskStatusChanged', id: task.id, done: true, at });
    expect(dataOf(completed).tasks[0]).toMatchObject({ status: 'done', completedAt: at });
    const repeated = workspaceReducer(completed, { type: 'taskStatusChanged', id: task.id, done: true, at: later });
    expect(dataOf(repeated).tasks[0]!.completedAt).toBe(at);
    const reopened = workspaceReducer(completed, { type: 'taskStatusChanged', id: task.id, done: false, at: later });
    expect(dataOf(reopened).tasks[0]).toMatchObject({ status: 'todo', completedAt: null });
    const recompleted = workspaceReducer(reopened, { type: 'taskStatusChanged', id: task.id, done: true, at: later });
    expect(dataOf(recompleted).tasks[0]!.completedAt).toBe(later);
  });
  it('deletes a task without deleting its project', () => {
    const deleted = workspaceReducer(populated(), { type: 'taskDeleted', id: task.id });
    expect(dataOf(deleted).tasks).toEqual([]);
    expect(dataOf(deleted).projects).toEqual([project]);
  });
  it('renames a project without breaking assignments', () => {
    const renamed = workspaceReducer(populated(), { type: 'projectRenamed', id: project.id, name: 'API platform', at: later });
    expect(dataOf(renamed).projects[0]).toEqual({ ...project, name: 'API platform', updatedAt: later });
    expect(dataOf(renamed).tasks[0]!.projectId).toBe(project.id);
  });
  it('deletes a project while preserving completed task history in No Project', () => {
    const completed = workspaceReducer(populated(), { type: 'taskStatusChanged', id: task.id, done: true, at });
    const deleted = workspaceReducer(completed, { type: 'projectDeleted', id: project.id, at: later });
    expect(dataOf(deleted).projects).toEqual([]);
    expect(dataOf(deleted).tasks[0]).toEqual({ ...task, projectId: null, status: 'done', completedAt: at, updatedAt: later });
    expect(dataOf(completed).tasks[0]!.projectId).toBe(project.id);
  });
  it('rejects invalid mutations including duplicates and dangling assignments', () => {
    const state = populated();
    expect(workspaceReducer(state, { type: 'taskCreated', task })).toBe(state);
    expect(workspaceReducer(state, { type: 'projectCreated', project })).toBe(state);
    expect(workspaceReducer(state, { type: 'projectRenamed', id: project.id, name: ' ', at })).toBe(state);
    expect(workspaceReducer(state, { type: 'taskCreated', task: { ...task, id: 'other', projectId: 'missing' } })).toBe(state);
    expect(workspaceReducer(state, { type: 'taskStatusChanged', id: task.id, done: true, at: 'invalid' })).toBe(state);
  });
  it('blocks all domain mutations during conflicts and recovery', () => {
    const conflict = workspaceReducer(populated(), { type: 'saveFailed', conflict: true, message: 'Reload' });
    const recovery: WorkspaceState = { phase: 'recovery', message: 'Invalid data' };
    for (const state of [conflict, recovery]) {
      expect(workspaceReducer(state, { type: 'taskDeleted', id: task.id })).toBe(state);
      expect(workspaceReducer(state, { type: 'taskCreated', task })).toBe(state);
      expect(workspaceReducer(state, { type: 'projectDeleted', id: project.id, at })).toBe(state);
      expect(workspaceReducer(state, { type: 'projectCreated', project })).toBe(state);
    }
  });
  it('keeps session-only data editable after a quota failure', () => {
    const memory = workspaceReducer(populated(), { type: 'saveFailed', conflict: false, message: 'Full' });
    expect(dataOf(workspaceReducer(memory, { type: 'taskDeleted', id: task.id })).tasks).toEqual([]);
  });
});

it('ignores stale IDs and repeated completion without scheduling another save', () => {
  const state = populated();
  expect(workspaceReducer(state, { type: 'taskDeleted', id: 'missing' })).toBe(state);
  expect(workspaceReducer(state, { type: 'projectDeleted', id: 'missing', at })).toBe(state);
  expect(workspaceReducer(state, { type: 'taskStatusChanged', id: task.id, done: false, at })).toBe(state);
});
