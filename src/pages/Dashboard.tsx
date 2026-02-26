import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CameraLiveView } from '../components/CameraLiveView';

export function Dashboard() {
  const { api } = useAuth();
  const { data: cameras, isLoading, error } = useQuery({
    queryKey: ['cameras'],
    queryFn: () => api.listCameras(),
  });

  if (isLoading) return <div className="loading">Loading cameras…</div>;
  if (error) return <div className="error-message">{String(error)}</div>;

  return (
    <>
      <h1>Dashboard</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        Live view and quick status. Use Cameras for detection controls and config.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {(cameras ?? []).map((cam) => (
          <div key={cam.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h2 style={{ margin: 0 }}>{cam.name || `Camera ${cam.id}`}</h2>
              <span className={`badge ${cam.detection_paused ? 'muted' : 'success'}`}>
                {cam.detection_paused ? 'Paused' : 'Detecting'}
              </span>
            </div>
            <CameraLiveView cameraIndex={cam.id} />
            <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
              <Link to={`/cameras/${cam.id}`}>
                <button type="button">View &amp; control</button>
              </Link>
            </div>
          </div>
        ))}
      </div>
      {cameras?.length === 0 && (
        <div className="empty-state">
          No cameras configured. Check server config.
        </div>
      )}
    </>
  );
}
