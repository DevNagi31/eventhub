import { Queue, Worker } from 'bullmq';
import dotenv from 'dotenv';
import eventAggregator from './eventAggregator.js';
import { query } from '../config/database.js';

dotenv.config();

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

function parseRedisUrl(url) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname || 'localhost',
    port: parseInt(parsed.port) || 6379,
    password: parsed.password || undefined,
  };
}

class Scheduler {
  constructor() {
    this.defaultLocation = {
      lat: parseFloat(process.env.SCRAPE_DEFAULT_LAT) || 42.0987,
      lng: parseFloat(process.env.SCRAPE_DEFAULT_LNG) || -75.9179,
    };
    this.radius = parseInt(process.env.SCRAPE_RADIUS) || 100;
    this.cronSchedule = process.env.SCRAPE_CRON_SCHEDULE || '0 */4 * * *';
    this.queue = null;
    this.worker = null;
  }

  start() {
    const connection = parseRedisUrl(REDIS_URL);

    console.log(`Starting BullMQ scheduler for location ${this.defaultLocation.lat}, ${this.defaultLocation.lng}`);

    // Create the queue
    this.queue = new Queue('event-scraping', { connection });

    // Create the worker that processes jobs
    this.worker = new Worker('event-scraping', async (job) => {
      switch (job.name) {
        case 'scrape-events':
          return await this.handleScrapeJob(job);
        case 'cleanup-events':
          return await this.handleCleanupJob(job);
        default:
          console.log(`Unknown job: ${job.name}`);
      }
    }, {
      connection,
      concurrency: 1, // Only one scrape at a time
    });

    this.worker.on('completed', (job, result) => {
      console.log(`Job ${job.name} completed: ${JSON.stringify(result)}`);
    });

    this.worker.on('failed', (job, error) => {
      console.error(`Job ${job?.name} failed (attempt ${job?.attemptsMade}):`, error.message);
    });

    // Schedule recurring scrape job
    this.queue.upsertJobScheduler(
      'scrape-events-scheduler',
      { pattern: this.cronSchedule },
      {
        name: 'scrape-events',
        data: {
          location: this.defaultLocation,
          radius: this.radius,
        },
        opts: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 30000 },
          removeOnComplete: 50,
          removeOnFail: 20,
        },
      }
    );

    // Schedule daily cleanup at 3am
    this.queue.upsertJobScheduler(
      'cleanup-events-scheduler',
      { pattern: '0 3 * * *' },
      {
        name: 'cleanup-events',
        opts: {
          attempts: 2,
          removeOnComplete: 10,
          removeOnFail: 5,
        },
      }
    );

    // Run initial scrape after short delay
    setTimeout(() => {
      this.queue.add('scrape-events', {
        location: this.defaultLocation,
        radius: this.radius,
        initial: true,
      }, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 30000 },
        removeOnComplete: true,
      });
    }, 5000);

    console.log('BullMQ scheduler started');
  }

  async handleScrapeJob(job) {
    const { location, radius } = job.data;
    console.log(`Running ${job.data.initial ? 'initial' : 'scheduled'} event scraping...`);

    await job.updateProgress(10);

    const events = await eventAggregator.fetchAndStoreEvents(
      location || this.defaultLocation,
      radius || this.radius,
      { useScraper: true, includeEsports: true, useTicketmaster: true, useIcal: true }
    );

    await job.updateProgress(100);

    return { count: events.length, timestamp: new Date().toISOString() };
  }

  async handleCleanupJob(job) {
    try {
      const result = await query(
        `DELETE FROM events
         WHERE start_time < NOW() - INTERVAL '7 days'
           AND id NOT IN (SELECT DISTINCT event_id FROM group_events WHERE event_id IS NOT NULL)
         RETURNING id`
      );
      const count = result.rowCount;
      if (count > 0) {
        console.log(`Cleaned up ${count} past events`);
      }
      return { cleaned: count };
    } catch (error) {
      console.error('Event cleanup failed:', error.message);
      throw error; // Let BullMQ retry
    }
  }

  async stop() {
    if (this.worker) await this.worker.close();
    if (this.queue) await this.queue.close();
  }
}

export default new Scheduler();
