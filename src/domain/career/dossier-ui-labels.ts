import type { ApplicationDossierEmailStatus } from "./application-dossier";

/** User-facing primary line for the dossier card (content is always generated in-app first). */
export function dossierPrimaryLabel(_emailStatus: ApplicationDossierEmailStatus | string): string {
  return "Dossier ready";
}

/** Secondary line: email pipeline — honest about pending / not configured. */
export function dossierEmailSubtitle(emailStatus: ApplicationDossierEmailStatus | string): string {
  switch (emailStatus) {
    case "pending":
      return "Delivery pending · outbound email not configured for this environment";
    case "queued":
      return "Delivery queued";
    case "sent":
      return "Email delivered";
    case "failed":
      return "Email delivery failed — check logs / configuration";
    case "skipped":
      return "Email skipped";
    default:
      return "Delivery status unknown";
  }
}

/** Compact badge for lists (tracker, applications index). */
export function dossierCompactBadgeText(emailStatus: ApplicationDossierEmailStatus | string): string {
  switch (emailStatus) {
    case "pending":
      return "Dossier ready · delivery pending";
    case "queued":
      return "Dossier ready · queued";
    case "sent":
      return "Dossier ready · sent";
    case "failed":
      return "Dossier ready · email failed";
    case "skipped":
      return "Dossier ready · skipped";
    default:
      return "Dossier";
  }
}
