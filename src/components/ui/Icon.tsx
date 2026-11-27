export type IconName = 'pulse' | 'overview' | 'tasks' | 'projects' | 'sun' | 'moon' | 'system' | 'check' | 'shield';
const paths: Record<IconName, string> = {
  pulse: 'M3 12h4l3-7 4 14 3-7h4',
  overview: 'M4 4h6v6H4z M14 4h6v6h-6z M4 14h6v6H4z M14 14h6v6h-6z',
  tasks: 'M9 6h11 M9 12h11 M9 18h11 M3 6l1 1 2-2 M3 12l1 1 2-2 M3 18l1 1 2-2',
  projects: 'M3 7h7l2 2h9v11H3z M3 7V4h7l2 3h9v2',
  sun: 'M12 3v1 M12 20v1 M3 12h1 M20 12h1 M5.6 5.6l.7.7 M17.7 17.7l.7.7 M5.6 18.4l.7-.7 M17.7 6.3l.7-.7 M16 12a4 4 0 1 0-8 0 4 4 0 0 0 8 0',
  moon: 'M20 15.5A9 9 0 0 1 8.5 4 9 9 0 1 0 20 15.5',
  system: 'M3 4h18v13H3z M8 21h8 M12 17v4',
  check: 'M5 12l4 4L19 6',
  shield: 'M12 3l8 3v6c0 5-8 9-8 9s-8-4-8-9V6z M8 12l3 3 5-6',
};

export function Icon({ name }: { name: IconName }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}
