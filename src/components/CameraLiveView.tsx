import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getServerBaseUrl } from '../api/client';

const MJPEG_BOUNDARY = 'frame';

/**
 * Consumes the real MJPEG stream (GET /cameras/{id}/stream) over one connection,
 * parses multipart frames, and displays them. Smoother than polling /current.
 * Works with or without auth; on 401 shows "Sign in to view".
 */
export function CameraLiveView({ cameraIndex }: { cameraIndex: number }) {
  const { credentials } = useAuth();
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const base = credentials?.apiBaseUrl?.replace(/\/$/, '') ?? getServerBaseUrl();
    const url = `${base}/cameras/${cameraIndex}/stream`;

    const authHeader =
      credentials?.username && credentials?.password
        ? 'Basic ' + btoa(`${credentials.username}:${credentials.password}`)
        : null;

    let cancelled = false;
    const ac = new AbortController();
    abortRef.current = ac;

    (async () => {
      try {
        const res = await fetch(url, {
          headers: authHeader ? { Authorization: authHeader } : {},
          credentials: 'omit',
          signal: ac.signal,
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
        setError(null);

        const contentType = res.headers.get('Content-Type') || '';
        const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;\s]+))/i);
        const boundary = boundaryMatch
          ? (boundaryMatch[1] || boundaryMatch[2] || '').trim()
          : MJPEG_BOUNDARY;
        const boundaryPrefix = `--${boundary}\r\n`;
        const boundaryBytes = new TextEncoder().encode(boundaryPrefix);
        const boundaryLen = boundaryBytes.length;

        const reader = res.body?.getReader();
        if (!reader) {
          setError('No response body');
          return;
        }
        let buffer = new Uint8Array(0);
        let currentBlobUrl: string | null = null;

        while (!cancelled) {
          const { done, value } = await reader.read();
          if (done) break;
          const newBuf = new Uint8Array(buffer.length + value.length);
          newBuf.set(buffer);
          newBuf.set(value, buffer.length);
          buffer = newBuf;

          // Find next boundary (--boundary) then headers then body
          const boundaryIdx = findSequence(buffer, boundaryBytes);
          if (boundaryIdx < 0) {
            if (buffer.length > 512 * 1024) buffer = buffer.slice(-boundaryLen - 100);
            continue;
          }

          const afterBoundary = boundaryIdx + boundaryLen;
          const headersEnd = findSequence(buffer, new TextEncoder().encode('\r\n\r\n'), afterBoundary);
          if (headersEnd < 0) continue;

          const headerBlock = new TextDecoder().decode(buffer.subarray(afterBoundary, headersEnd));
          const clMatch = /Content-Length:\s*(\d+)/i.exec(headerBlock);
          const bodyStart = headersEnd + 4;
          const bodyLen = clMatch ? parseInt(clMatch[1], 10) : 0;
          const bodyEnd = bodyStart + bodyLen;

          if (bodyLen <= 0 || buffer.length < bodyEnd) continue;

          const jpeg = buffer.slice(bodyStart, bodyEnd);
          buffer = buffer.slice(bodyEnd);
          if (cancelled) break;
          setBlobUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            currentBlobUrl = URL.createObjectURL(new Blob([jpeg], { type: 'image/jpeg' }));
            return currentBlobUrl;
          });
        }

        if (currentBlobUrl) URL.revokeObjectURL(currentBlobUrl);
      } catch (e) {
        if (!cancelled && (e as Error).name !== 'AbortError') {
          setNeedsAuth(false);
          setError(e instanceof Error ? e.message : 'Stream error');
        }
      }
    })();

    return () => {
      cancelled = true;
      ac.abort();
      abortRef.current = null;
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

function findSequence(buf: Uint8Array, seq: Uint8Array, start = 0): number {
  if (seq.length === 0 || start + seq.length > buf.length) return -1;
  for (let i = start; i <= buf.length - seq.length; i++) {
    let match = true;
    for (let j = 0; j < seq.length; j++) {
      if (buf[i + j] !== seq[j]) {
        match = false;
        break;
      }
    }
    if (match) return i;
  }
  return -1;
}
