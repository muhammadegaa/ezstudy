// Simple in-memory rate limiting (for production, use Redis or similar)
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

export interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
}

export function rateLimit(
  identifier: string,
  options: RateLimitOptions = { windowMs: 60000, maxRequests: 60 }
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = identifier;
  
  // Clean up expired entries
  Object.keys(store).forEach((k) => {
    if (store[k].resetTime < now) {
      delete store[k];
    }
  });
  
  // Get or create entry
  let entry = store[key];
  
  if (!entry || entry.resetTime < now) {
    // Create new window
    entry = {
      count: 1,
      resetTime: now + options.windowMs,
    };
    store[key] = entry;
    return {
      allowed: true,
      remaining: options.maxRequests - 1,
      resetTime: entry.resetTime,
    };
  }
  
  // Check if limit exceeded
  if (entry.count >= options.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }
  
  // Increment count
  entry.count++;
  
  return {
    allowed: true,
    remaining: options.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

// Get client identifier from request
export function getClientIdentifier(req: Request): string {
  // Try to get IP from headers (works with Vercel and most proxies)
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip') || 'unknown';
  
  // Use IP as identifier (in production, combine with user ID if authenticated)
  return ip;
}

