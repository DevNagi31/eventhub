import { useState, useEffect } from 'react';
import { searchEvents, refreshEvents } from '../services/api';
import { MapPin, Calendar, ExternalLink, RefreshCw, DollarSign, Mail, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Events() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({
    radius: 50,
    category: '',
    eventType: '',
  });

  useEffect(() => {
    fetchEvents();
  }, [filters]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = {
        lat: user?.lat || 42.0987,
        lng: user?.lng || -75.9179,
        radius: filters.radius,
      };
      
      if (filters.category) params.category = filters.category;
      if (filters.eventType) params.eventType = filters.eventType;

      const response = await searchEvents(params);
      setEvents(response.data.events);
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshEvents({
        lat: user?.lat || 42.0987,
        lng: user?.lng || -75.9179,
        radius: filters.radius || 50,
      });
      await fetchEvents();
    } catch (error) {
      console.error('Failed to refresh events:', error);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-mac-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-semibold mb-2">Discover Events</h1>
            <p className="text-mac-text-secondary">Find events happening near you</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-primary flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Events'}</span>
          </button>
        </div>

        {/* Filters */}
        <div className="card p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Radius (miles)</label>
              <input
                type="number"
                value={filters.radius}
                onChange={(e) => setFilters({ ...filters, radius: e.target.value })}
                className="input"
                min="1"
                max="200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Type</label>
              <select
                value={filters.eventType}
                onChange={(e) => setFilters({ ...filters, eventType: e.target.value })}
                className="input"
              >
                <option value="">All Types</option>
                <option value="sports">Sports</option>
                <option value="esports">Esports</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <input
                type="text"
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="input"
                placeholder="e.g., basketball, valorant"
              />
            </div>
          </div>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card p-6">
                <div className="skeleton h-6 w-3/4 mb-4"></div>
                <div className="skeleton h-4 w-1/2 mb-2"></div>
                <div className="skeleton h-4 w-full mb-2"></div>
                <div className="skeleton h-4 w-2/3"></div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-mac-text-secondary mb-4">No events found in your area</p>
            <button onClick={handleRefresh} className="btn-primary">
              Refresh Events
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div key={event.id} className="card p-6 hover:shadow-mac-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <span className="inline-block px-3 py-1 bg-mac-bg text-xs font-medium rounded-full border border-mac-border">
                    {event.event_type}
                  </span>
                  <span className="text-xs text-mac-text-secondary">
                    {event.distance_miles} mi
                  </span>
                </div>

                <h3 className="text-lg font-semibold mb-3">
                  {event.title}
                </h3>

                <div className="space-y-2 text-sm text-mac-text-secondary mb-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(event.start_time).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4" />
                    <span>{event.venue_name}</span>
                  </div>
                  {event.price > 0 && (
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4" />
                      <span>From ${event.price}</span>
                    </div>
                  )}
                </div>

                {event.registration_url && (
                  <a
                    href={event.registration_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 text-sm hover:opacity-70 transition-opacity"
                  >
                    <span>Register</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
