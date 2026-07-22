import ical from 'node-ical';
import crypto from 'crypto';
import { query } from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

class ICalService {
  generateStableId(source, uniqueStr) {
    const hash = crypto.createHash('sha256').update(`${source}:${uniqueStr}`).digest('hex').slice(0, 16);
    return `ical_${hash}`;
  }

  categorizeEvent(title, description = '') {
    const text = `${title} ${description}`.toLowerCase();

    const esportKeywords = ['esport', 'gaming', 'valorant', 'league of legends', 'csgo', 'dota', 'smash bros', 'overwatch', 'fortnite'];
    if (esportKeywords.some(kw => text.includes(kw))) {
      return { eventType: 'esports', category: 'other' };
    }

    const sportKeywords = ['basketball', 'soccer', 'football', 'baseball', 'hockey', 'tennis', 'volleyball', 'swimming', 'running', 'marathon', 'gym', 'fitness', 'athletic', 'wrestling', 'boxing'];
    if (sportKeywords.some(kw => text.includes(kw))) {
      return { eventType: 'sports', category: 'other' };
    }

    return { eventType: 'community', category: 'other' };
  }

  async fetchFromFeeds(location) {
    const feedUrls = (process.env.ICAL_FEED_URLS || '')
      .split(',')
      .map(u => u.trim())
      .filter(Boolean);

    if (feedUrls.length === 0) {
      console.log('  No iCal feeds configured (ICAL_FEED_URLS)');
      return [];
    }

    const allEvents = [];

    for (const url of feedUrls) {
      try {
        console.log(`  Fetching iCal feed: ${url}`);
        const events = await this.parseFeed(url, location);
        allEvents.push(...events);
        console.log(`  Got ${events.length} events from ${url}`);
      } catch (error) {
        console.error(`  iCal feed error (${url}):`, error.message);
      }
    }

    console.log(`  Found ${allEvents.length} total events from iCal feeds`);

    if (allEvents.length > 0) {
      await this.storeEvents(allEvents);
    }

    return allEvents;
  }

  async parseFeed(url, location) {
    const data = await ical.async.fromURL(url);
    const events = [];
    const now = new Date();
    const maxDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days out

    for (const [key, event] of Object.entries(data)) {
      if (event.type !== 'VEVENT') continue;

      const startTime = event.start ? new Date(event.start) : null;
      if (!startTime || isNaN(startTime.getTime())) continue;
      if (startTime < now || startTime > maxDate) continue;

      const title = event.summary || '';
      if (!title.trim()) continue;

      const endTime = event.end ? new Date(event.end) : null;
      const description = (event.description || '').slice(0, 500);
      const locationStr = event.location || '';
      const { eventType, category } = this.categorizeEvent(title, description);

      // Try to extract geo from VEVENT if available
      let lat = location.lat;
      let lng = location.lng;
      if (event.geo) {
        lat = parseFloat(event.geo.lat) || location.lat;
        lng = parseFloat(event.geo.lon) || location.lng;
      }

      events.push({
        externalId: this.generateStableId(url, event.uid || key),
        title: title.slice(0, 500),
        description,
        eventType,
        category,
        location: { lat, lng },
        venueName: locationStr.split(',')[0]?.trim() || 'TBD',
        startTime,
        endTime: endTime && !isNaN(endTime.getTime()) ? endTime : null,
        price: null,
        registrationUrl: event.url || null,
        source: 'ical',
      });
    }

    return events;
  }

  async storeEvents(events) {
    let stored = 0;
    for (const event of events) {
      try {
        await query(
          `INSERT INTO events (
            external_id, title, description, event_type, category,
            lat, lng, venue_name, start_time, end_time, price,
            registration_url, source, raw_data, created_at
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,NOW())
          ON CONFLICT (external_id) DO UPDATE SET
            title = EXCLUDED.title,
            description = EXCLUDED.description,
            event_type = EXCLUDED.event_type,
            category = EXCLUDED.category,
            start_time = EXCLUDED.start_time,
            end_time = EXCLUDED.end_time,
            venue_name = EXCLUDED.venue_name`,
          [
            event.externalId, event.title, event.description,
            event.eventType, event.category,
            event.location.lat, event.location.lng,
            event.venueName, event.startTime, event.endTime,
            event.price, event.registrationUrl,
            event.source, JSON.stringify(event),
          ]
        );
        stored++;
      } catch (error) {
        console.error(`Error storing iCal event ${event.externalId}:`, error.message);
      }
    }
    console.log(`  Stored/updated ${stored}/${events.length} iCal events`);
  }
}

export default new ICalService();
