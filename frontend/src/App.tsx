import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  Navigate,
  useLocation,
} from "react-router-dom";
import { Admin } from "./pages/Admin";
import { Plugins } from "./pages/Plugins";
import { PluginDetail } from "./pages/PluginDetail";
import { ToastProvider } from "./components/Toast";
import { ParticleBackground } from "./components/ParticleBackground";
import { AuroraBackground } from "./components/AuroraBackground";
import "./styles/global.css";

const Navigation: React.FC = () => {
  const location = useLocation();

  return (
    <>
      <style>{`
        @keyframes logoFloat {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-5px) rotate(5deg);
          }
        }

        .nav-logo {
          animation: logoFloat 3s ease-in-out infinite;
        }

        .nav-link {
          position: relative;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .nav-link::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 50%;
          transform: translateX(-50%) scaleX(0);
          width: 80%;
          height: 3px;
          background: linear-gradient(90deg, #0052cc, #0065ff);
          border-radius: 2px;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .nav-link.active::after,
        .nav-link:hover::after {
          transform: translateX(-50%) scaleX(1);
        }
      `}</style>

      <div
        className="header"
        style={{
          background: "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.9)",
          boxShadow: "0 4px 24px rgba(0, 0, 0, 0.08)",
          position: "sticky" as const,
          top: 0,
          zIndex: 100,
        }}
      >
        <div className="container">
          <div>
            <h1
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="nav-logo"
                style={{ display: "inline-block" }}
              >
                <rect width="32" height="32" rx="8" fill="url(#gradient)" />
                <path d="M16 8L12 16H16L14 24L22 14H18L20 8H16Z" fill="white" />
                <defs>
                  <linearGradient
                    id="gradient"
                    x1="0"
                    y1="0"
                    x2="32"
                    y2="32"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#0052cc" />
                    <stop offset="1" stopColor="#0065ff" />
                  </linearGradient>
                </defs>
              </svg>
              <span
                style={{
                  background: "linear-gradient(135deg, #0052cc, #0065ff)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                DC PluginX
              </span>
            </h1>
            <p
              style={{
                background:
                  "linear-gradient(90deg, rgba(0, 82, 204, 0.8), rgba(0, 101, 255, 0.6))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                fontWeight: 600,
              }}
            >
              Local Jira Data Center Plugin Repository
            </p>
          </div>
          <nav
            className="nav"
            style={{
              display: "flex",
              gap: "8px",
            }}
          >
            <Link
              to="/plugins"
              className={`nav-link ${
                location.pathname.startsWith("/plugins") ? "active" : ""
              }`}
              style={{
                padding: "10px 20px",
                borderRadius: "10px",
                background: location.pathname.startsWith("/plugins")
                  ? "linear-gradient(135deg, rgba(0, 82, 204, 0.15), rgba(0, 101, 255, 0.2))"
                  : "transparent",
                color: location.pathname.startsWith("/plugins")
                  ? "var(--color-text-inverse)"
                  : "var(--color-text-secondary)",
                fontWeight: 600,
                textDecoration: "none",
                transition: "all 0.3s",
                backdropFilter: "blur(5px)",
                border: location.pathname.startsWith("/plugins")
                  ? "1px solid rgba(0, 82, 204, 0.2)"
                  : "1px solid transparent",
              }}
            >
              📦 Plugins
            </Link>
            <Link
              to="/admin"
              className={`nav-link ${
                location.pathname === "/admin" ? "active" : ""
              }`}
              style={{
                padding: "10px 20px",
                borderRadius: "10px",
                background:
                  location.pathname === "/admin"
                    ? "linear-gradient(135deg, rgba(0, 82, 204, 0.15), rgba(0, 101, 255, 0.2))"
                    : "transparent",
                color:
                  location.pathname === "/admin"
                    ? "var(--color-text-inverse)"
                    : "var(--color-text-secondary)",
                fontWeight: 600,
                textDecoration: "none",
                transition: "all 0.3s",
                backdropFilter: "blur(5px)",
                border:
                  location.pathname === "/admin"
                    ? "1px solid rgba(0, 82, 204, 0.2)"
                    : "1px solid transparent",
              }}
            >
              ⚙️ Admin
            </Link>
          </nav>
        </div>
      </div>
    </>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuroraBackground />
        <ParticleBackground />
        <Navigation />
        <Routes>
          <Route path="/" element={<Navigate to="/plugins" replace />} />
          <Route path="/plugins" element={<Plugins />} />
          <Route path="/plugins/:addonKey" element={<PluginDetail />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
};

export default App;
