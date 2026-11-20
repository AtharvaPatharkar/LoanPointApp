import { IncomingMessage } from 'node:http';
import { config } from '../config/index.js';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

interface LockoutRecord {
  failedAttempts: number;
  lockedUntil: number;
}

/**
 * Dynamic Retry Schedule for Exponential Backoff & IP Jail:
 * - 1st failed attempt: 30 seconds
 * - 2nd failed attempt: 60 seconds (1 minute)
 * - 3rd failed attempt: 300 seconds (5 minutes)
 * - 4th failed attempt: 900 seconds (15 minutes)
 * - 5th+ failed attempt: 86400 seconds (24-hour IP Jail / lockout)
 */
const BACKOFF_SCHEDULE_SECONDS = [30, 60, 300, 900, 86400];

function getBackoffDurationMs(attemptCount: number): number {
  const index = Math.min(Math.max(attemptCount - 1, 0), BACKOFF_SCHEDULE_SECONDS.length - 1);
  return BACKOFF_SCHEDULE_SECONDS[index] * 1000;
}

/**
 * Hybrid Rate Limiter:
 * - Distributed Upstash Redis (REST HTTP API) when configured (multi-instance production safe).
 * - High-speed in-memory fallback with dynamic exponential backoff and IP jail.
 */
class RateLimiter {
  private requestCounts = new Map<string, RateLimitRecord>();
  private lockouts = new Map<string, LockoutRecord>();

  /**
   * Helper to perform low-overhead Upstash REST calls
   */
  private async callUpstash(command: string[]): Promise<any> {
    if (!config.upstashRedisRestUrl || !config.upstashRedisRestToken) {
      return null;
    }
    try {
      const res = await fetch(config.upstashRedisRestUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.upstashRedisRestToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(command),
      });
      if (!res.ok) return null;
      const data: any = await res.json();
      return data?.result;
    } catch {
      return null; // Fall back to in-memory silently
    }
  }

  /**
   * Check sliding-window request limit (e.g., max N requests in W milliseconds)
   */
  public async checkLimit(key: string, maxRequests: number, windowMs: number): Promise<boolean> {
    // 1. Try Distributed Redis if configured
    if (config.upstashRedisRestUrl && config.upstashRedisRestToken) {
      const windowSeconds = Math.ceil(windowMs / 1000);
      try {
        const currentCount = await this.callUpstash(['INCR', `rl:${key}`]);
        if (typeof currentCount === 'number') {
          if (currentCount === 1) {
            await this.callUpstash(['EXPIRE', `rl:${key}`, String(windowSeconds)]);
          }
          return currentCount <= maxRequests;
        }
      } catch {
        // Fall back to in-memory
      }
    }

    // 2. In-Memory Rate Limiting
    const now = Date.now();
    const existing = this.requestCounts.get(key);

    if (!existing || existing.resetAt <= now) {
      this.requestCounts.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });
      return true;
    }

    if (existing.count >= maxRequests) {
      return false;
    }

    existing.count += 1;
    return true;
  }

  /**
   * Check if a key (IP or user) is currently locked out in Jail
   */
  public async isLockedOut(key: string): Promise<{ locked: boolean; remainingSeconds?: number }> {
    // 1. Check Redis if available
    if (config.upstashRedisRestUrl && config.upstashRedisRestToken) {
      try {
        const ttl = await this.callUpstash(['TTL', `jail:${key}`]);
        if (typeof ttl === 'number' && ttl > 0) {
          return { locked: true, remainingSeconds: ttl };
        }
      } catch {
        // Fall back
      }
    }

    // 2. In-Memory check
    const now = Date.now();
    const entry = this.lockouts.get(key);
    if (!entry) return { locked: false };

    if (entry.lockedUntil > now) {
      const remainingSeconds = Math.ceil((entry.lockedUntil - now) / 1000);
      return { locked: true, remainingSeconds };
    }

    this.lockouts.delete(key);
    return { locked: false };
  }

  /**
   * Record a failed attempt towards exponential backoff & IP Jail:
   * Dynamic Retry Schedule:
   * - 1st failed attempt: 30s lockout
   * - 2nd failed attempt: 60s lockout
   * - 3rd failed attempt: 5m lockout
   * - 4th failed attempt: 15m lockout
   * - 5th+ failed attempt: 24h IP Jail
   */
  public async recordFailure(key: string): Promise<{
    locked: boolean;
    failedAttempts: number;
    lockoutDurationSeconds: number;
    remainingSeconds: number;
    isJailed: boolean;
  }> {
    const now = Date.now();
    const entry = this.lockouts.get(key) || { failedAttempts: 0, lockedUntil: 0 };
    entry.failedAttempts += 1;

    const backoffMs = getBackoffDurationMs(entry.failedAttempts);
    entry.lockedUntil = now + backoffMs;
    this.lockouts.set(key, entry);

    const durationSeconds = Math.ceil(backoffMs / 1000);
    const isJailed = entry.failedAttempts >= 5;

    // Sync to Redis if available
    if (config.upstashRedisRestUrl && config.upstashRedisRestToken) {
      try {
        await this.callUpstash(['SET', `jail:${key}`, String(entry.failedAttempts), 'EX', String(durationSeconds)]);
      } catch {
        // Fallback handled
      }
    }

    return {
      locked: true,
      failedAttempts: entry.failedAttempts,
      lockoutDurationSeconds: durationSeconds,
      remainingSeconds: durationSeconds,
      isJailed,
    };
  }

  /**
   * Clear failed attempts upon successful verification
   */
  public async clearFailures(key: string): Promise<void> {
    this.lockouts.delete(key);
    if (config.upstashRedisRestUrl && config.upstashRedisRestToken) {
      try {
        await this.callUpstash(['DEL', `jail:${key}`]);
      } catch {
        // Fallback handled
      }
    }
  }
}

export const rateLimiter = new RateLimiter();

export function getClientIp(req: IncomingMessage): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || '127.0.0.1';
}
