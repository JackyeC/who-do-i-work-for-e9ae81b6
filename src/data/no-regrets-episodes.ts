import type { Episode } from "@/types/no-regrets-game";

export const EPISODE_1: Episode = {
  id: "episode-1",
  title: "Episode 1: The Shock",
  narrative: [
    "You walk into the office on a Tuesday morning, coffee in hand. The Slack channel is quieter than usual. Then you see it — an all-hands calendar invite labeled \"Organizational Update\" dropped ten minutes ago. Your stomach drops.",
    "By 11 AM, it's official: your division is being restructured. Some roles are eliminated outright. Yours isn't gone yet, but the new reporting structure makes it clear — your position is on borrowed time. The severance package is modest. The job market is brutal.",
    "You sit at your desk staring at the screen. Three paths flash through your mind. Each one carries risk. None of them feel safe.",
  ],
  initialStats: { money: 60, safety: 40, sanity: 50, power: 30 },
  choices: [
    {
      id: "safe-job",
      label: "Grab the first safe job you can find",
      statChanges: { money: -5, safety: 10, sanity: 5, power: -5 },
      recapText: "You chose stability over ambition. Within days, you accepted the first reasonable offer that landed in your inbox — a lateral move at a mid-size firm with decent benefits. It's not exciting, but it's a paycheck.",
    },
    {
      id: "pause",
      label: "Pause and take a breath before deciding",
      statChanges: { money: -10, safety: -5, sanity: 15, power: 10 },
      recapText: "You resisted the panic and gave yourself space to think. You updated your profile, reached out to your network, and started researching companies instead of just applying blindly. It cost you some savings, but you feel more in control.",
    },
    {
      id: "survive",
      label: "Double down and try to survive where you are",
      statChanges: { money: 5, safety: -10, sanity: -10, power: 15 },
      recapText: "You chose to fight for your seat. You scheduled meetings with the new leadership, volunteered for high-visibility projects, and made yourself indispensable. The stress is real, but you're building political capital fast.",
    },
  ],
};
