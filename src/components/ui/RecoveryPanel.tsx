import { useState } from 'react';
import { useWorkspace } from '../../app/AppProvider';

export function RecoveryPanel({ message }: { message: string }) {
  const { resetWorkspace } = useWorkspace();
  const [confirmed, setConfirmed] = useState(false);
  return <section className="recovery panel" aria-labelledby="recovery-title">
    <p className="eyebrow">Workspace recovery</p><h1 id="recovery-title">Your saved data needs attention.</h1>
    <p role="alert">{message}</p>
    <p>Your existing data has been left untouched. If this workspace came from a newer version, open it with that version. You can also preserve the raw <code>devpulse.workspace</code> value from your browser’s storage tools before resetting.</p>
    <div className="recovery-actions"><button onClick={() => window.location.reload()}>Reload workspace</button></div>
    <div className="reset-area"><h2>Start with an empty workspace</h2><p>Reset permanently replaces this browser’s saved DevPulse data. This cannot be undone.</p>
      <label className="confirmation"><input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} />I understand that resetting deletes the existing saved workspace.</label>
      <button className="danger-button" disabled={!confirmed} onClick={resetWorkspace}>Reset saved workspace</button>
    </div>
  </section>;
}
