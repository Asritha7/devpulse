import { useEffect, useState } from 'react';

/** Refresh calendar-dependent selectors after midnight and when returning to the tab. */
export function useCurrentDate() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const refresh = () => setNow(new Date());
    const interval = window.setInterval(refresh, 30_000);
    window.addEventListener('focus', refresh);
    return () => { window.clearInterval(interval); window.removeEventListener('focus', refresh); };
  }, []);
  return now;
}
