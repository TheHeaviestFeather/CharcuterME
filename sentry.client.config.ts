import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Only enable in production
  enabled: process.env.NODE_ENV === 'production',

  // Adjust sample rate for your traffic (0.1 = 10% of errors)
  // For <100 users, capture everything
  tracesSampleRate: 1.0,

  // Capture console errors
  integrations: [
    Sentry.browserTracingIntegration(),
  ],

  // Filter out known non-issues
  ignoreErrors: [
    // User cancelled share/abort
    'AbortError',
    // User navigated away
    'ResizeObserver loop',
  ],
});
