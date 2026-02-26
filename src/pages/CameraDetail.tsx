import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CameraLiveView } from '../components/CameraLiveView';

export function CameraDetail() {
  const { id } = useParams<{ id: string }>();
  const cameraIndex = id ? parseInt(id, 10) : NaN;
  const { api } = useAuth();
  const queryClient = useQueryClient();

  const { data: cameras } = useQuery({ queryKey: ['cameras'], queryFn: () => api.listCameras() });
  const cam = cameras?.find((c) => c.id === cameraIndex);

  const { data: status } = useQuery({
    queryKey: ['camera-status', cameraIndex],
    queryFn: () => api.getCameraStatus(cameraIndex),
    enabled: Number.isInteger(cameraIndex),
  });
  const { data: detection } = useQuery({
    queryKey: ['detection-status', cameraIndex],
    queryFn: () => api.getDetectionStatus(cameraIndex),
    enabled: Number.isInteger(cameraIndex),
  });

  const startMutation = useMutation({
    mutationFn: () => api.detectionStart(cameraIndex),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cameras'] });
      queryClient.invalidateQueries({ queryKey: ['detection-status', cameraIndex] });
    },
  });
  const pauseMutation = useMutation({
    mutationFn: () => api.detectionPause(cameraIndex),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cameras'] });
      queryClient.invalidateQueries({ queryKey: ['detection-status', cameraIndex] });
    },
  });
  const snapshotMutation = useMutation({
    mutationFn: () => api.takeSnapshot(cameraIndex),
  });

  if (!Number.isInteger(cameraIndex)) {
    return <div className="error-message">Invalid camera id</div>;
  }

  return (
    <>
      <div style={{ marginBottom: '1rem' }}>
        <Link to="/cameras">← Cameras</Link>
      </div>
      <h1>{cam?.name ?? `Camera ${cameraIndex}`}</h1>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {status && (
          <span className={`badge ${status.connected ? 'success' : 'error'}`}>
            {status.connected ? 'Connected' : 'Disconnected'}
          </span>
        )}
        {detection && (
          <span className={`badge ${detection.paused ? 'muted' : 'success'}`}>
            {detection.paused ? 'Paused' : 'Detecting'}
            {detection.in_event ? ` (event #${detection.event_id})` : ''}
          </span>
        )}
      </div>
      <div className="card" style={{ marginBottom: '1rem' }}>
        <CameraLiveView cameraIndex={cameraIndex} />
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {!cam?.detection_paused ? (
          <button type="button" onClick={() => pauseMutation.mutate()} disabled={pauseMutation.isPending}>
            Pause detection
          </button>
        ) : (
          <button type="button" className="primary" onClick={() => startMutation.mutate()} disabled={startMutation.isPending}>
            Start detection
          </button>
        )}
        <button type="button" onClick={() => snapshotMutation.mutate()} disabled={snapshotMutation.isPending}>
          {snapshotMutation.isPending ? 'Taking…' : 'Take snapshot'}
        </button>
        <Link to={`/cameras/${cameraIndex}/config`}>
          <button type="button">Edit config</button>
        </Link>
      </div>
    </>
  );
}
