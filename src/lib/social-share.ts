/**
 * Platform-specific social sharing utilities.
 * 
 * Each platform has different optimal formats:
 * - LinkedIn: Professional tone, URL-focused (OG tags drive the preview)
 * - Twitter/X: Punchy copy + hashtags, text + URL
 * - Facebook: URL-focused (OG tags drive everything)
 */

const BASE_URL = "https://wdiwf.jackyeclayton.com";

export type SharePlatform = "linkedin" | "twitter" | "facebook" | "copy";

export interface ShareContext {
  type: "company" | "battle" | "rivalry" | "scorecard" | "receipt" | "career-risk";
  companyA: string;
  companyB?: string;
  scoreA?: number;
  scoreB?: number;
  slugA?: string;
  slugB?: string;
  industry?: string;
  signals?: { label: string; score: number }[];
  dimensions?: { label: string; score: number }[];
}

function getShareUrl(ctx: ShareContext): string {
  switch (ctx.type) {
    case "battle":
      return ctx.slugA && ctx.slugB
        ? `${BASE_URL}/compare?a=${ctx.slugA}&b=${ctx.slugB}`
        : `${BASE_URL}/compare`;
    case "company":
      return ctx.slugA ? `${BASE_URL}/company/${ctx.slugA}` : BASE_URL;
    case "rivalry":
      return `${BASE_URL}/rivalries`;
    case "scorecard":
      return ctx.slugA ? `${BASE_URL}/company/${ctx.slugA}` : BASE_URL;
    case "receipt":
      return `${BASE_URL}/employer-receipt`;
    case "career-risk":
      return ctx.slugA ? `${BASE_URL}/company/${ctx.slugA}` : BASE_URL;
    default:
      return BASE_URL;
  }
}

function getWinner(ctx: ShareContext): string | null {
  if (ctx.scoreA != null && ctx.scoreB != null) {
    if (ctx.scoreA > ctx.scoreB) return ctx.companyA;
    if (ctx.scoreB > ctx.scoreA) return ctx.companyB || null;
  }
  return null;
}

/** LinkedIn: professional, concise, URL does the heavy lifting via OG tags */
function linkedInText(ctx: ShareContext): string {
  switch (ctx.type) {
    case "battle": {
      const winner = getWinner(ctx);
      if (winner) {
        return `${ctx.companyA} (${ctx.scoreA}/100) vs ${ctx.companyB} (${ctx.scoreB}/100) — ${winner} leads in employer transparency.\n\nHow does your employer compare?`;
      }
      return `${ctx.companyA} vs ${ctx.companyB} — who's more transparent? Compare employers side-by-side.`;
    }
    case "company":
      return `${ctx.companyA} scored ${ctx.scoreA}/100 on employer transparency.\n\nPAC spending, lobbying, workforce signals — all from public records.\n\nKnow before you sign.`;
    case "scorecard":
      return `Your employer scored ${ctx.scoreA}/100 on transparency. Do you know who you really work for?`;
    default:
      return "Know who you're really working for before you sign.";
  }
}

/** Twitter/X: punchy, emoji-forward, hashtags */
function twitterText(ctx: ShareContext): string {
  switch (ctx.type) {
    case "battle": {
      const winner = getWinner(ctx);
      if (winner) {
        return `⚔️ ${ctx.companyA} (${ctx.scoreA}) vs ${ctx.companyB} (${ctx.scoreB}) — ${winner} wins!\n\nWho does YOUR employer work for? 👀\n\n#CareerIntelligence #KnowBeforeYouSign`;
      }
      return `⚔️ ${ctx.companyA} vs ${ctx.companyB} — who's more transparent?\n\n#CareerIntelligence #KnowBeforeYouSign`;
    }
    case "company":
      return `🔍 ${ctx.companyA}: ${ctx.scoreA}/100 transparency score\n\nPAC money. Lobbying. Real data.\n\n#KnowBeforeYouSign #CareerIntelligence`;
    case "scorecard":
      return `📊 Your employer scored ${ctx.scoreA}/100. Do you know who you really work for?\n\n#KnowBeforeYouSign`;
    default:
      return "Know who you're really working for. #KnowBeforeYouSign";
  }
}

