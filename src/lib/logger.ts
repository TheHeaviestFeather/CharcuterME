// =============================================================================
// Structured Logger
// JSON logging for production observability
// =============================================================================

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  userId?: string;
  action?: string;
  duration?: number;
  error?: string;
  [key: string]: unknown;
}

function formatLog(level: LogLevel, message: string, context: LogContext = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
    ...(process.env.NODE_ENV === 'production' && {
      environment: 'production',
      version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7),
    }),
  };

  return JSON.stringify(entry);
}

function log(level: LogLevel, message: string, context: LogContext = {}) {
  const formatted = formatLog(level, message, context);

  // In development, use readable format
  if (process.env.NODE_ENV === 'development') {
    const prefix = {
      debug: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
    }[level];

    if (level === 'error') {
      console.error(`${prefix} [${level.toUpperCase()}] ${message}`, context);
    } else if (level === 'warn') {
      console.warn(`${prefix} [${level.toUpperCase()}] ${message}`, context);
    } else {
      console.log(`${prefix} [${level.toUpperCase()}] ${message}`, context);
    }
    return;
  }

  // In production, use JSON for log aggregation
  if (level === 'error') {
    console.error(formatted);
  } else if (level === 'warn') {
    console.warn(formatted);
  } else {
    console.log(formatted);
  }
}

export const logger = {
  debug: (msg: string, ctx?: LogContext) => log('debug', msg, ctx),
  info: (msg: string, ctx?: LogContext) => log('info', msg, ctx),
  warn: (msg: string, ctx?: LogContext) => log('warn', msg, ctx),
  error: (msg: string, ctx?: LogContext) => log('error', msg, ctx),
};

// Helper for timing operations
export function withTiming<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  return fn()
    .then((result) => {
      logger.info(`${operation} completed`, { duration: Date.now() - start });
      return result;
    })
    .catch((error) => {
      logger.error(`${operation} failed`, {
        duration: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    });
}
