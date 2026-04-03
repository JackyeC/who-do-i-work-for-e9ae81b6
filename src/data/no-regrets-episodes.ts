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
