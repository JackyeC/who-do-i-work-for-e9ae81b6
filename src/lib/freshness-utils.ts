/**
 * Freshness label utilities for executive/board member verification dates.
 * Display-layer only.
 */

export interface FreshnessInfo {
  label: string;
  color: string;
  dotColor: string;
  isStale: boolean; // > 90 days
}

export function getFreshnessInfo(lastVerifiedAt: string | null | undefined): FreshnessInfo {
  if (!lastVerifiedAt) {
    return {
      label: "Status unverified",
      color: "#7a7590",
      dotColor: "#7a7590",
      isStale: true,
    };
  }

  const verified = new Date(lastVerifiedAt);
  const now = new Date();
  const daysDiff = Math.floor((now.getTime() - verified.getTime()) / (1000 * 60 * 60 * 24));

  if (daysDiff <= 30) {
    return {
      label: `Verified ${daysDiff}d ago`,
      color: "#47ffb3",
      dotColor: "#47ffb3",
      isStale: false,
    };
  }
  if (daysDiff <= 90) {
    return {
      label: `Verified ${Math.floor(daysDiff / 30)}mo ago`,
      color: "#f0c040",
      dotColor: "#f0c040",
      isStale: false,
    };
  }
  if (daysDiff <= 365) {
    return {
      label: `Verified ${Math.floor(daysDiff / 30)}mo ago — may be outdated`,
      color: "#f0c040",
      dotColor: "#f0c040",
      isStale: true,
    };
  }
  return {
    label: `Last verified ${Math.floor(daysDiff / 365)}yr ago — verify before relying`,
    color: "#ff4d6d",
    dotColor: "#ff4d6d",
    isStale: true,
  };
}

export function hasStaleRecords(
  records: Array<{ last_verified_at?: string | null }>
): boolean {
  return records.some((r) => getFreshnessInfo(r.last_verified_at).isStale);
}

/**
 * Splits records into confirmed (verified within 90 days) and unverified.
 */
export function splitByVerification<T extends { last_verified_at?: string | null }>(
  records: T[]
): { confirmed: T[]; unverified: T[] } {
  const confirmed: T[] = [];
  const unverified: T[] = [];

  for (const r of records) {
    const info = getFreshnessInfo(r.last_verified_at);
    if (info.isStale) {
      unverified.push(r);
    } else {
      confirmed.push(r);
    }
  }

  return { confirmed, unverified };
}
