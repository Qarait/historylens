import { createHash } from 'node:crypto';

const memoryWindows = new Map();

export function enforceOrigin(req, res) {
  if (process.env.NODE_ENV !== 'production') return true;

  const headers = req.headers || {};
  const originValue = headers.origin || headers.referer || '';
  if (!originValue) {
    res.status(403).json({ error: 'Unauthorized origin' });
    return false;
  }

  try {
    const hostname = new URL(originValue).hostname.toLowerCase();
    const allowed =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === 'historylens.app' ||
      hostname.endsWith('.historylens.app') ||
      hostname === 'historylens-psi.vercel.app';

    if (!allowed) {
      res.status(403).json({ error: 'Unauthorized origin' });
      return false;
    }
    return true;
  } catch {
    res.status(403).json({ error: 'Unauthorized origin' });
    return false;
  }
}

export function getClientId(req) {
  const headers = req.headers || {};
  const forwarded = String(headers['x-forwarded-for'] || '').split(',')[0].trim();
  const raw = forwarded || req.socket?.remoteAddress || 'unknown';
  return createHash('sha256').update(raw).digest('hex').slice(0, 24);
}

export async function enforceRateLimit(req, res, options) {
  const { scope, limit, windowSeconds = 60 } = options;
  const clientId = getClientId(req);
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  let result;
  if (redisUrl && redisToken) {
    try {
      result = await checkRedisWindow(redisUrl, redisToken, scope, clientId, limit, windowSeconds);
    } catch (error) {
      console.error('[Rate Limit] Redis unavailable, using memory fallback:', error.message);
    }
  }

  if (!result) {
    result = checkMemoryWindow(scope, clientId, limit, windowSeconds);
    res.setHeader?.('X-RateLimit-Mode', redisUrl && redisToken ? 'fallback' : 'memory');
  } else {
    res.setHeader?.('X-RateLimit-Mode', 'redis');
  }

  res.setHeader?.('X-RateLimit-Limit', String(limit));
  res.setHeader?.('X-RateLimit-Remaining', String(Math.max(0, limit - result.count)));

  if (!result.allowed) {
    res.setHeader?.('Retry-After', String(result.retryAfter));
    res.status(429).json({ error: 'Too many requests. Please wait a minute.' });
    return false;
  }
  return true;
}

async function checkRedisWindow(url, token, scope, clientId, limit, windowSeconds) {
  const bucket = Math.floor(Date.now() / (windowSeconds * 1000));
  const key = `historylens:${scope}:${clientId}:${bucket}`;
  const response = await fetch(`${url.replace(/\/$/, '')}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([
      ['INCR', key],
      ['EXPIRE', key, windowSeconds + 5, 'NX'],
    ]),
  });

  if (!response.ok) throw new Error(`Redis ${response.status}`);
  const data = await response.json();
  const count = Number(data?.[0]?.result);
  if (!Number.isFinite(count)) throw new Error('Invalid Redis response');

  return {
    allowed: count <= limit,
    count,
    retryAfter: windowSeconds,
  };
}

function checkMemoryWindow(scope, clientId, limit, windowSeconds) {
  const now = Date.now();
  const key = `${scope}:${clientId}`;
  const existing = memoryWindows.get(key);
  const windowMs = windowSeconds * 1000;

  if (!existing || now - existing.startedAt >= windowMs) {
    memoryWindows.set(key, { count: 1, startedAt: now });
    pruneMemoryWindows(now, windowMs);
    return { allowed: true, count: 1, retryAfter: windowSeconds };
  }

  existing.count += 1;
  return {
    allowed: existing.count <= limit,
    count: existing.count,
    retryAfter: Math.max(1, Math.ceil((windowMs - (now - existing.startedAt)) / 1000)),
  };
}

function pruneMemoryWindows(now, windowMs) {
  if (memoryWindows.size < 500) return;
  for (const [key, value] of memoryWindows) {
    if (now - value.startedAt > windowMs * 2) memoryWindows.delete(key);
  }
}
