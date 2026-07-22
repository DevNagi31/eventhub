import axios from 'axios';
import * as cheerio from 'cheerio';
import crypto from 'crypto';
import { query } from '../config/database.js';

class EsportsScraper {
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

  generateId(source, uniqueStr) {
    const hash = crypto.createHash('sha256').update(`${source}:${uniqueStr}`).digest('hex').slice(0, 16);
    return `esports_${hash}`;
  }

  // ── LIQUIPEDIA (all games) ──────────────────────────────────────
  async scrapeLiquipedia() {
    const games = [
      { slug: 'counterstrike', category: 'csgo', name: 'Counter-Strike' },
      { slug: 'valorant', category: 'valorant', name: 'Valorant' },
      { slug: 'leagueoflegends', category: 'league_of_legends', name: 'League of Legends' },
      { slug: 'dota2', category: 'dota2', name: 'Dota 2' },
      { slug: 'overwatch', category: 'overwatch', name: 'Overwatch' },
      { slug: 'rocketleague', category: 'rocket_league', name: 'Rocket League' },
    ];

    const allEvents = [];

    for (const game of games) {
      try {
        const events = await this.scrapeLiquipediaGame(game);
        allEvents.push(...events);
        // Respect Liquipedia rate limits
        await new Promise(r => setTimeout(r, 2000));
      } catch (error) {
        console.error(`  Liquipedia ${game.name} error:`, error.message);
      }
    }

    return allEvents;
  }

  async scrapeLiquipediaGame(game) {
    const url = `https://liquipedia.net/${game.slug}/Liquipedia:Upcoming_and_ongoing_matches`;
    console.log(`  Scraping Liquipedia ${game.name}: ${url}`);

    const events = [];

    try {
      const response = await this.http.get(url, {
        headers: {
          'Accept-Encoding': 'gzip',
        },
      });

      const $ = cheerio.load(response.data);

      // Liquipedia match tables
      $('.infobox_matches_content, .match-countdown-block, [data-toggle-area-content]').each((_, el) => {
        const block = $(el);

        // Extract teams
        const team1 = block.find('.team-left .team-template-text a, .team-left span').first().text().trim();
        const team2 = block.find('.team-right .team-template-text a, .team-right span').first().text().trim();

        if (!team1 && !team2) return;

        // Extract tournament name
        const tournament = block.find('.match-filler .text-nowrap a, .league-icon-small-image a').first().text().trim()
          || block.closest('.panel-box').find('.panel-box-heading').first().text().trim();

        // Extract time from countdown or timer
        const timerEl = block.find('.timer-object, .match-countdown');
        const dateStr = timerEl.attr('data-timestamp') || timerEl.attr('datetime');
        let startTime = dateStr ? new Date(parseInt(dateStr) * 1000) : null;

        // If no timestamp, try text parsing
        if (!startTime || isNaN(startTime.getTime())) {
          const timeText = timerEl.text().trim();
          if (timeText) {
            startTime = new Date(timeText);
          }
        }

        if (!startTime || isNaN(startTime.getTime())) return;

        // Skip past matches
        if (startTime < new Date()) return;

        const title = team1 && team2
          ? `${team1} vs ${team2}`
          : tournament || `${game.name} Match`;

        const description = tournament
          ? `${game.name} - ${tournament}${team1 && team2 ? ` | ${team1} vs ${team2}` : ''}`
          : `${game.name} esports match`;

        // Extract stream link
        const streamLink = block.find('a[href*="twitch.tv"], a[href*="youtube.com"]').first().attr('href');

        events.push({
          externalId: this.generateId('liquipedia', `${game.slug}:${title}:${startTime.toISOString()}`),
          title,
          description,
          eventType: 'esports',
          category: game.category,
          location: { lat: 0, lng: 0 },
          venueName: 'Online',
          startTime,
          endTime: null,
          price: 0,
          registrationUrl: streamLink || `https://liquipedia.net/${game.slug}`,
          source: 'liquipedia',
        });
      });
    } catch (error) {
      // Liquipedia might block or rate limit
      if (error.response?.status === 429) {
        console.error(`  Liquipedia rate limited for ${game.name}`);
      }
      // Fall through
    }

    console.log(`  Found ${events.length} matches from Liquipedia ${game.name}`);
    return events;
  }

  // ── HLTV (Counter-Strike) ──────────────────────────────────────
  async scrapeHLTV() {
    console.log('  Scraping HLTV for CS2 matches...');
    const events = [];

    try {
      const response = await this.http.get('https://www.hltv.org/matches', {
        headers: {
          'Referer': 'https://www.hltv.org/',
        },
      });

      const $ = cheerio.load(response.data);

      $('.upcomingMatch, .liveMatch').each((_, el) => {
        const match = $(el);

        const team1 = match.find('.matchTeam .matchTeamName, .team1 .team').first().text().trim();
        const team2 = match.find('.matchTeam .matchTeamName, .team2 .team').last().text().trim();
        const event = match.find('.matchEvent .matchEventName, .event .event-name').first().text().trim();

        if (!team1 && !team2) return;

        // Unix timestamp
        const timestamp = match.find('[data-unix]').first().attr('data-unix')
          || match.find('.matchTime').first().attr('data-unix');
        let startTime = timestamp ? new Date(parseInt(timestamp)) : null;

        if (!startTime || isNaN(startTime.getTime()) || startTime < new Date()) return;

        const matchLink = match.find('a.match, a[href*="/matches/"]').first().attr('href');
        const fullUrl = matchLink ? `https://www.hltv.org${matchLink}` : 'https://www.hltv.org/matches';

        const title = team1 && team2 ? `${team1} vs ${team2}` : 'CS2 Match';
        const description = event ? `Counter-Strike 2 - ${event}` : 'Counter-Strike 2 match';

        events.push({
          externalId: this.generateId('hltv', `${title}:${startTime.toISOString()}`),
          title,
          description,
          eventType: 'esports',
          category: 'csgo',
          location: { lat: 0, lng: 0 },
          venueName: 'Online',
          startTime,
          endTime: null,
          price: 0,
          registrationUrl: fullUrl,
          source: 'hltv',
        });
      });
    } catch (error) {
      console.error('  HLTV scraping error:', error.message);
    }

    console.log(`  Found ${events.length} CS2 matches from HLTV`);
    return events;
  }

