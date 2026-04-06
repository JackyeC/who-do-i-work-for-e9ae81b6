/**
 * Shared poster pool — used by Newsletter cards AND the share lightbox.
 * Single source of truth so the same article always gets the same image.
 */
import type { ReceiptArticle } from "@/hooks/use-receipts-feed";

const CDN = "/posters";
export const POSTER_POOL: Record<string, string[]> = {
  ai_workplace: [`${CDN}/poster-fewer-humans.jpg`, `${CDN}/poster-ai-handshake.jpg`, `${CDN}/poster-ai-screening.jpg`, `${CDN}/poster-tech-stack.jpg`, `${CDN}/poster-robot-helper.jpg`, `${CDN}/poster-surveillance.jpg`],
  tech_stack: [`${CDN}/poster-tech-stack.jpg`, `${CDN}/poster-robot-helper.jpg`, `${CDN}/poster-ai-screening.jpg`, `${CDN}/poster-surveillance.jpg`],
  future_of_work: [`${CDN}/poster-smile-more.jpg`, `${CDN}/poster-wfh-reality.jpg`, `${CDN}/poster-open-office.jpg`, `${CDN}/poster-rto-commute.jpg`, `${CDN}/poster-water-cooler.jpg`],
  worker_rights: [`${CDN}/poster-dei-rollback.jpg`, `${CDN}/poster-the-handbook.jpg`, `${CDN}/poster-pay-scale.jpg`, `${CDN}/poster-boardroom.jpg`],
  regulation: [`${CDN}/poster-regulation.jpg`, `${CDN}/poster-fine-print.jpg`, `${CDN}/poster-legislation.jpg`],
  pay_equity: [`${CDN}/poster-pay-ratio.jpg`, `${CDN}/poster-ceo-lunch-v2.jpg`, `${CDN}/poster-pay-scale.jpg`, `${CDN}/poster-golden-parachute.jpg`],
  layoffs: [`${CDN}/poster-ghost-postings.jpg`, `${CDN}/poster-the-box.jpg`, `${CDN}/poster-the-pivot.jpg`, `${CDN}/poster-golden-parachute.jpg`],
  legislation: [`${CDN}/poster-legislation.jpg`, `${CDN}/poster-fine-print.jpg`, `${CDN}/poster-regulation.jpg`],
  labor_organizing: [`${CDN}/poster-labor.jpg`, `${CDN}/poster-open-office.jpg`, `${CDN}/poster-supply-chain.jpg`],
  daily_grind: [`${CDN}/poster-water-cooler.jpg`, `${CDN}/poster-rto-commute.jpg`, `${CDN}/poster-exit-interview.jpg`, `${CDN}/poster-smile-more.jpg`, `${CDN}/poster-surveillance.jpg`],
  c_suite: [`${CDN}/poster-golden-parachute.jpg`, `${CDN}/poster-boardroom.jpg`, `${CDN}/poster-follow-money.jpg`],
  fine_print: [`${CDN}/poster-fine-print.jpg`, `${CDN}/poster-regulation.jpg`, `${CDN}/poster-legislation.jpg`, `${CDN}/poster-the-handbook.jpg`],
  paycheck: [`${CDN}/poster-pay-ratio.jpg`, `${CDN}/poster-ceo-lunch-v2.jpg`, `${CDN}/poster-pay-scale.jpg`],
  general: [`${CDN}/poster-jackye-throne.jpg`, `${CDN}/poster-jackye-receipts.jpg`, `${CDN}/poster-jackye-broadcast.jpg`, `${CDN}/poster-follow-money.jpg`, `${CDN}/poster-exit-interview.jpg`, `${CDN}/poster-ghost-jobs.jpg`, `${CDN}/poster-water-cooler.jpg`, `${CDN}/poster-supply-chain.jpg`],
};
export const ALL_POSTERS = [...new Set(Object.values(POSTER_POOL).flat())];

export function getPosterForArticle(article: { headline?: string; id?: string; category?: string | null }): string {
  const pool = POSTER_POOL[article.category ?? ""] || ALL_POSTERS;
  const s = article.headline || article.id || "";
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return pool[Math.abs(h) % pool.length];
}
