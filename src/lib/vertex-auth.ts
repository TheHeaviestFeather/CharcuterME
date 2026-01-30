/**
 * Vertex AI Authentication
 * Shared module for Google Cloud access token generation
 */

import { GoogleAuth } from 'google-auth-library';

/**
 * Get an access token for Vertex AI API calls
 * Supports both raw JSON and base64-encoded service account credentials
 */
export async function getVertexAccessToken(): Promise<string> {
  const credentials = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!credentials) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY not configured');
  }

  let serviceAccount;
  try {
    // Try parsing as raw JSON first
    serviceAccount = JSON.parse(credentials);
  } catch {
    // If that fails, try base64 decoding
    try {
      const decoded = Buffer.from(credentials, 'base64').toString('utf-8');
      serviceAccount = JSON.parse(decoded);
    } catch {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY is not valid JSON or base64-encoded JSON');
    }
  }

  const auth = new GoogleAuth({
    credentials: serviceAccount,
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });

  const client = await auth.getClient();
  const token = await client.getAccessToken();

  if (!token.token) {
    throw new Error('Failed to get access token');
  }

  return token.token;
}

/**
 * Check if Vertex AI credentials are configured
 */
export function isVertexConfigured(): boolean {
  return !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
}
