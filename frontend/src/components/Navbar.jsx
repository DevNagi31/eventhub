import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Users, Calendar, Bot, LogOut, Menu, X } from 'lucide-react';
import DarkModeToggle from './DarkModeToggle';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    navigate('/login');
  };

  const navLinks = [
    { to: '/events', label: 'Events', icon: Calendar },
    { to: '/groups', label: 'Groups', icon: Users },
    { to: '/chat', label: 'HELP', icon: Bot },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-mac-surface border-b border-mac-border sticky top-0 z-50 backdrop-blur-mac bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-xl font-semibold hover:opacity-70 transition-opacity">
              EventHub
            </Link>

            {isAuthenticated && (
              <div className="hidden md:flex items-center space-x-6">
                {navLinks.map(({ to, label, icon: Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    className={`flex items-center space-x-2 transition-colors ${
                      isActive(to)
                        ? 'text-mac-text font-medium'
                        : 'text-mac-text-secondary hover:text-mac-text'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <DarkModeToggle />

            {isAuthenticated ? (
              <>
                <div className="hidden md:flex items-center space-x-3">
                  <span className="text-sm text-mac-text-secondary">{user?.username}</span>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 text-mac-text-secondary hover:text-mac-text transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Sign Out</span>
                  </button>
                </div>

                {/* Mobile menu button */}
                <button
                  onClick={() => setMobileOpen(!mobileOpen)}
                  className="md:hidden p-2 rounded-mac hover:bg-mac-surface-hover transition-colors"
                  aria-label="Toggle menu"
                >
                  {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link to="/login" className="btn-secondary text-sm">
                  Sign In
                </Link>
                <Link to="/register" className="btn-primary text-sm">
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isAuthenticated && mobileOpen && (
        <div className="md:hidden border-t border-mac-border bg-mac-surface">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center space-x-3 px-3 py-3 rounded-mac transition-colors ${
                  isActive(to)
                    ? 'bg-mac-surface-hover text-mac-text font-medium'
                    : 'text-mac-text-secondary hover:bg-mac-surface-hover hover:text-mac-text'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </Link>
            ))}

            <div className="border-t border-mac-border mt-2 pt-2">
              <div className="px-3 py-2 text-sm text-mac-text-secondary">
                Signed in as <span className="font-medium text-mac-text">{user?.username}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-3 px-3 py-3 rounded-mac w-full text-left text-mac-text-secondary hover:bg-mac-surface-hover hover:text-mac-text transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
