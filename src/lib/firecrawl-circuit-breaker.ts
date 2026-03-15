/**
 * Multi-Provider Circuit Breaker
 * 
 * Tracks per-provider health state with cooldown windows.
 * Prevents repeated calls to exhausted/broken providers.
 */

const COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes
const STORAGE_PREFIX = 'provider_circuit_';

export type ProviderErrorType =
  | 'credits_exhausted'
  | 'invalid_api_key'
  | 'timeout'
  | 'provider_outage'
  | 'unknown';

export type ProviderName = 'firecrawl' | 'scrapingbee' | 'apify' | 'government_api' | 'ats_api';

// Keep backward compat
export type FirecrawlErrorType = ProviderErrorType;

interface CircuitState {
  isOpen: boolean;
  errorType: ProviderErrorType;
  openedAt: number;
  errorMessage: string;
  provider: ProviderName;
}

function storageKey(provider: ProviderName) {
  return `${STORAGE_PREFIX}${provider}`;
}

function getProviderState(provider: ProviderName): CircuitState | null {
  try {
    const raw = sessionStorage.getItem(storageKey(provider));
    if (!raw) return null;
    const state = JSON.parse(raw) as CircuitState;
    if (Date.now() - state.openedAt > COOLDOWN_MS) {
      sessionStorage.removeItem(storageKey(provider));
      return null;
    }
    return state;
  } catch {
    return null;
  }
}

function openCircuit(provider: ProviderName, errorType: ProviderErrorType, errorMessage: string) {
  const state: CircuitState = {
    isOpen: true,
    errorType,
    openedAt: Date.now(),
    errorMessage,
    provider,
  };
  sessionStorage.setItem(storageKey(provider), JSON.stringify(state));
}

// ─── Public API ───

/** Check if a specific provider is unavailable */
export function isProviderUnavailable(provider: ProviderName): CircuitState | null {
  return getProviderState(provider);
}

/** Backward compat: check Firecrawl specifically */
export function isFirecrawlUnavailable(): CircuitState | null {
  return getProviderState('firecrawl');
}

/** Record a provider failure */
export function recordProviderFailure(provider: ProviderName, errorType: ProviderErrorType, errorMessage: string) {
  openCircuit(provider, errorType, errorMessage);
}

/** Backward compat */
export function recordFirecrawlFailure(errorType: ProviderErrorType, errorMessage: string) {
  recordProviderFailure('firecrawl', errorType, errorMessage);
}

/** Reset a specific provider's circuit */
export function resetProviderCircuit(provider: ProviderName) {
  sessionStorage.removeItem(storageKey(provider));
}

/** Backward compat */
export function resetCircuit() {
  resetProviderCircuit('firecrawl');
}

/** Get remaining cooldown in minutes for a provider */
export function getProviderCooldownMinutes(provider: ProviderName): number {
  const state = getProviderState(provider);
  if (!state) return 0;
  const remaining = COOLDOWN_MS - (Date.now() - state.openedAt);
  return Math.max(0, Math.ceil(remaining / 60000));
}

/** Backward compat */
export function getCooldownMinutes(): number {
  return getProviderCooldownMinutes('firecrawl');
}

/** Get the first available provider from a fallback chain */
export function getFirstAvailableProvider(chain: ProviderName[]): ProviderName | null {
  for (const provider of chain) {
    if (!getProviderState(provider)) return provider;
  }
  return null;
}

/** Get all unavailable providers with their states */
export function getUnavailableProviders(): CircuitState[] {
  const providers: ProviderName[] = ['firecrawl', 'scrapingbee', 'apify'];
  return providers
    .map(p => getProviderState(p))
    .filter((s): s is CircuitState => s !== null);
}

/** Classify an error from any scraping provider */
export function classifyFirecrawlError(error: any): { isFirecrawl: boolean; errorType: ProviderErrorType; message: string } {
  return classifyProviderError(error);
}

export function classifyProviderError(error: any): { isFirecrawl: boolean; errorType: ProviderErrorType; message: string } {
  const msg = typeof error === 'string' ? error : error?.message || error?.error || '';
  const lower = msg.toLowerCase();

  if (lower.includes('insufficient credits') || lower.includes('credits exhausted') || lower.includes('usage limit') || lower.includes('402')) {
    return { isFirecrawl: true, errorType: 'credits_exhausted', message: msg };
  }
  if (lower.includes('invalid') && (lower.includes('key') || lower.includes('api') || lower.includes('authorization'))) {
    return { isFirecrawl: true, errorType: 'invalid_api_key', message: msg };
  }
  if (lower.includes('timeout') || lower.includes('timed out') || lower.includes('deadline')) {
    return { isFirecrawl: true, errorType: 'timeout', message: msg };
  }
  if (lower.includes('502') || lower.includes('503') || lower.includes('service unavailable') || lower.includes('gateway')) {
    return { isFirecrawl: true, errorType: 'provider_outage', message: msg };
  }
  if (lower.includes('non-2xx')) {
    return { isFirecrawl: true, errorType: 'credits_exhausted', message: msg };
  }

  return { isFirecrawl: false, errorType: 'unknown', message: msg };
}

/** Log structured error for admin debugging */
export function logScanError(details: {
  provider: string;
  errorType: ProviderErrorType;
  companyId?: string;
  companyName?: string;
  scanType: string;
  section?: string;
  rawError: string;
}) {
  console.error(`[SCAN_ERROR] ${JSON.stringify({
    ...details,
    timestamp: new Date().toISOString(),
  })}`);
}
