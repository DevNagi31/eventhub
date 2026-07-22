import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MapPin, Loader } from 'lucide-react';

const INTEREST_OPTIONS = [
  'basketball', 'soccer', 'baseball', 'hockey', 'tennis',
  'volleyball', 'running', 'swimming', 'golf', 'boxing',
  'valorant', 'league_of_legends', 'csgo', 'dota2',
  'smash_bros', 'overwatch', 'fortnite',
];

export default function Register() {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [location, setLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('idle');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    detectLocation();
  }, []);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('unsupported');
      return;
    }

    setLocationStatus('detecting');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationStatus('detected');
      },
      () => {
        setLocationStatus('denied');
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  };

  const toggleInterest = (interest) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await register({
        email: formData.email,
        username: formData.username,
        password: formData.password,
        preferences: selectedInterests,
        location: location || { lat: 42.0987, lng: -75.9179 },
      });
      navigate('/events');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-mac-surface px-4 py-12">
      <div className="w-full max-w-md">
        <div className="card p-8">
          <h1 className="text-3xl font-semibold mb-2">Create Account</h1>
          <p className="text-mac-text-secondary mb-8">Join EventHub today</p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-mac text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="input"
                placeholder="johndoe"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="input"
                placeholder="At least 8 characters"
                minLength={8}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="input"
                placeholder="Confirm your password"
                required
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium mb-2">Location</label>
              <div className="flex items-center space-x-2 text-sm text-mac-text-secondary">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                {locationStatus === 'detecting' && (
                  <span className="flex items-center space-x-1">
                    <Loader className="w-3 h-3 animate-spin" />
                    <span>Detecting location...</span>
                  </span>
                )}
                {locationStatus === 'detected' && (
                  <span className="text-green-600 dark:text-green-400">Location detected</span>
                )}
                {locationStatus === 'denied' && (
                  <span>
                    Location access denied.{' '}
                    <button type="button" onClick={detectLocation} className="underline hover:opacity-70">
                      Retry
                    </button>
                    {' '}or default will be used.
                  </span>
                )}
                {locationStatus === 'unsupported' && (
                  <span>Geolocation not supported. Default location will be used.</span>
                )}
                {locationStatus === 'idle' && <span>Default location will be used.</span>}
              </div>
            </div>

            {/* Interests */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Interests <span className="text-mac-text-secondary font-normal">(optional)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {INTEREST_OPTIONS.map((interest) => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      selectedInterests.includes(interest)
                        ? 'bg-mac-accent text-white border-transparent'
                        : 'bg-mac-surface border-mac-border text-mac-text-secondary hover:border-mac-text'
                    }`}
                  >
                    {interest.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-mac-text-secondary">
            Already have an account?{' '}
            <Link to="/login" className="text-mac-text font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
