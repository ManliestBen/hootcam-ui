import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FileContentView } from '../components/FileContentView';
import type { FileRecord } from '../api/types';

export function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const eventId = id ? parseInt(id, 10) : NaN;
  const { api, credentials } = useAuth();
  const queryClient = useQueryClient();

  const { data: event, isLoading, error } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => api.getEvent(eventId),
    enabled: Number.isInteger(eventId),
  });

  const { data: files } = useQuery({
    queryKey: ['files', 'event', eventId],
    queryFn: () => api.listFiles({ event_id: eventId, limit: 500 }),
    enabled: Number.isInteger(eventId),
  });

  const { data: cameras } = useQuery({
    queryKey: ['cameras'],
    queryFn: () => api.listCameras(),
  });

  const deleteMutation = useMutation({
    mutationFn: (fileId: number) => api.deleteFile(fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', 'event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['files-list'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
    },
  });

  function handleDelete(f: FileRecord) {
    if (!window.confirm(`Delete this ${f.file_type}? This cannot be undone.`)) return;
    deleteMutation.mutate(f.id);
  }

  if (!Number.isInteger(eventId)) {
    return <div className="error-message">Invalid event id</div>;
  }
  if (isLoading) return <div className="loading">Loading event…</div>;
  if (error) return <div className="error-message">{String(error)}</div>;
  if (!event) return <div className="error-message">Event not found</div>;

  const camName = cameras?.find((c) => c.id === (event as { camera_index?: number }).camera_index)?.name;
  const cameraIndex = (event as { camera_index?: number }).camera_index;

  return (
    <>
      <div style={{ marginBottom: '1rem' }}>
        <Link to="/events">← Events</Link>
      </div>
      <h1>Event #{eventId}</h1>
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.5rem 1.5rem', margin: 0 }}>
          <dt style={{ color: 'var(--text-muted)' }}>Camera</dt>
          <dd style={{ margin: 0 }}>{camName ?? `Camera ${cameraIndex}`}</dd>
          <dt style={{ color: 'var(--text-muted)' }}>Started</dt>
          <dd style={{ margin: 0 }}>{(event as { started_at?: string }).started_at}</dd>
          <dt style={{ color: 'var(--text-muted)' }}>Ended</dt>
          <dd style={{ margin: 0 }}>{(event as { ended_at?: string }).ended_at ?? '—'}</dd>
        </dl>
      </div>
      <h2>Files</h2>
      {files?.length === 0 && <div className="empty-state">No files for this event.</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        {(files ?? []).map((f) => (
          <div key={f.id} className="card">
            <FileContentView fileId={f.id} fileType={f.file_type} filePath={f.file_path} credentials={credentials} />
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              {f.file_type} · {f.timestamp}
            </p>
            <button
              type="button"
              className="secondary"
              style={{ marginTop: '0.5rem' }}
              disabled={deleteMutation.isPending}
              onClick={() => handleDelete(f)}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
