import { useState, useEffect, useRef, useCallback } from 'react';
import { searchEvents, refreshEvents, checkSavedEvents, saveEvent, unsaveEvent } from '../services/api';
import socketService from '../services/socket';
import { MapPin, Calendar, ExternalLink, RefreshCw, DollarSign, Loader, Bookmark } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

export default function Events() {
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [scrapeStatus, setScrapeStatus] = useState(null);
  const [savedIds, setSavedIds] = useState(new Set());
  const [filters, setFilters] = useState({
    radius: 50,
    category: '',
    eventType: '',
  });
  const debounceRef = useRef(null);

  // Debounced fetch - waits 400ms after last filter change
  const debouncedFetch = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchEvents();
    }, 400);
  }, [filters, user, isAuthenticated]);

  useEffect(() => {
    debouncedFetch();
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [filters]);

  // Initial fetch on mount
  useEffect(() => {
    fetchEvents();
  }, []);

  // Subscribe to real-time scrape status
  useEffect(() => {
    socketService.connect();

    socketService.subscribeScrapeStatus({
      onStarted: () => {
        setScrapeStatus({ stage: 'started', message: 'Scraping events...' });
      },
      onProgress: (data) => {
        setScrapeStatus({
          stage: 'progress',
          message: `${data.source}: ${data.status === 'success' ? `${data.count} events found` : 'failed'}`,
        });
      },
      onCompleted: (data) => {
        setScrapeStatus({
          stage: 'completed',
          message: `Found ${data.count} events`,
        });
        fetchEvents();
        setTimeout(() => setScrapeStatus(null), 3000);
      },
      onFailed: () => {
        setScrapeStatus({ stage: 'failed', message: 'Scraping failed' });
        setTimeout(() => setScrapeStatus(null), 3000);
      },
    });

    return () => {
      socketService.unsubscribeScrapeStatus();
    };
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = {
        lat: user?.lat || 42.0987,
        lng: user?.lng || -75.9179,
        radius: filters.radius || 50,
      };

      if (filters.category) params.category = filters.category;
      if (filters.eventType) params.eventType = filters.eventType;

      const response = await searchEvents(params);
      const eventList = response.data.events;
      setEvents(eventList);

      // Check which events are saved (only if logged in)
      if (isAuthenticated && eventList.length > 0) {
        try {
          const ids = eventList.map((e) => e.id);
          const savedRes = await checkSavedEvents(ids);
          setSavedIds(new Set(savedRes.data.savedIds));
        } catch {
          // Silently fail - saved status is non-critical
        }
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setScrapeStatus({ stage: 'started', message: 'Starting event refresh...' });
    try {
      const result = await refreshEvents({
        lat: user?.lat || 42.0987,
        lng: user?.lng || -75.9179,
        radius: filters.radius || 50,
      });
      setScrapeStatus({
        stage: 'completed',
        message: `Refreshed ${result.data.count} events`,
      });
      await fetchEvents();
      setTimeout(() => setScrapeStatus(null), 3000);
    } catch (error) {
      console.error('Failed to refresh events:', error);
      setScrapeStatus({ stage: 'failed', message: 'Refresh failed' });
      setTimeout(() => setScrapeStatus(null), 3000);
    } finally {
      setRefreshing(false);
    }
  };

  const toggleSave = async (eventId) => {
    if (!isAuthenticated) {
      toast.error('Log in to save events');
      return;
    }

    const isSaved = savedIds.has(eventId);
    try {
      if (isSaved) {
        await unsaveEvent(eventId);
        setSavedIds((prev) => {
          const next = new Set(prev);
          next.delete(eventId);
          return next;
        });
        toast.info('Event removed from saved');
      } else {
        await saveEvent(eventId);
        setSavedIds((prev) => new Set(prev).add(eventId));
        toast.success('Event saved!');
      }
    } catch {
      toast.error('Failed to update saved event');
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

        {/* Scrape Status Banner */}
        {scrapeStatus && (
          <div
            className={`mb-6 p-4 rounded-mac border flex items-center space-x-3 transition-all ${
              scrapeStatus.stage === 'completed'
                ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400'
                : scrapeStatus.stage === 'failed'
                ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
                : 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400'
            }`}
          >
            {scrapeStatus.stage !== 'completed' && scrapeStatus.stage !== 'failed' && (
              <Loader className="w-4 h-4 animate-spin flex-shrink-0" />
            )}
            <span className="text-sm font-medium">{scrapeStatus.message}</span>
          </div>
        )}

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
                <option value="community">Community</option>
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
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-mac-text-secondary">
                      {event.distance_miles} mi
                    </span>
                    <button
                      onClick={() => toggleSave(event.id)}
                      className="p-1 hover:bg-mac-surface-hover rounded transition-colors"
                      title={savedIds.has(event.id) ? 'Unsave' : 'Save'}
                    >
                      <Bookmark
                        className={`w-4 h-4 ${
                          savedIds.has(event.id)
                            ? 'fill-current text-mac-text'
                            : 'text-mac-text-secondary'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-semibold mb-3">{event.title}</h3>

                {event.description && (
                  <p className="text-sm text-mac-text-secondary mb-3 line-clamp-2">
                    {event.description}
                  </p>
                )}

                <div className="space-y-2 text-sm text-mac-text-secondary mb-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    <span>
                      {new Date(event.start_time).toLocaleDateString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{event.venue_name}</span>
                  </div>
                  {event.price > 0 && (
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 flex-shrink-0" />
                      <span>From ${event.price}</span>
                    </div>
                  )}
                  {event.price === 0 && (
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 flex-shrink-0" />
                      <span className="text-green-600 dark:text-green-400">Free</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-mac-text-secondary px-2 py-1 bg-mac-bg rounded">
                    {event.source}
                  </span>
                  {event.registration_url && (
                    <a
                      href={event.registration_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 text-sm hover:opacity-70 transition-opacity"
                    >
                      <span>Register</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
