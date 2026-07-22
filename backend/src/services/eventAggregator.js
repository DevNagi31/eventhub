import sportsService from './sportsService.js';
import esportsService from './esportsService.js';
import esportsScraper from './esportsScraper.js';
import scraperService from './scraperService.js';
import ticketmasterService from './ticketmasterService.js';
import icalService from './icalService.js';

class EventAggregator {
  constructor() {
    this.isRunning = false;
    this.lastRun = null;
    this.lastResult = null;
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      lastRun: this.lastRun,
      lastResult: this.lastResult,
    };
  }

  async fetchAndStoreEvents(location, radius = 50, options = {}, onProgress = null) {
    if (this.isRunning) {
      console.log('Scrape already in progress, skipping');
      return [];
    }

    this.isRunning = true;

    try {
      const {
        categories = [],
        games = [],
        includeEsports = true,
        useScraper = true,
        useTicketmaster = true,
        useIcal = true,
      } = options;

      const sourceResults = {};
      const promises = [];
      const sourceNames = [];

      // 1. Ticketmaster Discovery API (free, best coverage)
      if (useTicketmaster && process.env.TICKETMASTER_API_KEY && process.env.TICKETMASTER_API_KEY !== 'your_ticketmaster_api_key') {
        promises.push(ticketmasterService.fetchEvents(location, radius, { classificationName: categories.join(',') || undefined }));
        sourceNames.push('ticketmaster');
      }

      // 2. SeatGeek sports API
      if (process.env.SEATGEEK_CLIENT_ID && process.env.SEATGEEK_CLIENT_ID !== 'your_seatgeek_client_id') {
        promises.push(sportsService.fetchEvents(location, radius, categories));
        sourceNames.push('seatgeek');
      }

      // 3. PandaScore esports API (if key configured)
      if (includeEsports && process.env.PANDASCORE_API_KEY && process.env.PANDASCORE_API_KEY !== 'your_pandascore_api_key') {
        promises.push(esportsService.fetchEvents(location, radius, games));
        sourceNames.push('pandascore');
      }

      // 4. Esports scrapers (HLTV, VLR.gg, LoL Esports, Liquipedia — always free)
      if (includeEsports) {
        promises.push(esportsScraper.scrapeAll());
        sourceNames.push('esports-scraper');
      }

      // 5. iCal/ICS feeds (university calendars, venue feeds)
      if (useIcal) {
        promises.push(icalService.fetchFromFeeds(location));
        sourceNames.push('ical');
      }

      // 6. Web scraper (Eventbrite JSON-LD, community sites)
      if (useScraper) {
        promises.push(scraperService.scrapeAllSources(location));
        sourceNames.push('scraper');
      }

      const results = await Promise.allSettled(promises);

      const allEvents = [];
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const sourceName = sourceNames[i];

        if (result.status === 'fulfilled') {
          const events = result.value || [];
          sourceResults[sourceName] = { status: 'success', count: events.length };
          allEvents.push(...events);

          if (onProgress) {
            onProgress({ source: sourceName, count: events.length, status: 'success' });
          }
        } else {
          sourceResults[sourceName] = { status: 'failed', error: result.reason?.message };
          console.error(`Source ${sourceName} failed:`, result.reason?.message);

          if (onProgress) {
            onProgress({ source: sourceName, count: 0, status: 'failed' });
          }
        }
      }

      this.lastResult = {
        totalEvents: allEvents.length,
        sources: sourceResults,
        timestamp: new Date().toISOString(),
      };

      console.log(`Aggregated ${allEvents.length} total events from ${sourceNames.length} sources`);
      return allEvents;
    } catch (error) {
      console.error('Event aggregation error:', error);
      return [];
    } finally {
      this.isRunning = false;
      this.lastRun = new Date().toISOString();
    }
  }
}

export default new EventAggregator();
