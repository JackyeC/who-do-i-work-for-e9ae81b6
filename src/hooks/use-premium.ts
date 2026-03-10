import { useAuth } from "@/contexts/AuthContext";

export type PremiumTier = "free" | "starter" | "pro" | "team";

export const STRIPE_TIERS = {
  starter: {
    price_id: "price_1T9Tve7Qj0W6UtN9eZPIbMff",
    product_id: "prod_U7jOh7zqBI9YBu",
    label: "Starter",
    price: "$29/mo",
    companies: 3,
  },
  pro: {
    price_id: "price_1T9Tvf7Qj0W6UtN9gpum2Bw3",
    product_id: "prod_U7jOK344koIbiZ",
    label: "Pro",
    price: "$250/mo",
    companies: 25,
  },
  team: {
    price_id: "price_1T9Tvg7Qj0W6UtN9c9OwDzDM",
    product_id: "prod_U7jOw43ulg302A",
    label: "Team",
    price: "$800/mo",
    companies: 100,
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

const PRO_FEATURES: PremiumFeatures = {
  tier: "pro",
  maxSavedReports: Infinity,
  canCompare: true,
  canExport: true,
  canTrackAlerts: true,
  unlimitedOfferChecks: true,
  advancedSectionDetail: true,
};

export function usePremium(): PremiumFeatures & { isPremium: boolean; isLoggedIn: boolean; subscriptionEnd: string | null } {
  const { user, subscriptionStatus } = useAuth();

  const isPremium = subscriptionStatus?.subscribed ?? false;
  const features = isPremium ? PRO_FEATURES : FREE_FEATURES;

  return {
    ...features,
    isPremium,
    isLoggedIn: !!user,
    subscriptionEnd: subscriptionStatus?.subscription_end ?? null,
  };
}

export function useAutoApplySubscription() {
  const { user, subscriptionStatus } = useAuth();

  // Auto-Apply is available if user has the auto_apply product OR the pro product (pro includes it)
  const hasAutoApply =
    subscriptionStatus?.subscribed === true &&
    (subscriptionStatus?.product_id === STRIPE_TIERS.auto_apply.product_id ||
     subscriptionStatus?.product_id === STRIPE_TIERS.pro.product_id);

  return {
    hasAutoApply: hasAutoApply ?? false,
    isLoggedIn: !!user,
  };
}
