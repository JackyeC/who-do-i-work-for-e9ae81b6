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

export const EPISODE_3: Episode = {
  id: "episode-3",
  title: "Episode 3: The Cost",
  narrative: [
    "Six months in. The adrenaline is gone. The \"new job energy\" wore off around month three. Now it's just... the job. And the job is telling you things you didn't want to hear.",
  ],
  initialStats: { money: 50, safety: 35, sanity: 40, power: 35 },
  choices: [], // overridden by branches
  branches: [
    {
      forArchetype: "safe-pay-shaky-ethics",
      narrative: [
        "NovaCorp is exactly what they promised: stable, well-paying, and allergic to disruption. Your paycheck clears like clockwork. Your benefits are excellent. Your 401(k) match is the best you've ever had. And you haven't said anything honest in a meeting in four months.",
        "Last week, a colleague was put on a PIP for raising concerns about a vendor contract that had obvious conflicts of interest. Nobody said a word. You didn't say a word. The silence wasn't awkward — it was practiced. Everyone here knows the rules: the money is good because the questions are bad.",
        "You've started checking your bank account before bed. Not because you're broke — because the balance is the only thing that still feels like proof you made the right call.",
      ],
      warningSign: {
        emoji: "🚩",
        title: "Warning sign you noticed",
        detail: "A senior director told you over coffee: \"The trick here is to care about the work, not about what the work does.\" She wasn't joking. She's been here eleven years.",
      },
      selfJustification: {
        emoji: "🧠",
        title: "What you tell yourself",
        detail: "\"Every company has problems. At least here, the problems come with dental insurance and a vesting schedule. I'll leave when I have enough saved. I'll leave next year.\"",
      },
      choices: [
        {
          id: "moral-injury-accept",
          label: "Keep cashing the checks. You can live with the silence.",
          archetype: "moral-injury",
          statChanges: { money: 15, safety: 5, sanity: -25, power: -20 },
          recapText: "You stayed quiet. The money kept coming. But something shifted — you stopped reading the news about your industry, stopped answering when friends asked how work was going, stopped thinking of yourself as someone who would speak up. The golden handcuffs didn't snap shut all at once. They closed one comfortable paycheck at a time. You're safe. You're solvent. And you're not sure you'd recognize the person who walked in here six months ago.",
        },
        {
          id: "moral-injury-exit",
          label: "Start planning your exit before this place hollows you out.",
          archetype: "moral-injury",
          statChanges: { money: -20, safety: -15, sanity: 20, power: 10 },
          recapText: "You opened a private browser tab at lunch and started building a spreadsheet: savings runway, monthly burn rate, three companies you actually respect. You haven't quit yet — you're not reckless. But you've stopped pretending this is temporary discomfort. It's moral corrosion, and you can feel it in how you talk about your job at dinner. The exit plan isn't ready, but the decision is. You're leaving. The only question is whether you leave on your terms or theirs.",
        },
      ],
    },
    {
      forArchetype: "mission-driven-unstable",
      narrative: [
        "Clearpath Labs is running on fumes and conviction. The mission is still real — you believe that. But the Slack channels have a different energy now. The \"all-hands\" meetings happen weekly instead of monthly. The founder's eyes look tired. The phrases are getting familiar: \"we're being scrappy,\" \"this is what startups do,\" \"the next round will change everything.\"",
        "Your title has changed twice in six months. Not promotions — absorptions. You're doing the work of three people because the other two left and weren't replaced. The equity you were promised is technically worth something, but only if the company survives long enough to vest it. You checked the cap table last week. You wish you hadn't.",
        "Your partner asked if you were okay. You said yes. You're not sure that was true.",
      ],
      warningSign: {
        emoji: "🚩",
        title: "Warning sign you noticed",
        detail: "The Head of People quietly updated her LinkedIn headline to \"Exploring Opportunities\" last Tuesday. She hasn't told anyone. You only noticed because you've been checking.",
      },
      selfJustification: {
        emoji: "🧠",
        title: "What you tell yourself",
        detail: "\"If I leave now, I'm just another person who gave up on something that mattered. The people who stay through the hard parts are the ones who get to say they built it. I just need to hold on until the next round.\"",
      },
      choices: [
        {
          id: "mission-collapse-stay",
          label: "Ride it out. If the ship sinks, at least you went down believing in something.",
          archetype: "mission-collapse",
          statChanges: { money: -25, safety: -25, sanity: -15, power: 5 },
          recapText: "You stayed. Not because the math made sense, but because leaving felt like betrayal. The next round didn't come. The runway shrank to four months, then two. The all-hands meetings got shorter and the silences got longer. You're still here, still working weekends, still believing — but your savings are nearly gone and the equity is worth exactly what the market says a pre-revenue company with no bridge round is worth: nothing, probably. You believed in the mission. The mission didn't believe in your rent.",
        },
        {
          id: "mission-collapse-leave",
          label: "Start interviewing before the runway disappears — and your savings with it.",
          archetype: "mission-collapse",
          statChanges: { money: -10, safety: 10, sanity: 15, power: 5 },
          recapText: "You made the call. Not angrily, not dramatically — you just opened your laptop one Sunday night and started applying. It felt like giving up on something sacred. But sacred doesn't cover COBRA premiums. You gave Clearpath your best six months. The work was real. The mission was real. The money wasn't. You're not leaving because you stopped believing. You're leaving because you finally looked at the cap table, the burn rate, and your bank balance in the same browser window — and couldn't pretend they were unrelated.",
        },
      ],
    },
    {
      forArchetype: "prestige-burnout",
      narrative: [
        "Meridian Group is everything your résumé needed it to be. The brand opens doors. The work is high-profile. Your LinkedIn connections have tripled. Your parents finally understand what you do. And you haven't slept more than five hours a night in three months.",
        "The performance reviews here aren't reviews — they're rankings. Every quarter, every team, stack-ranked. The bottom 10% gets \"managed out\" with surgical politeness. Nobody calls it a PIP. They call it a \"development conversation.\" Everyone knows what it means. You're not in the bottom 10% — yet. But staying out of it requires a kind of performance that has nothing to do with your actual skills. It's about visibility, face time, and never, ever saying \"I don't have capacity.\"",
        "You canceled plans with your best friend for the third time last month. You told yourself it was temporary. You're starting to realize that \"temporary\" is just what burnout calls itself before it becomes permanent.",
      ],
      warningSign: {
        emoji: "🚩",
        title: "Warning sign you noticed",
        detail: "Your manager sent you a Slack message at 11:47 PM on a Saturday that just said \"Quick thought —\" followed by a task that took four hours. When you delivered it Sunday morning, she responded with a thumbs-up emoji. No thank you. No acknowledgment that it was the weekend.",
      },
      selfJustification: {
        emoji: "🧠",
        title: "What you tell yourself",
        detail: "\"Two years here and I can write my own ticket. Everyone knows Meridian on a résumé is a cheat code. I just need to survive long enough to collect the brand equity. Then I'll rest.\"",
      },
      choices: [
        {
          id: "burnout-spiral-grind",
          label: "Keep grinding. The résumé line is almost worth it. Almost.",
          archetype: "burnout-spiral",
          statChanges: { money: 20, safety: 0, sanity: -30, power: 10 },
          recapText: "You stayed on the treadmill. The money went up. The title got shinier. And something inside you went quiet — not calm, just... numb. You stopped noticing the late-night Slacks because they stopped feeling unusual. You stopped canceling plans because you stopped making them. Your therapist used the word \"depersonalization\" last week. You Googled it in the parking garage and sat there for twenty minutes before driving home. Meridian didn't break you. It replaced you — with a version of yourself that performs well and feels nothing.",
        },
        {
          id: "burnout-spiral-reclaim",
          label: "Set a hard boundary before this place takes the last thing you have left.",
          archetype: "burnout-spiral",
          statChanges: { money: -10, safety: -10, sanity: 25, power: -15 },
          recapText: "You drew the line. Not loudly — you just stopped answering Slack after 8 PM. You took a Saturday off and didn't apologize for it. You told your manager you wouldn't be available for the Sunday sprint. She looked at you like you'd spoken a foreign language. Your ranking slipped. Your visibility dropped. And for the first time in months, you ate dinner without your laptop open. The math is simple: Meridian will replace you in two weeks if you leave. Your nervous system will take two years to recover if you don't.",
        },
      ],
    },
  ],
};
