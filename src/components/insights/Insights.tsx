import { selectActivity, selectStatistics } from '../../lib/selectors';
import type { StoredData } from '../../types/models';

export function Insights({ data, now }: { data: StoredData; now: Date }) {
  const statistics = selectStatistics(data, now);
  const activity = selectActivity(data, now);
  const maximum = Math.max(1, ...activity.map(day => day.completed));
  const total = activity.reduce((sum, day) => sum + day.completed, 0);
  return <section aria-label="Productivity insights" className="insights">
    <dl className="stats-grid">{Object.entries(statistics).map(([label, count]) => <div key={label}><dt>{label === 'open' ? 'Open' : label[0]!.toUpperCase() + label.slice(1)} tasks</dt><dd>{count}</dd></div>)}</dl>
    <section className="panel activity-panel" aria-labelledby="activity-title">
      <div className="panel-heading"><div><h2 id="activity-title">Completion activity</h2><p>Last seven days · {total} {total === 1 ? 'completion' : 'completions'}</p></div><span className="subtle-badge">Including today</span></div>
      <div className="activity-chart" aria-hidden="true">{activity.map(day => <div className="activity-day" key={day.date}><span>{day.completed}</span><div className="bar-track"><div className="activity-bar" style={{ height: `${day.completed / maximum * 100}%` }} /></div><span>{new Date(`${day.date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short' })}</span></div>)}</div>
      <details className="activity-data"><summary>View daily completion counts</summary><table><caption>Completed tasks by local calendar date</caption><thead><tr><th scope="col">Date</th><th scope="col">Completed tasks</th></tr></thead><tbody>{activity.map(day => <tr key={day.date}><th scope="row">{day.date}</th><td>{day.completed}</td></tr>)}</tbody></table></details>
      <p className="panel-footnote">{total === 0 ? 'No completions in this period. ' : ''}Reopening or deleting a task removes its completion from this view.</p>
    </section>
  </section>;
}
