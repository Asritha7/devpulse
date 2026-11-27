import { describe, expect, it } from 'vitest';
import { createEmptyData, createSampleData } from './sampleData';
import { selectActivity, selectProjectProgress, selectStatistics, selectFilteredTasks, emptyFilters, NO_PROJECT_FILTER } from './selectors';
import { localDateKey } from './dates';

const now = new Date(2026, 10, 27, 14, 0, 0);

describe('derived selectors', () => {
  it('handles an empty workspace without division by zero', () => {
    expect(selectStatistics(createEmptyData(), now)).toEqual({ total: 0, completed: 0, open: 0, overdue: 0 });
    expect(selectProjectProgress(createEmptyData(), 'missing')).toEqual({ total: 0, completed: 0, percent: 0 });
    expect(selectActivity(createEmptyData(), now)).toHaveLength(7);
  });
  it('derives counts and project progress without mutating or persisting statistics', () => {
    const data = createSampleData(now);
    const before = JSON.stringify(data);
    expect(selectStatistics(data, now)).toEqual({ total: 9, completed: 5, open: 4, overdue: 0 });
    expect(selectProjectProgress(data, 'project-platform')).toEqual({ total: 3, completed: 2, percent: 67 });
    expect(JSON.stringify(data)).toBe(before);
  });
  it('counts only incomplete tasks due before the local calendar day', () => {
    const data = createSampleData(now);
    data.tasks[0]!.dueDate = '2026-11-26';
    data.tasks[1]!.dueDate = '2026-11-27';
    data.tasks[4]!.dueDate = '2026-11-20';
    expect(selectStatistics(data, now).overdue).toBe(1);
  });
  it('includes today and six previous days, with zero-filled gaps', () => {
    const data = createSampleData(now);
    const activity = selectActivity(data, now);
    expect(activity.map(day => day.completed)).toEqual([0, 1, 0, 1, 0, 2, 1]);
    expect(activity[6]!.date).toBe(localDateKey(now));
    data.tasks[4]!.status = 'todo';
    data.tasks[4]!.completedAt = null;
    expect(selectActivity(data, now)[6]!.completed).toBe(0);
  });
  it('buckets completions by local date around midnight and across year boundaries', () => {
    const boundary = new Date(2027, 0, 1, 0, 15);
    const data = createSampleData(boundary);
    expect(selectActivity(data, boundary)[0]!.date).toBe('2026-12-26');
    expect(selectActivity(data, boundary)[6]).toEqual({ date: '2027-01-01', completed: 1 });
  });
});

describe('combined task filters', () => {
  it('combines search, status, priority and project using AND', () => {
    const data = createSampleData(now);
    const filters = { search: '  API  ', status: 'todo', priority: 'high', project: 'project-platform' };
    expect(selectFilteredTasks(data, filters).map(task => task.title)).toEqual(['Define API response contracts']);
    expect(selectFilteredTasks(data, { ...filters, status: 'done' })).toEqual([]);
    expect(selectFilteredTasks(data, { ...filters, priority: 'low' })).toEqual([]);
    expect(selectFilteredTasks(data, { ...filters, project: 'project-design' })).toEqual([]);
  });
  it('searches descriptions and supports unassigned tasks and clearing filters', () => {
    const data = createSampleData(now);
    data.tasks[0]!.description = 'Investigate retry handling';
    data.tasks[0]!.projectId = null;
    expect(selectFilteredTasks(data, { ...emptyFilters, search: 'RETRY', project: NO_PROJECT_FILTER })).toEqual([data.tasks[0]]);
    expect(selectFilteredTasks(data, emptyFilters)).toEqual(data.tasks);
    expect(selectFilteredTasks(data, { ...emptyFilters, search: 'not present' })).toEqual([]);
  });
});
