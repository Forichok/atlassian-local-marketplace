import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(username, password);
      showToast('Login successful!', 'success');
      navigate('/admin');
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    }}>
      <div className="card" style={{
        width: '100%',
        maxWidth: '400px',
        padding: 'var(--space-2xl)',
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 800,
          background: 'var(--gradient-jira)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: 'var(--space-md)',
          textAlign: 'center',
        }}>
          DC PluginX
        </h1>
        <p style={{
          fontSize: '14px',
          color: 'var(--color-text-secondary)',
          textAlign: 'center',
          marginBottom: 'var(--space-2xl)',
        }}>
          Sign in to access admin panel
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 'var(--space-lg)' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 600,
              marginBottom: 'var(--space-xs)',
              color: 'var(--color-text-primary)',
            }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              style={{
                width: '100%',
                padding: 'var(--space-md)',
                fontSize: '14px',
                border: '2px solid rgba(0, 0, 0, 0.1)',
                borderRadius: 'var(--radius-md)',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(0, 0, 0, 0.1)'}
            />
          </div>

          <div style={{ marginBottom: 'var(--space-xl)' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 600,
              marginBottom: 'var(--space-xs)',
              color: 'var(--color-text-primary)',
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: 'var(--space-md)',
                fontSize: '14px',
                border: '2px solid rgba(0, 0, 0, 0.1)',
                borderRadius: 'var(--radius-md)',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(0, 0, 0, 0.1)'}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="button"
            style={{
              width: '100%',
              padding: 'var(--space-md)',
              fontSize: '16px',
              fontWeight: 600,
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};
