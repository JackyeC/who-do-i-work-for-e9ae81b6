/**
 * Lightweight analytics event tracker.
 * Logs events to console in dev and can be extended to PostHog/Plausible/etc.
 */

type AnalyticsEvent =
  | "company_search"
  | "company_profile_view"
  | "company_saved"
  | "scan_triggered"
  | "offer_check_started"
  | "values_check_viewed"
  | "subscription_upgrade_clicked"
  | "onboarding_completed"
  | "example_profile_clicked";

interface EventProperties {
  [key: string]: string | number | boolean | null | undefined;
}

export function trackEvent(event: AnalyticsEvent, properties?: EventProperties) {
  // Console logging for dev visibility
  if (import.meta.env.DEV) {
    console.log(`[Analytics] ${event}`, properties || {});
  }

  // PostHog / Plausible integration point
  // When ready, replace with:
  // posthog.capture(event, properties);
  // or: plausible(event, { props: properties });

  // For now, send to a simple beacon endpoint if available
  try {
    if (typeof navigator.sendBeacon === "function" && import.meta.env.VITE_ANALYTICS_ENDPOINT) {
      navigator.sendBeacon(
        import.meta.env.VITE_ANALYTICS_ENDPOINT,
        JSON.stringify({ event, properties, timestamp: new Date().toISOString() })
      );
    }
  } catch {
    // Silently fail - analytics should never break the app
  }
}
