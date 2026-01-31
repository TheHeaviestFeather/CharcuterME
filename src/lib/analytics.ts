/**
 * CharcuterME Analytics
 * Lightweight event tracking that works with Sentry
 */

import * as Sentry from '@sentry/nextjs';

// Session ID for funnel tracking
const getSessionId = (): string => {
  if (typeof window === 'undefined') return 'server';

  let sessionId = sessionStorage.getItem('charcuterme_session');
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem('charcuterme_session', sessionId);
  }
  return sessionId;
};

// Track an event
export function track(
  event: string,
  properties?: Record<string, unknown>
): void {
  const eventData = {
    event,
    session_id: getSessionId(),
    timestamp: new Date().toISOString(),
    ...properties,
  };

  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[TRACK]', event, properties);
  }

  // Send to Sentry as breadcrumb (free, no extra service needed)
  try {
    Sentry.addBreadcrumb({
      category: 'analytics',
      message: event,
      level: 'info',
      data: eventData,
    });

    // For important events, also capture as a Sentry event
    const importantEvents = [
      'share_click',
      'share_complete',
      'image_save',
      'vibe_complete',
      'funnel_complete',
    ];

    if (importantEvents.includes(event)) {
      Sentry.captureMessage(`[Analytics] ${event}`, {
        level: 'info',
        tags: { analytics_event: event },
        extra: eventData,
      });
    }
  } catch {
    // Silently fail if Sentry isn't configured
  }
}

// =============================================================================
// Pre-defined Events
// =============================================================================

export const analytics = {
  // Funnel events
  inputView: () => track('funnel_input_view'),
  inputSubmit: (ingredientCount: number) =>
    track('funnel_input_submit', { ingredient_count: ingredientCount }),
  resultsView: (hasImage: boolean, isFallback: boolean) =>
    track('funnel_results_view', { has_image: hasImage, is_fallback: isFallback }),

  // Share events
  shareClick: (screen: 'results' | 'vibe', hasImage: boolean) =>
    track('share_click', { screen, has_image: hasImage }),
  shareComplete: (screen: 'results' | 'vibe', method: 'native' | 'clipboard', hadImage: boolean) =>
    track('share_complete', { screen, method, had_image: hadImage }),

  // Save events
  imageSave: (format: 'png' | 'watermarked') =>
    track('image_save', { format }),
  captionCopy: () =>
    track('caption_copy'),

  // Name events
  nameRegenerate: () =>
    track('name_regenerate'),

  // Vibe events
  vibeStart: () =>
    track('vibe_start'),
  vibeUpload: () =>
    track('vibe_upload'),
  vibeComplete: (score: number, rank: string) =>
    track('vibe_complete', { score, rank }),

  // Return visits
  returnVisit: () => {
    const lastVisit = localStorage.getItem('charcuterme_last_visit');
    const now = Date.now();

    if (lastVisit) {
      const daysSince = Math.floor((now - parseInt(lastVisit)) / (1000 * 60 * 60 * 24));
      track('return_visit', { days_since_last: daysSince });
    }

    localStorage.setItem('charcuterme_last_visit', now.toString());
  },
};

export default analytics;
