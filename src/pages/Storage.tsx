import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export function Storage() {
  const { api } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ['storage'],
    queryFn: () => api.getStorage(),
  });
  const [path, setPath] = useState('');
  const [useSsd, setUseSsd] = useState(false);

  const patchMutation = useMutation({
    mutationFn: (update: { path?: string; use_auto_detected_ssd?: boolean }) =>
      api.patchStorage(update),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storage'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (useSsd) {
      patchMutation.mutate({ use_auto_detected_ssd: true });
    } else if (path.trim()) {
      patchMutation.mutate({ path: path.trim() });
    }
  };

  if (isLoading) return <div className="loading">Loading storage…</div>;
  if (error) return <div className="error-message">{String(error)}</div>;

  return (
    <>
      <h1>Storage</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        Recording directory. Changes take effect after server restart.
      </p>
      <div className="card" style={{ maxWidth: 560, marginBottom: '1.5rem' }}>
        <div className="form-group">
          <label>Current path</label>
          <p className="mono" style={{ margin: 0, wordBreak: 'break-all' }}>
            {data?.current_path ?? '—'}
          </p>
        </div>
        {data?.auto_detected_ssd_path && (
          <div className="form-group">
            <label>Auto-detected SSD path</label>
            <p className="mono" style={{ margin: 0, wordBreak: 'break-all' }}>
              {data.auto_detected_ssd_path}
            </p>
          </div>
        )}
      </div>
      <div className="card" style={{ maxWidth: 560 }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                checked={useSsd}
                onChange={(e) => setUseSsd(e.target.checked)}
                disabled={!data?.auto_detected_ssd_path}
              />
              Use auto-detected SSD
            </label>
            {!data?.auto_detected_ssd_path && (
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                No SSD detected.
              </p>
            )}
          </div>
          <div className="form-group">
            <label>Or set path manually (absolute)</label>
            <input
              type="text"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="/path/to/recordings"
              disabled={useSsd}
            />
          </div>
          {patchMutation.isError && (
            <div className="error-message">{String(patchMutation.error)}</div>
          )}
          <button
            type="submit"
            className="primary"
            disabled={patchMutation.isPending || (!path.trim() && !useSsd)}
          >
            {patchMutation.isPending ? 'Saving…' : 'Update storage'}
          </button>
        </form>
      </div>
    </>
  );
}
