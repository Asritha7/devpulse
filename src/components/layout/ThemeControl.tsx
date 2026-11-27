import { useWorkspace } from '../../app/AppProvider';
import type { Theme } from '../../types/models';
import { Icon, type IconName } from '../ui/Icon';

const options: Array<{ theme: Theme; icon: IconName; label: string }> = [
  { theme: 'light', icon: 'sun', label: 'Light' },
  { theme: 'dark', icon: 'moon', label: 'Dark' },
  { theme: 'system', icon: 'system', label: 'System' },
];

export function ThemeControl() {
  const { state, setTheme } = useWorkspace();
  const selected = state.phase === 'ready' ? state.data.preferences.theme : 'system';
  return <fieldset className="theme-control" disabled={state.phase !== 'ready' || state.persistence === 'conflict'}>
    <legend>Appearance</legend>
    <div className="theme-options">{options.map(({ theme, icon, label }) =>
      <label key={theme} title={`${label} theme`}>
        <input type="radio" name="theme" value={theme} checked={selected === theme} onChange={() => setTheme(theme)} />
        <span><Icon name={icon} /><span className="sr-only">{label}</span></span>
      </label>,
    )}</div>
  </fieldset>;
}
