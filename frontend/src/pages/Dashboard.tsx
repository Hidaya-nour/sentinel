import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as monitorsApi from '../lib/monitors';
import type { Monitor } from '../lib/monitors';
import { ApiError } from '../lib/api';

export function Dashboard() {
  const { user, logout } = useAuth();
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function refresh() {
    setLoading(true);
    monitorsApi
      .listMonitors()
      .then(setMonitors)
      .finally(() => setLoading(false));
  }

  useEffect(refresh, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await monitorsApi.createMonitor({ name, url });
      setName('');
      setUrl('');
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create monitor');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this monitor?')) return;
    await monitorsApi.deleteMonitor(id);
    refresh();
  };

  return (
    <div>
      <header>
        <span>{user?.email}</span>
        <button onClick={logout}>Log out</button>
      </header>

      <h1>Monitors</h1>

      <form onSubmit={handleCreate}>
        {error && <p role="alert">{error}</p>}
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="url"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />
        <button type="submit" disabled={submitting}>
          {submitting ? 'Adding...' : 'Add monitor'}
        </button>
      </form>

      {loading ? (
        <p>Loading...</p>
      ) : monitors.length === 0 ? (
        <p>No monitors yet.</p>
      ) : (
        <ul>
          {monitors.map((m) => (
            <li key={m.id}>
              <Link to={`/monitors/${m.id}`}>{m.name}</Link> — {m.url} —{' '}
              {m.isActive ? 'active' : 'paused'}
              <button onClick={() => handleDelete(m.id)}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
