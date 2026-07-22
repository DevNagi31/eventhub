const rateLimitStore = new Map();

function createRateLimiter(windowMs, maxRequests) {
  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();

    if (!rateLimitStore.has(key)) {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    const record = rateLimitStore.get(key);

    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
      return next();
    }

    if (record.count >= maxRequests) {
      return res.status(429).json({ error: 'Too many requests, please try again later' });
    }

    record.count++;
    next();
  };
}

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

// 100 requests per 15 minutes for general API
export const apiLimiter = createRateLimiter(15 * 60 * 1000, 100);

// 10 requests per 15 minutes for auth (login/register)
export const authLimiter = createRateLimiter(15 * 60 * 1000, 10);

// 30 requests per minute for chat
export const chatLimiter = createRateLimiter(60 * 1000, 30);
