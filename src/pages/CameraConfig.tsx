import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { CameraConfig as CameraConfigType } from '../api/types';

export function CameraConfig() {
  const { id } = useParams<{ id: string }>();
  const cameraIndex = id ? parseInt(id, 10) : NaN;
  const { api } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Partial<CameraConfigType>>({});

  const { data, isLoading, error } = useQuery({
    queryKey: ['camera-config', cameraIndex],
    queryFn: () => api.getCameraConfig(cameraIndex),
    enabled: Number.isInteger(cameraIndex),
  });

  useEffect(() => {
    if (!data) return;
    setForm({
      camera_name: data.camera_name ?? undefined,
      camera_id: data.camera_id ?? undefined,
      width: data.width ?? undefined,
      height: data.height ?? undefined,
      framerate: data.framerate ?? undefined,
      threshold: data.threshold ?? undefined,
      event_gap: data.event_gap ?? undefined,
      pre_capture: data.pre_capture ?? undefined,
      post_capture: data.post_capture ?? undefined,
      movie_output: data.movie_output ?? undefined,
      movie_max_time: data.movie_max_time ?? undefined,
    });
  }, [data]);

  const patchMutation = useMutation({
    mutationFn: (update: CameraConfigType) => api.patchCameraConfig(cameraIndex, update),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['camera-config', cameraIndex] });
      queryClient.invalidateQueries({ queryKey: ['cameras'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    patchMutation.mutate(form as CameraConfigType);
  };

  if (!Number.isInteger(cameraIndex)) {
    return <div className="error-message">Invalid camera id</div>;
  }
  if (isLoading) return <div className="loading">Loading camera config…</div>;
  if (error) return <div className="error-message">{String(error)}</div>;

  return (
    <>
      <div style={{ marginBottom: '1rem' }}>
        <Link to={`/cameras/${cameraIndex}`}>← Camera {cameraIndex}</Link>
      </div>
      <h1>Camera {cameraIndex} config</h1>
      <div className="card" style={{ maxWidth: 560 }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Camera name</label>
            <input
              type="text"
              value={form.camera_name ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, camera_name: e.target.value || undefined }))}
            />
          </div>
          <div className="form-group">
            <label>Camera ID (1–32000)</label>
            <input
              type="number"
              min={1}
              max={32000}
              value={form.camera_id ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, camera_id: e.target.value ? parseInt(e.target.value, 10) : undefined }))}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Width</label>
              <input
                type="number"
                min={8}
                value={form.width ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, width: e.target.value ? parseInt(e.target.value, 10) : undefined }))}
              />
            </div>
            <div className="form-group">
              <label>Height</label>
              <input
                type="number"
                min={8}
                value={form.height ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, height: e.target.value ? parseInt(e.target.value, 10) : undefined }))}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Framerate</label>
            <input
              type="number"
              min={2}
              max={100}
              value={form.framerate ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, framerate: e.target.value ? parseInt(e.target.value, 10) : undefined }))}
            />
          </div>
          <div className="form-group">
            <label>Motion threshold (pixels)</label>
            <input
              type="number"
              min={1}
              value={form.threshold ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, threshold: e.target.value ? parseInt(e.target.value, 10) : undefined }))}
            />
          </div>
          <div className="form-group">
            <label>Event gap (seconds, -1 = no events)</label>
            <input
              type="number"
              min={-1}
              value={form.event_gap ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, event_gap: e.target.value ? parseInt(e.target.value, 10) : undefined }))}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Pre-capture frames</label>
              <input
                type="number"
                min={0}
                max={100}
                value={form.pre_capture ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, pre_capture: e.target.value ? parseInt(e.target.value, 10) : undefined }))}
              />
            </div>
            <div className="form-group">
              <label>Post-capture frames</label>
              <input
                type="number"
                min={0}
                value={form.post_capture ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, post_capture: e.target.value ? parseInt(e.target.value, 10) : undefined }))}
              />
            </div>
          </div>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                checked={form.movie_output ?? false}
                onChange={(e) => setForm((f) => ({ ...f, movie_output: e.target.checked }))}
              />
              Movie output on motion
            </label>
          </div>
          <div className="form-group">
            <label>Movie max time (seconds, 0 = unlimited)</label>
            <input
              type="number"
              min={0}
              value={form.movie_max_time ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, movie_max_time: e.target.value ? parseInt(e.target.value, 10) : undefined }))}
            />
          </div>
          {patchMutation.isError && (
            <div className="error-message">{String(patchMutation.error)}</div>
          )}
          <button type="submit" className="primary" disabled={patchMutation.isPending}>
            {patchMutation.isPending ? 'Saving…' : 'Save camera config'}
          </button>
        </form>
      </div>
    </>
  );
}
