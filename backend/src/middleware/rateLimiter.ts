import { IncomingMessage, ServerResponse } from 'node:http';
import { sendError } from '../utils/http.js';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

interface LockoutRecord {
  failedAttempts: number;
  lockedUntil: number;
}

/**
 * In-memory sliding-window rate limiter for Pure Node.js HTTP server.
 * Note: Suitable for single-instance / local testing. Multi-instance production
 * deployments should pair with a shared Redis store (e.g. Upstash Redis).
 */
class RateLimiter {
  private requestCounts = new Map<string, RateLimitRecord>();
  private lockouts = new Map<string, LockoutRecord>();

  /**
   * Check sliding-window request limit (e.g., max N requests in W milliseconds)
   */
  public checkLimit(key: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const existing = this.requestCounts.get(key);

    if (!existing || existing.resetAt <= now) {
      this.requestCounts.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });
      return true; // allowed
    }

    if (existing.count >= maxRequests) {
      return false; // rate exceeded
    }

    existing.count += 1;
    return true; // allowed
  }

  /**
   * Check if a key is currently locked out due to repeated failed attempts
   */
  public isLockedOut(key: string): { locked: boolean; remainingSeconds?: number } {
    const now = Date.now();
    const entry = this.lockouts.get(key);
    if (!entry) return { locked: false };

    if (entry.lockedUntil > now) {
      const remainingSeconds = Math.ceil((entry.lockedUntil - now) / 1000);
      return { locked: true, remainingSeconds };
    }

    // Lockout expired
    this.lockouts.delete(key);
    return { locked: false };
  }

  /**
   * Record a failed attempt towards lockout (e.g., invalid OTP / PIN)
   */
  public recordFailure(key: string, maxFailures: number, lockoutDurationMs: number): { locked: boolean; remainingAttempts: number } {
    const now = Date.now();
    const entry = this.lockouts.get(key) || { failedAttempts: 0, lockedUntil: 0 };

    entry.failedAttempts += 1;

    if (entry.failedAttempts >= maxFailures) {
      entry.lockedUntil = now + lockoutDurationMs;
      this.lockouts.set(key, entry);
      return { locked: true, remainingAttempts: 0 };
    }

    this.lockouts.set(key, entry);
    return { locked: false, remainingAttempts: maxFailures - entry.failedAttempts };
  }

  /**
   * Clear failed attempts upon successful verification
   */
  public clearFailures(key: string): void {
    this.lockouts.delete(key);
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
