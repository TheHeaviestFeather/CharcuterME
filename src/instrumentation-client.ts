import * as Sentry from '@sentry/nextjs';

// Export router transition hook for navigation instrumentation
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Only enable in production
  enabled: process.env.NODE_ENV === 'production',

  // Capture all errors for small user base
  tracesSampleRate: 1.0,

  // Capture console errors
  integrations: [Sentry.browserTracingIntegration()],

  // Filter out known non-issues
  ignoreErrors: [
    // User cancelled share/abort
    'AbortError',
    // User navigated away
    'ResizeObserver loop',
  ],
});
