import { connectRedis } from '../config/redis.js';

class CacheService {
  constructor() {
    this.client = null;
    this.init();
  }

  async init() {
    this.client = await connectRedis();
  }

  generateAPIKey(source, params) {
    const sorted = Object.entries(params)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${Array.isArray(v) ? v.join(',') : v}`)
      .join('&');
    return `api:${source}:${sorted}`;
  }

  generateEventKey(source, externalId) {
    return `event:${source}:${externalId}`;
  }

  async get(key) {
    if (!this.client) return null;
    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Cache get error:', error.message);
      return null;
    }
  }

  async set(key, value, ttl = 3600) {
    if (!this.client) return false;
    try {
      await this.client.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Cache set error:', error.message);
      return false;
    }
  }

  async del(key) {
    if (!this.client) return false;
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Cache del error:', error.message);
      return false;
    }
  }
}

export default new CacheService();
