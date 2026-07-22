import express from 'express';
import { query } from '../config/database.js';
import { optionalAuth } from '../middleware/auth.js';
import { apiLimiter } from '../utils/apiRateLimiter.js';
import eventAggregator from '../services/eventAggregator.js';
import { calculateDistance } from '../utils/geoUtils.js';

const router = express.Router();

// Search events by location
router.get('/search', apiLimiter, optionalAuth, async (req, res) => {
  try {
    const { 
      lat, 
      lng, 
      radius = 50, 
      category, 
      eventType,
      startDate,
      endDate,
      limit = 50 
    } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude required' });
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const maxRadius = parseFloat(radius);

    // Approximate bounding box (1 degree lat ~ 69 miles, 1 degree lng ~ 69 * cos(lat) miles)
    const latDelta = maxRadius / 69.0;
    const lngDelta = maxRadius / (69.0 * Math.cos(userLat * Math.PI / 180));

    // Include online events (lat=0,lng=0) alongside local bounding box
    let queryText = `
      SELECT
        id, external_id, title, description, event_type, category,
        lat, lng, venue_name, start_time, end_time, price, registration_url, source
      FROM events
      WHERE start_time >= $1
        AND (
          (lat BETWEEN $2 AND $3 AND lng BETWEEN $4 AND $5)
          OR (lat = 0 AND lng = 0)
        )
    `;

    const params = [
      startDate || new Date(),
      userLat - latDelta,
      userLat + latDelta,
      userLng - lngDelta,
      userLng + lngDelta,
    ];
    let paramIndex = 6;

    if (category) {
      queryText += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (eventType) {
      queryText += ` AND event_type = $${paramIndex}`;
      params.push(eventType);
      paramIndex++;
    }

    if (endDate) {
      queryText += ` AND start_time <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    queryText += ` ORDER BY start_time LIMIT $${paramIndex}`;
    params.push(parseInt(limit));

    const result = await query(queryText, params);

    // Refine with exact Haversine distance; online events (lat=0,lng=0) always included
    const events = result.rows
      .map(event => {
        const isOnline = parseFloat(event.lat) === 0 && parseFloat(event.lng) === 0;
        const distance = isOnline ? 0 : calculateDistance(userLat, userLng, event.lat, event.lng);
        return { ...event, distance_miles: isOnline ? 'Online' : distance.toFixed(2) };
      })
      .filter(event => event.distance_miles === 'Online' || parseFloat(event.distance_miles) <= maxRadius)
      .sort((a, b) => {
        // Local events sorted by distance first, then online events after
        const aOnline = a.distance_miles === 'Online';
        const bOnline = b.distance_miles === 'Online';
        if (aOnline && bOnline) return new Date(a.start_time) - new Date(b.start_time);
        if (aOnline) return 1;
        if (bOnline) return -1;
        return parseFloat(a.distance_miles) - parseFloat(b.distance_miles);
      });

    res.json({
      count: events.length,
      events
    });
  } catch (error) {
    console.error('Error searching events:', error);
    res.status(500).json({ error: 'Failed to search events' });
  }
});

// Get scrape status (must be before /:id to avoid being caught by wildcard)
router.get('/scrape-status', async (req, res) => {
  res.json(eventAggregator.getStatus());
});

// Get single event by ID
router.get('/:id', apiLimiter, async (req, res) => {
  try {
    const result = await query(
      `SELECT 
        id, external_id, title, description, event_type, category,
        lat, lng, venue_name, start_time, end_time, price, 
        registration_url, source, raw_data, created_at
       FROM events WHERE id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// Refresh events from APIs and scrapers
router.post('/refresh', apiLimiter, async (req, res) => {
  try {
    const { lat, lng, radius = 50, categories = [], games = [] } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Location required' });
    }

    const io = req.app.get('io');

    // Notify clients that scraping started
    if (io) {
      io.to('scrape-status').emit('scrape-started', { timestamp: new Date().toISOString() });
    }

    const events = await eventAggregator.fetchAndStoreEvents(
      { lat, lng },
      radius,
      { categories, games, includeEsports: true, useScraper: true },
      (progress) => {
        // Emit per-source progress updates
        if (io) {
          io.to('scrape-status').emit('scrape-progress', progress);
        }
      }
    );

    const result = {
      message: 'Events refreshed successfully',
      count: events.length,
      details: eventAggregator.getStatus().lastResult,
    };

    // Notify clients that scraping completed
    if (io) {
      io.to('scrape-status').emit('scrape-completed', {
        count: events.length,
        timestamp: new Date().toISOString(),
      });
    }

    res.json(result);
  } catch (error) {
    console.error('Error refreshing events:', error);

    const io = req.app.get('io');
    if (io) {
      io.to('scrape-status').emit('scrape-failed', { error: 'Refresh failed' });
    }

    res.status(500).json({ error: 'Failed to refresh events' });
  }
});

// Get categories
router.get('/meta/categories', async (req, res) => {
  try {
    const result = await query(
      `SELECT DISTINCT category, event_type, COUNT(*) as count
       FROM events
       WHERE start_time >= NOW()
       GROUP BY category, event_type
       ORDER BY count DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

export default router;