  // ── VLR.gg (Valorant) ──────────────────────────────────────────
  async scrapeVLR() {
    console.log('  Scraping VLR.gg for Valorant matches...');
    const events = [];

    try {
      const response = await this.http.get('https://www.vlr.gg/matches');
      const $ = cheerio.load(response.data);

      $('.wf-module-item.match-item').each((_, el) => {
        const match = $(el);

        const teams = match.find('.match-item-vs-team-name .text-of');
        const team1 = teams.eq(0).text().trim();
        const team2 = teams.eq(1).text().trim();

        if (!team1 && !team2) return;

        const event = match.find('.match-item-event-series .text-of').first().text().trim();
        const eventName = match.find('.match-item-event .text-of').first().text().trim();

        // VLR shows time as text
        const timeText = match.find('.match-item-time').first().text().trim();
        const dateHeader = match.closest('.wf-card').prev('.wf-label').text().trim();

        let startTime = null;
        if (dateHeader && timeText) {
          startTime = new Date(`${dateHeader} ${timeText}`);
        }

        // Skip if we can't parse the time or it's in the past
        if (!startTime || isNaN(startTime.getTime())) return;
        if (startTime < new Date()) return;

        const matchLink = match.attr('href');
        const fullUrl = matchLink ? `https://www.vlr.gg${matchLink}` : 'https://www.vlr.gg/matches';

        const title = team1 && team2 ? `${team1} vs ${team2}` : 'Valorant Match';
        const description = `Valorant${eventName ? ` - ${eventName}` : ''}${event ? ` | ${event}` : ''}`;

        events.push({
          externalId: this.generateId('vlr', `${title}:${startTime.toISOString()}`),
          title,
          description,
          eventType: 'esports',
          category: 'valorant',
          location: { lat: 0, lng: 0 },
          venueName: 'Online',
          startTime,
          endTime: null,
          price: 0,
          registrationUrl: fullUrl,
          source: 'vlr',
        });
      });
    } catch (error) {
      console.error('  VLR scraping error:', error.message);
    }

    console.log(`  Found ${events.length} Valorant matches from VLR.gg`);
    return events;
  }

  // ── Lolesports (League of Legends official) ─────────────────────
  async scrapeLolesports() {
    console.log('  Fetching LoL Esports schedule...');
    const events = [];

    try {
      // LoL Esports has a public API
      const response = await this.http.get('https://esports-api.lolesports.com/persisted/gw/getSchedule', {
        params: { hl: 'en-US' },
        headers: {
          'x-api-key': '0TvQnueqKa5mxJntVWt0w4LpLfEkrV1Ta8rQBb9Z',  // Public API key
        },
      });

      const schedule = response.data?.data?.schedule;
      if (!schedule?.events) return events;

      for (const event of schedule.events) {
        if (event.state === 'completed') continue;

        const startTime = event.startTime ? new Date(event.startTime) : null;
        if (!startTime || isNaN(startTime.getTime())) continue;
        if (startTime < new Date()) continue;

        const match = event.match;
        const teams = match?.teams || [];
        const team1 = teams[0]?.name || '';
        const team2 = teams[1]?.name || '';

        const title = team1 && team2
          ? `${team1} vs ${team2}`
          : event.blockName || 'LoL Esports Match';

        const league = event.league?.name || '';
        const description = `League of Legends${league ? ` - ${league}` : ''}${event.blockName ? ` | ${event.blockName}` : ''}`;

        events.push({
          externalId: this.generateId('lolesports', `${event.match?.id || title}:${startTime.toISOString()}`),
          title,
          description,
          eventType: 'esports',
          category: 'league_of_legends',
          location: { lat: 0, lng: 0 },
          venueName: 'Online',
          startTime,
          endTime: null,
          price: 0,
          registrationUrl: 'https://lolesports.com/schedule',
          source: 'lolesports',
        });
      }
    } catch (error) {
      console.error('  LoL Esports error:', error.message);
    }

    console.log(`  Found ${events.length} LoL matches from lolesports`);
    return events;
  }

  // ── ENTRY POINT ─────────────────────────────────────────────────
  async scrapeAll() {
    console.log('Starting esports scraping...');

    const scrapers = [
      this.scrapeHLTV(),
      this.scrapeVLR(),
      this.scrapeLolesports(),
      this.scrapeLiquipedia(),
    ];

    const results = await Promise.allSettled(scrapers);

    const allEvents = results
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => r.value);

    // Deduplicate
    const seen = new Set();
    const unique = allEvents.filter(e => {
      if (seen.has(e.externalId)) return false;
      seen.add(e.externalId);
      return true;
    });

    console.log(`Esports scraping complete: ${unique.length} unique matches`);

    if (unique.length > 0) {
      await this.storeEvents(unique);
    }

    return unique;
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
        console.error(`Error storing esports event ${event.externalId}:`, error.message);
      }
    }
    console.log(`  Stored/updated ${stored}/${events.length} esports events`);
  }
}

export default new EsportsScraper();
