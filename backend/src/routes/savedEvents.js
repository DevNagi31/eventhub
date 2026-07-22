import express from 'express';
import { query } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get saved events for current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT e.id, e.external_id, e.title, e.description, e.event_type, e.category,
              e.lat, e.lng, e.venue_name, e.start_time, e.end_time, e.price,
              e.registration_url, e.source, se.saved_at
       FROM saved_events se
       JOIN events e ON se.event_id = e.id
       WHERE se.user_id = $1
       ORDER BY e.start_time`,
      [req.user.id]
    );

    res.json({ events: result.rows });
  } catch (error) {
    console.error('Error fetching saved events:', error);
    res.status(500).json({ error: 'Failed to fetch saved events' });
  }
});

// Batch check which events are saved - must be before /:eventId
router.post('/check', authenticateToken, async (req, res) => {
  try {
    const { eventIds } = req.body;
    if (!Array.isArray(eventIds) || eventIds.length === 0) {
      return res.json({ savedIds: [] });
    }

    // Filter to valid integers only
    const validIds = eventIds.filter(id => Number.isInteger(id) || /^\d+$/.test(id));
    if (validIds.length === 0) {
      return res.json({ savedIds: [] });
    }

    const result = await query(
      'SELECT event_id FROM saved_events WHERE user_id = $1 AND event_id = ANY($2::int[])',
      [req.user.id, validIds]
    );

    res.json({ savedIds: result.rows.map(r => r.event_id) });
  } catch (error) {
    console.error('Error checking saved events:', error);
    res.status(500).json({ error: 'Failed to check saved events' });
  }
});

// Save an event
router.post('/:eventId', authenticateToken, async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    if (isNaN(eventId)) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    // Verify event exists
    const event = await query('SELECT id FROM events WHERE id = $1', [eventId]);
    if (event.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    await query(
      `INSERT INTO saved_events (user_id, event_id, saved_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id, event_id) DO NOTHING`,
      [req.user.id, eventId]
    );

    res.status(201).json({ message: 'Event saved' });
  } catch (error) {
    console.error('Error saving event:', error);
    res.status(500).json({ error: 'Failed to save event' });
  }
});

// Unsave an event
router.delete('/:eventId', authenticateToken, async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    if (isNaN(eventId)) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    await query(
      'DELETE FROM saved_events WHERE user_id = $1 AND event_id = $2',
      [req.user.id, eventId]
    );

    res.json({ message: 'Event unsaved' });
  } catch (error) {
    console.error('Error unsaving event:', error);
    res.status(500).json({ error: 'Failed to unsave event' });
  }
});

export default router;
