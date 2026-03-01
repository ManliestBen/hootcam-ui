import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { CameraConfig as CameraConfigType, CameraResolution } from '../api/types';

/** Commonly used resolutions from 640×480 up to 4608×2592 for camera config. */
const COMMON_RESOLUTIONS: CameraResolution[] = [
  { width: 640, height: 480, fps: 0 },
  { width: 800, height: 600, fps: 0 },
  { width: 1024, height: 768, fps: 0 },
  { width: 1280, height: 720, fps: 0 },
  { width: 1280, height: 960, fps: 0 },
  { width: 1920, height: 1080, fps: 0 },
  { width: 2592, height: 1944, fps: 0 },
  { width: 3280, height: 2464, fps: 0 },
  { width: 3840, height: 2160, fps: 0 },
  { width: 4608, height: 2592, fps: 0 },
];

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

  const { data: apiResolutions = [] } = useQuery({
    queryKey: ['camera-resolutions', cameraIndex],
    queryFn: () => api.getCameraResolutions(cameraIndex),
    enabled: Number.isInteger(cameraIndex),
  });

  // Use hardware resolutions when available, otherwise common list (so dropdown always works)
  const resolutions = apiResolutions.length > 0 ? apiResolutions : COMMON_RESOLUTIONS;

  useEffect(() => {
    if (!data) return;
    setForm({
      camera_name: data.camera_name ?? undefined,
      camera_id: data.camera_id ?? undefined,
      stream_url: data.stream_url ?? undefined,
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

  const resolutionRestartPending = useRef(false);

  const patchMutation = useMutation({
    mutationFn: (update: CameraConfigType) => api.patchCameraConfig(cameraIndex, update),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['camera-config', cameraIndex] });
      queryClient.invalidateQueries({ queryKey: ['cameras'] });
      if (resolutionRestartPending.current) {
        resolutionRestartPending.current = false;
        try {
          await api.restartServer();
        } catch {
          // Request may fail when server exits; that's expected
        }
        setRestartMessage('Server is restarting. Please wait a moment and refresh the page.');
      }
    },
  });

  const [restartMessage, setRestartMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const resolutionChanged =
      data != null &&
      (form.width !== data.width || form.height !== data.height);
    if (resolutionChanged) {
      const ok = window.confirm(
        'Changing the resolution will restart the server so the new resolution takes effect. The server will restart automatically after saving. Continue?'
      );
      if (!ok) return;
      resolutionRestartPending.current = true;
    }
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
      {restartMessage && (
        <div className="card" style={{ marginBottom: '1rem', background: 'var(--card-bg)', color: 'var(--text)' }}>
          {restartMessage}
        </div>
      )}
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
          <div className="form-group">
            <label>Stream URL</label>
            <input
              type="url"
              placeholder="http://pi-ip:8082/stream"
              value={form.stream_url ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, stream_url: e.target.value || undefined }))}
            />
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Where to pull video from (e.g. Hootcam Streamer: <code>http://&lt;pi-ip&gt;:8082/stream</code> for cam0, <code>:8083/stream</code> for cam1).
            </p>
          </div>
          <div className="form-group">
            <label>Resolution</label>
            <select
              value={[form.width, form.height].filter((x) => x != null).join(',') || ''}
              onChange={(e) => {
                const v = e.target.value;
                if (!v) return;
                const [w, h] = v.split(',').map((n) => parseInt(n, 10));
                if (Number.isNaN(w) || Number.isNaN(h)) return;
                const res = resolutions.find((r) => r.width === w && r.height === h);
                setForm((f) => ({
                  ...f,
                  width: w,
                  height: h,
                  framerate: res?.fps ?? f.framerate,
                }));
              }}
            >
              <option value="">Select resolution…</option>
              {resolutions.map((r) => (
                <option key={`${r.width}x${r.height}`} value={`${r.width},${r.height}`}>
                  {r.width} × {r.height}
                  {r.fps > 0 ? ` (up to ${r.fps} fps)` : ''}
                </option>
              ))}
              {form.width != null && form.height != null && !resolutions.some((r) => r.width === form.width && r.height === form.height) && (
                <option value={`${form.width},${form.height}`}>Current: {form.width} × {form.height}</option>
              )}
            </select>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              {apiResolutions.length > 0
                ? 'Values from the connected camera hardware. Restart the server after changing resolution.'
                : 'Common resolutions. Restart the server after changing resolution.'}
            </p>
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
