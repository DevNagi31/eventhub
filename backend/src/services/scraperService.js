import axios from 'axios';
import crypto from 'crypto';
import * as cheerio from 'cheerio';
import { query } from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

class ScraperService {
  constructor() {
    this.http = axios.create({
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
  }

  generateStableId(source, uniqueStr) {
    const hash = crypto.createHash('sha256').update(`${source}:${uniqueStr}`).digest('hex').slice(0, 16);
    return `${source}_${hash}`;
  }

  async fetchPage(url) {
    const response = await this.http.get(url);
    return cheerio.load(response.data);
  }

  extractJsonLd($) {
    const events = [];
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const data = JSON.parse($(el).html());
        const items = Array.isArray(data) ? data : data['@graph'] ? data['@graph'] : [data];
        for (const item of items) {
          if (item['@type'] === 'Event') {
            events.push(item);
          }
          if (item['@type'] === 'ItemList' && Array.isArray(item.itemListElement)) {
            for (const listItem of item.itemListElement) {
              const inner = listItem.item || listItem;
              if (inner.startDate && inner.url) {
                events.push({ '@type': 'Event', ...inner });
              }
            }
          }
        }
      } catch {
        // Ignore malformed JSON-LD blocks
      }
    });
    return events;
  }

  // ── CATEGORIZATION ──────────────────────────────────────────────

  // Word boundary match — prevents "sigma gamma" matching "mma"
  _matchKeyword(text, keyword) {
    // Multi-word phrases or long keywords: simple includes is safe
    if (keyword.length >= 5 || keyword.includes(' ')) {
      return text.includes(keyword);
    }
    // Short keywords (mma, ufc, nba, nfl, nhl, mlb, dj, ai): require word boundaries
    return new RegExp(`\\b${keyword}\\b`).test(text);
  }

  categorizeEvent(title, description = '') {
    const text = `${title} ${description}`.toLowerCase();

    // Esports — check first (more specific)
    const esportCategories = {
      valorant: ['valorant'],
      league_of_legends: ['league of legends', 'lol esport', 'lol champ'],
      csgo: ['counter-strike', 'csgo', 'cs2', 'cs:go'],
      dota2: ['dota 2', 'dota2'],
      smash_bros: ['smash bros', 'smash ultimate', 'melee tournament'],
      overwatch: ['overwatch'],
      fortnite: ['fortnite'],
      gaming: ['esport', 'e-sport', 'lan party', 'gaming tournament', 'game tournament', 'speedrun'],
    };

    for (const [category, keywords] of Object.entries(esportCategories)) {
      if (keywords.some(kw => this._matchKeyword(text, kw))) {
        return { eventType: 'esports', category };
      }
    }

    // Sports
    const sportCategories = {
      basketball: ['basketball', 'hoops', 'nba', 'ncaa basketball', 'march madness'],
      soccer: ['soccer', 'futsal', 'mls', 'premier league', 'world cup'],
      football: ['football game', 'nfl', 'tailgate', 'super bowl'],
      baseball: ['baseball', 'softball', 'mlb', 'little league'],
      hockey: ['hockey', 'nhl', 'ice hockey'],
      tennis: ['tennis', 'pickleball'],
      volleyball: ['volleyball'],
      running: ['running race', 'marathon', '5k run', '5k race', '10k run', '10k race', 'half marathon', 'fun run', 'color run', 'trail run', 'road race'],
      swimming: ['swimming', 'swim meet', 'triathlon'],
      golf: ['golf tournament', 'golf outing', 'golf league'],
      wrestling: ['wrestling', 'wwe'],
      combat: ['boxing match', 'boxing event', 'mma', 'ufc', 'fight night', 'kickboxing', 'martial art', 'karate', 'jiu jitsu', 'judo'],
      fitness: ['fitness class', 'workout', 'crossfit', 'yoga', 'pilates', 'zumba', 'boot camp', 'bootcamp', 'hiit'],
      cycling: ['cycling', 'bike race', 'criterium', 'gran fondo'],
      outdoor: ['hiking trip', 'kayaking', 'rock climbing', 'skiing event', 'snowboard'],
    };

    for (const [category, keywords] of Object.entries(sportCategories)) {
      if (keywords.some(kw => this._matchKeyword(text, kw))) {
        return { eventType: 'sports', category };
      }
    }

    if (/\b(sports? event|athletic|athlete|championship|playoff)\b/.test(text)) {
      return { eventType: 'sports', category: 'general' };
    }

    // Community — fine-grained categories
    const communityCategories = {
      music: ['concert', 'live music', 'open mic', 'live band', 'symphony', 'orchestra', 'jazz night', 'blues night', 'rock show', 'dj set', 'edm', 'hip hop', 'rapper', 'singer', 'acoustic', 'music festival', 'karaoke', 'album release'],
      comedy: ['comedy', 'stand-up', 'standup', 'improv', 'comedian', 'comedy show', 'funny'],
      food: ['food fest', 'tasting', 'brewery', 'wine tasting', 'beer fest', 'brunch', 'dinner event', 'cooking class', 'culinary', 'bbq', 'barbeque', 'food truck', 'farmers market', 'potluck'],
      art: ['art show', 'gallery', 'exhibit', 'painting class', 'sculpture', 'craft fair', 'pottery', 'photography', 'film festival', 'movie night', 'cinema', 'theater', 'theatre', 'musical', 'dance show', 'ballet', 'opera'],
      education: ['workshop', 'seminar', 'lecture', 'training session', 'certification', 'webinar', 'conference', 'symposium', 'panel discussion', 'presentation', 'learning'],
      career: ['career', 'job fair', 'hiring event', 'networking event', 'resume', 'professional development', 'mentor', 'internship', 'career fair', 'startup event', 'entrepreneur'],
      tech: ['hackathon', 'tech meetup', 'coding', 'developer', 'software', 'data science', 'machine learning', 'cybersecurity', 'blockchain', 'python meetup', 'javascript'],
      family: ['family event', 'kids event', 'children', 'parent', 'youth program', 'toddler', 'baby shower', 'storytime', 'easter egg', 'trick or treat'],
      social: ['meetup', 'mixer', 'speed dating', 'singles', 'social event', 'happy hour', 'game night', 'trivia', 'bingo', 'bar crawl', 'pub crawl', 'party', 'celebration'],
      community: ['volunteer', 'cleanup', 'charity', 'fundrais', 'benefit', 'donation drive', 'community event', 'town hall', 'civic', 'neighborhood', 'memorial', 'parade', 'festival'],
      health: ['health fair', 'wellness', 'meditation', 'mindful', 'mental health', 'therapy', 'support group', 'recovery', 'nutrition', 'self-care'],
      books: ['book signing', 'book reading', 'author', 'literary', 'poetry', 'spoken word', 'book club', 'book fair'],
      spiritual: ['church event', 'worship', 'prayer', 'faith', 'spiritual', 'bible study', 'ministry'],
      nature: ['garden tour', 'nature walk', 'bird watch', 'plant sale', 'botanical', 'farm tour', 'harvest fest', 'outdoor market'],
      market: ['flea market', 'craft market', 'vendor fair', 'pop-up shop', 'artisan market', 'handmade', 'vintage market', 'antique', 'swap meet'],
    };

    for (const [category, keywords] of Object.entries(communityCategories)) {
      if (keywords.some(kw => this._matchKeyword(text, kw))) {
        return { eventType: 'community', category };
      }
    }

    return { eventType: 'community', category: 'general' };
  }

  parsePrice(priceStr) {
    if (!priceStr) return null;
    const str = String(priceStr).toLowerCase();
    if (str.includes('free') || str === '0') return 0;
    const match = str.match(/[\d]+\.?\d*/);
    return match ? parseFloat(match[0]) : null;
  }

  // ── EVENTBRITE ──────────────────────────────────────────────────
  async scrapeEventbrite(location) {
    try {
      const slug = process.env.SCRAPE_EVENTBRITE_LOCATION_SLUG || 'binghamton--ny';
      const allEvents = [];
      const pagesToScrape = parseInt(process.env.SCRAPE_EVENTBRITE_PAGES) || 3;

      for (let page = 1; page <= pagesToScrape; page++) {
        const url = page === 1
          ? `https://www.eventbrite.com/d/${slug}/events/`
          : `https://www.eventbrite.com/d/${slug}/events/?page=${page}`;

        console.log(`  Scraping Eventbrite page ${page}: ${url}`);

        try {
          const $ = await this.fetchPage(url);
          const pageEvents = this.parseEventbritePage($, location);

          if (pageEvents.length === 0) break; // No more pages
          allEvents.push(...pageEvents);

          // Small delay between pages to be respectful
          if (page < pagesToScrape) {
            await new Promise(r => setTimeout(r, 1000));
          }
        } catch (error) {
          console.error(`  Eventbrite page ${page} error:`, error.message);
          break;
        }
      }

      // Also scrape category-specific pages for better coverage
      const categoryPages = (process.env.SCRAPE_EVENTBRITE_CATEGORIES || 'music,sports,food-and-drink,arts,science-and-tech')
        .split(',').map(c => c.trim()).filter(Boolean);

      for (const cat of categoryPages) {
        try {
          const url = `https://www.eventbrite.com/d/${slug}/${cat}/`;
          console.log(`  Scraping Eventbrite category: ${cat}`);
          const $ = await this.fetchPage(url);
          const catEvents = this.parseEventbritePage($, location);
          allEvents.push(...catEvents);
          await new Promise(r => setTimeout(r, 800));
        } catch (error) {
          console.error(`  Eventbrite category ${cat} error:`, error.message);
        }
      }

      // Deduplicate by externalId
      const seen = new Set();
      const unique = allEvents.filter(e => {
        if (seen.has(e.externalId)) return false;
        seen.add(e.externalId);
        return true;
      });

      console.log(`  Found ${unique.length} unique events from Eventbrite (${allEvents.length} total incl dupes)`);
      return unique;
    } catch (error) {
      console.error('  Eventbrite scraping error:', error.message);
      return [];
    }
  }

  parseEventbritePage($, location) {
    const events = [];

    // Strategy 1: JSON-LD structured data
    const jsonLdEvents = this.extractJsonLd($);
    for (const item of jsonLdEvents) {
      const title = item.name;
      if (!title) continue;

      const startTime = item.startDate ? new Date(item.startDate) : null;
      if (!startTime || isNaN(startTime.getTime())) continue;

      const geo = item.location?.geo;
      const lat = geo?.latitude ? parseFloat(geo.latitude) : location.lat;
      const lng = geo?.longitude ? parseFloat(geo.longitude) : location.lng;

      const { eventType, category } = this.categorizeEvent(title, item.description);
      const eventUrl = item.url || '';

      events.push({
        externalId: this.generateStableId('eventbrite', eventUrl || title),
        title,
        description: item.description?.slice(0, 500) || '',
        eventType,
        category,
        location: { lat, lng },
        venueName: item.location?.name || item.location?.address?.addressLocality || 'TBD',
        startTime,
        endTime: item.endDate ? new Date(item.endDate) : null,
        price: this.parsePrice(item.offers?.price || item.offers?.lowPrice),
        registrationUrl: eventUrl,
        source: 'eventbrite',
      });
    }

    // Strategy 2: HTML card parsing fallback
    if (events.length === 0) {
      $('a[href*="/e/"]').each((_, el) => {
        const $link = $(el);
        const href = $link.attr('href') || '';
        if (!href.includes('/e/')) return;

        // Walk up to find the card container
        const card = $link.closest('[class*="event-card"]') || $link;
        const title = card.find('h2, h3, [class*="Typography_body-lg"]').first().text().trim();
        if (!title || title.length < 5) return;

        const dateText = card.find('time, [class*="Typography_body-md"]').first().text().trim();
        const venueText = card.find('[class*="location"], [class*="Typography_body-md"]').eq(1).text().trim();

        let startTime = dateText ? new Date(dateText) : new Date(Date.now() + 7 * 86400000);
        if (isNaN(startTime.getTime())) startTime = new Date(Date.now() + 7 * 86400000);

        const { eventType, category } = this.categorizeEvent(title);
        const fullUrl = href.startsWith('http') ? href : `https://www.eventbrite.com${href}`;

        events.push({
          externalId: this.generateStableId('eventbrite', fullUrl),
          title,
          description: '',
          eventType,
          category,
          location: { lat: location.lat, lng: location.lng },
          venueName: venueText || 'TBD',
          startTime,
          endTime: null,
          price: null,
          registrationUrl: fullUrl,
          source: 'eventbrite',
        });
      });
    }

    return events;
  }

  // ── UNIVERSITY EVENTS ───────────────────────────────────────────
  async scrapeUniversityEvents(location) {
    const urls = (process.env.SCRAPE_UNIVERSITY_URLS || '')
      .split(',')
      .map(u => u.trim())
      .filter(Boolean);

    if (urls.length === 0) return [];

    const allEvents = [];

    for (const baseUrl of urls) {
      try {
        console.log(`  Scraping university events: ${baseUrl}`);

        const apiEvents = await this.tryLocalistApi(baseUrl, location);
        if (apiEvents.length > 0) {
          allEvents.push(...apiEvents);
          continue;
        }

        const htmlEvents = await this.scrapeUniversityHtml(baseUrl, location);
        allEvents.push(...htmlEvents);
      } catch (error) {
        console.error(`  University scraping error (${baseUrl}):`, error.message);
      }
    }

    console.log(`  Found ${allEvents.length} events from university sources`);
    return allEvents;
  }

  async tryLocalistApi(baseUrl, location) {
    const events = [];
    try {
      const apiUrl = `${baseUrl}/api/2/events?days=30&pp=50`;
      const response = await this.http.get(apiUrl, {
        headers: { Accept: 'application/json' },
      });

      const data = response.data;
      if (!data.events || !Array.isArray(data.events)) return [];

      for (const item of data.events) {
        const evt = item.event || item;
        if (!evt.title) continue;

        const startTime = evt.first_date ? new Date(evt.first_date) : null;
        if (!startTime || isNaN(startTime.getTime())) continue;

        const geo = evt.geo;
        const lat = geo?.latitude ? parseFloat(geo.latitude) : location.lat;
        const lng = geo?.longitude ? parseFloat(geo.longitude) : location.lng;

        const { eventType, category } = this.categorizeEvent(evt.title, evt.description_text);

        events.push({
          externalId: this.generateStableId('university', `${baseUrl}:${evt.id || evt.title}`),
          title: evt.title,
          description: (evt.description_text || '').slice(0, 500),
          eventType,
          category,
          location: { lat, lng },
          venueName: evt.location_name || evt.location || 'Campus',
          startTime,
          endTime: evt.last_date ? new Date(evt.last_date) : null,
          price: evt.ticket_cost ? this.parsePrice(evt.ticket_cost) : 0,
          registrationUrl: evt.localist_url || evt.url || baseUrl,
          source: 'university',
        });
      }
    } catch {
      // API not available
    }
    return events;
  }

  async scrapeUniversityHtml(baseUrl, location) {
    const events = [];
    try {
      const $ = await this.fetchPage(baseUrl);

      const jsonLdEvents = this.extractJsonLd($);
      for (const item of jsonLdEvents) {
        if (!item.name) continue;
        const startTime = item.startDate ? new Date(item.startDate) : null;
        if (!startTime || isNaN(startTime.getTime())) continue;

        const { eventType, category } = this.categorizeEvent(item.name, item.description);
        events.push({
          externalId: this.generateStableId('university', `${baseUrl}:${item.url || item.name}`),
          title: item.name,
          description: (item.description || '').slice(0, 500),
          eventType,
          category,
          location: { lat: location.lat, lng: location.lng },
          venueName: item.location?.name || 'Campus',
          startTime,
          endTime: item.endDate ? new Date(item.endDate) : null,
          price: 0,
          registrationUrl: item.url || baseUrl,
          source: 'university',
        });
      }

      if (events.length === 0) {
        $('.event, .event-item, .em-card, [class*="event-listing"], .views-row, article.post').each((_, el) => {
          const card = $(el);
          const title = card.find('h2, h3, .event-title, .em-card_title, .field-title a').first().text().trim();
          if (!title) return;

          const dateText = card.find('time, .event-date, .em-card_date, .date-display-single').first().text().trim()
            || card.find('time').first().attr('datetime');
          const link = card.find('a').first().attr('href') || '';

          let startTime = dateText ? new Date(dateText) : null;
          if (!startTime || isNaN(startTime.getTime())) {
            startTime = new Date(Date.now() + 7 * 86400000);
          }

          const { eventType, category } = this.categorizeEvent(title);
          const fullUrl = link.startsWith('http') ? link : `${baseUrl}${link}`;

          events.push({
            externalId: this.generateStableId('university', fullUrl || title),
            title,
            description: card.find('.event-description, .em-card_description, p').first().text().trim().slice(0, 500),
            eventType,
            category,
            location: { lat: location.lat, lng: location.lng },
            venueName: card.find('.event-location, .em-card_location').first().text().trim() || 'Campus',
            startTime,
            endTime: null,
            price: 0,
            registrationUrl: fullUrl,
            source: 'university',
          });
        });
      }
    } catch (error) {
      console.error(`  University HTML scraping error (${baseUrl}):`, error.message);
    }
    return events;
  }

  // ── COMMUNITY EVENTS ────────────────────────────────────────────
  async scrapeCommunityEvents(location) {
    const urls = (process.env.SCRAPE_COMMUNITY_URLS || '')
      .split(',')
      .map(u => u.trim())
      .filter(Boolean);

    if (urls.length === 0) return [];

    const allEvents = [];

    for (const url of urls) {
      try {
        console.log(`  Scraping community events: ${url}`);
        const $ = await this.fetchPage(url);

        const jsonLdEvents = this.extractJsonLd($);
        for (const item of jsonLdEvents) {
          if (!item.name) continue;
          const startTime = item.startDate ? new Date(item.startDate) : null;
          if (!startTime || isNaN(startTime.getTime())) continue;

          const { eventType, category } = this.categorizeEvent(item.name, item.description);
          allEvents.push({
            externalId: this.generateStableId('community', item.url || item.name),
            title: item.name,
            description: (item.description || '').slice(0, 500),
            eventType,
            category,
            location: {
              lat: item.location?.geo?.latitude ? parseFloat(item.location.geo.latitude) : location.lat,
              lng: item.location?.geo?.longitude ? parseFloat(item.location.geo.longitude) : location.lng,
            },
            venueName: item.location?.name || 'TBD',
            startTime,
            endTime: item.endDate ? new Date(item.endDate) : null,
            price: this.parsePrice(item.offers?.price),
            registrationUrl: item.url || url,
            source: 'community',
          });
        }

        if (jsonLdEvents.length === 0) {
          $('[class*="event"], [class*="calendar"] li, article').each((_, el) => {
            const card = $(el);
            const title = card.find('h2, h3, h4, .title a').first().text().trim();
            if (!title || title.length < 5) return;

            const dateText = card.find('time, .date, [class*="date"]').first().text().trim()
              || card.find('time').first().attr('datetime');
            const link = card.find('a').first().attr('href') || '';

            let startTime = dateText ? new Date(dateText) : null;
            if (!startTime || isNaN(startTime.getTime())) return;

            const { eventType, category } = this.categorizeEvent(title);
            const fullUrl = link.startsWith('http') ? link : `${url}${link}`;

            allEvents.push({
              externalId: this.generateStableId('community', fullUrl || title),
              title,
              description: card.find('p, .description, .summary').first().text().trim().slice(0, 500),
              eventType,
              category,
              location: { lat: location.lat, lng: location.lng },
              venueName: card.find('.venue, .location, [class*="location"]').first().text().trim() || 'TBD',
              startTime,
              endTime: null,
              price: null,
              registrationUrl: fullUrl,
              source: 'community',
            });
          });
        }
      } catch (error) {
        console.error(`  Community scraping error (${url}):`, error.message);
      }
    }

    console.log(`  Found ${allEvents.length} events from community sources`);
    return allEvents;
  }

  // ── ENTRY POINT ─────────────────────────────────────────────────
  async scrapeAllSources(location) {
    console.log('Starting event scraping from web sources...');

    const scrapers = [
      this.scrapeEventbrite(location),
      this.scrapeUniversityEvents(location),
      this.scrapeCommunityEvents(location),
    ];

    const results = await Promise.allSettled(scrapers);

    const allEvents = results
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => r.value);

    // Filter out past events
    const now = new Date();
    const futureEvents = allEvents.filter(e => e.startTime && e.startTime > now);

    console.log(`Scraped ${futureEvents.length} future events (${allEvents.length} total)`);

    await this.storeEvents(futureEvents);

    return futureEvents;
  }

  // ── DB STORAGE ──────────────────────────────────────────────────
  async storeEvents(events) {
    let stored = 0;
    for (const event of events) {
      try {
        await query(
          `INSERT INTO events (
            external_id, title, description, event_type, category,
            lat, lng, venue_name, start_time, end_time, price,
            registration_url, source, raw_data, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
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
            event.externalId,
            event.title,
            event.description,
            event.eventType,
            event.category,
            event.location.lat,
            event.location.lng,
            event.venueName,
            event.startTime,
            event.endTime || null,
            event.price,
            event.registrationUrl,
            event.source,
            JSON.stringify(event),
          ]
        );
        stored++;
      } catch (error) {
        console.error(`Error storing event ${event.externalId}:`, error.message);
      }
    }
    console.log(`Stored/updated ${stored}/${events.length} events in database`);
  }
}

export default new ScraperService();
