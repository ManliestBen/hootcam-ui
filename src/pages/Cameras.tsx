import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CameraLiveView } from '../components/CameraLiveView';

export function Cameras() {
  const { api } = useAuth();
  const { data: cameras, isLoading, error } = useQuery({
    queryKey: ['cameras'],
    queryFn: () => api.listCameras(),
  });

  if (isLoading) return <div className="loading">Loading cameras…</div>;
  if (error) return <div className="error-message">{String(error)}</div>;

  return (
    <>
      <h1>Cameras</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        Live view, connection status, and detection controls per camera.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {(cameras ?? []).map((cam) => (
          <CameraCard key={cam.id} camera={cam} api={api} />
        ))}
      </div>
      {cameras?.length === 0 && (
        <div className="empty-state">No cameras configured.</div>
      )}
    </>
  );
}

function CameraCard({
  camera,
  api,
}: {
  camera: { id: number; name: string | null; detection_paused: boolean; stream_url: string };
  api: ReturnType<typeof import('../api/client').createApi>;
}) {
  const queryClient = useQueryClient();
  const { data: status } = useQuery({
    queryKey: ['camera-status', camera.id],
    queryFn: () => api.getCameraStatus(camera.id),
  });
  const { data: detection } = useQuery({
    queryKey: ['detection-status', camera.id],
    queryFn: () => api.getDetectionStatus(camera.id),
  });
  const startMutation = useMutation({
    mutationFn: () => api.detectionStart(camera.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cameras'] });
      queryClient.invalidateQueries({ queryKey: ['detection-status', camera.id] });
    },
  });
  const pauseMutation = useMutation({
    mutationFn: () => api.detectionPause(camera.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cameras'] });
      queryClient.invalidateQueries({ queryKey: ['detection-status', camera.id] });
    },
  });
  const snapshotMutation = useMutation({
    mutationFn: () => api.takeSnapshot(camera.id),
  });

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h2 style={{ margin: 0 }}>{camera.name || `Camera ${camera.id}`}</h2>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {status && (
            <span className={`badge ${status.connected ? 'success' : 'error'}`}>
              {status.connected ? 'Connected' : 'Disconnected'}
            </span>
          )}
          {detection && (
            <span className={`badge ${detection.paused ? 'muted' : 'success'}`}>
              {detection.paused ? 'Paused' : 'Detecting'}
              {detection.in_event ? ' (event)' : ''}
            </span>
          )}
        </div>
      </div>
      <CameraLiveView cameraIndex={camera.id} />
      <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        {!camera.detection_paused ? (
          <button
            type="button"
            onClick={() => pauseMutation.mutate()}
            disabled={pauseMutation.isPending}
          >
            Pause detection
          </button>
        ) : (
          <button
            type="button"
            className="primary"
            onClick={() => startMutation.mutate()}
            disabled={startMutation.isPending}
          >
            Start detection
          </button>
        )}
        <button
          type="button"
          onClick={() => snapshotMutation.mutate()}
          disabled={snapshotMutation.isPending}
        >
          {snapshotMutation.isPending ? 'Taking…' : 'Snapshot'}
        </button>
        <Link to={`/cameras/${camera.id}/config`}>
          <button type="button">Config</button>
        </Link>
      </div>
    </div>
  );
}
