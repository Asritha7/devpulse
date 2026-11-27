import { describe, expect, it, vi } from 'vitest';
import { createStorageAdapter, STORAGE_KEY } from './storage';
import { createEmptyData, createSampleData } from './sampleData';
import { isDateKey, parseStoredData, validateStoredData } from './validation';

function fixture(initial: string | null = null) {
  const values = new Map<string, string>();
  if (initial !== null) values.set(STORAGE_KEY, initial);
  const port = {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => { values.set(key, value); }),
  };
  return { adapter: createStorageAdapter(() => port), port, values };
}

describe('persisted data validation', () => {
  it('accepts empty and realistic sample workspaces', () => {
    expect(validateStoredData(createEmptyData()).ok).toBe(true);
    expect(validateStoredData(createSampleData()).ok).toBe(true);
  });
  it.each(['{', 'null', '[]', '42', '{"schemaVersion":2}', '{}'])('rejects malformed or unsupported data: %s', raw => {
    expect(parseStoredData(raw).ok).toBe(false);
  });
  it.each([
    ['duplicate tasks', (data: ReturnType<typeof createSampleData>) => { data.tasks.push(data.tasks[0]!); }],
    ['duplicate projects', (data: ReturnType<typeof createSampleData>) => { data.projects.push(data.projects[0]!); }],
    ['dangling project', (data: ReturnType<typeof createSampleData>) => { data.tasks[0]!.projectId = 'missing'; }],
    ['blank title', (data: ReturnType<typeof createSampleData>) => { data.tasks[0]!.title = ' '; }],
    ['oversized title', (data: ReturnType<typeof createSampleData>) => { data.tasks[0]!.title = 'x'.repeat(161); }],
    ['impossible date', (data: ReturnType<typeof createSampleData>) => { data.tasks[0]!.dueDate = '2026-02-30'; }],
    ['invalid timestamp', (data: ReturnType<typeof createSampleData>) => { data.tasks[0]!.createdAt = 'yesterday'; }],
    ['completion mismatch', (data: ReturnType<typeof createSampleData>) => { data.tasks[0]!.status = 'done'; }],
    ['invalid chronology', (data: ReturnType<typeof createSampleData>) => { data.tasks[0]!.updatedAt = '2000-01-01T00:00:00.000Z'; }],
  ])('rejects %s', (_, mutate) => {
    const data = createSampleData();
    mutate(data);
    expect(validateStoredData(data).ok).toBe(false);
  });
  it('rejects unknown fields and invalid enum values instead of silently dropping them', () => {
    expect(validateStoredData({ ...createEmptyData(), statistics: {} }).ok).toBe(false);
    expect(validateStoredData({ ...createEmptyData(), preferences: { theme: 'sepia' } }).ok).toBe(false);
    expect(validateStoredData({ ...createEmptyData(), preferences: { theme: ['dark'] } }).ok).toBe(false);
  });
  it('validates leap dates', () => {
    expect(isDateKey('2024-02-29')).toBe(true);
    expect(isDateKey('2025-02-29')).toBe(false);
  });
});

describe('storage safety', () => {
  it('distinguishes missing data from a valid empty workspace', () => {
    expect(fixture().adapter.load().kind).toBe('missing');
    const { adapter, port } = fixture(JSON.stringify(createEmptyData()));
    expect(adapter.load().kind).toBe('ready');
    expect(port.setItem).not.toHaveBeenCalled();
  });
  it.each(['', '{broken', '{"schemaVersion":99}'])('preserves invalid bytes on read and ordinary save: %s', raw => {
    const { adapter, port, values } = fixture(raw);
    expect(adapter.load().kind).toBe('recovery');
    expect(adapter.save(createEmptyData(), raw).ok).toBe(false);
    expect(values.get(STORAGE_KEY)).toBe(raw);
    expect(port.setItem).not.toHaveBeenCalled();
  });
  it('round-trips data and detects another tab before saving', () => {
    const { adapter, values } = fixture();
    const data = createSampleData();
    const saved = adapter.save(data, null);
    expect(saved.ok).toBe(true);
    expect(adapter.load()).toMatchObject({ kind: 'ready', data });
    values.set(STORAGE_KEY, 'external changes');
    expect(adapter.save(createEmptyData(), JSON.stringify(data))).toMatchObject({ ok: false, kind: 'conflict' });
    expect(values.get(STORAGE_KEY)).toBe('external changes');
  });
  it('requires explicit reset and refuses reset against a stale snapshot', () => {
    const { adapter } = fixture('broken');
    expect(adapter.save(createEmptyData(), 'stale', true)).toMatchObject({ ok: false, kind: 'conflict' });
    expect(adapter.save(createEmptyData(), 'broken', true).ok).toBe(true);
    expect(adapter.load()).toMatchObject({ kind: 'ready', data: createEmptyData() });
  });
  it('handles storage access being blocked', () => {
    const adapter = createStorageAdapter(() => { throw new Error('SecurityError'); });
    expect(adapter.load().kind).toBe('unavailable');
    expect(adapter.save(createEmptyData(), null)).toMatchObject({ ok: false, kind: 'unavailable' });
  });
  it('preserves existing data when quota is exceeded', () => {
    const original = JSON.stringify(createEmptyData());
    const { adapter, port, values } = fixture(original);
    port.setItem.mockImplementation(() => { throw new Error('QuotaExceededError'); });
    expect(adapter.save(createSampleData(), original)).toMatchObject({ ok: false, kind: 'unavailable' });
    expect(values.get(STORAGE_KEY)).toBe(original);
  });
  it('validates outgoing data before writing', () => {
    const { adapter, port } = fixture();
    const data = createSampleData();
    data.tasks[0]!.title = '';
    expect(adapter.save(data, null)).toMatchObject({ ok: false, kind: 'invalid' });
    expect(port.setItem).not.toHaveBeenCalled();
  });
});

describe('external storage notifications', () => {
  it('ignores other storage areas and unrelated keys', () => {
    const { adapter, port } = fixture('changed');
    const otherPort = fixture().port;
    expect(adapter.isExternalChange({ key: STORAGE_KEY, newValue: 'changed', storageArea: otherPort }, 'original')).toBe(false);
    expect(adapter.isExternalChange({ key: 'unrelated', newValue: 'changed', storageArea: port }, 'original')).toBe(false);
  });
  it('detects changes and clearing the workspace in the correct storage area', () => {
    const { adapter, port, values } = fixture('changed');
    expect(adapter.isExternalChange({ key: STORAGE_KEY, newValue: 'changed', storageArea: port }, 'original')).toBe(true);
    values.clear();
    expect(adapter.isExternalChange({ key: null, newValue: null, storageArea: port }, 'original')).toBe(true);
  });
  it('ignores stale queued events when current storage still matches the snapshot', () => {
    const { adapter, port } = fixture('current');
    expect(adapter.isExternalChange({ key: STORAGE_KEY, newValue: 'older', storageArea: port }, 'current')).toBe(false);
  });
  it('does not throw if storage becomes unavailable while handling an event', () => {
    const adapter = createStorageAdapter(() => { throw new Error('Blocked'); });
    expect(adapter.isExternalChange({ key: STORAGE_KEY, newValue: null, storageArea: null }, 'old')).toBe(false);
  });
});
