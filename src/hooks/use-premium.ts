import { useAuth } from "@/contexts/AuthContext";
import { useDemoSafeMode } from "@/contexts/DemoSafeModeContext";

export type PremiumTier = "free" | "candidate" | "professional";

export const STRIPE_TIERS = {
  candidate: {
    price_id: "price_1TAHg57Qj0W6UtN9K0R65x7g",
    price_id_annual: "price_1TB4Na7Qj0W6UtN9CtKdAM9G",
    product_id: "prod_U8YnG3ulVF5QEW",
    label: "Candidate",
    price: "$29/mo",
    priceAnnual: "$290/yr",
    priceAnnualMonthly: "$24",
    scans: 10,
    offerChecks: 5,
    askJackye: 30,
    dailyScanCap: 5,
    dossierLayers: 7,
  },
  professional: {
    price_id: "price_1TAHg67Qj0W6UtN9HLpWnQy4",
    price_id_annual: "price_1TB4Nb7Qj0W6UtN9mzOJj9E3",
    product_id: "prod_U8Ynpf4FKYEV3Q",
    label: "Professional",
    price: "$99/mo",
    priceAnnual: "$990/yr",
    priceAnnualMonthly: "$83",
    scans: 50,
    offerChecks: 20,
    askJackye: 100,
    dailyScanCap: 15,
    dossierLayers: 7,
  },
  auto_apply: {
    price_id: "price_1T9Tvd7Qj0W6UtN9EbbU1EOn",
    product_id: "prod_U7jOXGhFa2WjxK",
    label: "Auto-Apply Add-on",
    price: "$9/mo",
  },
} as const;

export interface PremiumFeatures {
  tier: PremiumTier;
  maxScansPerMonth: number;
  maxOfferChecks: number;
  maxAskJackye: number;
  dailyScanCap: number;
  dossierLayers: number;
  canExport: boolean;
  canTrackAlerts: boolean;
  hasInfluenceChain: boolean;
  hasEmployerPromiseAudit: boolean;
}

const FREE_FEATURES: PremiumFeatures = {
  tier: "free",
  maxScansPerMonth: 3,
  maxOfferChecks: 1,
  maxAskJackye: 5,
  dailyScanCap: 1,
  dossierLayers: 3,
  canExport: false,
  canTrackAlerts: false,
  hasInfluenceChain: false,
  hasEmployerPromiseAudit: false,
};

const CANDIDATE_FEATURES: PremiumFeatures = {
  tier: "candidate",
  maxScansPerMonth: 10,
  maxOfferChecks: 5,
  maxAskJackye: 30,
  dailyScanCap: 5,
  dossierLayers: 7,
  canExport: false,
  canTrackAlerts: true,
  hasInfluenceChain: false,
  hasEmployerPromiseAudit: false,
};

const PROFESSIONAL_FEATURES: PremiumFeatures = {
  tier: "professional",
  maxScansPerMonth: 50,
  maxOfferChecks: 20,
  maxAskJackye: 100,
  dailyScanCap: 15,
  dossierLayers: 7,
  canExport: true,
  canTrackAlerts: true,
  hasInfluenceChain: true,
  hasEmployerPromiseAudit: true,
};

function getTierFromProductId(productId: string | null): PremiumTier {
  if (productId === STRIPE_TIERS.professional.product_id) return "professional";
  if (productId === STRIPE_TIERS.candidate.product_id) return "candidate";
  return "free";
}

function getFeaturesForTier(tier: PremiumTier): PremiumFeatures {
  switch (tier) {
    case "professional": return PROFESSIONAL_FEATURES;
    case "candidate": return CANDIDATE_FEATURES;
    default: return FREE_FEATURES;
  }
}

export function usePremium(): PremiumFeatures & { isPremium: boolean; isLoggedIn: boolean; subscriptionEnd: string | null } {
  const { user, subscriptionStatus } = useAuth();
  const { isDemoSafe } = useDemoSafeMode();

  // Demo Safe Mode: treat as professional tier (bypass all paywalls)
  if (isDemoSafe && user) {
    return {
      ...PROFESSIONAL_FEATURES,
      isPremium: true,
      isLoggedIn: true,
      subscriptionEnd: null,
    };
  }

  const tier = getTierFromProductId(subscriptionStatus?.product_id ?? null);
  const isPremium = tier !== "free";
  const features = getFeaturesForTier(tier);

  return {
    ...features,
    isPremium,
    isLoggedIn: !!user,
    subscriptionEnd: subscriptionStatus?.subscription_end ?? null,
  };
}

export function useAutoApplySubscription() {
  const { user, subscriptionStatus } = useAuth();

  const hasAutoApply =
    subscriptionStatus?.subscribed === true &&
    (subscriptionStatus?.product_id === STRIPE_TIERS.auto_apply.product_id ||
     subscriptionStatus?.product_id === STRIPE_TIERS.professional.product_id);

  return {
    hasAutoApply: hasAutoApply ?? false,
    isLoggedIn: !!user,
  };
}
