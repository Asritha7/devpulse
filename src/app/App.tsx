import { useWorkspace } from './AppProvider';
import { useTheme } from '../hooks/useTheme';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { RecoveryPanel } from '../components/ui/RecoveryPanel';
import { TaskSection } from '../components/tasks/TaskSection';
import { ProjectSection } from '../components/projects/ProjectSection';
import { Insights } from '../components/insights/Insights';
import { useCurrentDate } from '../hooks/useCurrentDate';
import { Icon } from '../components/ui/Icon';

export function App() {
  const { state, retrySave } = useWorkspace();
  const now = useCurrentDate();
  useTheme(state.phase === 'ready' ? state.data.preferences.theme : 'system');
  return <DashboardLayout>
    {state.phase === 'loading' && <div className="loading-state" role="status"><span className="eyebrow">DevPulse</span><h1>Opening your workspace…</h1><p>Reading your locally saved data.</p></div>}
    {state.phase === 'recovery' && <RecoveryPanel message={state.message} />}
    {state.phase === 'ready' && <>
      <div className="page-heading"><div><p className="eyebrow">Your development workspace</p><h1>Less noise. More progress.</h1><p>A clear place for your projects, priorities, and the work ahead.</p></div><span className={`save-state ${state.persistence !== 'saved' ? 'unsaved' : ''}`} role="status"><Icon name="shield" />{state.persistence === 'saved' ? (state.dirty ? 'Saving…' : 'Saved locally') : state.persistence === 'conflict' ? 'Reload required' : 'Not saved'}</span></div>
      {state.message && <div className="status-banner" role="alert"><span>{state.message}</span><button onClick={state.persistence === 'conflict' ? () => window.location.reload() : retrySave}>{state.persistence === 'conflict' ? 'Reload workspace' : 'Retry saving'}</button></div>}
      <Insights data={state.data} now={now} />
      <div className="workspace-grid">
        <TaskSection data={state.data} locked={state.persistence === 'conflict'} now={now} />
        <ProjectSection data={state.data} locked={state.persistence === 'conflict'} />
      </div>
    </>}
  </DashboardLayout>;
}
