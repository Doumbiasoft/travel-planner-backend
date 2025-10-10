/**
 * Route configuration for API prefix
 */

let API_PREFIX = "/api";

export function setApiPrefix(prefix: string): void {
  API_PREFIX = prefix;
}

export function buildRoute(path: string): string {
  return `${API_PREFIX}/${path}`;
}
