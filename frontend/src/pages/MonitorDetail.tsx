import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import * as monitorsApi from '../lib/monitors';
import type { Monitor, CheckRecord, Incident } from '../lib/monitors';

export function MonitorDetail() {
  const { id } = useParams<{ id: string }>();
  const [monitor, setMonitor] = useState<Monitor | null>(null);
  const [checks, setChecks] = useState<CheckRecord[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      monitorsApi.getMonitor(id),
      monitorsApi.getChecks(id),
      monitorsApi.getIncidents(id),
    ])
      .then(([m, c, i]) => {
        setMonitor(m);
        setChecks(c);
        setIncidents(i);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p>Loading...</p>;
  if (!monitor) return <p>Monitor not found.</p>;

  // Chart wants oldest-first for a left-to-right timeline; the API returns newest-first.
  const chartData = [...checks].reverse().map((c) => ({
    time: new Date(c.checkedAt).toLocaleTimeString(),
    latencyMs: c.latencyMs ?? 0,
  }));

  const uptimePercent =
    checks.length > 0
      ? ((checks.filter((c) => c.success).length / checks.length) * 100).toFixed(1)
      : 'N/A';

  return (
    <div>
      <Link to="/dashboard">&larr; Back</Link>
      <h1>{monitor.name}</h1>
      <p>{monitor.url}</p>
      <p>
        Uptime (last {checks.length} checks): {uptimePercent}%
      </p>

      <h2>Latency</h2>
      {chartData.length === 0 ? (
        <p>No checks recorded yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <XAxis dataKey="time" />
            <YAxis label={{ value: 'ms', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Line type="monotone" dataKey="latencyMs" stroke="#2563eb" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      )}

      <h2>Incidents</h2>
      {incidents.length === 0 ? (
        <p>No incidents recorded.</p>
      ) : (
        <ul>
          {incidents.map((inc) => (
            <li key={inc.id}>
              <strong>{inc.status}</strong> — opened {new Date(inc.openedAt).toLocaleString()}
              {inc.resolvedAt && ` — resolved ${new Date(inc.resolvedAt).toLocaleString()}`}
            </li>
          ))}
        </ul>
      )}

      <h2>Recent checks</h2>
      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>Status</th>
            <th>Latency</th>
            <th>Error</th>
          </tr>
        </thead>
        <tbody>
          {checks.map((c) => (
            <tr key={c.id}>
              <td>{new Date(c.checkedAt).toLocaleString()}</td>
              <td>
                {c.success ? '✅' : '❌'} {c.statusCode}
              </td>
              <td>{c.latencyMs}ms</td>
              <td>{c.error ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
