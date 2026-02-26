import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

export function Events() {
  const { api } = useAuth();
  const [cameraFilter, setCameraFilter] = useState<number | ''>('');
  const [limit] = useState(100);
  const [offset, setOffset] = useState(0);

  const { data: events, isLoading, error } = useQuery({
    queryKey: ['events', cameraFilter, limit, offset],
    queryFn: () =>
      api.listEvents({
        camera_index: cameraFilter === '' ? undefined : cameraFilter,
        limit,
        offset,
      }),
  });

  const { data: cameras } = useQuery({
    queryKey: ['cameras'],
    queryFn: () => api.listCameras(),
  });

  if (isLoading) return <div className="loading">Loading events…</div>;
  if (error) return <div className="error-message">{String(error)}</div>;

  return (
    <>
      <h1>Events</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
        Motion events from the database. Click an event to see details and files.
      </p>
      <div className="card" style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="form-group" style={{ margin: 0, minWidth: 160 }}>
          <label>Camera</label>
          <select
            value={cameraFilter === '' ? '' : String(cameraFilter)}
            onChange={(e) => {
              setOffset(0);
              setCameraFilter(e.target.value === '' ? '' : parseInt(e.target.value, 10));
            }}
          >
            <option value="">All</option>
            {cameras?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name ?? `Camera ${c.id}`}
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
          <button type="button" disabled={offset === 0} onClick={() => setOffset((o) => Math.max(0, o - limit))}>
            Previous
          </button>
          <button type="button" onClick={() => setOffset((o) => o + limit)}>
            Next
          </button>
        </div>
      </div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
              <th style={{ padding: '0.75rem 1rem' }}>ID</th>
              <th style={{ padding: '0.75rem 1rem' }}>Camera</th>
              <th style={{ padding: '0.75rem 1rem' }}>Started</th>
              <th style={{ padding: '0.75rem 1rem' }}>Ended</th>
              <th style={{ padding: '0.75rem 1rem' }}>Files</th>
              <th style={{ padding: '0.75rem 1rem' }}></th>
            </tr>
          </thead>
          <tbody>
            {(events ?? []).map((ev) => (
              <tr key={ev.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '0.75rem 1rem' }}>{ev.id}</td>
                <td style={{ padding: '0.75rem 1rem' }}>
                  {cameras?.find((c) => c.id === ev.camera_index)?.name ?? `Camera ${ev.camera_index}`}
                </td>
                <td style={{ padding: '0.75rem 1rem' }}>{ev.started_at}</td>
                <td style={{ padding: '0.75rem 1rem' }}>{ev.ended_at ?? '—'}</td>
                <td style={{ padding: '0.75rem 1rem' }}>{ev.file_count}</td>
                <td style={{ padding: '0.75rem 1rem' }}>
                  <Link to={`/events/${ev.id}`}>View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {events?.length === 0 && (
        <div className="empty-state">No events found.</div>
      )}
    </>
  );
}
