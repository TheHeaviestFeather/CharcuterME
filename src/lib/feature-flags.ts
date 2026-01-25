// =============================================================================
// Feature Flags
// Simple feature flags for quick enable/disable without deployment
// =============================================================================

const FLAGS = {
  // AI Features - can disable if services are having issues
  enableDalle: process.env.ENABLE_DALLE !== 'false',
  enableVibeCheck: process.env.ENABLE_VIBE_CHECK !== 'false',
  enableClaudeNaming: process.env.ENABLE_CLAUDE_NAMING !== 'false',

  // App Features
  enableSharing: process.env.ENABLE_SHARING !== 'false',
  enableCamera: process.env.ENABLE_CAMERA !== 'false',

  // Maintenance Mode - show maintenance page
  maintenanceMode: process.env.MAINTENANCE_MODE === 'true',

  // Debug Mode - extra logging
  debugMode: process.env.DEBUG_MODE === 'true',
} as const;

export type FeatureFlag = keyof typeof FLAGS;

export function isEnabled(flag: FeatureFlag): boolean {
  return FLAGS[flag];
}

export function getFlags(): typeof FLAGS {
  return { ...FLAGS };
}

// Helper for conditional rendering
export function whenEnabled<T>(flag: FeatureFlag, value: T, fallback?: T): T | undefined {
  return isEnabled(flag) ? value : fallback;
}
