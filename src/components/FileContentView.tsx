import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import type { AuthCredentials } from '../api/client';
import { createApi } from '../api/client';

/**
 * Fetches file content with auth and displays image or video.
 */
export function FileContentView({
  fileId,
  fileType,
  credentials,
}: {
  fileId: number;
  fileType: string;
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

  if (!credentials) return <div style={{ color: 'var(--text-muted)' }}>Sign in to view</div>;
  if (isLoading) return <div className="loading">Loading…</div>;
  if (error) return <div className="error-message">{String(error)}</div>;
  if (!blobUrl) return null;

  const isVideo = fileType === 'movie' || fileType === 'timelapse';
  if (isVideo) {
    return (
      <video
        src={blobUrl}
        controls
        style={{ width: '100%', maxHeight: 240, borderRadius: 8 }}
        preload="metadata"
      />
    );
  }
  return (
    <img
      src={blobUrl}
      alt=""
      style={{ width: '100%', height: 'auto', maxHeight: 240, objectFit: 'contain', borderRadius: 8 }}
    />
  );
}
