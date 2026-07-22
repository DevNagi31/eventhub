import axios from 'axios';
import dotenv from 'dotenv';
import cacheService from './cacheService.js';
import { query } from '../config/database.js';

dotenv.config();

class TicketmasterService {
  constructor() {
    this.baseURL = 'https://app.ticketmaster.com/discovery/v2';
    this.apiKey = process.env.TICKETMASTER_API_KEY;
    this.http = axios.create({
      baseURL: this.baseURL,
      timeout: 15000,
    });
  }

  async fetchEvents(location, radius = 50, options = {}) {
    if (!this.apiKey || this.apiKey === 'your_ticketmaster_api_key') {
      console.log('Ticketmaster API key not configured - skipping');
      return [];
    }

    try {
      const cacheKey = cacheService.generateAPIKey('ticketmaster', {
        lat: location.lat,
        lng: location.lng,
        radius,
        ...options,
      });

      const cached = await cacheService.get(cacheKey);
      if (cached) {
        console.log('Returning cached Ticketmaster events');
        return cached;
      }

      const params = {
        apikey: this.apiKey,
        latlong: `${location.lat},${location.lng}`,
        radius,
        unit: 'miles',
        size: 100,
        sort: 'date,asc',
        startDateTime: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
      };

      if (options.keyword) params.keyword = options.keyword;
      if (options.classificationName) params.classificationName = options.classificationName;
      if (options.segmentName) params.segmentName = options.segmentName;

      const response = await this.http.get('/events.json', { params });
      const embedded = response.data._embedded;

      if (!embedded || !embedded.events) {
        console.log('  Ticketmaster: no events found');
        return [];
      }

      const events = embedded.events.map(e => this.normalizeEvent(e, location));

      // Cache for 30 minutes
      await cacheService.set(cacheKey, events, 1800);

      console.log(`Fetched ${events.length} events from Ticketmaster`);

      // Store in DB
      await this.storeEvents(events);

      return events;
    } catch (error) {
      if (error.response?.status === 429) {
        console.error('  Ticketmaster rate limit hit - try again later');
      } else {
        console.error('  Ticketmaster API error:', error.message);
      }
      return [];
    }
  }

  normalizeEvent(event, fallbackLocation) {
    const venue = event._embedded?.venues?.[0] || {};
    const lat = venue.location?.latitude
      ? parseFloat(venue.location.latitude)
      : fallbackLocation.lat;
    const lng = venue.location?.longitude
      ? parseFloat(venue.location.longitude)
      : fallbackLocation.lng;

    const classification = event.classifications?.[0] || {};
    const { eventType, category } = this.categorize(classification, event.name);

    const priceRange = event.priceRanges?.[0];

    return {
      externalId: `ticketmaster_${event.id}`,
      title: event.name,
      description: (event.info || event.pleaseNote || '').slice(0, 500),
      eventType,
      category,
      location: { lat, lng },
      venueName: venue.name || 'TBD',
      startTime: new Date(event.dates?.start?.dateTime || event.dates?.start?.localDate),
      endTime: event.dates?.end?.dateTime ? new Date(event.dates.end.dateTime) : null,
      price: priceRange?.min || null,
      registrationUrl: event.url || null,
      source: 'ticketmaster',
      rawData: event,
    };
  }

  categorize(classification, title = '') {
    const segment = (classification.segment?.name || '').toLowerCase();
    const genre = (classification.genre?.name || '').toLowerCase();
    const subGenre = (classification.subGenre?.name || '').toLowerCase();
    const text = `${segment} ${genre} ${subGenre} ${title}`.toLowerCase();

    // Esports
    if (text.includes('esport') || text.includes('gaming') || text.includes('league of legends')
        || text.includes('valorant') || text.includes('dota') || text.includes('csgo')) {
      return { eventType: 'esports', category: genre || 'other' };
    }

    // Sports
    if (segment === 'sports') {
      return { eventType: 'sports', category: genre || 'sports' };
    }

    // Music / Arts / Community
    if (segment === 'music' || segment === 'arts & theatre' || segment === 'film') {
      return { eventType: 'community', category: genre || segment };
    }

    return { eventType: 'community', category: genre || 'other' };
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
            price = EXCLUDED.price,
            venue_name = EXCLUDED.venue_name`,
          [
            event.externalId, event.title, event.description,
            event.eventType, event.category,
            event.location.lat, event.location.lng,
            event.venueName, event.startTime, event.endTime || null,
            event.price, event.registrationUrl,
            event.source, JSON.stringify(event.rawData),
          ]
        );
        stored++;
      } catch (error) {
        console.error(`Error storing TM event ${event.externalId}:`, error.message);
      }
    }
    console.log(`  Stored/updated ${stored}/${events.length} Ticketmaster events`);
  }
}

export default new TicketmasterService();
