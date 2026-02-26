import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import type { AuthCredentials } from '../api/client';
import { createApi } from '../api/client';

/** Suggested filename for download (e.g. from file_path). */
function downloadFilename(filePath: string | undefined, fileId: number, fileType: string): string {
  if (filePath) {
    const base = filePath.replace(/^.*[/\\]/, '');
    if (base) return base;
  }
  const ext = fileType === 'movie' || fileType === 'timelapse' ? 'mp4' : 'jpg';
  return `file-${fileId}.${ext}`;
}

/**
 * Fetches file content with auth and displays image or video.
 * Optional filePath is used for the download filename.
 */
export function FileContentView({
  fileId,
  fileType,
  filePath,
  credentials,
}: {
  fileId: number;
  fileType: string;
  filePath?: string;
  credentials: AuthCredentials | null;
}) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const api = createApi(credentials);

  const { data: blob, isLoading, error } = useQuery({
    queryKey: ['file-content', fileId],
    queryFn: () => api.getFileBlob(fileId),
    enabled: !!credentials && fileId > 0,
  });

  useEffect(() => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    setBlobUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [blob]);

  const handleDownload = () => {
    if (!blobUrl) return;
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = downloadFilename(filePath, fileId, fileType);
    a.click();
  };

  if (!credentials) return <div style={{ color: 'var(--text-muted)' }}>Sign in to view</div>;
  if (isLoading) return <div className="loading">Loading…</div>;
  if (error) return <div className="error-message">{String(error)}</div>;
  if (!blobUrl) return null;

  const isVideo = fileType === 'movie' || fileType === 'timelapse';
  return (
    <div>
      {isVideo ? (
        <video
          src={blobUrl}
          controls
          style={{ width: '100%', maxHeight: 240, borderRadius: 8 }}
          preload="metadata"
        />
      ) : (
        <img
          src={blobUrl}
          alt=""
          style={{ width: '100%', height: 'auto', maxHeight: 240, objectFit: 'contain', borderRadius: 8 }}
        />
      )}
      <button type="button" className="secondary" onClick={handleDownload} style={{ marginTop: '0.5rem', width: '100%' }}>
        Download
      </button>
    </div>
  );
}
