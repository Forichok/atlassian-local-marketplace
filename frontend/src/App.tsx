import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { Package, Settings, User } from "lucide-react";
import { Home } from "./pages/Home";
import { Admin } from "./pages/Admin";
import { Plugins } from "./pages/Plugins";
import { PluginDetail } from "./pages/PluginDetail";
import { Login } from "./pages/Login";
import { ToastProvider } from "./components/Toast";
import { ParticleBackground } from "./components/ParticleBackground";
import { AuroraBackground } from "./components/AuroraBackground";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ThemeToggle } from "./components/ThemeToggle";
import "./styles/global.css";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const Navigation: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (location.pathname === "/login" || location.pathname === "/") {
    return null;
  }

  return (
    <div className="header">
      <div className="container">
        <Link to="/" style={{ textDecoration: "none" }}>
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
                    <stop stopColor="#667eea" />
                    <stop offset="1" stopColor="#764ba2" />
                  </linearGradient>
                </defs>
              </svg>
              <span
                style={{
                  background: "linear-gradient(135deg, #667eea, #764ba2)",
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
                  "linear-gradient(90deg, rgba(102, 126, 234, 0.8), rgba(118, 75, 162, 0.6))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                fontWeight: 600,
              }}
            >
              Local Atlassian Data Center Plugin Repository
            </p>
          </div>
        </Link>
        <nav className="nav">
          <ThemeToggle />
          <Link
            to="/plugins"
            className={location.pathname.startsWith("/plugins") ? "active" : ""}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <Package size={18} /> Plugins
          </Link>
          <Link
            to="/admin"
            className={location.pathname === "/admin" ? "active" : ""}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <Settings size={18} /> Admin
          </Link>
          {isAuthenticated && (
            <button
              onClick={handleLogout}
              className="button secondary"
              style={{
                padding: "10px 20px",
                fontSize: "14px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <User size={16} /> {user?.username} | Logout
            </button>
          )}
        </nav>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <AuroraBackground />
            <ParticleBackground />
            <Navigation />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Home />} />
              <Route path="/plugins" element={<Plugins />} />
              <Route path="/plugins/:addonKey" element={<PluginDetail />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <Admin />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;
