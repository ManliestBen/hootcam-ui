import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { GlobalConfig } from '../api/types';

export function Config() {
  const { api } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ['config'],
    queryFn: () => api.getConfig(),
  });
  const [form, setForm] = useState<Partial<GlobalConfig>>({});

  const global = data?.global_config;
  useEffect(() => {
    if (!global) return;
    setForm({
      log_level: global.log_level ?? undefined,
      stream_quality: global.stream_quality ?? undefined,
      stream_maxrate: global.stream_maxrate ?? undefined,
      stream_localhost: global.stream_localhost ?? undefined,
      stream_grey: global.stream_grey ?? undefined,
      stream_motion: global.stream_motion ?? undefined,
      stream_failure_sec: global.stream_failure_sec ?? undefined,
      stream_retry_sec: global.stream_retry_sec ?? undefined,
      streamer_api_url: global.streamer_api_url ?? undefined,
      database_busy_timeout: global.database_busy_timeout ?? undefined,
      log_file: global.log_file ?? undefined,
    });
  }, [global]);

  const patchMutation = useMutation({
    mutationFn: (update: GlobalConfig) => api.patchConfig(update),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const update: GlobalConfig = {};
    if (form.log_level != null) update.log_level = form.log_level;
    if (form.stream_quality != null) update.stream_quality = form.stream_quality;
    if (form.stream_maxrate != null) update.stream_maxrate = form.stream_maxrate;
    if (form.stream_localhost != null) update.stream_localhost = form.stream_localhost;
    if (form.stream_grey != null) update.stream_grey = form.stream_grey;
    if (form.stream_motion != null) update.stream_motion = form.stream_motion;
    if (form.stream_failure_sec != null) update.stream_failure_sec = form.stream_failure_sec;
    if (form.stream_retry_sec != null) update.stream_retry_sec = form.stream_retry_sec;
    if (form.streamer_api_url !== undefined) update.streamer_api_url = form.streamer_api_url || null;
    if (form.database_busy_timeout != null) update.database_busy_timeout = form.database_busy_timeout;
    if (form.log_file !== undefined) update.log_file = form.log_file || null;
    patchMutation.mutate(update);
  };

  if (isLoading) return <div className="loading">Loading config…</div>;
  if (error) return <div className="error-message">{String(error)}</div>;

  return (
    <>
      <h1>Global configuration</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        Global server settings. Target directory is managed under <Link to="/storage">Storage</Link>.
        Per-camera settings: <Link to="/cameras">Cameras</Link> → Config.
      </p>
      <div className="card" style={{ maxWidth: 560 }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Log level (1–9)</label>
            <input
              type="number"
              min={1}
              max={9}
              value={form.log_level ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, log_level: e.target.value ? parseInt(e.target.value, 10) : undefined }))}
            />
          </div>
          <div className="form-group">
            <label>Log file path (optional)</label>
            <input
              type="text"
              value={form.log_file ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, log_file: e.target.value || undefined }))}
              placeholder="Leave empty for stderr"
            />
          </div>
          <div className="form-group">
            <label>Stream quality (1–100)</label>
            <input
              type="number"
              min={1}
              max={100}
              value={form.stream_quality ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, stream_quality: e.target.value ? parseInt(e.target.value, 10) : undefined }))}
            />
          </div>
          <div className="form-group">
            <label>Stream max framerate (1–100, 100 = unlimited)</label>
            <input
              type="number"
              min={1}
              max={100}
              value={form.stream_maxrate ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, stream_maxrate: e.target.value ? parseInt(e.target.value, 10) : undefined }))}
            />
          </div>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                checked={form.stream_localhost ?? false}
                onChange={(e) => setForm((f) => ({ ...f, stream_localhost: e.target.checked }))}
              />
              Stream localhost only
            </label>
          </div>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                checked={form.stream_grey ?? false}
                onChange={(e) => setForm((f) => ({ ...f, stream_grey: e.target.checked }))}
              />
              Stream greyscale
            </label>
          </div>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                checked={form.stream_motion ?? false}
                onChange={(e) => setForm((f) => ({ ...f, stream_motion: e.target.checked }))}
              />
              Limit stream FPS when no motion
            </label>
          </div>
          <div className="form-group">
            <label>Stream failure (seconds)</label>
            <input
              type="number"
              min={3}
              max={300}
              value={form.stream_failure_sec ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, stream_failure_sec: e.target.value ? parseInt(e.target.value, 10) : undefined }))}
              placeholder="15"
            />
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Seconds with no frame before marking camera failed. Higher = more tolerant of brief dropouts.
            </p>
          </div>
          <div className="form-group">
            <label>Stream retry (seconds)</label>
            <input
              type="number"
              min={2}
              max={60}
              value={form.stream_retry_sec ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, stream_retry_sec: e.target.value ? parseInt(e.target.value, 10) : undefined }))}
              placeholder="5"
            />
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              When a camera is failed, re-attempt connection every this many seconds.
            </p>
          </div>
          <div className="form-group">
            <label>Streamer API URL (optional)</label>
            <input
              type="url"
              value={form.streamer_api_url ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, streamer_api_url: e.target.value || undefined }))}
              placeholder="http://pi-ip:8084"
            />
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Base URL of Hootcam Streamer on the Pi. When set, saving camera config (resolution, fps) in Cameras → Config will push those values to the streamer so they take effect on the Pi.
            </p>
          </div>
          <div className="form-group">
            <label>Database busy timeout (ms, 0 = immediate)</label>
            <input
              type="number"
              min={0}
              value={form.database_busy_timeout ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, database_busy_timeout: e.target.value ? parseInt(e.target.value, 10) : undefined }))}
            />
          </div>
          {patchMutation.isError && (
            <div className="error-message">{String(patchMutation.error)}</div>
          )}
          <button type="submit" className="primary" disabled={patchMutation.isPending}>
            {patchMutation.isPending ? 'Saving…' : 'Save global config'}
          </button>
        </form>
      </div>
    </>
  );
}
