import { useAuth } from "@/contexts/AuthContext";

export type PremiumTier = "free" | "premium";

export interface PremiumFeatures {
  tier: PremiumTier;
  maxSavedReports: number;
  canCompare: boolean;
  canExport: boolean;
  canTrackAlerts: boolean;
  unlimitedOfferChecks: boolean;
  advancedSectionDetail: boolean;
}

const FREE_FEATURES: PremiumFeatures = {
  tier: "free",
  maxSavedReports: 5,
  canCompare: false,
  canExport: false,
  canTrackAlerts: false,
  unlimitedOfferChecks: false,
  advancedSectionDetail: false,
};

const PREMIUM_FEATURES: PremiumFeatures = {
  tier: "premium",
  maxSavedReports: Infinity,
  canCompare: true,
  canExport: true,
  canTrackAlerts: true,
  unlimitedOfferChecks: true,
  advancedSectionDetail: true,
};

/**
 * Hook to determine the user's premium tier and available features.
 * Currently always returns free tier. When billing is added,
 * this will check the user's subscription status.
 */
export function usePremium(): PremiumFeatures & { isPremium: boolean; isLoggedIn: boolean } {
  const { user } = useAuth();

  // TODO: Check subscription status from billing table when available
  const isPremium = false;
  const features = isPremium ? PREMIUM_FEATURES : FREE_FEATURES;

  return {
    ...features,
    isPremium,
    isLoggedIn: !!user,
  };
}
