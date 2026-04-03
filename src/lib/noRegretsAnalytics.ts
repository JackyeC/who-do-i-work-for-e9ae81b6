/**
 * Lightweight analytics helper for the No-Regrets Career Story funnel.
 * Logs to console in dev; swap the `send` implementation for PostHog / Segment / etc.
 *
 * Event names are defined in the `NoRegretsEvent` type below.
 */

export type NoRegretsEvent =
  | "landing_page_view"
  | "landing_primary_cta_click"
  | "landing_secondary_cta_click"
  | "episode_1_started"
  | "episode_1_completed"
  | "episode_2_started"
  | "episode_2_completed"
  | "episode_3_started"
  | "episode_3_completed"
  | "recap_cta_clicked";

export interface NoRegretsEventProps {
  player_archetype?: string;
  company_archetype?: string;
  consequence_label?: string;
  cta_destination?: string;
  episode?: number;
  [key: string]: unknown;
}

function send(event: NoRegretsEvent, props?: NoRegretsEventProps) {
  try {
    // ── Replace this block with your analytics provider ──
    // e.g. posthog.capture(event, props);
    // e.g. analytics.track(event, props);
    if (import.meta.env.DEV) {
      console.log(`[NoRegrets] ${event}`, props ?? "");
    }
  } catch {
    // analytics should never break the app
  }
}

export function trackNoRegrets(event: NoRegretsEvent, props?: NoRegretsEventProps) {
  send(event, props);
}
