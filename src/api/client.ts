/**
 * API client for hootcam-server. All requests use HTTP Basic Auth when credentials are provided.
 * Base URL is taken from credentials or from VITE_HOOTCAM_SERVER_URL (e.g. in .env).
 */

import type {
  ApiInfo,
  CameraConfig,
  ConfigResponse,
  GlobalConfig,
  StorageResponse,
  StorageUpdate,
  EventSummary,
  FileRecord,
  PasswordChangeBody,
} from './types';

export interface AuthCredentials {
  apiBaseUrl: string;
  username: string;
  password: string;
}

/** Server URL from env (VITE_HOOTCAM_SERVER_URL) or default. Used when building API URLs. */
export function getServerBaseUrl(): string {
  const url = import.meta.env.VITE_HOOTCAM_SERVER_URL;
  return (typeof url === 'string' && url.trim() !== '') ? url.trim().replace(/\/$/, '') : 'http://localhost:8080';
}

function getBaseUrl(creds: AuthCredentials | null): string {
  return (creds?.apiBaseUrl?.trim() ? creds.apiBaseUrl.replace(/\/$/, '') : null) ?? getServerBaseUrl();
}

function b64(s: string): string {
  return btoa(s);
}

function getAuthHeader(creds: AuthCredentials): string {
  return 'Basic ' + b64(`${creds.username}:${creds.password}`);
}

async function request<T>(
  creds: AuthCredentials | null,
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const base = getBaseUrl(creds);
  const url = path.startsWith('http') ? path : `${base}${path.startsWith('/') ? '' : '/'}${path}`;
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (creds?.username && creds?.password) {
    headers['Authorization'] = getAuthHeader(creds);
  }
  const res = await fetch(url, { ...options, headers, credentials: 'include' });
  if (!res.ok) {
    const text = await res.text();
    let detail = text;
    try {
      const j = JSON.parse(text);
      detail = j.detail ?? text;
    } catch {
      // use text as-is
    }
    throw new Error(detail || `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

async function requestBlob(creds: AuthCredentials | null, path: string): Promise<Blob> {
  const base = getBaseUrl(creds);
  const url = path.startsWith('http') ? path : `${base}${path.startsWith('/') ? '' : '/'}${path}`;
  const headers: Record<string, string> = {};
  if (creds?.username && creds?.password) {
    headers['Authorization'] = getAuthHeader(creds);
  }
  const res = await fetch(url, { headers, credentials: 'include' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.blob();
}

/** Build stream URL (use with fetch + auth for cross-origin; same-origin can use as img src). */
export function streamUrl(creds: AuthCredentials | null, cameraIndex: number): string {
  return `${getBaseUrl(creds)}/cameras/${cameraIndex}/stream`;
}

/** URL for single frame JPEG (for img src with credentials). */
export function currentFrameUrl(creds: AuthCredentials | null, cameraIndex: number): string {
  return `${getBaseUrl(creds)}/cameras/${cameraIndex}/current`;
}

/** URL for file content (img/video src or download). */
export function fileContentUrl(creds: AuthCredentials | null, fileId: number): string {
  return `${getBaseUrl(creds)}/files/${fileId}/content`;
}

export function createApi(creds: AuthCredentials | null) {
  return {
    getInfo: () => request<ApiInfo>(creds, '/'),

    // Auth
    changePassword: (body: PasswordChangeBody) =>
      request<void>(creds, '/auth/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),

    // Config
    getConfig: () => request<ConfigResponse>(creds, '/config'),
    patchConfig: (update: GlobalConfig) =>
      request<GlobalConfig>(creds, '/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update),
      }),
    restartServer: () =>
      request<{ message: string }>(creds, '/restart', { method: 'POST' }),

    // Storage
    getStorage: () => request<StorageResponse>(creds, '/storage'),
    patchStorage: (update: StorageUpdate) =>
      request<StorageResponse>(creds, '/storage', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update),
      }),

    // Cameras
    listCameras: () => request<import('./types').CameraInfo[]>(creds, '/cameras'),
    getCameraConfig: (cameraIndex: number) =>
      request<CameraConfig>(creds, `/cameras/${cameraIndex}/config`),
    patchCameraConfig: (cameraIndex: number, update: CameraConfig) =>
      request<CameraConfig>(creds, `/cameras/${cameraIndex}/config`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update),
      }),
    getCameraStatus: (cameraIndex: number) =>
      request<import('./types').CameraStatus>(creds, `/cameras/${cameraIndex}/status`),
    getCameraResolutions: (cameraIndex: number) =>
      request<import('./types').CameraResolution[]>(creds, `/cameras/${cameraIndex}/resolutions`),

    // Detection
    detectionStart: (cameraIndex: number) =>
      request<{ camera_index: number; paused: boolean }>(
        creds,
        `/cameras/${cameraIndex}/detection/start`,
        { method: 'POST' }
      ),
    detectionPause: (cameraIndex: number) =>
      request<{ camera_index: number; paused: boolean }>(
        creds,
        `/cameras/${cameraIndex}/detection/pause`,
        { method: 'POST' }
      ),
    getDetectionStatus: (cameraIndex: number) =>
      request<import('./types').DetectionStatus>(
        creds,
        `/cameras/${cameraIndex}/detection/status`
      ),
    takeSnapshot: (cameraIndex: number) =>
      request<{ camera_index: number; requested: boolean }>(
        creds,
        `/cameras/${cameraIndex}/action/snapshot`,
        { method: 'POST' }
      ),

    // Events & files
    listEvents: (params?: { camera_index?: number; limit?: number; offset?: number }) => {
      const sp = new URLSearchParams();
      if (params?.camera_index != null) sp.set('camera_index', String(params.camera_index));
      if (params?.limit != null) sp.set('limit', String(params.limit));
      if (params?.offset != null) sp.set('offset', String(params.offset));
      const q = sp.toString();
      return request<EventSummary[]>(creds, `/events${q ? '?' + q : ''}`);
    },
    getEvent: (eventId: number) =>
      request<Record<string, unknown>>(creds, `/events/${eventId}`),
    listFiles: (params?: {
      event_id?: number;
      camera_index?: number;
      file_type?: string;
      limit?: number;
      offset?: number;
    }) => {
      const sp = new URLSearchParams();
      if (params?.event_id != null) sp.set('event_id', String(params.event_id));
      if (params?.camera_index != null) sp.set('camera_index', String(params.camera_index));
      if (params?.file_type != null) sp.set('file_type', params.file_type);
      if (params?.limit != null) sp.set('limit', String(params.limit));
      if (params?.offset != null) sp.set('offset', String(params.offset));
      const q = sp.toString();
      return request<FileRecord[]>(creds, `/files${q ? '?' + q : ''}`);
    },
    getFileBlob: (fileId: number) =>
      requestBlob(creds, `/files/${fileId}/content`),
  };
}

export type Api = ReturnType<typeof createApi>;
