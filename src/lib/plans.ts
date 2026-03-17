export interface PlanConfig {
  name: string;
  generations: number;
  brandProfiles: number;
  platforms: "all" | string[];
  export: boolean;
  api: boolean;
  teamMembers: number;
  priceMonthly: number;
  stripePriceId: string;
}

export const PLANS: Record<string, PlanConfig> = {
  free: {
    name: "Free",
    generations: 10,
    brandProfiles: 1,
    platforms: ["meta", "google", "tiktok", "youtube"],
    export: false,
    api: false,
    teamMembers: 0,
    priceMonthly: 0,
    stripePriceId: "",
  },
  pro: {
    name: "Pro",
    generations: 100,
    brandProfiles: 5,
    platforms: "all",
    export: true,
    api: false,
    teamMembers: 3,
    priceMonthly: 19,
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID || "",
  },
  agency: {
    name: "Agency",
    generations: Infinity,
    brandProfiles: Infinity,
    platforms: "all",
    export: true,
    api: true,
    teamMembers: Infinity,
    priceMonthly: 49,
    stripePriceId: process.env.STRIPE_AGENCY_PRICE_ID || "",
  },
};

export function getPlan(planId: string): PlanConfig {
  return PLANS[planId] || PLANS.free;
}

export function canUsePlatform(planId: string, platform: string): boolean {
  const plan = getPlan(planId);
  return plan.platforms === "all" || plan.platforms.includes(platform);
}
