export function getPublicSiteUrl(): string {
  const raw =
    (import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined) ||
    "https://wdiwf.jackyeclayton.com";
  return raw.replace(/\/+$/, "");
}

