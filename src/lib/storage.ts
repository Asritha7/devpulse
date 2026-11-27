import type { StoredData } from '../types/models';
import { parseStoredData, validateStoredData } from './validation';

export const STORAGE_KEY = 'devpulse.workspace';
export type StoragePort = Pick<Storage, 'getItem' | 'setItem'>;
export type LoadResult =
  | { kind: 'missing'; raw: null }
  | { kind: 'ready'; raw: string; data: StoredData }
  | { kind: 'recovery'; raw: string; message: string }
  | { kind: 'unavailable'; message: string };
export type SaveResult = { ok: true; raw: string } | { ok: false; kind: 'conflict' | 'unavailable' | 'invalid'; message: string };

/** Access localStorage lazily: even reading the property may throw in restricted browsers. */
export function createStorageAdapter(getStorage: () => StoragePort = () => window.localStorage) {
  return {
    isExternalChange(event: { key: string | null; newValue: string | null; storageArea: StoragePort | null }, expectedRaw: string | null): boolean {
      if (event.key !== STORAGE_KEY && event.key !== null) return false;
      try {
        const storage = getStorage();
        // Ignore sessionStorage and queued events whose value is already superseded.
        return event.storageArea === storage && event.newValue !== expectedRaw && storage.getItem(STORAGE_KEY) !== expectedRaw;
      } catch { return false; }
    },
    load(): LoadResult {
      try {
        const raw = getStorage().getItem(STORAGE_KEY);
        if (raw === null) return { kind: 'missing', raw };
        const result = parseStoredData(raw);
        return result.ok ? { kind: 'ready', raw, data: result.data } : { kind: 'recovery', raw, message: result.reason };
      } catch { return { kind: 'unavailable', message: 'Browser storage is unavailable. Changes will only last for this session.' }; }
    },
    save(data: StoredData, expectedRaw: string | null, explicitReset = false): SaveResult {
      if (!validateStoredData(data).ok) return { ok: false, kind: 'invalid', message: 'Changes could not be saved because the workspace data is invalid.' };
      try {
        const storage = getStorage();
        const currentRaw = storage.getItem(STORAGE_KEY);
        if (currentRaw !== expectedRaw) return { ok: false, kind: 'conflict', message: 'Workspace data changed in another tab. Reload to use the latest saved version.' };
        if (!explicitReset && currentRaw !== null && !parseStoredData(currentRaw).ok) return { ok: false, kind: 'invalid', message: 'Saved data needs recovery. It has not been overwritten.' };
        const raw = JSON.stringify(data);
        storage.setItem(STORAGE_KEY, raw);
        return { ok: true, raw };
      } catch { return { ok: false, kind: 'unavailable', message: 'Changes are not saved. Browser storage may be blocked or full; keep this tab open and retry.' }; }
    },
  };
}
