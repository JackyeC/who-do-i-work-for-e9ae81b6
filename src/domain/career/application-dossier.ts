/**
 * Post-application email dossier (row in application_email_dossiers).
 * Content is generated server-side; this type matches the migration shape.
 */
export type ApplicationDossierEmailStatus =
  | "pending"
  | "queued"
  | "sent"
  | "failed"
  | "skipped";

export interface ApplicationEmailDossier {
  id: string;
  user_id: string;
  application_id: string;
  title: string;
  body_markdown: string;
  email_status: ApplicationDossierEmailStatus;
  sent_at: string | null;
  provider_message_id: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}
