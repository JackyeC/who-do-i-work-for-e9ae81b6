import type { Episode } from "@/types/no-regrets-game";

export const EPISODE_1: Episode = {
  id: "episode-1",
  title: "Episode 1: The Shock",
  narrative: [
    "You're mid-bite into a breakfast bar when the calendar invite appears. \"Organizational Alignment — All Hands — Mandatory.\" No agenda. No pre-read. Sent by someone two levels above your boss. The meeting is in forty-five minutes.",
    "By lunch, the language is already corporate-sanitized: \"streamlining for impact,\" \"refocusing investment.\" But you can read between the lines. Your team lead won't make eye contact. HR is walking the floor with folders. The severance terms leaked on Slack before the official email even went out — four weeks per year of service, COBRA for sixty days, and a politely worded non-disparagement clause. Your position isn't eliminated yet. But the reorg chart has your role reporting into someone who was hired three months ago and has never spoken to you.",
    "Your rent is $2,400 a month. You have about five months of savings if you cut everything non-essential. The job market in your field has been brutal since Q3. You open LinkedIn and see six people from your company have already updated their headlines to \"Open to Work.\" Three paths sit in front of you. None of them are safe. All of them are real.",
  ],
  initialStats: { money: 60, safety: 40, sanity: 50, power: 30 },
  choices: [
    {
      id: "stability-first",
      label: "Take the first offer with a steady paycheck — even if it's a step down",
      statChanges: { money: -5, safety: 10, sanity: 5, power: -10 },
      archetype: "stability-first",
      recapText: "You didn't overthink it. Within seventy-two hours of the reorg announcement, you had three applications out and accepted the first callback — a lateral role at a mid-size firm with reliable benefits and zero ambiguity about reporting lines. It's not a dream job. It's a floor under your feet. You traded upside for certainty, and right now that trade feels like survival.",
    },
    {
      id: "pause-and-reassess",
      label: "Burn some savings to buy yourself time — and investigate before you leap",
      statChanges: { money: -15, safety: -5, sanity: 15, power: 10 },
      archetype: "pause-and-reassess",
      recapText: "You resisted the panic. While everyone else scrambled to apply anywhere, you pulled up your finances, calculated your runway, and gave yourself three weeks to research instead of react. You started looking into the companies behind the job postings — who funds them, who runs them, what their track record looks like when no one is watching. It cost you savings and some sleepless nights. But for the first time in this process, you feel like you're making a decision instead of just absorbing one.",
    },
    {
      id: "overstay-and-hope",
      label: "Stay put and try to outlast the reorg — maybe your number won't come up",
      statChanges: { money: 5, safety: -15, sanity: -10, power: 15 },
      archetype: "overstay-and-hope",
      recapText: "You decided to hold your ground. You showed up early, stayed late, volunteered for the transition committee, and sent three unsolicited strategy memos to the new leadership. You're building visibility fast — but the anxiety is constant. Every closed-door meeting feels like a verdict. Every Slack DM from HR makes your chest tighten. You're gaining power inside a building that might not want you in it much longer.",
    },
  ],
};

export const EPISODE_2: Episode = {
  id: "episode-2",
  title: "Episode 2: The Offer",
  narrative: [
    "Three weeks after The Shock, your inbox has three real offers. Not dream jobs — real jobs, with start dates and salary numbers and health insurance PDFs attached. You should feel relieved. Instead, you feel like you're reading three different versions of the same lie.",
    "Because here's what nobody told you when you started job hunting: every company looks good from the outside. The careers page is always inspiring. The Glassdoor reviews are always \"mixed.\" The recruiter always says \"we're like a family here.\" But you've been through a reorg now. You know what \"family\" means when headcount gets cut.",
    "So you do something most candidates never do. You look past the offer letter. You pull the receipts.",
  ],
  initialStats: { money: 50, safety: 35, sanity: 55, power: 35 },
  choices: [
    {
      id: "safe-pay-shaky-ethics",
      label: "NovaCorp — $112K, full benefits, 401(k) match. Stable. Quiet. Suspiciously quiet.",
      archetype: "safe-pay-shaky-ethics",
      statChanges: { money: 20, safety: 10, sanity: -10, power: -15 },
      receiptHints: [
        { emoji: "🧾", label: "FEC filings", detail: "PAC donated $340K to candidates opposing worker protection bills in 2022–2024" },
        { emoji: "⚖️", label: "EEOC record", detail: "Three settled discrimination complaints in the last 18 months — all under NDA" },
        { emoji: "📉", label: "Glassdoor pattern", detail: "Reviews mention \"golden handcuffs\" and \"don't ask questions\" culture across 40+ entries" },
      ],
      recapText: "You took the money. NovaCorp's offer was clean — good salary, strong benefits, no surprises in the paperwork. But the paperwork isn't where the surprises live. The company's PAC has been funding candidates who vote against the labor protections you'd need if things went sideways. Three EEOC complaints were settled quietly in the last year and a half. The Glassdoor reviews don't say \"toxic\" — they say \"stable, as long as you don't make waves.\" You traded your voice for a 401(k) match. The question is whether you'll notice before it costs you something you can't get back.",
    },
    {
      id: "mission-driven-unstable",
      label: "Clearpath Labs — $88K, equity, mission you believe in. Funding runway: 11 months.",
      archetype: "mission-driven-unstable",
      statChanges: { money: -20, safety: -20, sanity: 15, power: 10 },
      receiptHints: [
        { emoji: "💸", label: "SEC filings", detail: "Burned through 60% of Series B in 14 months — no bridge round announced" },
        { emoji: "🚪", label: "LinkedIn signal", detail: "VP of Engineering and Head of Product both departed in the last 90 days" },
        { emoji: "✊", label: "Mission check", detail: "Founder quoted in TechCrunch: \"We'd rather shut down than compromise on values\"" },
      ],
      recapText: "You chose the mission. Clearpath Labs is doing real work — the kind that makes you feel like your career has a point. But the financials don't lie. They burned through most of their Series B in just over a year. Two senior leaders left in the last quarter. The founder's conviction is genuine, but conviction doesn't make payroll. You're betting your rent on a company that might not exist in eleven months. If it works, you'll have been part of something that mattered. If it doesn't, you'll have a gap on your resume and a story about how you believed in something that ran out of runway.",
    },
    {
      id: "prestige-burnout",
      label: "Meridian Group — $135K, brand-name résumé line. Average tenure: 14 months.",
      archetype: "prestige-burnout",
      statChanges: { money: 15, safety: 5, sanity: -25, power: 20 },
      receiptHints: [
        { emoji: "🔥", label: "Turnover data", detail: "Average employee tenure is 14 months — drops to 9 months for non-managers" },
        { emoji: "🏛️", label: "Lobbying spend", detail: "$2.1M in federal lobbying last year — primarily on labor classification and contractor rules" },
        { emoji: "🏆", label: "Brand signal", detail: "Named to \"Best Places to Work\" list by a publication they spend $400K/year advertising with" },
      ],
      recapText: "You chose the name. Meridian Group looks incredible on paper — and they know it. The salary is strong, the brand opens doors, and the recruiter made you feel like you'd been selected for something elite. But the average tenure tells a different story: 14 months company-wide, 9 months for non-managers. They spent $2.1M lobbying on labor classification rules last year. And that \"Best Places to Work\" award? It came from a publication where Meridian is a six-figure advertiser. You're not joining a company. You're joining a machine that converts ambition into burnout and calls it a résumé upgrade.",
    },
  ],
};
