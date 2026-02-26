import { Link } from 'react-router-dom';
import { CameraLiveView } from '../components/CameraLiveView';
import { useTheme } from '../context/ThemeContext';

/**
 * Public camera streams view. Visible without logging in.
 * Uses VITE_HOOTCAM_SERVER_URL for frame URLs; if server requires auth, each stream shows "Sign in to view".
 */
export function PublicStreams() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="app-layout">
      <header className="app-header">
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <h1>Hootcam</h1>
        </Link>
        <nav className="app-nav">
          <button
            type="button"
            onClick={toggleTheme}
            title={theme === 'light' ? 'Switch to dark' : 'Switch to light'}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <Link to="/login">
            <button type="button" className="primary">
              Sign in
            </button>
          </Link>
        </nav>
      </header>
      <main className="app-main">
        <h1>Live view</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          Camera streams. Sign in for detection controls, events, and configuration.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          <div className="card">
            <h2 style={{ margin: '0 0 0.75rem' }}>Camera 0</h2>
            <CameraLiveView cameraIndex={0} />
          </div>
          <div className="card">
            <h2 style={{ margin: '0 0 0.75rem' }}>Camera 1</h2>
            <CameraLiveView cameraIndex={1} />
          </div>
        </div>
      </main>
    </div>
  );
}
