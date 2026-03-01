import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FileContentView } from '../components/FileContentView';
import type { FileRecord } from '../api/types';

export function Files() {
  const { api, credentials } = useAuth();
  const queryClient = useQueryClient();
  const [cameraFilter, setCameraFilter] = useState<number | ''>('');
  const [fileTypeFilter, setFileTypeFilter] = useState<string>('');
  const [limit] = useState(200);
  const [offset, setOffset] = useState(0);

  const { data: files, isLoading, error } = useQuery({
    queryKey: ['files-list', cameraFilter, fileTypeFilter, limit, offset],
    queryFn: () =>
      api.listFiles({
        camera_index: cameraFilter === '' ? undefined : cameraFilter,
        file_type: fileTypeFilter || undefined,
        limit,
        offset,
      }),
  });

  const { data: cameras } = useQuery({
    queryKey: ['cameras'],
    queryFn: () => api.listCameras(),
  });

  const deleteMutation = useMutation({
    mutationFn: (fileId: number) => api.deleteFile(fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files-list'] });
      queryClient.invalidateQueries({ queryKey: ['files'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  function handleDelete(f: FileRecord) {
    if (!window.confirm(`Delete this ${f.file_type}? This cannot be undone.`)) return;
    deleteMutation.mutate(f.id);
  }

  if (isLoading) return <div className="loading">Loading files…</div>;
  if (error) return <div className="error-message">{String(error)}</div>;

  return (
    <>
      <h1>Files</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
        Recorded pictures and movies. Filter by camera or type.
      </p>
      <div className="card" style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
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
        <div className="form-group" style={{ margin: 0, minWidth: 140 }}>
          <label>Type</label>
          <select
            value={fileTypeFilter}
            onChange={(e) => {
              setOffset(0);
              setFileTypeFilter(e.target.value);
            }}
          >
            <option value="">All</option>
            <option value="picture">Picture</option>
            <option value="movie">Movie</option>
            <option value="snapshot">Snapshot</option>
            <option value="timelapse">Timelapse</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="button" disabled={offset === 0} onClick={() => setOffset((o) => Math.max(0, o - limit))}>
            Previous
          </button>
          <button type="button" onClick={() => setOffset((o) => o + limit)}>
            Next
          </button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        {(files ?? []).map((f) => (
          <div key={f.id} className="card">
            <FileContentView fileId={f.id} fileType={f.file_type} filePath={f.file_path} credentials={credentials} />
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              {f.file_type} · {f.timestamp}
              {f.event_id != null && ` · Event ${f.event_id}`}
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
      {files?.length === 0 && <div className="empty-state">No files found.</div>}
    </>
  );
}
