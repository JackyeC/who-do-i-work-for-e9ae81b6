/**
 * Firecrawl Circuit Breaker
 * 
 * Prevents repeated calls to Firecrawl when credits are exhausted.
 * Uses a cooldown window to avoid burning edge function invocations.
 */

const COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes
const STORAGE_KEY = 'firecrawl_circuit_breaker';

export type FirecrawlErrorType =
  | 'credits_exhausted'
  | 'invalid_api_key'
  | 'timeout'
  | 'provider_outage'
  | 'unknown';

interface CircuitState {
  isOpen: boolean;
  errorType: FirecrawlErrorType;
  openedAt: number;
  errorMessage: string;
}

function getState(): CircuitState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const state = JSON.parse(raw) as CircuitState;
    // Auto-close after cooldown
    if (Date.now() - state.openedAt > COOLDOWN_MS) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return state;
  } catch {
    return null;
  }
}

function openCircuit(errorType: FirecrawlErrorType, errorMessage: string) {
  const state: CircuitState = {
    isOpen: true,
    errorType,
    openedAt: Date.now(),
    errorMessage,
  };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resetCircuit() {
  sessionStorage.removeItem(STORAGE_KEY);
}

/**
 * Classify an error from edge function response
 */
export function classifyFirecrawlError(error: any): { isFirecrawl: boolean; errorType: FirecrawlErrorType; message: string } {
  const msg = typeof error === 'string' ? error : error?.message || error?.error || '';
  const lower = msg.toLowerCase();

  if (lower.includes('insufficient credits') || lower.includes('credits exhausted') || lower.includes('usage limit')) {
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
  // Check for 402 status code pattern (edge function returned non-2xx)
  if (lower.includes('402') || lower.includes('non-2xx')) {
    return { isFirecrawl: true, errorType: 'credits_exhausted', message: msg };
  }

  return { isFirecrawl: false, errorType: 'unknown', message: msg };
}

/**
 * Check if Firecrawl is currently unavailable (circuit is open)
 */
export function isFirecrawlUnavailable(): CircuitState | null {
  return getState();
}

/**
 * Record a Firecrawl failure — opens the circuit breaker
 */
export function recordFirecrawlFailure(errorType: FirecrawlErrorType, errorMessage: string) {
  openCircuit(errorType, errorMessage);
}

/**
 * Get remaining cooldown time in minutes
 */
export function getCooldownMinutes(): number {
  const state = getState();
  if (!state) return 0;
  const remaining = COOLDOWN_MS - (Date.now() - state.openedAt);
  return Math.max(0, Math.ceil(remaining / 60000));
}

/**
 * Log structured error for admin debugging
 */
export function logScanError(details: {
  provider: string;
  errorType: FirecrawlErrorType;
  companyId?: string;
  companyName?: string;
  scanType: string;
  rawError: string;
}) {
  console.error(`[SCAN_ERROR] ${JSON.stringify({
    ...details,
    timestamp: new Date().toISOString(),
  })}`);
}
