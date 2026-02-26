import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export function Layout() {
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-layout">
      <header className="app-header">
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <h1>Hootcam</h1>
        </Link>
        <nav className="app-nav">
          <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'active' : '')}>Dashboard</NavLink>
          <NavLink to="/cameras" className={({ isActive }) => (isActive ? 'active' : '')}>Cameras</NavLink>
          <NavLink to="/events" className={({ isActive }) => (isActive ? 'active' : '')}>Events</NavLink>
          <NavLink to="/files" className={({ isActive }) => (isActive ? 'active' : '')}>Files</NavLink>
          <NavLink to="/config" className={({ isActive }) => (isActive ? 'active' : '')}>Config</NavLink>
          <NavLink to="/storage" className={({ isActive }) => (isActive ? 'active' : '')}>Storage</NavLink>
          <NavLink to="/account" className={({ isActive }) => (isActive ? 'active' : '')}>Account</NavLink>
          <button
            type="button"
            onClick={toggleTheme}
            title={theme === 'light' ? 'Switch to dark' : 'Switch to light'}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <button type="button" onClick={handleLogout}>
            Log out
          </button>
        </nav>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
