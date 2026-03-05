/**
 * Web-safe version of defaultAppHeaders.
 * In the Electron app, defaultAppHeaders returns X-Title and HTTP-Referer headers.
 * In the web version, these custom headers cause CORS preflight failures because
 * third-party API servers (e.g., api.cherry-ai.com) don't include them in
 * Access-Control-Allow-Headers. Since the browser enforces CORS (unlike Electron),
 * we return empty headers for the web context.
 */
export const defaultAppHeaders = (): Record<string, string> => {
  return {}
}
