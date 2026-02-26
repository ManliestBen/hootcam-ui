import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export function Account() {
  const { api, credentials, updatePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  const changeMutation = useMutation({
    mutationFn: (pwd: string) => api.changePassword({ new_password: pwd }),
    onSuccess: () => {
      updatePassword(newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage({ type: 'ok', text: 'Password updated. Stored credentials refreshed.' });
    },
    onError: (err) => {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to change password' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }
    if (currentPassword !== credentials?.password) {
      setMessage({ type: 'error', text: 'Current password is incorrect (use the one you signed in with).' });
      return;
    }
    changeMutation.mutate(newPassword);
  };

  return (
    <>
      <h1>Account</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        Change your password. Server URL and username stay the same.
      </p>
      <div className="card" style={{ maxWidth: 400 }}>
        <p style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
          Signed in as <strong>{credentials?.username}</strong> at <span className="mono">{credentials?.apiBaseUrl}</span>
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Current password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <div className="form-group">
            <label>New password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
          <div className="form-group">
            <label>Confirm new password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
          {message && (
            <div className={message.type === 'error' ? 'error-message' : ''} style={message.type === 'ok' ? { color: 'var(--success)', marginBottom: '0.5rem' } : undefined}>
              {message.text}
            </div>
          )}
          <button type="submit" className="primary" disabled={changeMutation.isPending}>
            {changeMutation.isPending ? 'Updating…' : 'Change password'}
          </button>
        </form>
      </div>
    </>
  );
}