/** Full share text for clipboard copy */
function copyText(ctx: ShareContext): string {
  const url = getShareUrl(ctx);
  switch (ctx.type) {
    case "battle": {
      const winner = getWinner(ctx);
      if (winner) {
        return `⚔️ ${ctx.companyA} (${ctx.scoreA}/100) vs ${ctx.companyB} (${ctx.scoreB}/100) — ${winner} wins the transparency battle!\n\nCompare your employer → ${url}`;
      }
      return `⚔️ ${ctx.companyA} vs ${ctx.companyB} — Compare employer transparency scores → ${url}`;
    }
    case "company":
      return `${ctx.companyA} scored ${ctx.scoreA}/100 on employer transparency. PAC spending, lobbying, workforce signals — all from public records.\n\n→ ${url}`;
    case "scorecard":
      return `Your employer scored ${ctx.scoreA}/100. Know before you sign. → ${url}`;
    default:
      return `Know who you're really working for. → ${url}`;
  }
}

export function getShareText(platform: SharePlatform, ctx: ShareContext): string {
  switch (platform) {
    case "linkedin": return linkedInText(ctx);
    case "twitter": return twitterText(ctx);
    case "copy": return copyText(ctx);
    default: return copyText(ctx);
  }
}

export function openShareWindow(platform: SharePlatform, ctx: ShareContext): void {
  const url = getShareUrl(ctx);
  const text = getShareText(platform, ctx);

  switch (platform) {
    case "linkedin":
      window.open(
        `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
        "_blank",
        "width=600,height=600"
      );
      break;
    case "twitter":
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
        "_blank",
        "width=600,height=500"
      );
      break;
    case "facebook":
      window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`,
        "_blank",
        "width=600,height=500"
      );
      break;
    case "copy":
      navigator.clipboard.writeText(text);
      break;
  }
}

/** Generate OG image URL for dynamic pages (PNG format for LinkedIn/social) */
export function getOGImageUrl(ctx: ShareContext): string {
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'tdetybqdxadmowjivtjy';
  const bucketBase = `https://${projectId}.supabase.co/storage/v1/object/public/battle-images`;
  
  switch (ctx.type) {
    case "battle": {
      const pair = [ctx.companyA, ctx.companyB || ''].sort().join('-vs-').toLowerCase().replace(/[^a-z0-9-]/g, '');
      return `${bucketBase}/og-battle-${pair}.png`;
    }
    case "company": {
      const key = ctx.companyA.toLowerCase().replace(/[^a-z0-9]/g, '');
      return `${bucketBase}/og-company-${key}.png`;
    }
    case "scorecard": {
      const key = ctx.companyA.toLowerCase().replace(/[^a-z0-9]/g, '');
      return `${bucketBase}/og-scorecard-${key}.png`;
    }
    case "receipt": {
      const key = ctx.companyA.toLowerCase().replace(/[^a-z0-9]/g, '');
      return `${bucketBase}/og-receipt-${key}-${ctx.scoreA || 0}.png`;
    }
    case "career-risk": {
      const key = ctx.companyA.toLowerCase().replace(/[^a-z0-9]/g, '');
      return `${bucketBase}/og-career-risk-${key}-${ctx.scoreA || 0}.png`;
    }
    case "rivalry":
      return `${BASE_URL}/og-image.png`;
    default:
      return `${BASE_URL}/og-image.png`;
  }
}

/** Pre-generate OG card via edge function (best-effort, fire-and-forget) */
export async function preGenerateOGCard(ctx: ShareContext): Promise<void> {
  const { supabase } = await import("@/integrations/supabase/client");
  
  const body: Record<string, unknown> = { type: ctx.type, companyA: ctx.companyA, scoreA: ctx.scoreA };
  
  if (ctx.type === "battle") {
    body.companyB = ctx.companyB;
    body.scoreB = ctx.scoreB;
    body.industryA = ctx.industry;
    body.industryB = ctx.industry;
  } else if (ctx.type === "company" || ctx.type === "scorecard") {
    body.industryA = ctx.industry;
  } else if (ctx.type === "receipt") {
    body.signals = ctx.signals;
  } else if (ctx.type === "career-risk") {
    body.dimensions = ctx.dimensions;
  }

  supabase.functions.invoke("generate-og-card", { body }).catch(() => {});
}
