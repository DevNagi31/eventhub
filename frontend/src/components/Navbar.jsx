import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Users, Calendar, Bot, LogOut } from 'lucide-react';
import DarkModeToggle from './DarkModeToggle';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
                <Link
                  to="/events"
                  className="flex items-center space-x-2 text-mac-text-secondary hover:text-mac-text transition-colors"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Events</span>
                </Link>
                <Link
                  to="/groups"
                  className="flex items-center space-x-2 text-mac-text-secondary hover:text-mac-text transition-colors"
                >
                  <Users className="w-4 h-4" />
                  <span>Groups</span>
                </Link>
                <Link
                  to="/chat"
                  className="flex items-center space-x-2 text-mac-text-secondary hover:text-mac-text transition-colors"
                >
                  <Bot className="w-4 h-4" />
                  <span>HELP</span>
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <DarkModeToggle />
            
            {isAuthenticated ? (
              <>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-mac-text-secondary">{user?.username}</span>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 text-mac-text-secondary hover:text-mac-text transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Sign Out</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link to="/login" className="btn-secondary">
                  Sign In
                </Link>
                <Link to="/register" className="btn-primary">
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
