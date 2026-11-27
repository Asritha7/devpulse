import { createContext, useCallback, useContext, useEffect, useReducer, useRef, type ReactNode } from 'react';
import { createEmptyData, createSampleData } from '../lib/sampleData';
import { createStorageAdapter } from '../lib/storage';
import { workspaceReducer, type MutationAction, type WorkspaceState } from './reducer';
import type { Theme } from '../types/models';

interface WorkspaceContextValue {
  state: WorkspaceState;
  mutate: (action: MutationAction) => void;
  setTheme: (theme: Theme) => void;
  retrySave: () => void;
  resetWorkspace: () => void;
}
const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(workspaceReducer, { phase: 'loading' });
  const adapter = useRef(createStorageAdapter());
  const expectedRaw = useRef<string | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const loaded = adapter.current.load();
    if (loaded.kind === 'recovery') {
      expectedRaw.current = loaded.raw;
      dispatch({ type: 'recovery', message: loaded.message });
    } else if (loaded.kind === 'ready') {
      expectedRaw.current = loaded.raw;
      dispatch({ type: 'loaded', data: loaded.data });
    } else if (loaded.kind === 'unavailable') {
      dispatch({ type: 'loaded', data: createEmptyData(), memoryOnly: true, message: loaded.message });
    } else {
      const data = createSampleData();
      const saved = adapter.current.save(data, null);
      if (saved.ok) {
        expectedRaw.current = saved.raw;
        dispatch({ type: 'loaded', data });
      } else {
        dispatch({ type: 'loaded', data, memoryOnly: true, message: saved.message });
        if (saved.kind === 'conflict') dispatch({ type: 'saveFailed', conflict: true, message: saved.message });
      }
    }
  }, []);

  const retrySave = useCallback(() => {
    if (state.phase !== 'ready' || state.persistence === 'conflict') return;
    const result = adapter.current.save(state.data, expectedRaw.current);
    if (result.ok) {
      expectedRaw.current = result.raw;
      dispatch({ type: 'saved' });
    } else dispatch({ type: 'saveFailed', message: result.message, conflict: result.kind !== 'unavailable' });
  }, [state]);

  useEffect(() => {
    if (state.phase === 'ready' && state.dirty) retrySave();
  }, [state, retrySave]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (adapter.current.isExternalChange(event, expectedRaw.current)) dispatch({ type: 'saveFailed', conflict: true, message: 'Workspace data changed in another tab. Reload before making more changes.' });
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const resetWorkspace = () => {
    if (state.phase !== 'recovery') return;
    const data = createEmptyData();
    const result = adapter.current.save(data, expectedRaw.current, true);
    if (result.ok) {
      expectedRaw.current = result.raw;
      dispatch({ type: 'loaded', data });
    } else dispatch({ type: 'recovery', message: result.message });
  };

  return <WorkspaceContext.Provider value={{ state, mutate: dispatch, setTheme: theme => dispatch({ type: 'themeChanged', theme }), retrySave, resetWorkspace }}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error('useWorkspace must be used inside AppProvider');
  return context;
}
