import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Rocket,
  Settings,
  Zap,
  RefreshCw,
  Target,
  Shield,
  BarChart3,
  Globe,
} from "lucide-react";
import { ThemeToggle } from "../components/ThemeToggle";
import "../styles/home.css";

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        setMousePosition({
          x: (e.clientX - rect.left) / rect.width,
          y: (e.clientY - rect.top) / rect.height,
        });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="home">
      <div className="home-theme-toggle">
        <ThemeToggle />
      </div>
      <div className="hero-orbs">
        <div
          className="orb orb-1"
          style={{
            transform: `translate(${mousePosition.x * 30}px, ${
              mousePosition.y * 30
            }px)`,
          }}
        />
        <div
          className="orb orb-2"
          style={{
            transform: `translate(${mousePosition.x * -20}px, ${
              mousePosition.y * -20
            }px)`,
          }}
        />
        <div
          className="orb orb-3"
          style={{
            transform: `translate(${mousePosition.x * 15}px, ${
              mousePosition.y * -15
            }px)`,
          }}
        />
      </div>

      <section className="hero" ref={heroRef}>
        <div className={`hero-content ${isVisible ? "visible" : ""}`}>
          <div className="badge-wrapper">
            <div className="badge">
              <span className="badge-pulse"></span>
              <span className="badge-text">
                Enterprise-Grade Plugin Management
              </span>
            </div>
          </div>

          <h1 className="hero-title">
            <span className="title-line">DC PluginX</span>
            <span className="title-accent">
              The Future of Plugin Distribution
            </span>
          </h1>

          <p className="hero-subtitle">
            Self-hosted Atlassian Marketplace mirror with blazing-fast
            downloads, automatic synchronization, and enterprise security
          </p>

          <div className="hero-stats">
            <div className="stat-item">
              <div className="stat-value">10,000+</div>
              <div className="stat-label">Plugins Synced</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-value">99.9%</div>
              <div className="stat-label">Uptime</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-value">24/7</div>
              <div className="stat-label">Auto Sync</div>
            </div>
          </div>

          <div className="hero-actions">
            <button
              className="cta-primary"
              onClick={() => navigate("/plugins")}
            >
              <span className="cta-icon">
                <Rocket size={20} />
              </span>
              <span className="cta-text">Explore Plugins</span>
              <span className="cta-shine"></span>
            </button>
            <button
              className="cta-secondary"
              onClick={() => navigate("/admin")}
            >
              <span className="cta-icon">
                <Settings size={20} />
              </span>
              <span className="cta-text">Admin Panel</span>
            </button>
          </div>

          <div className="hero-badges">
            <div className="hero-badge">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path d="M8 0L10 6H16L11 10L13 16L8 12L3 16L5 10L0 6H6L8 0Z" />
              </svg>
              <span>Open Source</span>
            </div>
            <div className="hero-badge">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path d="M8 1L3 6V11L8 15L13 11V6L8 1Z" />
              </svg>
              <span>Self-Hosted</span>
            </div>
            <div className="hero-badge">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm4 9H9v3H7V9H4V7h3V4h2v3h3v2z" />
              </svg>
              <span>Production Ready</span>
            </div>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="section-header">
          <h2 className="section-title">Built for Performance</h2>
          <p className="section-description">
            Enterprise features designed to accelerate your Atlassian deployment
          </p>
        </div>

        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-card-inner">
              <div className="feature-icon-wrapper">
                <div className="feature-icon">
                  <Zap size={32} />
                </div>
                <div className="feature-icon-bg"></div>
              </div>
              <h3>Lightning Fast</h3>
              <p>
                Local repository eliminates marketplace latency. Downloads at
                network speed with intelligent caching.
              </p>
              <div className="feature-metrics">
                <span className="metric">10x faster</span>
              </div>
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-card-inner">
              <div className="feature-icon-wrapper">
                <div className="feature-icon">
                  <RefreshCw size={32} />
                </div>
                <div className="feature-icon-bg"></div>
              </div>
              <h3>Auto Sync</h3>
              <p>
                Continuous synchronization with Atlassian Marketplace. Always
                up-to-date, zero maintenance required.
              </p>
              <div className="feature-metrics">
                <span className="metric">Real-time updates</span>
              </div>
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-card-inner">
              <div className="feature-icon-wrapper">
                <div className="feature-icon">
                  <Target size={32} />
                </div>
                <div className="feature-icon-bg"></div>
              </div>
              <h3>Smart Search</h3>
              <p>
                Advanced filtering by product, version, and compatibility. Find
                the perfect plugin in seconds.
              </p>
              <div className="feature-metrics">
                <span className="metric">Instant results</span>
              </div>
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-card-inner">
              <div className="feature-icon-wrapper">
                <div className="feature-icon">
                  <Shield size={32} />
                </div>
                <div className="feature-icon-bg"></div>
              </div>
              <h3>Enterprise Security</h3>
              <p>
                SHA-256 verification, secure storage, and comprehensive audit
                logging protect your infrastructure.
              </p>
              <div className="feature-metrics">
                <span className="metric">Military-grade encryption</span>
              </div>
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-card-inner">
              <div className="feature-icon-wrapper">
                <div className="feature-icon">
                  <BarChart3 size={32} />
                </div>
                <div className="feature-icon-bg"></div>
              </div>
              <h3>Analytics Dashboard</h3>
              <p>
                Real-time monitoring of sync status, download metrics, and
                storage utilization at a glance.
              </p>
              <div className="feature-metrics">
                <span className="metric">Live insights</span>
              </div>
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-card-inner">
              <div className="feature-icon-wrapper">
                <div className="feature-icon">
                  <Globe size={32} />
                </div>
                <div className="feature-icon-bg"></div>
              </div>
              <h3>Multi-Product</h3>
              <p>
                Unified repository for both Jira and Confluence Data Center
                plugins with seamless switching.
              </p>
              <div className="feature-metrics">
                <span className="metric">2 products, 1 interface</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="products">
        <div className="section-header">
          <h2 className="section-title">Supported Platforms</h2>
          <p className="section-description">
            Complete plugin ecosystem for your entire Atlassian stack
          </p>
        </div>

        <div className="products-grid">
          <div
            className="product-card jira"
            onClick={() => navigate("/plugins?productType=JIRA")}
          >
            <div className="product-card-glow"></div>
            <div className="product-icon">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <path
                  d="M24 0L8 16L24 32L40 16L24 0Z"
                  fill="url(#jira-gradient)"
                />
                <path
                  d="M24 16L8 32L24 48L40 32L24 16Z"
                  fill="url(#jira-gradient)"
                  opacity="0.7"
                />
                <defs>
                  <linearGradient
                    id="jira-gradient"
                    x1="8"
                    y1="0"
                    x2="40"
                    y2="48"
                  >
                    <stop stopColor="#0052cc" />
                    <stop offset="1" stopColor="#2684ff" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h3>Atlassian Data Center</h3>
            <p>
              Complete plugin ecosystem for project management, workflows, and
              team collaboration
            </p>
            <div className="product-stats">
              <div className="product-stat">
                <span className="stat-number">7,500+</span>
                <span className="stat-text">Plugins</span>
              </div>
            </div>
            <div className="product-arrow">→</div>
          </div>

          <div
            className="product-card confluence"
            onClick={() => navigate("/plugins?productType=CONFLUENCE")}
          >
            <div className="product-card-glow"></div>
            <div className="product-icon">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  fill="url(#confluence-gradient)"
                />
                <path
                  d="M24 8L16 24L24 40"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <path
                  d="M24 8L32 24L24 40"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient
                    id="confluence-gradient"
                    x1="4"
                    y1="4"
                    x2="44"
                    y2="44"
                  >
                    <stop stopColor="#0065ff" />
                    <stop offset="1" stopColor="#2684ff" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h3>Confluence Data Center</h3>
            <p>
              Extend knowledge management with macros, integrations, and
              productivity tools
            </p>
            <div className="product-stats">
              <div className="product-stat">
                <span className="stat-number">2,500+</span>
                <span className="stat-text">Plugins</span>
              </div>
            </div>
            <div className="product-arrow">→</div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">Ready to accelerate your workflow?</h2>
          <p className="cta-description">
            Deploy DC PluginX in minutes and experience the future of plugin
            management
          </p>
          <button className="cta-large" onClick={() => navigate("/plugins")}>
            <span className="cta-large-text">Get Started Now</span>
            <span className="cta-large-icon">→</span>
          </button>
        </div>
      </section>
    </div>
  );
};
