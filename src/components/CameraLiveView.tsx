import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getServerBaseUrl } from '../api/client';

/**
 * Polls GET /cameras/{cameraIndex}/current (JPEG) and displays the frame.
 * Works with or without auth: uses credentials when logged in, otherwise server URL from env (no auth).
 * On 401 when not logged in, shows "Sign in to view".
 */
export function CameraLiveView({ cameraIndex }: { cameraIndex: number }) {
  const { credentials } = useAuth();
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const base = credentials?.apiBaseUrl?.replace(/\/$/, '') ?? getServerBaseUrl();
    const url = `${base}/cameras/${cameraIndex}/current`;

    const authHeader =
      credentials?.username && credentials?.password
        ? 'Basic ' + btoa(`${credentials.username}:${credentials.password}`)
        : null;

    let cancelled = false;
    async function fetchFrame() {
      if (cancelled) return;
      try {
        const res = await fetch(url, {
          headers: authHeader ? { Authorization: authHeader } : {},
          credentials: 'omit',
        });
        if (res.status === 401) {
          setNeedsAuth(true);
          setError(null);
          return;
        }
        if (!res.ok) {
          setNeedsAuth(false);
          setError(res.status === 503 ? 'No frame yet' : `HTTP ${res.status}`);
          return;
        }
        setNeedsAuth(false);
        const blob = await res.blob();
        if (cancelled) return;
        setBlobUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(blob);
        });
        setError(null);
      } catch (e) {
        if (!cancelled) {
          setNeedsAuth(false);
          setError(e instanceof Error ? e.message : 'Failed to load frame');
        }
      }
    }

    fetchFrame();
    intervalRef.current = setInterval(fetchFrame, 800);

    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
      setBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [credentials, cameraIndex]);

  if (needsAuth && !blobUrl) {
    return (
      <div className="card" style={{ aspectRatio: '16/10', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: '0.5rem' }}>
        <span>Sign in to view this camera</span>
        <Link to="/login">Sign in</Link>
      </div>
    );
  }

  if (error && !blobUrl) {
    return (
      <div className="card" style={{ aspectRatio: '16/10', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        {error}
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {blobUrl ? (
        <img
          src={blobUrl}
          alt={`Camera ${cameraIndex} live`}
          style={{ width: '100%', height: 'auto', display: 'block', aspectRatio: '16/10', objectFit: 'contain' }}
        />
      ) : (
        <div style={{ aspectRatio: '16/10', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
          Connecting…
        </div>
      )}
    </div>
  );
}
