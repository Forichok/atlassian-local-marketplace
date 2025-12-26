import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import { ThemeToggle } from '../components/ThemeToggle';
import '../styles/login.css';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { login, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePosition({
          x: (e.clientX - rect.left) / rect.width,
          y: (e.clientY - rect.top) / rect.height,
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

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
    <div className="login">
      <div className="login-theme-toggle">
        <ThemeToggle />
      </div>

      <div className="login-orbs">
        <div
          className="login-orb login-orb-1"
          style={{
            transform: `translate(${mousePosition.x * 30}px, ${mousePosition.y * 30}px)`
          }}
        />
        <div
          className="login-orb login-orb-2"
          style={{
            transform: `translate(${mousePosition.x * -20}px, ${mousePosition.y * -20}px)`
          }}
        />
        <div
          className="login-orb login-orb-3"
          style={{
            transform: `translate(${mousePosition.x * 15}px, ${mousePosition.y * -15}px)`
          }}
        />
      </div>

      <div className="login-container" ref={containerRef}>
        <div className="login-content">
          <div className="login-card">
            <div className="login-card-glow"></div>

            <div className="login-header">
              <div className="login-badge">
                <span className="login-badge-pulse"></span>
                <span className="login-badge-text">Secure Access</span>
              </div>

              <h1 className="login-title">DC PluginX</h1>
              <p className="login-subtitle">Sign in to access admin panel</p>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="login-form-group">
                <label className="login-label">Username</label>
                <input
                  type="text"
                  className="login-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  required
                  autoFocus
                />
              </div>

              <div className="login-form-group">
                <label className="login-label">Password</label>
                <input
                  type="password"
                  className="login-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>

              <button
                type="submit"
                className="login-button"
                disabled={loading}
              >
                <span className="login-button-text">
                  {loading ? 'Signing in...' : 'Sign In'}
                </span>
                <span className="login-button-shine"></span>
              </button>
            </form>

            <div className="login-footer">
              <div className="login-footer-badge">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 1L3 6V11L8 15L13 11V6L8 1Z"/>
                </svg>
                <span>Self-Hosted</span>
              </div>
              <div className="login-footer-badge">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 0L10 6H16L11 10L13 16L8 12L3 16L5 10L0 6H6L8 0Z"/>
                </svg>
                <span>Enterprise Security</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
