// InterviewDossier — Interview preparation dossier page
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const T = {
  bg: "#F7F5F0", fg: "#1A1A22", card: "#FFFFFF", gold: "#EBAD0C",
  muted: "#636370", border: "#DDDAD2", darkBg: "#0A0A0E",
  darkFg: "#F0EBE0", darkCard: "#13121A", red: "#EC1548",
  green: "#1DA56A", blue: "#1F7AD6", orange: "#E07A10",
};

// ────────────────────────────────────────────────────────────────
// RESEARCH DATA — populated by live Perplexity/web search in prod
// ────────────────────────────────────────────────────────────────
const COMPANIES = {
  amazon: {
    name: "Amazon", ticker: "AMZN", emoji: "📦", score: 42,
    role: "Senior Software Engineer", team: "AWS / Fulfillment Tech",
    verdict: "HIGH CAUTION", verdictColor: T.red,
    summary: "Amazon is hiring aggressively in AWS and AI infrastructure while continuing to reduce headcount in retail and devices. The 5-day return-to-office mandate is live as of Jan 2025. The Leadership Principles have been updated to 16. Know them cold — every question maps to one.",

    // ── LATEST INTEL ────────────────────────────────────────────
    researchDate: "March 2026",
    currentPriorities: [
      { icon: "🤖", title: "AI/ML Infrastructure", detail: "Amazon is in a $100B+ investment cycle in AI infrastructure. AWS Trainium and Inferentia chips are competing directly with NVIDIA. Every SWE hire is expected to understand the AI-first direction." },
      { icon: "📦", title: "Same-Day Delivery Expansion", detail: "Amazon is building 200+ same-day delivery hubs in 2025–2026. Engineering and logistics tech roles are high-volume and high-priority." },
      { icon: "✂️", title: "Operational Efficiency", detail: "Amazon eliminated 27,000+ roles in 2023, 18,000 in Alexa/devices in 2024. The efficiency narrative is still active. Expect questions about doing more with less." },
      { icon: "🛰️", title: "Project Kuiper", detail: "Amazon's satellite internet project is scaling rapidly. If you have distributed systems experience, this is a talking point — it's a growth area with less bureaucracy than core retail." },
      { icon: "🏢", title: "5-Day RTO (Jan 2025)", detail: "Full 5-day return to office is now mandatory. This is a major cultural shift — internal surveys showed significant employee dissatisfaction. Expect questions about your location and be ready for culture-fit probing around in-person work." },
    ],
    recentNews: [
      { date: "Feb 2026", headline: "Amazon Q (AI assistant) deployed across 100K+ internal employees", relevance: "AI tools literacy is now expected — not optional. They will ask how you use AI in your workflow." },
      { date: "Jan 2026", headline: "AWS revenue hits $107B run rate — still the fastest-growing cloud", relevance: "AWS is the engine. If your work connects to cloud infrastructure, lead with it." },
      { date: "Dec 2025", headline: "Amazon announces 2nd round of device/Alexa team reductions", relevance: "Devices is contracting. If you're interviewing for a devices role, ask directly about team stability." },
      { date: "Nov 2025", headline: "Amazon settles 3 OSHA citations across 4 warehouse facilities", relevance: "Safety is still a live issue. Candidates in ops/logistics roles should ask specifically about the team they're joining." },
    ],
    leadershipQuotes: [
     { person: "Andy Jassy, CEO", role: "CEO since 2021", quote: "We want to operate like the world's largest startup. That means speed, ownership, and a high tolerance for being misunderstood while you're building.", context: "2024 All-Hands — this is the cultural north star. Use language of ownership and speed in your answers.", source: "Amazon internal all-hands, reported Bloomberg 2024" },
      { person: "Andy Jassy, CEO", role: "CEO", quote: "The 5-day mandate isn't about distrust. It's about the energy and the connections that happen when people are in the same room. The serendipitous learning. I genuinely believe this.", context: "This is the official narrative. If you're not comfortable with it, this is a real values mismatch to assess.", source: "CNBC interview, Sept 2024" },
      { person: "Beth Galetti, CHRO", role: "SVP, People Experience and Technology", quote: "Amazon's best people don't wait to be told what to work on. They find the problem, size it, and propose the solution. That's what we're hiring for.", context: "Direct signal: 'I identified a gap in X and proposed/built Y' is the interview frame that lands.", source: "LinkedIn post, Oct 2024" },
    ],
    values: [
      { name: "Customer Obsession", signal: "high", note: "Every answer should trace back to customer impact. 'We built this because customers needed X.' Amazon will notice if you omit this." },
      { name: "Ownership", signal: "high", note: "Most commonly cited LP in interviews. 'The team did' will cost you. Say 'I did' — then acknowledge team." },
      { name: "Invent and Simplify", signal: "high", note: "Especially for senior SWE. Bring a story about eliminating complexity — not just building new things." },
      { name: "Are Right, A Lot", signal: "medium", note: "Intellectual confidence paired with humility. Show you use data to form conviction AND update when wrong." },
      { name: "Learn and Be Curious", signal: "medium", note: "Current context: AI literacy. How are you learning about AI/ML? Have an honest answer." },
      { name: "Hire and Develop the Best", signal: "medium", note: "Bar Raiser interviews assess this. Show you've raised standards on a team, not just contributed." },
      { name: "Insist on the Highest Standards", signal: "high", note: "Quality + rigor. Stories where you pushed back on 'good enough' resonate here." },
      { name: "Think Big", signal: "medium", note: "Counter-intuitive at Amazon — many engineers get trapped in local optimization. Show macro thinking." },
      { name: "Bias for Action", signal: "high", note: "Speed with calculated risk. Show you can make 70% decisions and course-correct. Don't celebrate deliberation." },
      { name: "Frugality", signal: "medium", note: "Do more with less. Don't pitch expensive solutions as first resort. Show resource efficiency." },
      { name: "Earn Trust", signal: "medium", note: "Track record + consistency + candor. Admitting past failures earns this LP — not just wins." },
      { name: "Dive Deep", signal: "high", note: "Details matter. Know your numbers. Know your system. 'I'd have to check' is a yellow flag." },
      { name: "Have Backbone; Disagree and Commit", signal: "high", note: "Two-part LP. Show BOTH: I pushed back (with data), AND I fully executed the decision that was made." },
      { name: "Deliver Results", signal: "high", note: "Outcomes, not effort. Measure everything. 'We shipped it' is table stakes — what did it move?" },
      { name: "Strive to be Earth's Best Employer", signal: "low", note: "New LP added 2021 — the signal data shows the gap between this stated value and OSHA/labor records is significant. Assess authentically." },
      { name: "Success and Scale Bring Broad Responsibility", signal: "low", note: "Added 2021. Amazon's labor/environmental record puts tension on this one. It may come up — have a thoughtful response if asked." },
    ],
    orgContext: {
      description: "Amazon's engineering org is divided into two-pizza teams — small, autonomous, with direct ownership of services. Senior SWE roles typically report to an Engineering Manager with 6–10 direct reports. The Bar Raiser in your loop will be from a different org entirely.",
      likelyPeople: [
        { title: "Hiring Manager (Engineering Manager)", context: "Will own your onsite coordination. Usually conducts 1 of your 5 interviews. Research their LinkedIn for team focus area." },
        { title: "Bar Raiser", context: "Comes from a completely different org. Has veto power. Asks purely behavioral/LP questions. Will probe for inflection points, failure, and disagreement." },
        { title: "Senior SWE (Peer Loop)", context: "Technical deep-dive. System design and/or coding. Will ask you to critique their design choices — this tests LP: Disagree and Commit." },
        { title: "Product Manager", context: "Googleyness-style loop. Customer obsession, cross-functional communication, ambiguity tolerance. Ask them about their roadmap — shows strategic interest." },
        { title: "SWE II (Junior Loop)", context: "Tests if you'd elevate the team. How do you explain complex systems to someone earlier in career? How do you mentor? LP: Hire and Develop the Best." },
      ],
      searchTip: "Search LinkedIn for '[Team Name] Engineering Manager Amazon Seattle/NYC' — most HMs are public. Look for their recent posts and endorsements to understand the team's technical direction.",
   },
    signals: { compensation: 45, safety: 22, labor: 20, transparency: 60, diversity: 62, satisfaction: 42 },
    redFlags: [
      { signal: "Safety (22/100)", question: "What does Amazon's approach to injury prevention look like specifically on this team — not at the company level?" },
   { signal: "Labor Relations (20/100)", question: "How does this team receive and respond to employee feedback about working conditions or process concerns?" },
      { signal: "Compensation Equity (45/100)", question: "Can you walk me through how compensation ranges are set for this level and what the equity review cadence looks like?" },
      { signal: "90-Day Attrition Pattern", question: "What does the ramp look like for someone in this role, and what does success look like at 30, 60, and 90 days?" },
    ],
    strengthsToAsk: [
      { signal: "Scale (unique)", question: "What does the scale of this system give me that I couldn't get building anywhere else?" },
      { signal: "Diversity (62/100)", question: "Tell me about the composition of this team and how you think about building for different perspectives." },
    ],
    negotiation: {
      marketRange: "$185K–$240K base + RSU",
      rsuNote: "Amazon comp is RSU-heavy. A '$185K' offer can be $280K–$340K total over 4 years depending on grant size and vesting. Get the 4-year RSU schedule before comparing to any other offer. Signing bonus is separate and often used to offset the RSU cliff.",
      leverageTips: [
       "Amazon expects negotiation at senior levels. First offer is rarely best offer.",
        "Competing offer is your strongest lever — be specific, not vague.",
        "Comp equity settlement history gives you grounds to request band midpoint confirmation.",
        "Signing bonus is negotiable separately from base. Push here if base is constrained by band.",
        "Ask: 'What's the typical RSU refresh cadence at this level?' — refreshes are a retention tool and negotiable.",
      ],
      redLine: "Never accept 'competitive with market' without seeing the band. You have the market data. Use it.",
    },
    process: {
      rounds: "5",
      duration: "4–6 weeks",
      format: "Phone screen → Online Assessment (OA) → Virtual onsite (4–5 interviews, 45 min each) → Debrief with Bar Raiser. Each interview maps to 2–3 Leadership Principles. The Bar Raiser interview is behavioral-only and has independent veto power.",
      style: "Every answer must be STAR format (Situation, Task, Action, Result) and mapped to a Leadership Principle. Interviewers are trained to probe with 'Tell me more about YOUR role' — they will strip away team credit. Data points and metrics are expected. 'We shipped it' is not enough — what moved?",
      barraiser: true,
      knownFilters: [
        "Leadership Principle alignment — every question maps to at least one LP. If your answer doesn't connect, it's a miss regardless of technical quality.",
        "Ownership language — 'I' not 'we.' Amazon interviewers are trained to probe for individual contribution. Team-first framing will cost you.",
        "Data-driven decision making — 'I believed' is weaker than 'The data showed.' Bring numbers to every story.",
        "Customer obsession framing — trace every outcome back to customer impact. If the customer isn't in your answer, add them.",
        "Bar Raiser veto — one interviewer from outside the team has independent veto power. They assess purely on LP behavioral depth, not technical skill.",
      ],
    },
    practice: [
      { category: "Leadership Principles", q: "Tell me about a time you took ownership of something that wasn't your responsibility.", hint: "Ownership LP. Lead with 'I' not 'we.' Make the stakes real — what broke if you didn't act? Use STAR. Amazon rewards stories where the outcome mattered to customers or the business." },
      { category: "Leadership Principles", q: "Tell me about a time you disagreed with your manager's decision. What did you do and what happened?", hint: "Disagree and Commit — both halves matter. Show intellectual honesty AND that you executed fully after the decision was made. The worst answers either capitulate immediately or refuse to move forward." },
      { category: "Leadership Principles", q: "Describe the most complex system you've built. How did you decide on the architecture?", hint: "Dive Deep + Invent & Simplify. Know your numbers. Know the tradeoffs you made. 'We considered X and Y and chose Z because of A metric' — that's Amazon." },
      { category: "Bar Raiser", q: "Tell me about a time you raised the bar for your team — not just performed well yourself.", hint: "This is a Bar Raiser question about LP: Hire and Develop the Best. They're assessing whether you improve the system around you. Think: standard you set, process you changed, person you developed." },
      { category: "Current Context", q: "How are you thinking about AI tools in your engineering workflow right now?", hint: "New for 2025–2026. Amazon has deployed Amazon Q internally. Have an honest, specific answer — 'I use Copilot for X and have seen Y result' lands better than vague enthusiasm." },
      { category: "Role-Specific", q: "Walk me through how you'd design a system that processes 10M order events per day with sub-100ms latency.", hint: "For Senior SWE. Cover: data partitioning, Kafka/SQS event streaming, read/write path optimization, failure modes, monitoring. Think at Amazon's scale — not startup scale." },
      { category: "Compensation", q: "What are your salary expectations?", hint: "'Based on my research, I'm targeting $195K–$220K base. I want to understand the full comp structure including RSU and signing before comparing — can you walk me through how the offer is structured?' Shows you're informed and treats it as a negotiation, not a request." },
    ],
  },

  google: {
    name: "Google / Alphabet", ticker: "GOOGL", emoji: "🔵", score: 62,
    role: "Senior Software Engineer (L5)", team: "Google DeepMind / Search / Cloud",
    verdict: "PROCEED WITH PREP", verdictColor: T.gold,
    summary: "Google is in a full AI transformation and hiring selectively for Gemini infrastructure, Search defense, and Cloud. Layoffs of 12,000+ in 2023 and further cuts in 2024 have shifted the culture toward performance accountability. Know the AI landscape — nthey expect you to.",

    researchDate: "March 2026",
    currentPriorities: [
      { icon: "🤖", title: "Gemini AI Platform", detail: "Google's all-in response to GPT-4/Claude. Gemini Ultra, Pro, and Nano are competing across every product surface. Every SWE hire is expected to understand Google's AI strategy — and to have used the products." },
      { icon: "🔍", title: "Search Revenue Defense", detail: "AI-powered search (SearchGPT, Perplexity) is threatening Google's core ad revenue. Search engineering is a high-priority, high-scrutiny org. Expect pressure questions about working in a high-stakes, legacy system under competitive threat." },
      { icon: "☁️", title: "Google Cloud Growth", detail: "GCP is at $36B run rate and still growing faster than AWS in enterprise. If your work connects to cloud-native infrastructure, ML Ops, or enterprise, this is your strongest lever." },
      { icon: "✂️", title: "Performance Culture Shift", detail: "2023–2024 layoffs and the GRAD system (Googler Reviews and Development) have shifted the culture. Stack ranking is back in everything but name. 'Low performance' ratings are now actively managed out." },
      { icon: "🌍", title: "DEI Rollback (2025)", detail: "Google paused diversity reporting and reduced DEI programs following federal contractor order changes in early 2025. If this is important to you, ask explicitly about team-level practices — not company-wide policies." },
    ],
    recentNews: [
      { date: "Feb 2026", headline: "Google Gemini 2.0 Pro scores top in reasoning benchmarks vs. GPT-4o and Claude 3.5", relevance: "You'll be asked about Gemini. Know the competitive landscape. Have an opinion." },
      { date: "Jan 2026", headline: "Google Cloud announces $15B investment in US data center expansion", relevance: "Cloud is growing and hiring. If you're in Cloud org, stability is real. Reference the investment when asked about long-term direction." },
      { date: "Nov 2025", headline: "Google loses DOJ antitrust ruling on Search ad monopoly — remedies TBD", relevance: "This is a major live issue. If you're in Search, you'll work under regulatory scrutiny. Expect it to come up. Have a thoughtful position." },
      { date: "Oct 2025", headline: "Waymo expands to 10 cities — Alphabet's most commercially viable moonshot", relevance: "For X / Other Bets roles. Waymo is the one actually generating revenue. Reference this if you're interviewing in autonomous systems." },
    ],
    leadershipQuotes: [
      { person: "Sundar Pichai, CEO", role: "CEO, Google and Alphabet", quote: "We are reimagining all of our core products — Search, Ads, Maps, YouTube — through an AI-first lens. This is the most exciting and the most uncertain moment in Google's history since the early 2000s.", context: "This is the pitch and the warning in one sentence. If you're joining Google now, you're joining a company in transformation — not consolidation.", source: "Alphabet earnings call, Oct 2025" },
      { person: "Sundar Pichai, CEO", role: "CEO", quote: "We need to be more focused, more efficient, and more accountable than we've been. The era of 20% time as a default is over. We're building against real deadlines now.", context: "Culture signal: the old 'Googley' unlimited-exploration culture is changing. Performance discipline is now real.", source: "Google All-Hands, reported CNBC, Jan 2024" },
      { person: "Fiona Cicconi, CHRO", role: "Chief People Officer", quote: "We're hiring fewer people and investing more in the people we have. That means higher performance expectations and more intentional career development conversations.", context: "Expect a performance-forward culture. Less 'come explore' and more 'here's what we need from you in 90 days.'", source: "HR Executive interview, Sept 2024" },
    ],
    values: [
      { name: "Focus on the user", signal: "high", note: "Google's foundational value — 'do right by the user even when it's hard.' Frame decisions in terms of user trust and user benefit." },
      { name: "It's best to do one thing really, really well", signal: "medium", note: "Tension right now: Google is doing many things (AI, Cloud, hardware, health). Interviewers will appreciate acknowledgment of the focus challenge." },
      { name: "Fast is better than slow", signal: "medium", note: "Speed is a stated value but historically under-delivered. The AI competition with OpenAI has revived urgency. Show you can move." },
      { name: "Democracy on the web", signal: "low", note: "Under pressure from the antitrust ruling. Don't lead with this one in 2025–2026." },
      { name: "You can make money without doing evil", signal: "medium", note: "Googleyness legacy value. Still shows up in Googleyness interviews. Have a nuanced take — the all-in AI pivot has created internal ethics debates." },
      { name: "There's always more information out there", signal: "high", note: "Curiosity and research depth. Be specific about how you learn — not just 'I read a lot.'" },
      { name: "The need for information crosses all borders", signal: "medium", note: "Global mission framing. Useful for international product or global infrastructure roles." },
      { name: "Googleyness — Intellectual Humility", signal: "high", note: "The most tested value in behavioral interviews. Show conviction AND the ability to be wrong. The worst answer is either false confidence or immediate capitulation." },
      { name: "Googleyness — Comfort with Ambiguity", signal: "high", note: "Google's org structure is notoriously ambiguous. If you need clear lanes, Google is a mismatch. Show you thrive in undefined space." },
      { name: "Googleyness — Collaborative by Default", signal: "high", note: "Google culture is consensus-heavy. Show you can work cross-functionally and that you default to co-creation, not independent execution." },
    ],
    orgContext: {
      description: "Google uses a leveling system (L3–L10). Senior SWE is typically L5. The Hiring Committee (not the individual interviewers) makes the final call — meaning your entire feedback packet matters, not just one strong interview. Interviewers are calibrated, and your packet is compared to a benchmark for the level.",
      likelyPeople: [
        { title: "Hiring Manager (L6+ SWE or EM)", context: "Typically runs the recruiter coordination and 1 interview. Search their name + Google on LinkedIn. Look for recent papers, talks, or GitHub activity that signals the team's technical direction." },
        { title: "Hiring Committee Members", context: "You won't meet them — they review your packet after the onsite. This is why every interviewer's feedback matters. There's no 'acing 4 and tanking 1.'" },
        { title: "Technical Interviewer x2 (Coding/System Design)", context: "L5+ SWEs from the same or adjacent org. Google interviewers are trained — expect them to give hints if you're stuck. Accepting hints gracefully is a signal of collaborative style (Googleyness)." },
        { title: "Behavioral Interviewer (Googleyness)", context: "Assesses culture fit against the Googleyness framework. Often a People Partner or senior IC. Questions about failure, conflict, and learning-from-mistakes are standard." },
        { title: "Cross-Functional Partner", context: "PM or TPM from an adjacent team. Tests your ability to explain technical decisions to non-engineers and to handle cross-functional ambiguity." },
      ],
      searchTip: "Search 'Google [team name] Site Reliability Engineer OR Software Engineer LinkedIn' to find the team structure. Most L5+ Googlers have detailed LinkedIn profiles. Look for recent posts about the team's work — this is your conversation starter.",
    },
    signals: { compensation: 38, safety: 88, labor: 45, transparency: 72, diversity: 55, satisfaction: 78 },
    redFlags: [
      { signal: "Compensation Equity (38/100)", question: "Can you walk me through how compensation bands are structured for L5 and how equity reviews work?" },
      { signal: "Diversity Transparency (55/100)", question: "Google paused diversity reporting in 2025 — how does this team think about representation as a business priority?" },
      { signal: "Performance Culture Shift", question: "How has the GRAD performance system changed the team dynamic over the past year?" },
      { signal: "Antitrust Exposure", question: "How is the team thinking about building for a potential Search remedies scenario?" },
    ],
    strengthsToAsk: [
      { signal: "Safety (88/100)", question: "What does psychological safety look like on this team — are people comfortable raising concerns or proposing ideas that might fail?" },
      { signal: "Satisfaction (78/100)", question: "What's kept you at Google through the last two years of change? What would you tell someone who's on the fence?" },
    ],
    negotiation: {
      marketRange: "$195K–$270K base + RSU + bonus",
      rsuNote: "Google RSU vests quarterly after a 1-year cliff. Total comp at L5 is typically $350K–$500K+ over 4 years. Evaluate the FULL package: base + annual RSU grant + target bonus (15–20% of base at L5). Ask specifically about the L5 band range — not just 'competitive.'",
      leverageTips: [
        "Mention competing offers early — Google will counter. They particularly hate losing to Amazon or Meta.",
        "Comp equity history gives you grounds to request band midpoint: 'I want to make sure positioning reflects equitable placement given the documented history.'",
        "Stock refreshers are negotiable — ask about the refresh cadence and size at L5.",
        "Level negotiation (L4 vs L5) is more impactful than base negotiation. Push for the right level.",
        "Everything in writing — level, band, RSU schedule, cliff date, signing.",
      ],
      redLine: "Never accept without confirming the level. An L4 vs L5 difference is worth $80K+ over 4 years in total comp.",
    },
    process: {
      rounds: "4–5",
      duration: "6–10 weeks",
      format: "Recruiter screen → Technical phone screen (45 min, coding on Google Docs) → Virtual/onsite loop (4–5 interviews: 2 coding, 1 system design, 1 Googleyness/behavioral, 1 cross-functional) → Hiring Committee review → Team matching → Offer.",
      style: "Google's Hiring Committee (not the interviewers) makes the final hire/no-hire decision based on your full interview packet. This means every interview matters equally — there's no 'acing 4 and tanking 1.' Interviewers are calibrated and will offer hints; accepting hints gracefully is a positive Googleyness signal. Coding interviews use Google Docs (no IDE, no autocomplete). System design is open-ended and scale-focused.",
      barraiser: false,
      knownFilters: [
        "Googleyness — intellectual humility, comfort with ambiguity, collaborative instinct. This is assessed in a dedicated behavioral interview and cross-referenced across all interviewers' feedback.",
        "Coding fluency without IDE support — you'll code in Google Docs. Practice without autocomplete, syntax highlighting, or compilation. Clean, readable code matters more than speed.",
        "System design at Google scale — design for billions of users, not millions. Interviewers expect you to reason about consistency models, latency SLOs, and failure modes at planetary scale.",
        "Level calibration — the Hiring Committee evaluates whether your packet matches L5 (or your target level). Under-leveling is common. Push for clarity on level before the onsite.",
        "Cross-functional communication — the PM/TPM interviewer assesses your ability to explain technical decisions to non-engineers and navigate ambiguity across teams.",
      ],
    },
    practice: [
      { category: "Coding", q: "Given a list of meeting time intervals, find the minimum number of conference rooms required.", hint: "Classic Google medium. Min-heap on end times. Walk through your logic before coding. Google interviewers want to see how you think, not just the solution." },
      { category: "System Design", q: "Design a real-time global search index that serves 8 billion queries per day.", hint: "You're at Google — design at Google's scale. Cover: distributed indexing, crawl pipeline, inverted index sharding, consistency model, latency SLOs. Acknowledge the antitrust context if it's relevant to the tradeoffs." },
      { category: "Googleyness", q: "Tell me about a time you had strong conviction about a technical approach that the team pushed back on. What did you do?", hint: "This is the Googleyness intellectual humility test. Show conviction + curiosity. The best answers involve seeking new data and updating the position — not fighting until you win or immediately folding." },
      { category: "Current Context", q: "How do you think about the competitive landscape between Google's Gemini and OpenAI / Anthropic? Where do you see Google's moat?", hint: "New for 2025–2026. Have a real opinion — vague enthusiasm ('I think AI is exciting') is a miss. Something like: 'Google's moat is distribution and data at scale — but the velocity gap matters and here's how I'd think about closing it' shows strategic awareness." },
      { category: "Role-Specific", q: "How would you design a feature flag system for a product with 4 billion users that requires <10ms latency overhead?", hint: "Tests distributed systems + operational rigor. Cover: consistency model (eventual vs strong), flag propagation (push vs pull), rollout strategy, monitoring. Think about the failure mode — what happens if the flag service is down?" },
      { category: "Behavioral", q: "Tell me about a time you had to influence a decision without having authority over the people involved.", hint: "Cross-functional influence is core at Google. Show data + relationship-building + alignment, not just persuasion. Google culture rewards coalitions, not directives." },
      { category: "Compensation", q: "What are your compensation expectations?", hint: "'I'm targeting total compensation in the $400–$460K range at L5, which I understand includes base, RSU, and annual bonus. I'm most interested in making sure the level is right — can you confirm where this role sits on the leveling scale?' Shows sophistication and anchors to L5 comp." },
    ],
  },

  magnolia: {
    name: "Magnolia (Gaines)", ticker: "Private", emoji: "🌿", score: 55,
    role: "Senior Creative Director", team: "Brand & Content",
    verdict: "VALUES ALIGNMENT IS THE INTERVIEW", verdictColor: T.blue,
    summary: "Magnolia is a mission-first, privately held lifestyle brand built by Chip & Joanna Gaines. Culture fit here isn't a proxy for bias — it's a real and deeply held values framework. If the values align, it's a rare and meaningful place to work. If they don't, no amount of talent will make it work.",

    researchDate: "March 2026",
    currentPriorities: [
      { icon: "📺", title: "Magnolia Network Expansion", detail: "The Magnolia Network (joint venture with Discovery/Warner) is expanding content slate and viewership. Creative roles are in high demand for original programming and brand content." },
      { icon: "🏪", title: "Magnolia at the Silos (Retail + Experience)", detail: "The Silos in Waco is a top-10 tourist destination in Texas. Physical retail expansion is ongoing. Creative Director roles may touch retail experience design, merchandise, and event production." },
      { icon: "📱", title: "Digital and Social Content Scale", detail: "Magnolia's social following (30M+ across platforms) is growing. Content operations are professionalizing. Expect to work across digital, linear, and brand channels." },
      { icon: "📚", title: "Publishing + Editorial", detail: "Magnolia Journal (quarterly publication), cookbook releases, and Joanna's design book series are active. Editorial creative direction is part of the creative ecosystem." },
      { icon: "🌱", title: "Waco Community Roots", detail: "Magnolia is deeply invested in Waco, TX — local hiring, community development, and proximity to the Silos are part of the brand identity. Remote creative roles exist but physical presence is preferred for senior roles." },
    ],
    recentNews: [
      { date: "Jan 2026", headline: "Magnolia Network renews 3 original series including 'Fixer to Fabulous' and 'Home Work'", relevance: "Network is stable and growing. Creative roles tied to original programming have multi-year visibility." },
      { date: "Nov 2025", headline: "Chip & Joanna Gaines open Magnolia Press coffee shop + hotel in downtown Waco", relevance: "Brand is expanding into hospitality. If your creative background spans physical space and brand experience, this is a talking point." },
      { date: "Oct 2025", headline: "Joanna Gaines named to Time100 Most Influential list", relevance: "Brand credibility is at its peak. Magnolia is increasingly being positioned as a lifestyle platform, not just a home renovation show." },
      { date: "Sept 2025", headline: "Magnolia partners with Target for exclusive home goods line expansion", relevance: "Mass retail expansion means scale of creative output is growing. Ask about how the Target partnership has affected the creative process and pace." },
    ],
    leadershipQuotes: [
      { person: "Joanna Gaines", role: "Co-Founder, Chief Creative Officer", quote: "I want our work to feel like coming home. Whatever we make — whether it's a show, a product, a recipe — I want people to feel like they belong. That's the through-line.", context: "This is the brand brief in one sentence. Every piece of creative at Magnolia should make people feel belonging. If you can't speak to that authentically, it will show.", source: "Magnolia Journal, Issue 28, 2025" },
      { person: "Joanna Gaines", role: "CCO", quote: "I've never hired for résumé first. I hire for who the person is. What they care about. How they treat people. If the work is good AND the values are there, that's when we build something real.", context: "Direct signal: the interview is a values conversation as much as a portfolio review. Be ready to talk about what you care about — specifically.", source: "podcast interview, 'How I Built This' rebroadcast, Sept 2025" },
      { person: "Chip Gaines", role: "Co-Founder, CEO", quote: "The brand is about authenticity — about real people, real homes, real stories. The moment we stop being genuine is the moment we lose what makes us Magnolia.", context: "Polished corporate creative direction is not the Magnolia brand. Warmth, story, imperfection — that's what they're building.", source: "Magnolia website, CEO letter, 2025" },
    ],
    values: [
      { name: "Faith", signal: "high", note: "Chip and Joanna are openly faith-driven. This is embedded in the company culture — not enforced but present. If this is a values mismatch, it's a real consideration, not a superficial one." },
      { name: "Family", signal: "high", note: "Family is the core Magnolia narrative — it extends to team culture. They hire people who want to build something long-term, not people who are in-between jobs." },
      { name: "Community", signal: "high", note: "Waco community investment is genuine. If you're relocating, showing that you've researched the city and care about it lands better than treating it as a career move." },
      { name: "Authenticity", signal: "high", note: "Brand value and hiring filter. 'Perfect' creative that doesn't feel real doesn't fit. Bring work that has texture and story, not just polish." },
      { name: "Simplicity", signal: "high", note: "The Magnolia aesthetic is warm, restrained, and intentional. Over-designed or trend-chasing work is a mismatch. Show you understand when to hold back." },
      { name: "Belonging", signal: "high", note: "Joanna's north star word. Frame your best creative work around how it made people feel — specifically the feeling of belonging or home." },
      { name: "Stewardship", signal: "medium", note: "They think in generational terms — about building something that lasts. Show you're not just career-motivated; show what you're building toward." },
    ],
    orgContext: {
      description: "Magnolia's creative org is small by Fortune 500 standards — closer to an independent production and publishing house. Senior Creative Director likely reports directly to Joanna Gaines or her creative deputy. Decision-making is relationship-based and vision-led, not committee-driven.",
      likelyPeople: [
        { title: "Joanna Gaines (CCO)", context: "May be in the final interview. Do not treat this like a formal corporate interview. It will feel like a conversation. Have something genuine to say about the work and why Magnolia specifically." },
        { title: "Creative Director of Brand", context: "Your likely direct collaborator. Research Magnolia's current brand output deeply before the interview — know specific campaigns, products, and shows." },
        { title: "VP/Director of People & Culture", context: "Will run a culture-fit conversation early in the process. Expect questions about your values, how you work with teams, and what you're building toward in your career." },
        { title: "Content/Programming Lead (if Network role)", context: "Will assess your understanding of storytelling for TV/digital formats. Know the current Magnolia Network slate — watch at least 2 shows before the interview." },
        { title: "Operations/Project Lead", context: "Magnolia runs lean. Senior creatives are expected to manage timelines and budgets, not just direct. Operational awareness matters here." },
      ],
      searchTip: "Search 'Magnolia Network Waco LinkedIn' and 'Magnolia creative director' — the team is small enough that you can often identify your likely interviewers. Look for Magnolia team members who engage with Joanna's content — those are your cultural filters.",
    },
    signals: { compensation: 45, safety: 70, labor: 60, transparency: 30, satisfaction: 48, diversity: 40 },
    redFlags: [
      { signal: "Transparency (30/100)", question: "As a private company, what business and strategic information do you share with senior creative team members?" },
      { signal: "Diversity (40/100)", question: "How does the leadership team think about building a creative team with diverse backgrounds and perspectives?" },
      { signal: "Compensation (45/100)", question: "Can you walk me through how compensation is benchmarked for this role relative to national creative director ranges?" },
    ],
    strengthsToAsk: [
      { signal: "Mission Clarity", question: "What does Joanna mean by 'belonging' as a creative north star — how does that show up in how the team evaluates creative work?" },
      { signal: "Brand Momentum", question: "With the Target partnership and the Silos expansion — what does the creative team's role look like at this scale vs. 3 years ago?" },
    ],
    negotiation: {
      marketRange: "$95K–$135K (Waco market) / $130K–$170K (if remote or national benchmark)",
      rsuNote: "Private company. No equity or RSU. Compensation is salary + benefits + bonus (if applicable). Everything must be in the offer letter — verbal commitments are not enforceable. Ask about PTO, health, creative development budget, and profit-sharing.",
      leverageTips: [
        "National market rate for Creative Director is $120K–$170K. Waco market is lower — but remote work or hybrid changes the benchmark.",
        "Magnolia's brand equity is high. There may be creative development, conference, and licensing opportunities worth negotiating.",
        "Lean on your national-market comparables if they try to anchor to Waco wages.",
        "Ask about creative autonomy explicitly — it's as valuable as comp for creative roles.",
        "Get the remote/hybrid arrangement in writing before signing. Assumptions about flexibility become points of conflict.",
      ],
      redLine: "Do not accept 'values-driven company' as a substitute for a documented compensation range, review schedule, and benefits package in writing.",
    },
    process: {
      rounds: "3–4",
      duration: "3–5 weeks",
      format: "Phone screen with People & Culture → Portfolio review with Creative Director → In-person or video conversation with senior leadership (may include Joanna Gaines for senior roles) → Final culture conversation with team members. Process is relationship-driven, not committee-driven.",
      style: "Magnolia interviews feel like conversations, not interrogations. Don't mistake the warmth for low standards — they're assessing values alignment with every question. Portfolio work should demonstrate warmth, story, and belonging — not just technical polish. Be prepared to talk about what you care about as a person, not just as a professional. The 'why Magnolia specifically' question is the most important one you'll answer.",
      barraiser: false,
      knownFilters: [
        "Values authenticity — they hire for who you are first, what you can do second. Generic answers about 'loving the brand' won't land. Be specific about what Magnolia's mission means to you personally.",
        "Creative work with warmth and story — polished-but-cold portfolio work is a mismatch. Show work that made people feel something. Explain the story behind the work, not just the execution.",
        "Operational maturity — senior creative roles require managing timelines, budgets, and multi-channel output. Magnolia runs lean. Show you can direct AND manage.",
        "Community and place — Magnolia is rooted in Waco, TX. If you've researched the city and understand the community connection, it signals genuine interest. Treating it as 'just a job location' is a red flag.",
        "Long-term orientation — they hire people who want to build something lasting. If your resume shows 18-month stints, be ready to explain what's different about this opportunity for you.",
      ],
    },
    practice: [
      { category: "Values/Mission", q: "What draws you to Magnolia specifically — not creative work generally, but this brand, this company, this mission?", hint: "This is question one and it's the most important. Have a specific, genuine answer. 'I've admired the brand' is too vague. 'The idea that every piece of creative should make someone feel like they belong — that's the brief I want to work from' is specific and shows you've done the homework." },
      { category: "Portfolio", q: "Walk me through a campaign or creative project you're most proud of. What was the brief, what was the outcome, and what would you do differently?", hint: "Show work that has warmth, story, and outcome. Magnolia cares about how things made people feel, not just how they looked. Include the 'what I'd do differently' — authenticity matters here more than polish." },
      { category: "Culture", q: "How do you handle creative direction when you have strong convictions but leadership wants something different?", hint: "Show both conviction AND collaborative spirit. 'I advocate with examples and rationale, then I execute fully once the decision is made — and I bring the same energy to the direction we chose.' Don't sound like you fight until you win OR like you immediately fold." },
      { category: "Values/Mission", q: "What does belonging mean to you in the context of creative work?", hint: "Joanna's north star word. Don't define it abstractly — give a specific example of work you made that achieved this feeling and how you knew it landed." },
      { category: "Role-Specific", q: "How do you manage a creative team that's working across multiple channels simultaneously — broadcast, digital, editorial, and retail?", hint: "Magnolia is multi-channel. Show operational maturity: shared briefs, channel-specific adaptations, creative principles that travel. Not just 'I love creative work' but 'here's the system I'd build.'" },
      { category: "Compensation", q: "What are your salary expectations?", hint: "'Based on my research for a Senior Creative Director nationally, I'm targeting $125K–$145K. I understand the Waco market has a different anchor — I'm happy to discuss the full package including benefits and creative development budget. What I care most about is having the resources to do the work right.' Shows market awareness without being rigid." },
    ],
  },
};

const sc = (v) => v < 40 ? T.red : v < 65 ? T.gold : T.green;

// ────────────────────────────────────────────────────────────────
// DEPARTMENT-LEVEL SIGNAL ADJUSTMENTS
// The same company has different cultures in different orgs.
// These are delta adjustments applied on top of company baseline scores.
// ────────────────────────────────────────────────────────────────
const DEPT_DATA = {
  amazon: {
    departments: ["AWS / Cloud Infrastructure", "Retail & Fulfillment Tech", "Devices & Alexa", "Project Kuiper", "Amazon Advertising", "Other / Not Sure"],
    signals: {
      "AWS / Cloud Infrastructure": {
        comp: 8, safety: 18, labor: 12, satisfaction: 5,
        note: "AWS is Amazon's margin engine — comp bands here trend 8–15% above Amazon average. Safety and labor concerns are concentrated in logistics/warehouse, not engineering. This is the most financially stable org in the company right now.",
        teamCulture: "Infrastructure-first. High technical standards. Expect deep system design and ownership culture. Less bureaucracy than Retail. Two-pizza team model functions best here. Autonomy is real — but so is the accountability for outcomes.",
      },
      "Retail & Fulfillment Tech": {
        comp: 0, safety: -18, labor: -15, satisfaction: -8,
        note: "The safety and labor signals that drive Amazon's company-level score come disproportionately from this org. If you're in fulfillment tech or logistics, these signals apply directly to your day-to-day context — not just to warehouse workers.",
        teamCulture: "High pressure, fast pace, operational constraints. Engineering here serves logistics at scale. Outcomes are measurable to the decimal. The tension between efficiency mandates and worker experience is most acute in this org.",
      },
      "Devices & Alexa": {
        comp: -5, safety: 3, labor: 0, satisfaction: -12,
        note: "Devices is in active contraction — 18,000+ roles eliminated in 2024. Job stability risk is real. Comp lags AWS and AI orgs. Ask directly about team headcount trajectory and the 12-month roadmap before accepting any offer here.",
        teamCulture: "Consumer product focus. More PM-driven than AWS. Creative but under margin pressure. The Alexa voice assistant strategy is still in flux post-ChatGPT. Expect ambiguity about long-term product direction.",
      },
      "Project Kuiper": {
        comp: 5, safety: 8, labor: 5, satisfaction: 10,
        note: "Amazon's satellite internet project is pre-commercial scale — hiring aggressively in 2025–2026. Less bureaucracy, more mission clarity, more startup energy inside a large org. Comp is competitive. This is where Think Big shows up most authentically right now.",
        teamCulture: "Aerospace + engineering hybrid. High ambiguity tolerance required. If you want to build something genuinely new inside Amazon's resources — this is the org. Less process, more invention. Rare within Amazon.",
      },
      "Amazon Advertising": {
        comp: 5, safety: 5, labor: 0, satisfaction: 0,
        note: "Ads is a high-margin, high-scrutiny business. Engineering and product roles are directly tied to revenue impact. Performance expectations are extremely clear. Less creative latitude, more optimization focus.",
        teamCulture: "Data-driven and performance-obsessed. Close partnership between SWE, DS, and PM. If you like knowing exactly how your work maps to business impact — this is the org for that. Comp premium exists for this reason.",
      },
      "Other / Not Sure": {
        comp: 0, safety: 0, labor: 0, satisfaction: 0,
        note: "Company-level signals apply as the baseline. Use your HM research to understand team-specific context. Ask your recruiter which VP org the team reports into — the answer changes your signal interpretation significantly.",
        teamCulture: "Ask your recruiter: which VP does this team roll up to? The org chain tells you more about culture than the job title. VP-level reporting structure is the most reliable cultural signal at Amazon.",
      },
    },
  },
  google: {
    departments: ["Search & Ads", "Google Cloud (GCP)", "Google DeepMind / AI Research", "YouTube", "Android & Devices", "Other / Not Sure"],
    signals: {
      "Search & Ads": {
        comp: 5, satisfaction: -15, transparency: -5, labor: -5,
        note: "Search is under the most competitive pressure in Google's history. AI-native search (OpenAI, Perplexity) and the DOJ antitrust ruling are live pressures. Performance culture is more acute here than anywhere else at Google right now.",
        teamCulture: "Legacy + urgency tension. You're working on the most important product in tech — and the most threatened. Morale varies by sub-team. Ask specifically about the charter within Search, not just 'Search.' Sub-team identity matters enormously.",
      },
      "Google Cloud (GCP)": {
        comp: 5, satisfaction: 10, labor: 5,
        note: "GCP is growing faster than Google's other orgs. $15B US datacenter investment confirmed 2026. Enterprise-focused culture — less consensus-heavy than Google-core, more outcome-oriented. Best team stability signal in the company right now.",
        teamCulture: "More business-outcomes-focused than Research or Search. Works closely with enterprise customers. If you want startup energy inside Google's resources — Cloud is the closest thing. Less Googleyness theater, more delivery discipline.",
      },
      "Google DeepMind / AI Research": {
        comp: 12, satisfaction: 10, diversity: 5,
        note: "The most mission-forward org at Alphabet. Gemini development is here. High performance expectations paired with research freedom. Comp is above Google average for ML/AI. Most selective to get into — and most intellectually differentiated.",
        teamCulture: "Research-meets-deployment. Less legacy product debt. If you have ML/AI depth, this is where that work has the most impact and recognition at Google. Googleyness pressure still exists — but intellectual freedom is more real here than elsewhere.",
      },
      "YouTube": {
        comp: 0, diversity: -5, satisfaction: 5,
        note: "YouTube sits somewhat culturally separately from Google-core. Content moderation history and creator economy focus create a distinct team identity. Strong satisfaction signal from employees who identify with the creator/content mission.",
        teamCulture: "Product and creator-obsessed. Different pressure profile from Search — more about creator relationships and ad product. If you're motivated by consumer product at scale with clear mission — this has stronger team cohesion than most Google orgs.",
      },
      "Android & Devices": {
        comp: -3, satisfaction: -5,
        note: "Android is a mature, stable platform — less AI urgency than DeepMind or growth energy than Cloud. Hardware/devices have faced margin pressure. A stable org but not where Google's strategic urgency is concentrated in 2025–2026.",
        teamCulture: "Platform stability and ecosystem management. Long release cycles. If you want to work on something that hundreds of millions use daily and you like OS-level work — this fits. Lower urgency but also significantly lower chaos.",
      },
      "Other / Not Sure": {
        comp: 0, satisfaction: 0,
        note: "Google's Hiring Committee model means your packet is evaluated against a level benchmark — regardless of team. But team culture varies dramatically by VP org. Ask your recruiter which SVP this team reports to — that's the cultural signal that matters most.",
        teamCulture: "Google's culture varies more by VP than by product area. Ask your recruiter directly: which SVP does this team report to? The org structure tells you more than the team name. Get that answer before the onsite.",
      },
    },
  },
  magnolia: {
    departments: ["Magnolia Network (TV/Content)", "Brand & Creative Direction", "Silos Retail & Operations", "Publishing & Editorial", "Other / Not Sure"],
    signals: {
      "Magnolia Network (TV/Content)": {
        comp: 5, satisfaction: 8, transparency: 5,
        note: "Content production has the clearest deliverable structure at Magnolia. Production schedules provide operational clarity that other creative orgs lack. Network renewals confirmed for 2026 — multi-year stability for this team.",
        teamCulture: "Production-first discipline with Magnolia warmth. Deadlines are real. Collaboration with external crews and talent. If you're from broadcast or digital content — this is the most professionally structured team in the company.",
      },
      "Brand & Creative Direction": {
        comp: 0, satisfaction: 0, transparency: -5,
        note: "Highest creative autonomy — and highest creative scrutiny. This team works most directly with Joanna. Expectations are high, feedback is direct, and the standard is set by CCO vision. If values alignment is strong, this is the most rewarding place in the company.",
        teamCulture: "Vision-led, relationship-based. Joanna's creative brief is the north star. Requires comfort with vision-driven direction — and the confidence to push back when you have a strong case. Don't expect a structured brief every time.",
      },
      "Silos Retail & Operations": {
        comp: -8, satisfaction: -3,
        note: "Physical retail comp anchors to Waco market rates. Operational roles are execution-focused with less creative latitude. Strong sense of community purpose but more structured and hierarchical than the creative teams.",
        teamCulture: "Community-rooted, operationally focused. You're building the physical expression of the brand. Strong team identity around place and craft. Less strategic input, more execution excellence. Values alignment matters as much here as everywhere.",
      },
      "Publishing & Editorial": {
        comp: -5, satisfaction: 5, transparency: 5,
        note: "Magnolia Journal and book operations are a small, high-meaning team. Clear deliverables, direct connection to brand voice. Comp is editorial-market standard (lower than digital/broadcast). Strong clarity of purpose — rare at any company.",
        teamCulture: "Writer/editor culture with Magnolia values. Small team, high quality bar. If you love the craft of making things people keep — not just consume — this is the team for that. Very close-knit by necessity.",
      },
      "Other / Not Sure": {
        comp: 0, satisfaction: 0,
        note: "Magnolia is small enough that team culture is primarily defined by your direct manager. Ask during the process who you'd report to and whether you can meet that person before a final decision. The relationship is the role at this scale.",
        teamCulture: "At Magnolia's size, your direct manager relationship defines your experience more than any org-level description. This is the most relationship-dependent culture in this dossier. The HM alignment question matters more here than anywhere.",
      },
    },
  },
};

// ────────────────────────────────────────────────────────────────
// HIRING MANAGER ALIGNMENT COACHING
// Coaches the candidate based on what they currently know about their HM
// ────────────────────────────────────────────────────────────────
const HM_COACHING = {
  "I found their LinkedIn profile": {
    action: "Read between the lines",
    steps: [
      "Check their recommendations — what do direct reports and peers say about their management style? Look for patterns across 3+ recommenders.",
      "Post history tells you everything: do they share company content or their own thinking? Own thinking = autonomy-giving manager. Company content = closer to the org line.",
      "Note their tenure at the company. A 5+ year HM is deeply embedded in culture. A 2-year HM who came from outside may still be pushing against legacy norms — that's a very different experience.",
      "Look at the skills their direct reports list. What they're known for on a team is what the HM built or reinforced — that's your day-to-day signal.",
    ],
    question: "Ask in the interview: \"What does success look like for this role in your view — not just the job description, but what would make you proud of this hire in 12 months?\"",
  },
  "I found recent articles, talks, or posts from them": {
    action: "Use their words — specifically",
    steps: [
      "Pull one specific idea from their most recent public statement to reference directly. 'I read your post on [topic] — that framing resonated with me.' This signals research depth, not flattery.",
      "Look for recurring themes across their writing. These are their actual values — not the company's stated ones. Alignment here is more predictive than company values alignment.",
      "Find a genuine point of tension or question, not just agreement. Asking a thoughtful follow-up question about something they wrote signals intellectual engagement. Managers who publish want to be engaged seriously.",
      "Their writing style tells you how they'll communicate with you. Detailed and analytical = they'll want precision from you. High-level and vision-led = they'll want you to fill in the operational gaps.",
    ],
    question: "Ask in the interview: \"I read your [article/post] on [specific topic] — that framing changed how I think about [relevant area]. How does that thinking show up in how this team approaches its work day-to-day?\"",
  },
  "I only have their name and title": {
    action: "Research before you assume anything",
    steps: [
      "LinkedIn first: '[First Name Last Name] [Company]' — most managers at L5+ level are findable. Even a 10-minute read changes your positioning in the room.",
      "Google search: '[Name] [Company] [Year]' — look for conference talks, panel appearances, bylines, or internal-to-public posts. Engineers often have GitHub or eng blog presence.",
      "Search the company's engineering blog or careers page. HMs often co-write job descriptions and blog posts; voice and priorities leak through even in boilerplate.",
      "Ask your recruiter directly: 'Can you tell me a bit about the hiring manager's background and what they're specifically looking for in this hire?' A good recruiter will give you real signal.",
    ],
    question: "Ask in the interview: \"What's your management philosophy — and what's worked best with the people on this team who've thrived under your leadership?\"",
  },
  "I haven't researched them yet": {
    action: "Do this before you do anything else",
    steps: [
      "Before you practice a single answer — LinkedIn the hiring manager. 10 minutes of research is worth 2 hours of generic prep. Every answer can be calibrated once you know who you're talking to.",
      "Look at the current team composition on LinkedIn. The people the HM has hired tell you what they value — more reliably than what they say they value.",
      "Search the company's engineering blog, press, or product announcements for the team name. HMs often contribute to those, or get quoted in them.",
      "Call your recruiter. Ask specifically: 'What can you tell me about the hiring manager's priorities for this hire? What matters most to them?' You're entitled to this information.",
    ],
    question: "Ask in the interview: \"I want to understand your vision for this role — what problem are you solving by making this hire, and what would an ideal first 90 days look like from your perspective?\"",
  },
};

function MiniBar({ label, score, delay = 0 }) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(score), delay); return () => clearTimeout(t); }, [score, delay]);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.38rem" }}>
      <span style={{ color: T.muted, fontSize: "0.68rem", width: 120, flexShrink: 0, fontFamily: "'DM Mono',monospace" }}>{label}</span>
      <div style={{ flex: 1, height: 4, background: "#EBEBEB", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${w}%`, height: "100%", background: sc(score), borderRadius: 3, transition: "width 1s cubic-bezier(.22,1,.36,1)" }} />
      </div>
      <span style={{ color: sc(score), fontWeight: 700, fontSize: "0.74rem", width: 20, textAlign: "right", fontFamily: "'DM Mono',monospace" }}>{score}</span>
    </div>
  );
}

function PracticeCard({ item }) {
  const [open, setOpen] = useState(false);
  const catColor = {
    "Leadership Principles": T.green, "Googleyness": T.green, "Values/Mission": T.green,
    "Coding": T.blue, "System Design": T.blue, "Role-Specific": T.blue,
    "Bar Raiser": T.red, "Culture": T.orange,
    "Current Context": T.orange, "Behavioral": T.muted,
    "Compensation": T.gold, "Portfolio": T.blue,
  }[item.category] || T.muted;
  return (
    <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 11, padding: "0.85rem 1rem", marginBottom: "0.5rem" }}>
      <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <span style={{ background: `${catColor}18`, color: catColor, fontSize: "0.62rem", fontWeight: 700, borderRadius: 4, padding: "0.1rem 0.38rem", fontFamily: "'DM Mono',monospace" }}>{item.category}</span>
          <div style={{ fontWeight: 600, fontSize: "0.84rem", color: T.fg, lineHeight: 1.45, marginTop: "0.3rem" }}>"{item.q}"</div>
        </div>
        <button onClick={() => setOpen(o => !o)} style={{ background: open ? `${T.gold}20` : T.card, border: `1.5px solid ${open ? T.gold : T.border}`, borderRadius: 8, padding: "0.32rem 0.7rem", cursor: "pointer", fontFamily: "'DM Mono',monospace", fontSize: "0.68rem", fontWeight: 700, color: open ? T.gold : T.muted, flexShrink: 0, transition: "all 0.2s" }}>
          {open ? "Hide" : "Coach me"}
        </button>
      </div>
      {open && (
        <div style={{ marginTop: "0.6rem", padding: "0.6rem 0.75rem", background: `${T.gold}10`, border: `1px solid ${T.gold}30`, borderRadius: 8 }}>
          <div style={{ fontSize: "0.67rem", color: T.gold, fontWeight: 800, fontFamily: "'DM Mono',monospace", marginBottom: "0.18rem" }}>COACHING NOTE</div>
          <div style={{ fontSize: "0.77rem", color: T.fg, lineHeight: 1.5 }}>{item.hint}</div>
        </div>
      )}
    </div>
  );
}

export default function InterviewDossier() {
  const navigate = useNavigate();
  const [coKey, setCoKey] = useState("amazon");
  const [tab, setTab] = useState("intel");
  const [filterCat, setFilterCat] = useState("All");
  const [dept, setDept] = useState("");
  const [hmName, setHmName] = useState("");
  const [hmTitle, setHmTitle] = useState("");
  const [hmKnown, setHmKnown] = useState("");
  const [recName, setRecName] = useState("");
  const [recTitle, setRecTitle] = useState("");
  const [recFirm, setRecFirm] = useState("");
  const [recEmail, setRecEmail] = useState("");
  const [recNote, setRecNote] = useState("");
  const [recSections, setRecSections] = useState({ intel: true, values: true, process: true, questions: true, practice: true, negotiate: true, alignment: false });
  const [recDisclosed, setRecDisclosed] = useState(false);
  const [recPreview, setRecPreview] = useState(false);
  const [recTemplate, setRecTemplate] = useState("");

  const co = (COMPANIES as any)[coKey];
  const categories: string[] = ["All", ...Array.from(new Set((co.practice as any[]).map((p: any) => String(p.category))))];
  const filtered = filterCat === "All" ? co.practice : co.practice.filter(p => p.category === filterCat);

  const tabs = [
    ["intel", "🔬 Latest Intel"],
    ["values", "🧬 Values & Culture"],
    ["process", "🗂 Process & People"],
    ["questions", "❓ Smart Questions"],
    ["practice", "💬 Practice"],
    ["negotiate", "💰 Negotiate"],
    ["alignment", "🎯 Alignment"],
    ["send", "📤 Send to Candidate"],
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=DM+Mono:wght@400;500;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${T.bg}; font-family: 'DM Sans', sans-serif; color: ${T.fg}; }
        .top { background: ${T.fg}; padding: 0.7rem 1.5rem; display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
        .logo { color: ${T.gold}; font-weight: 900; font-size: 1.15rem; letter-spacing: -0.02em; }
        .badge { border-radius: 50px; padding: 0.22rem 0.7rem; font-size: 0.7rem; font-weight: 700; font-family: 'DM Mono',monospace; }
        .co-pills { display: flex; gap: 0.4rem; flex-wrap: wrap; margin-left: auto; }
        .co-pill { border: 1.5px solid rgba(255,255,255,0.1); border-radius: 50px; padding: 0.3rem 0.9rem; font-size: 0.78rem; font-weight: 600; cursor: pointer; color: rgba(255,255,255,0.45); background: transparent; transition: all 0.2s; }
        .co-pill.active { background: ${T.gold}; color: ${T.fg}; border-color: ${T.gold}; font-weight: 700; }
        .layout { display: grid; grid-template-columns: 270px 1fr; height: calc(100vh - 52px); overflow: hidden; }
        .sidebar { background: ${T.card}; border-right: 1px solid ${T.border}; overflow-y: auto; padding: 1rem; display: flex; flex-direction: column; gap: 0.85rem; }
        .main { overflow-y: auto; padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem; }
        .tabs { display: flex; gap: 0.22rem; background: ${T.card}; border: 1px solid ${T.border}; border-radius: 12px; padding: 0.25rem; }
        .tab { flex: 1; padding: 0.4rem 0.35rem; border-radius: 8px; border: none; background: transparent; font-family: 'DM Sans',sans-serif; font-size: 0.7rem; font-weight: 600; color: ${T.muted}; cursor: pointer; transition: all 0.2s; text-align: center; white-space: nowrap; }
        .tab.on { background: ${T.card}; color: ${T.fg}; box-shadow: 0 1px 4px rgba(0,0,0,0.08); border: 1px solid ${T.border}; }
        .section { background: ${T.card}; border: 1px solid ${T.border}; border-radius: 14px; padding: 1.1rem 1.25rem; }
        .sec-label { font-size: 0.65rem; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: ${T.muted}; font-family: 'DM Mono',monospace; margin-bottom: 0.25rem; }
        .cat-pill { border: 1.5px solid ${T.border}; border-radius: 50px; padding: 0.25rem 0.7rem; font-size: 0.7rem; font-weight: 600; cursor: pointer; color: ${T.muted}; background: transparent; font-family: 'DM Mono',monospace; transition: all 0.2s; }
        .cat-pill.on { background: ${T.fg}; color: ${T.gold}; border-color: ${T.fg}; }
        @media(max-width:800px){ .layout { grid-template-columns: 1fr; height: auto; } }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 10px; }
        `}</style>

      <div className="top">
        <div className="logo">WDIWF</div>
        <div className="badge" style={{ background: `${T.green}22`, border: `1px solid ${T.green}55`, color: T.green }}>📋 INTERVIEW DOSSIER</div>
        <div style={{ color: "rgba(255,255,255,0.28)", fontSize: "0.75rem", fontFamily: "'DM Mono',monospace" }}>
          Research updated {co.researchDate} · Powered by WDIWF Intelligence
        </div>
        <div className="co-pills">
          {Object.entries(COMPANIES).map(([k, c]) => (
            <button key={k} className={`co-pill ${coKey === k ? "active" : ""}`} onClick={() => { setCoKey(k); setFilterCat("All"); setTab("intel"); setDept(""); setHmName(""); setHmTitle(""); setHmKnown(""); }}>
              {c.emoji} {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="layout">
        {/* Sidebar */}
        <div className="sidebar">
          <div>
            <div className="sec-label">Your Dossier</div>
            <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 11, padding: "0.8rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.55rem" }}>
                <span style={{ fontSize: "1.5rem" }}>{co.emoji}</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: "0.88rem" }}>{co.name}</div>
                  <div style={{ color: T.muted, fontSize: "0.68rem" }}>{co.ticker} · {co.team}</div>
                </div>
              </div>
              <div style={{ background: `${co.verdictColor}14`, border: `1px solid ${co.verdictColor}40`, borderRadius: 7, padding: "0.35rem 0.6rem", marginBottom: "0.6rem" }}>
                <div style={{ color: co.verdictColor, fontWeight: 800, fontSize: "0.68rem", fontFamily: "'DM Mono',monospace" }}>{co.verdict}</div>
              </div>
              <MiniBar label="Comp Equity" score={co.signals.compensation} delay={0} />
              <MiniBar label="Workplace Safety" score={co.signals.safety} delay={60} />
              <MiniBar label="Labor Relations" score={co.signals.labor} delay={120} />
              <MiniBar label="Transparency" score={co.signals.transparency} delay={180} />
              <MiniBar label="Diversity" score={co.signals.diversity} delay={240} />
              <MiniBar label="Satisfaction" score={co.signals.satisfaction} delay={300} />
            </div>
          </div>

          <div>
            <div className="sec-label">Dossier Coverage</div>
            {[
              ["Latest Intel", `${co.currentPriorities.length} priorities · ${co.recentNews.length} news items`],
              ["Values & Culture", `${co.values.length} values mapped to signals`],
              ["Process & People", `${co.process?.rounds ?? "?"} rounds · ${co.orgContext?.likelyPeople?.length ?? 0} likely contacts`],
              ["Smart Questions", `${co.redFlags.length + co.strengthsToAsk.length} data-derived questions`],
              ["Practice", `${co.practice.length} questions + coaching`],
              ["Negotiation Brief", `${co.negotiation?.leverageTips?.length ?? 0} leverage points`],
            ].map(([item, val]) => (
              <div key={item} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.22rem 0", borderBottom: `1px solid ${T.border}`, fontSize: "0.71rem" }}>
                <span style={{ color: T.muted }}>{item}</span>
                <span style={{ color: T.green, fontWeight: 700, fontSize: "0.65rem", fontFamily: "'DM Mono',monospace", textAlign: "right" }}>{val}</span>
              </div>
            ))}
          </div>

          <div style={{ background: T.fg, borderRadius: 11, padding: "0.85rem 1rem" }}>
            <div style={{ color: T.gold, fontWeight: 800, fontSize: "0.78rem", marginBottom: "0.2rem" }}>Interview Dossier — $49</div>
            <div style={{ color: "rgba(240,235,224,0.55)", fontSize: "0.7rem", lineHeight: 1.45, marginBottom: "0.55rem" }}>Per company · Full research · PDF export · Refreshed with every search</div>
            <div onClick={() => navigate("/pricing")} style={{ background: T.gold, borderRadius: 7, padding: "0.42rem", textAlign: "center", cursor: "pointer" }}>
              <div style={{ fontWeight: 800, fontSize: "0.8rem", color: T.fg }}>Unlock Full Dossier →</div>
            </div>
            <div style={{ color: "rgba(240,235,224,0.35)", fontSize: "0.65rem", textAlign: "center", marginTop: "0.35rem" }}>Also included in Premium ($79/mo)</div>
          </div>
        </div>

        {/* Main */}
        <div className="main">
          <div className="tabs">
            {tabs.map(([id, label]) => (
              <button key={id} className={`tab ${tab === id ? "on" : ""}`} onClick={() => setTab(id)}>{label}</button>
            ))}
          </div>

          {/* ── LATEST INTEL ── */}
          {tab === "intel" && (
            <>
              <div className="section" style={{ background: T.fg }}>
                <div style={{ display: "flex", gap: "0.85rem", alignItems: "flex-start" }}>
                  <span style={{ fontSize: "2.2rem" }}>{co.emoji}</span>
                  <div>
                    <div style={{ color: T.gold, fontWeight: 900, fontSize: "1.05rem", marginBottom: "0.2rem" }}>{co.name} — Intelligence Brief · {co.researchDate}</div>
                    <div style={{ color: "rgba(240,235,224,0.72)", fontSize: "0.8rem", lineHeight: 1.6 }}>{co.summary}</div>
                  </div>
                </div>
              </div>

              <div className="section">
                <div style={{ fontWeight: 800, fontSize: "1rem", marginBottom: "0.25rem" }}>What They're Focused On Right Now</div>
                <div style={{ color: T.muted, fontSize: "0.75rem", marginBottom: "0.85rem" }}>These are the priorities that define every hiring decision, budget conversation, and strategic question at {co.name} today. Know them. Reference them. Use them to show you've done the work.</div>
                {co.currentPriorities.map((p, i) => (
                  <div key={i} style={{ display: "flex", gap: "0.75rem", padding: "0.75rem 0.9rem", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 11, marginBottom: "0.45rem" }}>
                    <span style={{ fontSize: "1.3rem", flexShrink: 0 }}>{p.icon}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.84rem", color: T.fg, marginBottom: "0.15rem" }}>{p.title}</div>
                      <div style={{ fontSize: "0.76rem", color: T.muted, lineHeight: 1.5 }}>{p.detail}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="section">
                <div style={{ fontWeight: 700, fontSize: "0.84rem", marginBottom: "0.25rem" }}>Recent News — What Will Come Up in the Room</div>
                <div style={{ color: T.muted, fontSize: "0.75rem", marginBottom: "0.75rem" }}>These stories are in the news cycle. Interviewers will notice if you know them — and notice more if you don't.</div>
                {co.recentNews.map((n, i) => (
                  <div key={i} style={{ display: "flex", gap: "0.75rem", padding: "0.65rem 0.8rem", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, marginBottom: "0.4rem" }}>
                    <div style={{ color: T.gold, fontFamily: "'DM Mono',monospace", fontWeight: 700, fontSize: "0.65rem", flexShrink: 0, marginTop: "0.18rem", minWidth: 55 }}>{n.date}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.8rem", color: T.fg, marginBottom: "0.15rem" }}>{n.headline}</div>
                      <div style={{ fontSize: "0.73rem", color: T.muted, lineHeight: 1.45 }}><span style={{ color: T.blue, fontWeight: 700 }}>Why it matters: </span>{n.relevance}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="section">
                <div style={{ fontWeight: 700, fontSize: "0.84rem", marginBottom: "0.75rem" }}>What Leadership Is Saying — In Their Own Words</div>
                {co.leadershipQuotes.map((q, i) => (
                  <div key={i} style={{ marginBottom: "0.75rem", padding: "0.85rem 1rem", background: T.fg, borderRadius: 12 }}>
                    <div style={{ color: T.gold, fontSize: "1.05rem", lineHeight: 1.5, fontStyle: "italic", marginBottom: "0.55rem" }}>"{q.quote}"</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem" }}>
                      <div>
                        <div style={{ color: "rgba(240,235,224,0.85)", fontWeight: 700, fontSize: "0.78rem" }}>{q.person}</div>
                        <div style={{ color: "rgba(240,235,224,0.4)", fontSize: "0.68rem", fontFamily: "'DM Mono',monospace" }}>{q.role} · {q.source}</div>
                      </div>
                    </div>
                    <div style={{ marginTop: "0.5rem", padding: "0.45rem 0.65rem", background: `${T.blue}22`, border: `1px solid ${T.blue}35`, borderRadius: 7 }}>
                      <div style={{ fontSize: "0.72rem", color: T.blue, lineHeight: 1.45 }}><span style={{ fontWeight: 700 }}>Interview context: </span>{q.context}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── VALUES & CULTURE ── */}
          {tab === "values" && (
            <>
              <div className="section" style={{ background: T.fg }}>
                <div style={{ color: T.gold, fontWeight: 900, fontSize: "1rem", marginBottom: "0.3rem" }}>
                  Official Values vs. Signal Reality — Know the Gap
                </div>
                <div style={{ color: "rgba(240,235,224,0.7)", fontSize: "0.8rem", lineHeight: 1.55 }}>
                  Every company has a values page. What matters is how well those values show up in the public record — and what you do with the gap. This is where other candidates fly blind. You don't.
                </div>
              </div>

              <div className="section">
                <div style={{ fontWeight: 800, fontSize: "1rem", marginBottom: "0.25rem" }}>
                  {co.name} — Official Values with Signal Reality Check
                </div>
                <div style={{ color: T.muted, fontSize: "0.75rem", marginBottom: "0.9rem" }}>
                  Signal strength is how well the public record supports the stated value. High = consistent. Medium = partial. Low = documented gap.
                </div>
                {co.values.map((v, i) => {
                  const sigColor = v.signal === "high" ? T.green : v.signal === "medium" ? T.gold : T.red;
                  return (
                    <div key={i} style={{ display: "flex", gap: "0.75rem", padding: "0.65rem 0", borderBottom: `1px solid ${T.border}` }}>
                      <div style={{ width: 54, flexShrink: 0 }}>
                        <div style={{ background: `${sigColor}20`, color: sigColor, borderRadius: 5, padding: "0.2rem 0.3rem", fontFamily: "'DM Mono',monospace", fontWeight: 800, fontSize: "0.6rem", textAlign: "center", textTransform: "uppercase" }}>{v.signal}</div>
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "0.82rem", color: T.fg, marginBottom: "0.12rem" }}>{v.name}</div>
                        <div style={{ fontSize: "0.74rem", color: T.muted, lineHeight: 1.45 }}>{v.note}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="section">
                <div style={{ fontWeight: 700, fontSize: "0.84rem", marginBottom: "0.55rem" }}>How to Use This in the Interview</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
                  {[
                    { icon: "✅", title: "Lead with high-signal values", desc: "These have public record backing. Anchoring your answers to them is both accurate and strategically strong." },
                    { icon: "⚠️", title: "Acknowledge medium-signal values honestly", desc: "Show nuance. 'I see this value in X but I'd want to understand how it shows up at the team level' demonstrates you've done research, not just read the website." },
                    { icon: "🎯", title: "Low-signal values = your best questions", desc: "These are the gaps between stated culture and documented reality. They become the Smart Questions that differentiate you from every other candidate." },
                    { icon: "💡", title: "Never pretend the gap doesn't exist", desc: "If you're asked about a low-signal value and you know the public record, acknowledge it thoughtfully. That's the candidate who earns trust." },
                  ].map(({ icon, title, desc }) => (
                    <div key={title} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: "0.7rem 0.85rem" }}>
                      <div style={{ fontWeight: 700, fontSize: "0.8rem", color: T.fg, marginBottom: "0.2rem" }}>{icon} {title}</div>
                      <div style={{ fontSize: "0.73rem", color: T.muted, lineHeight: 1.45 }}>{desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── PROCESS & PEOPLE ── */}
          {tab === "process" && (
            <>
              <div className="section">
                <div style={{ fontWeight: 800, fontSize: "1rem", marginBottom: "0.85rem" }}>The {co.name} Interview Process — What You'll Actually Face</div>
                <div style={{ background: T.fg, borderRadius: 11, padding: "0.85rem 1rem", marginBottom: "0.85rem" }}>
                  <div style={{ color: T.gold, fontWeight: 700, fontSize: "0.72rem", fontFamily: "'DM Mono',monospace", marginBottom: "0.35rem" }}>FULL PROCESS</div>
                  <div style={{ color: "rgba(240,235,224,0.82)", fontSize: "0.8rem", lineHeight: 1.65 }}>{co.process?.format}</div>
                  <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.65rem" }}>
                    {[["Rounds", co.process?.rounds], ["Timeline", co.process?.duration]].map(([k, v]) => (
                      <div key={k}>
                        <div style={{ color: "rgba(240,235,224,0.35)", fontSize: "0.62rem", fontFamily: "'DM Mono',monospace" }}>{k}</div>
                        <div style={{ color: T.gold, fontWeight: 900, fontSize: "1rem", fontFamily: "'DM Mono',monospace" }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ fontWeight: 700, fontSize: "0.84rem", marginBottom: "0.5rem" }}>Interview Style & What They're Really Filtering For</div>
                <div style={{ padding: "0.75rem 0.9rem", background: T.bg, borderRadius: 10, border: `1px solid ${T.border}`, marginBottom: "0.75rem", fontSize: "0.8rem", color: T.fg, lineHeight: 1.6 }}>{co.process?.style}</div>
                {co.process?.barraiser && (
                  <div style={{ padding: "0.75rem 0.9rem", background: `${T.red}09`, border: `1px solid ${T.red}30`, borderRadius: 10, marginBottom: "0.75rem" }}>
                    <div style={{ color: T.red, fontWeight: 700, fontSize: "0.75rem", fontFamily: "'DM Mono',monospace", marginBottom: "0.2rem" }}>⚠ BAR RAISER — Independent Veto</div>
                    <div style={{ fontSize: "0.77rem", color: T.fg, lineHeight: 1.5 }}>The Bar Raiser has veto power and comes from a different org. Their only question: would this person raise the bar for the team? Behavioral depth and cultural signal matter most here — not technical depth.</div>
                  </div>
                )}
                <div style={{ fontWeight: 700, fontSize: "0.84rem", marginBottom: "0.5rem" }}>What They Actually Filter On</div>
                {(co.process?.knownFilters ?? []).map((f: any, i: number) => (
                  <div key={i} style={{ display: "flex", gap: "0.6rem", padding: "0.5rem 0.7rem", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 9, marginBottom: "0.35rem" }}>
                    <span style={{ color: T.blue, fontWeight: 700, flexShrink: 0 }}>→</span>
                    <div style={{ fontSize: "0.77rem", color: T.fg, lineHeight: 1.45 }}>{f}</div>
                  </div>
                ))}
              </div>

              <div className="section">
                <div style={{ fontWeight: 800, fontSize: "1rem", marginBottom: "0.25rem" }}>Who You'll Likely Meet</div>
                <div style={{ color: T.muted, fontSize: "0.75rem", marginBottom: "0.75rem" }}>{co.orgContext?.description}</div>
                {(co.orgContext?.likelyPeople ?? []).map((p: any, i: number) => (
                  <div key={i} style={{ display: "flex", gap: "0.75rem", padding: "0.65rem 0.8rem", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, marginBottom: "0.4rem" }}>
                    <span style={{ color: T.blue, fontWeight: 900, fontFamily: "'DM Mono',monospace", flexShrink: 0, marginTop: "0.15rem" }}>{i + 1}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.82rem", color: T.fg, marginBottom: "0.12rem" }}>{p.title}</div>
                      <div style={{ fontSize: "0.74rem", color: T.muted, lineHeight: 1.45 }}>{p.context}</div>
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: "0.65rem", padding: "0.6rem 0.8rem", background: `${T.gold}10`, border: `1px solid ${T.gold}30`, borderRadius: 9 }}>
                  <div style={{ fontSize: "0.67rem", fontWeight: 800, color: T.gold, fontFamily: "'DM Mono',monospace", marginBottom: "0.18rem" }}>HOW TO RESEARCH YOUR ACTUAL INTERVIEWERS</div>
                  <div style={{ fontSize: "0.75rem", color: T.fg, lineHeight: 1.5 }}>{co.orgContext?.searchTip}</div>
                </div>
              </div>
            </>
          )}

          {/* ── SMART QUESTIONS ── */}
          {tab === "questions" && (
            <>
              <div className="section" style={{ background: T.fg }}>
                <div style={{ color: T.gold, fontWeight: 900, fontSize: "1rem", marginBottom: "0.3rem" }}>Questions Built From the Data — Not a Generic List</div>
                <div style={{ color: "rgba(240,235,224,0.7)", fontSize: "0.8rem", lineHeight: 1.55 }}>
                  These questions come from {co.name}'s specific employer signals, current news, and values gaps. They signal research. They surface real information. And they show that you're evaluating them as much as they're evaluating you.
                </div>
              </div>
              <div className="section">
                <div style={{ fontWeight: 700, fontSize: "0.84rem", marginBottom: "0.65rem" }}>🚩 Questions for the Gaps — Ask These</div>
                {co.redFlags.map((f, i) => (
                  <div key={i} style={{ marginBottom: "0.65rem", padding: "0.8rem 0.95rem", background: `${T.red}07`, border: `1px solid ${T.red}25`, borderRadius: 11 }}>
                    <div style={{ color: T.red, fontSize: "0.65rem", fontWeight: 800, fontFamily: "'DM Mono',monospace", marginBottom: "0.18rem" }}>FROM SIGNAL: {f.signal}</div>
                    <div style={{ fontWeight: 700, fontSize: "0.84rem", color: T.fg }}>"{f.question}"</div>
                  </div>
                ))}
              </div>
              <div className="section">
                <div style={{ fontWeight: 700, fontSize: "0.84rem", marginBottom: "0.65rem" }}>✅ Questions to Lean Into the Strengths</div>
                {co.strengthsToAsk.map((s, i) => (
                  <div key={i} style={{ marginBottom: "0.5rem", padding: "0.75rem 0.9rem", background: `${T.green}07`, border: `1px solid ${T.green}25`, borderRadius: 11 }}>
                    <div style={{ color: T.green, fontSize: "0.65rem", fontWeight: 800, fontFamily: "'DM Mono',monospace", marginBottom: "0.18rem" }}>FROM SIGNAL: {s.signal}</div>
                    <div style={{ fontWeight: 700, fontSize: "0.84rem", color: T.fg }}>"{s.question}"</div>
                  </div>
                ))}
              </div>
              <div className="section">
                <div style={{ fontWeight: 700, fontSize: "0.84rem", marginBottom: "0.65rem" }}>📰 Questions From Current News</div>
                {co.currentPriorities.slice(0, 3).map((p, i) => (
                  <div key={i} style={{ marginBottom: "0.5rem", padding: "0.75rem 0.9rem", background: `${T.blue}07`, border: `1px solid ${T.blue}25`, borderRadius: 11 }}>
                    <div style={{ color: T.blue, fontSize: "0.65rem", fontWeight: 800, fontFamily: "'DM Mono',monospace", marginBottom: "0.18rem" }}>RE: {p.title.toUpperCase()}</div>
                    <div style={{ fontWeight: 700, fontSize: "0.84rem", color: T.fg }}>
                      "{p.title === "5-Day RTO (Jan 2025)" ? "How has the return-to-office transition affected this team's collaboration and productivity in your experience?" :
                        p.title === "Gemini AI Platform" ? "Where does this team's work fit into the Gemini roadmap — and how has the AI-first direction changed your engineering priorities?" :
                        p.title === "DEI Rollback (2025)" ? "With the changes to diversity reporting in 2025, how does this team think about building for different perspectives at the working level?" :
                        p.title.includes("Efficiency") || p.title.includes("Layoff") ? "How has the efficiency focus of the last 18 months changed how this team evaluates tradeoffs between speed and quality?" :
                        `Given the focus on ${p.title.toLowerCase()}, what would success look like for this role in the first 6 months?`}"
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── PRACTICE ── */}
          {tab === "practice" && (
            <>
              <div className="section">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.85rem" }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: "1rem" }}>Practice — {co.name} Calibrated</div>
                    <div style={{ color: T.muted, fontSize: "0.75rem", marginTop: "0.15rem" }}>Questions matched to {co.name}'s actual interview style, current context, and the level you're targeting. Click "Coach me" for the answer framework.</div>
                  </div>
                  <div style={{ color: T.muted, fontSize: "0.72rem", fontFamily: "'DM Mono',monospace" }}>{filtered.length} questions</div>
                </div>
                <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", marginBottom: "0.85rem" }}>
                  {categories.map(c => (
                    <button key={c} className={`cat-pill ${filterCat === c ? "on" : ""}`} onClick={() => setFilterCat(c)}>{c}</button>
                  ))}
                </div>
                {filtered.map((item, i) => <PracticeCard key={`${coKey}-${filterCat}-${i}`} item={item} />)}
              </div>
            </>
          )}

          {/* ── ALIGNMENT ── */}
          {tab === "alignment" && (() => {
            const deptSignals = dept && DEPT_DATA[coKey]?.signals[dept] ? DEPT_DATA[coKey].signals[dept] : {};
            const adjustedSignals = {
              compensation: Math.min(100, Math.max(0, co.signals.compensation + (deptSignals.comp || 0))),
              safety: Math.min(100, Math.max(0, co.signals.safety + (deptSignals.safety || 0))),
              labor: Math.min(100, Math.max(0, co.signals.labor + (deptSignals.labor || 0))),
              transparency: Math.min(100, Math.max(0, co.signals.transparency + (deptSignals.transparency || 0))),
              diversity: Math.min(100, Math.max(0, co.signals.diversity + (deptSignals.diversity || 0))),
              satisfaction: Math.min(100, Math.max(0, co.signals.satisfaction + (deptSignals.satisfaction || 0))),
            };
            const dimLabels = { compensation: "Comp Equity", safety: "Workplace Safety", labor: "Labor Relations", transparency: "Transparency", diversity: "Diversity", satisfaction: "Satisfaction" };
            const inFavor = Object.entries(adjustedSignals).filter(([, v]) => v >= 65);
            const toProbe = Object.entries(adjustedSignals).filter(([, v]) => v < 65);
            return (
              <>
                {/* Header */}
                <div className="section" style={{ background: T.fg }}>
                  <div style={{ color: T.gold, fontWeight: 900, fontSize: "1rem", marginBottom: "0.3rem" }}>
                    3-Level Alignment — Company → Department → Hiring Manager
                  </div>
                  <div style={{ color: "rgba(240,235,224,0.7)", fontSize: "0.8rem", lineHeight: 1.6 }}>
                    Company-level signals are the outer context. The real alignment question is: do YOU align with THIS department's culture AND THIS hiring manager's operating style? That's what determines whether you thrive here — or leave in 6 months. No dossier is complete without all three levels.
                  </div>
                </div>

                {/* Step 1: Opportunity Input */}
                <div className="section">
                  <div style={{ fontWeight: 800, fontSize: "1rem", marginBottom: "0.2rem" }}>Your Specific Opportunity</div>
                  <div style={{ color: T.muted, fontSize: "0.75rem", marginBottom: "0.85rem" }}>
                    The same company has radically different cultures in different departments under different managers. Tell us what you know — and this assessment adjusts to your actual situation.
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem", marginBottom: "0.75rem" }}>
                    <div>
                      <div style={{ fontSize: "0.63rem", fontWeight: 700, color: T.muted, fontFamily: "'DM Mono',monospace", marginBottom: "0.28rem" }}>HIRING MANAGER NAME (optional)</div>
                      <input value={hmName} onChange={e => setHmName(e.target.value)} placeholder="e.g. Sarah Chen"
                        style={{ width: "100%", padding: "0.5rem 0.7rem", border: `1.5px solid ${T.border}`, borderRadius: 8, fontFamily: "'DM Sans',sans-serif", fontSize: "0.8rem", background: T.bg, color: T.fg, outline: "none" }} />
                    </div>
                    <div>
                      <div style={{ fontSize: "0.63rem", fontWeight: 700, color: T.muted, fontFamily: "'DM Mono',monospace", marginBottom: "0.28rem" }}>HIRING MANAGER TITLE</div>
                      <input value={hmTitle} onChange={e => setHmTitle(e.target.value)} placeholder="e.g. Engineering Manager, L6"
                        style={{ width: "100%", padding: "0.5rem 0.7rem", border: `1.5px solid ${T.border}`, borderRadius: 8, fontFamily: "'DM Sans',sans-serif", fontSize: "0.8rem", background: T.bg, color: T.fg, outline: "none" }} />
                    </div>
                  </div>

                  <div style={{ marginBottom: "0.75rem" }}>
                    <div style={{ fontSize: "0.63rem", fontWeight: 700, color: T.muted, fontFamily: "'DM Mono',monospace", marginBottom: "0.3rem" }}>DEPARTMENT / TEAM</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                      {DEPT_DATA[coKey].departments.map(d => (
                        <button key={d} onClick={() => setDept(d)}
                          style={{ border: `1.5px solid ${dept === d ? T.gold : T.border}`, borderRadius: 50, padding: "0.3rem 0.8rem", fontSize: "0.72rem", fontWeight: 600, cursor: "pointer", color: dept === d ? T.fg : T.muted, background: dept === d ? T.gold : "transparent", transition: "all 0.2s", fontFamily: "'DM Sans',sans-serif" }}>
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: "0.63rem", fontWeight: 700, color: T.muted, fontFamily: "'DM Mono',monospace", marginBottom: "0.3rem" }}>WHAT DO YOU KNOW ABOUT YOUR HIRING MANAGER?</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.28rem" }}>
                      {Object.keys(HM_COACHING).map(k => (
                        <label key={k} style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.42rem 0.65rem", background: hmKnown === k ? `${T.blue}10` : T.bg, border: `1.5px solid ${hmKnown === k ? T.blue : T.border}`, borderRadius: 8, cursor: "pointer", transition: "all 0.2s" }}>
                          <input type="radio" checked={hmKnown === k} onChange={() => setHmKnown(k)} style={{ accentColor: T.blue }} />
                          <span style={{ fontSize: "0.78rem", color: T.fg, fontWeight: hmKnown === k ? 600 : 400 }}>{k}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* LEVEL 1: Company */}
                <div className="section">
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.55rem" }}>
                    <div style={{ background: `${T.muted}20`, color: T.muted, fontWeight: 800, fontSize: "0.62rem", fontFamily: "'DM Mono',monospace", borderRadius: 50, padding: "0.18rem 0.6rem", flexShrink: 0 }}>LEVEL 1</div>
                    <div style={{ fontWeight: 800, fontSize: "0.95rem" }}>Company Alignment — The Outer Frame</div>
                  </div>
                  <div style={{ color: T.muted, fontSize: "0.72rem", marginBottom: "0.75rem" }}>
                    These are the company-wide baseline signals. They apply to the whole org — but they're not your full story. Level 2 adjusts these for your specific department.
                    {dept && <span style={{ color: T.blue, fontWeight: 700 }}> Showing adjusted scores for {dept}.</span>}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.45rem" }}>
                    {Object.entries(co.signals).map(([dim, base]: [string, any]) => {
                      const adj = deptSignals[dim] || 0;
                      const adjScore = adjustedSignals[dim];
                      return (
                        <div key={dim} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 9, padding: "0.55rem 0.7rem" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.28rem" }}>
                            <span style={{ fontSize: "0.7rem", color: T.muted, fontWeight: 600 }}>{dimLabels[dim]}</span>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                              <span style={{ color: sc(base), fontFamily: "'DM Mono',monospace", fontWeight: 700, fontSize: "0.74rem" }}>{base}</span>
                              {adj !== 0 && dept && <>
                                <span style={{ color: adj > 0 ? T.green : T.red, fontFamily: "'DM Mono',monospace", fontWeight: 700, fontSize: "0.68rem" }}>{adj > 0 ? `+${adj}` : adj}</span>
                                <span style={{ color: sc(adjScore), fontFamily: "'DM Mono',monospace", fontWeight: 900, fontSize: "0.8rem" }}>→{adjScore}</span>
                              </>}
                            </div>
                          </div>
                          <div style={{ height: 4, background: "#EBEBEB", borderRadius: 3, overflow: "hidden" }}>
                            <div style={{ width: `${adjScore}%`, height: "100%", background: sc(adjScore), borderRadius: 3, transition: "width 0.8s ease" }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* LEVEL 2: Department */}
                <div className="section" style={{ border: `1.5px solid ${dept ? T.blue + "55" : T.border}`, opacity: dept ? 1 : 0.65 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.55rem" }}>
                    <div style={{ background: `${T.blue}20`, color: T.blue, fontWeight: 800, fontSize: "0.62rem", fontFamily: "'DM Mono',monospace", borderRadius: 50, padding: "0.18rem 0.6rem", flexShrink: 0 }}>LEVEL 2</div>
                    <div style={{ fontWeight: 800, fontSize: "0.95rem" }}>
                      Department Alignment — {dept || "Select a department above ↑"}
                    </div>
                  </div>
                  {!dept ? (
                    <div style={{ color: T.muted, fontSize: "0.77rem", padding: "0.65rem 0", textAlign: "center" }}>
                      Select your department above to see how the signals shift at the team level
                    </div>
                  ) : (
                    <>
                      <div style={{ padding: "0.7rem 0.85rem", background: `${T.blue}08`, border: `1px solid ${T.blue}25`, borderRadius: 10, marginBottom: "0.7rem" }}>
                        <div style={{ fontSize: "0.63rem", fontWeight: 800, color: T.blue, fontFamily: "'DM Mono',monospace", marginBottom: "0.2rem" }}>DEPARTMENT SIGNAL CONTEXT</div>
                        <div style={{ fontSize: "0.77rem", color: T.fg, lineHeight: 1.55 }}>{deptSignals.note}</div>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: "0.82rem", marginBottom: "0.35rem" }}>Team Culture Reality</div>
                      <div style={{ fontSize: "0.77rem", color: T.fg, lineHeight: 1.55, padding: "0.6rem 0.75rem", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 9 }}>
                        {deptSignals.teamCulture}
                      </div>
                    </>
                  )}
                </div>

                {/* LEVEL 3: HM */}
                <div className="section" style={{ border: `1.5px solid ${hmKnown ? T.gold + "55" : T.border}`, opacity: hmKnown ? 1 : 0.65 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.55rem" }}>
                    <div style={{ background: `${T.gold}25`, color: T.gold, fontWeight: 800, fontSize: "0.62rem", fontFamily: "'DM Mono',monospace", borderRadius: 50, padding: "0.18rem 0.6rem", flexShrink: 0 }}>LEVEL 3</div>
                    <div style={{ fontWeight: 800, fontSize: "0.95rem" }}>
                      Hiring Manager Alignment{hmName ? ` — ${hmName}${hmTitle ? `, ${hmTitle}` : ""}` : " — Your Direct Manager"}
                    </div>
                  </div>
                  {!hmKnown ? (
                    <div style={{ color: T.muted, fontSize: "0.77rem", padding: "0.65rem 0", textAlign: "center" }}>
                      Tell us what you know about your hiring manager above ↑
                    </div>
                  ) : (() => {
                    const hm = HM_COACHING[hmKnown];
                    return (
                      <>
                        <div style={{ padding: "0.5rem 0.7rem", background: `${T.gold}12`, border: `1px solid ${T.gold}30`, borderRadius: 8, marginBottom: "0.65rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{ color: T.gold, fontWeight: 800, fontSize: "0.7rem", fontFamily: "'DM Mono',monospace" }}>▶ NEXT ACTION: {hm.action.toUpperCase()}</span>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: "0.82rem", marginBottom: "0.4rem" }}>Research Playbook — Do This Before the Interview</div>
                        {hm.steps.map((step, i) => (
                          <div key={i} style={{ display: "flex", gap: "0.5rem", padding: "0.42rem 0.6rem", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, marginBottom: "0.28rem" }}>
                            <span style={{ color: T.gold, fontWeight: 800, fontFamily: "'DM Mono',monospace", flexShrink: 0, fontSize: "0.7rem", marginTop: "0.05rem" }}>{i + 1}</span>
                            <div style={{ fontSize: "0.76rem", color: T.fg, lineHeight: 1.5 }}>{step}</div>
                          </div>
                        ))}
                        <div style={{ marginTop: "0.65rem", padding: "0.8rem 0.95rem", background: T.fg, borderRadius: 10, marginBottom: "0.75rem" }}>
                          <div style={{ color: T.gold, fontWeight: 800, fontSize: "0.65rem", fontFamily: "'DM Mono',monospace", marginBottom: "0.28rem" }}>KEY QUESTION FOR THE INTERVIEW</div>
                          <div style={{ color: "rgba(240,235,224,0.88)", fontSize: "0.79rem", lineHeight: 1.55, fontStyle: "italic" }}>{hm.question}</div>
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: "0.82rem", marginBottom: "0.3rem" }}>HM Alignment Questions — For Every Interview</div>
                          <div style={{ color: T.muted, fontSize: "0.7rem", marginBottom: "0.55rem" }}>These questions diagnose management style, team health, and HM operating model. Ask at least 2. The answers tell you more than the official job description ever will.</div>
                          {[
                            "What does great look like at 90 days — not just tasks completed, but what tells you this hire was a success?",
                            "How do you like to give feedback, and what's your typical cadence for 1:1s and performance conversations?",
                            "What are the biggest challenges this team is navigating right now, and what would this role's owner need to take off your plate?",
                            "Tell me about someone you've managed who grew significantly under your leadership. What did that look like?",
                            "How does your team handle disagreement — especially when someone has strong conviction about a different direction than you?",
                          ].map((q, i) => (
                            <div key={i} style={{ display: "flex", gap: "0.5rem", padding: "0.55rem 0.7rem", background: `${T.green}07`, border: `1px solid ${T.green}22`, borderRadius: 9, marginBottom: "0.3rem" }}>
                              <span style={{ color: T.green, fontWeight: 700, fontFamily: "'DM Mono',monospace", flexShrink: 0, fontSize: "0.68rem", marginTop: "0.03rem" }}>Q{i + 1}</span>
                              <div style={{ fontSize: "0.75rem", color: T.fg, lineHeight: 1.48, fontStyle: "italic" }}>"{q}"</div>
                            </div>
                          ))}
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* What This Means For Your Decision — NOW WITH DEPARTMENT CONTEXT */}
                <div className="section" style={{ background: T.fg }}>
                  <div style={{ color: T.gold, fontWeight: 900, fontSize: "0.95rem", marginBottom: "0.35rem" }}>
                    What This Means For Your Decision{dept ? ` — ${dept} at ${co.name}` : ` — ${co.name} Company Level`}
                  </div>
                  <div style={{ color: "rgba(240,235,224,0.55)", fontSize: "0.72rem", marginBottom: "0.75rem" }}>
                    {dept
                      ? "These signals have been adjusted for your specific department. This is the real read — not the company headline."
                      : "Showing company-level signals. Select a department above for a more accurate read."}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
                    <div style={{ background: `${T.green}15`, border: `1px solid ${T.green}35`, borderRadius: 10, padding: "0.75rem 0.9rem" }}>
                      <div style={{ color: T.green, fontWeight: 800, fontSize: "0.63rem", fontFamily: "'DM Mono',monospace", marginBottom: "0.45rem" }}>✓ SIGNALS IN YOUR FAVOR</div>
                      {inFavor.length > 0
                        ? inFavor.map(([dim, score]) => (
                          <div key={dim} style={{ color: "rgba(240,235,224,0.85)", fontSize: "0.77rem", marginBottom: "0.2rem" }}>
                            + {dimLabels[dim]} ({score}/100)
                          </div>
                        ))
                        : <div style={{ color: "rgba(240,235,224,0.4)", fontSize: "0.72rem", fontStyle: "italic" }}>No high-signal dimensions for this team. Proceed with extra diligence.</div>
                      }
                    </div>
                    <div style={{ background: `${T.red}15`, border: `1px solid ${T.red}35`, borderRadius: 10, padding: "0.75rem 0.9rem" }}>
                      <div style={{ color: T.red, fontWeight: 800, fontSize: "0.63rem", fontFamily: "'DM Mono',monospace", marginBottom: "0.45rem" }}>⚠ SIGNALS TO PROBE</div>
                      {toProbe.length > 0
                        ? toProbe.map(([dim, score]) => (
                          <div key={dim} style={{ color: "rgba(240,235,224,0.85)", fontSize: "0.77rem", marginBottom: "0.2rem" }}>
                            ! {dimLabels[dim]} ({score}/100)
                          </div>
                        ))
                        : <div style={{ color: "rgba(240,235,224,0.4)", fontSize: "0.72rem", fontStyle: "italic" }}>All signals are favorable for this team.</div>
                      }
                    </div>
                  </div>
                  {!hmKnown && (
                    <div style={{ marginTop: "0.7rem", padding: "0.55rem 0.75rem", background: `${T.gold}12`, border: `1px solid ${T.gold}30`, borderRadius: 8 }}>
                      <div style={{ color: T.gold, fontSize: "0.72rem", fontWeight: 700 }}>⚡ Level 3 is missing — tell us about your hiring manager above to complete this assessment.</div>
                    </div>
                  )}
                </div>
              </>
            );
          })()}

          {/* ── NEGOTIATE ── */}
          {tab === "negotiate" && (
            <>
              <div className="section" style={{ background: T.fg }}>
                <div style={{ color: T.gold, fontWeight: 900, fontSize: "1rem", marginBottom: "0.3rem" }}>Negotiate From the Data. Not From Desperation.</div>
                <div style={{ color: "rgba(240,235,224,0.7)", fontSize: "0.8rem", lineHeight: 1.55 }}>Most candidates negotiate with feelings. You have employer signal data, market rate research, and in some cases documented compensation equity history. That changes the conversation.</div>
              </div>
              <div className="section">
                <div style={{ fontWeight: 800, fontSize: "1rem", marginBottom: "0.85rem" }}>Market Intelligence</div>
                <div style={{ background: `${T.gold}14`, border: `1.5px solid ${T.gold}40`, borderRadius: 11, padding: "0.85rem 1rem", marginBottom: "0.85rem" }}>
                  <div style={{ color: T.muted, fontSize: "0.65rem", fontWeight: 700, fontFamily: "'DM Mono',monospace", marginBottom: "0.15rem" }}>MARKET RANGE — WDIWF COMP DATA</div>
                  <div style={{ color: T.gold, fontFamily: "'DM Mono',monospace", fontWeight: 900, fontSize: "1.35rem" }}>{co.negotiation?.marketRange}</div>
                  <div style={{ color: T.muted, fontSize: "0.72rem", lineHeight: 1.5, marginTop: "0.38rem" }}>{co.negotiation?.rsuNote}</div>
                </div>
                <div style={{ fontWeight: 700, fontSize: "0.84rem", marginBottom: "0.55rem" }}>Leverage Points</div>
                {(co.negotiation?.leverageTips ?? []).map((tip: any, i: number) => (
                  <div key={i} style={{ display: "flex", gap: "0.6rem", padding: "0.5rem 0.7rem", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 9, marginBottom: "0.35rem" }}>
                    <span style={{ color: T.green, fontWeight: 800, flexShrink: 0 }}>{i + 1}</span>
                    <div style={{ fontSize: "0.77rem", color: T.fg, lineHeight: 1.45 }}>{tip}</div>
                  </div>
                ))}
              </div>
              <div className="section" style={{ border: `1.5px solid ${T.red}40`, background: `${T.red}05` }}>
                <div style={{ color: T.red, fontWeight: 800, fontSize: "0.72rem", fontFamily: "'DM Mono',monospace", marginBottom: "0.3rem" }}>YOUR RED LINE</div>
                <div style={{ fontSize: "0.82rem", color: T.fg, lineHeight: 1.5 }}>{co.negotiation?.redLine}</div>
              </div>
              <div className="section">
                <div style={{ fontWeight: 700, fontSize: "0.84rem", marginBottom: "0.65rem" }}>Scripts — Word for Word</div>
                {[
                  { s: "When they ask your salary expectations", t: `"Based on my research for ${co.role} at ${co.name}, I'm targeting ${(co.negotiation?.marketRange ?? "").split("+")[0].trim()}. I want to understand the full structure — can you walk me through how the offer is built?"` },
                  { s: "When the first offer comes in below market", t: `"I appreciate this offer. Based on the market data I've researched for this level at ${co.name}, I was expecting to be closer to ${(co.negotiation?.marketRange ?? "").split("+")[0].trim()}. Is there flexibility to move toward that range?"` },
                  { s: "When you need more time", t: `"This is an important decision and I want to give it the consideration it deserves. Can I have until [specific date]? I want to be fully committed when I say yes."` },
                  { s: "Counter-offer script — when you have competing offers", t: `"I want to be transparent — I have another offer at [competing company] that comes in at [amount]. I'm genuinely more interested in ${co.name} because of [specific reason tied to role/team/mission]. Is there room to close the gap on [base/RSU/signing]? I want to make this work."` },
                  { s: "When they say 'this is our best offer'", t: `"I understand this may be the top of the band for base. Can we look at other components — signing bonus, RSU acceleration, review timeline, or professional development budget? I'm trying to build a package that reflects the level of commitment I'm bringing."` },
                ].map(({ s, t }) => (
                  <div key={s} style={{ marginBottom: "0.65rem", padding: "0.75rem 0.9rem", background: T.bg, borderRadius: 10, border: `1px solid ${T.border}` }}>
                    <div style={{ fontWeight: 700, fontSize: "0.75rem", color: T.blue, marginBottom: "0.28rem" }}>📌 {s}</div>
                    <div style={{ fontSize: "0.77rem", color: T.fg, lineHeight: 1.5, fontStyle: "italic" }}>{t}</div>
                  </div>
                ))}
              </div>
            </>
          )}
          {/* ── SEND TO CANDIDATE ── */}
          {tab === "send" && (() => {
            const dossierUrl = `wdiwf.jackyeclayton.com/interview-dossier?company=${coKey}`;
            const shareMessage = `I put together an interview prep dossier for your upcoming conversation with ${co.name}. It includes employer signal data, practice questions calibrated to their interview style, and negotiation intelligence.\n\nHere's your link:\n${dossierUrl}\n\nReview the Smart Questions tab especially — those are built from real employer data, not generic lists. Go in prepared.\n\nLet me know if you have questions.`;
            const NOTE_TEMPLATES = {
              truth: {
                label: "The Full Truth (Jackye's Way)",
                text: `I'm sending you this dossier because I believe you deserve the full picture — not just the pitch.\n\nI know what ${co.name}'s public record looks like. I know what the signals say. And I think a recruiter who hides that from you isn't doing their job — they're doing their quota.\n\nReview this. Ask every question in the Smart Questions tab. If something gives you pause, that's the dossier doing its job. Go in with your eyes open — and if the signals align, go in with full confidence.\n\nI'm here for the process. Let's place you right, not just fast.`,
              },
              prep: {
                label: "The Prep Brief",
                text: `Here's your prep kit for your interview with ${co.name}.\n\nI've pulled the latest employer signal data, company priorities, likely interviewers, and calibrated practice questions for your level and role. This is the intelligence I use to prepare candidates — now it's yours.\n\nFocus especially on the "What They're Focused On Right Now" section. Those priorities will show up in the room. Know them, reference them, and show you've done the homework.\n\nYou've got this. I'll be available before and after.`,
              },
              advocate: {
                label: "The Advocate",
                text: `I want you to go into this interview knowing what I know about ${co.name}.\n\nThe company has real strengths. It also has real signals worth understanding. I've put together this dossier so you can evaluate them — not just impress them.\n\nThe best hiring outcomes I've seen are two-way fits. Not candidates who sold themselves into a mismatch. This dossier is my way of making sure you have what you need to make an informed decision.\n\nIf anything in here raises a question, call me.`,
              },
            };
            const sectionLabels = {
              intel: "🔬 Latest Intel",
              values: "🧬 Values & Culture",
              process: "🗂 Process & People",
              questions: "❓ Smart Questions",
              practice: "💬 Practice Questions",
              negotiate: "💰 Negotiation Brief",
              alignment: "🎯 Alignment Assessment",
            };
            const selectedCount = Object.values(recSections).filter(Boolean).length;
            const isReady = recName && selectedCount > 0;
            return (
              <>
                <div className="section" style={{ background: T.fg }}>
                  <div style={{ color: T.gold, fontWeight: 900, fontSize: "1rem", marginBottom: "0.3rem" }}>
                    Send the Truth, Not the Pitch
                  </div>
                  <div style={{ color: "rgba(240,235,224,0.7)", fontSize: "0.8rem", lineHeight: 1.6 }}>
                    The recruiter who gives a candidate the full picture — employer signals, real culture data, and specific prep — is the recruiter that candidate remembers, trusts, and sends referrals to. Use this to build and send a customized dossier package directly to your candidate.
                  </div>
                  <div style={{ marginTop: "0.65rem", padding: "0.5rem 0.75rem", background: `${T.gold}15`, border: `1px solid ${T.gold}35`, borderRadius: 7 }}>
                    <div style={{ color: T.gold, fontSize: "0.7rem", fontFamily: "'DM Mono',monospace", fontWeight: 700 }}>
                      "Skills are 25% of the hiring equation. Environment, culture, and fit are the other 75%. Give candidates what they need to assess all of it." — Jackye Clayton
                    </div>
                  </div>
                </div>

                {/* Shareable Link + Message */}
                <div className="section">
                  <div style={{ fontWeight: 800, fontSize: "1rem", marginBottom: "0.2rem" }}>Share This Dossier</div>
                  <div style={{ color: T.muted, fontSize: "0.74rem", marginBottom: "0.75rem" }}>Copy the link below and send it to your candidate via email or LinkedIn. The message template is ready to paste.</div>
                  <div style={{ marginBottom: "0.65rem" }}>
                    <div style={{ fontSize: "0.62rem", fontWeight: 700, color: T.muted, fontFamily: "'DM Mono',monospace", marginBottom: "0.25rem" }}>DOSSIER LINK</div>
                    <div style={{ display: "flex", gap: "0.4rem" }}>
                      <input readOnly value={dossierUrl}
                        style={{ flex: 1, padding: "0.5rem 0.7rem", border: `1.5px solid ${T.gold}50`, borderRadius: 8, fontFamily: "'DM Mono',monospace", fontSize: "0.75rem", background: T.bg, color: T.fg, outline: "none" }} />
                      <button onClick={() => { navigator.clipboard.writeText(dossierUrl); }}
                        style={{ padding: "0.5rem 0.85rem", background: T.gold, border: "none", borderRadius: 8, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: "0.75rem", color: T.fg, whiteSpace: "nowrap" }}>
                        Copy Link
                      </button>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.62rem", fontWeight: 700, color: T.muted, fontFamily: "'DM Mono',monospace", marginBottom: "0.25rem" }}>SHARE MESSAGE — PASTE INTO EMAIL OR LINKEDIN</div>
                    <div style={{ position: "relative" }}>
                      <textarea readOnly value={shareMessage} rows={7}
                        style={{ width: "100%", padding: "0.65rem 0.75rem", border: `1.5px solid ${T.border}`, borderRadius: 9, fontFamily: "'DM Sans',sans-serif", fontSize: "0.76rem", background: T.bg, color: T.fg, outline: "none", resize: "none", lineHeight: 1.55 }} />
                      <button onClick={() => { navigator.clipboard.writeText(shareMessage); }}
                        style={{ position: "absolute", top: "0.45rem", right: "0.45rem", padding: "0.3rem 0.65rem", background: T.fg, border: "none", borderRadius: 6, cursor: "pointer", fontFamily: "'DM Mono',monospace", fontWeight: 700, fontSize: "0.65rem", color: T.gold }}>
                        Copy Message
                      </button>
                    </div>
                  </div>
                </div>

                {/* Recruiter Info */}
                <div className="section">
                  <div style={{ fontWeight: 800, fontSize: "1rem", marginBottom: "0.2rem" }}>Your Information</div>
                  <div style={{ color: T.muted, fontSize: "0.74rem", marginBottom: "0.75rem" }}>This appears on the dossier as the sending recruiter. It's how your candidate knows this came from you — and how to reach you.</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.55rem" }}>
                    {([
                      ["YOUR NAME *", recName, setRecName, "e.g. Jackye Clayton"] as const,
                      ["TITLE / ROLE", recTitle, setRecTitle, "e.g. Senior Recruiter, Agency Partner"] as const,
                      ["FIRM OR COMPANY", recFirm, setRecFirm, "e.g. Clayton Consulting · WDIWF Partner"] as const,
                      ["YOUR EMAIL", recEmail, setRecEmail, "e.g. jackye@yourfirm.com"] as const,
                    ] as const).map(([label, val, setter, ph]) => (
                      <div key={label}>
                        <div style={{ fontSize: "0.62rem", fontWeight: 700, color: T.muted, fontFamily: "'DM Mono',monospace", marginBottom: "0.25rem" }}>{label}</div>
                        <input value={val} onChange={e => setter(e.target.value)} placeholder={ph}
                          style={{ width: "100%", padding: "0.5rem 0.7rem", border: `1.5px solid ${val ? T.gold + "50" : T.border}`, borderRadius: 8, fontFamily: "'DM Sans',sans-serif", fontSize: "0.8rem", background: T.bg, color: T.fg, outline: "none", transition: "border 0.2s" }} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section selector */}
                <div className="section">
                  <div style={{ fontWeight: 800, fontSize: "1rem", marginBottom: "0.2rem" }}>Customize the Package</div>
                  <div style={{ color: T.muted, fontSize: "0.74rem", marginBottom: "0.75rem" }}>Choose which sections of the dossier to include. The candidate sees exactly what you select. You can always send a lighter version first and share the full dossier after they advance.</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.38rem" }}>
                    {Object.entries(sectionLabels).map(([key, label]) => (
                      <label key={key} style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.42rem 0.6rem", background: recSections[key] ? `${T.green}10` : T.bg, border: `1.5px solid ${recSections[key] ? T.green + "50" : T.border}`, borderRadius: 8, cursor: "pointer", transition: "all 0.2s" }}>
                        <input type="checkbox" checked={recSections[key]} onChange={e => setRecSections(s => ({ ...s, [key]: e.target.checked }))} style={{ accentColor: T.green }} />
                        <span style={{ fontSize: "0.76rem", color: T.fg, fontWeight: recSections[key] ? 600 : 400 }}>{label}</span>
                      </label>
                    ))}
                  </div>
                  <div style={{ marginTop: "0.55rem", color: T.muted, fontSize: "0.68rem", fontFamily: "'DM Mono',monospace" }}>{selectedCount} of {Object.keys(sectionLabels).length} sections included</div>
                </div>

                {/* Personal note */}
                <div className="section">
                  <div style={{ fontWeight: 800, fontSize: "1rem", marginBottom: "0.2rem" }}>Your Note to the Candidate</div>
                  <div style={{ color: T.muted, fontSize: "0.74rem", marginBottom: "0.65rem" }}>This message appears at the top of the dossier. Choose a template or write your own — but make it genuine. Candidates can tell the difference between a recruiter who cares and one who's just placing bodies.</div>
                  <div style={{ display: "flex", gap: "0.38rem", flexWrap: "wrap", marginBottom: "0.65rem" }}>
                    {Object.entries(NOTE_TEMPLATES).map(([key, t]) => (
                      <button key={key} onClick={() => { setRecTemplate(key); setRecNote(t.text); }}
                        style={{ border: `1.5px solid ${recTemplate === key ? T.gold : T.border}`, borderRadius: 50, padding: "0.28rem 0.75rem", fontSize: "0.7rem", fontWeight: 600, cursor: "pointer", color: recTemplate === key ? T.fg : T.muted, background: recTemplate === key ? T.gold : "transparent", transition: "all 0.2s", fontFamily: "'DM Sans',sans-serif" }}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                  <textarea value={recNote} onChange={e => setRecNote(e.target.value)} placeholder="Write a personal message to your candidate... (The best note is honest about what the signals show and why you're still recommending this opportunity.)"
                    rows={6}
                    style={{ width: "100%", padding: "0.65rem 0.75rem", border: `1.5px solid ${recNote ? T.gold + "40" : T.border}`, borderRadius: 9, fontFamily: "'DM Sans',sans-serif", fontSize: "0.78rem", background: T.bg, color: T.fg, outline: "none", resize: "vertical", lineHeight: 1.55 }} />
                </div>

                {/* Disclosure pledge */}
                <div className="section" style={{ border: `1.5px solid ${recDisclosed ? T.green + "55" : T.border}`, background: recDisclosed ? `${T.green}05` : T.card }}>
                  <div style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: "0.25rem" }}>Recruiter Disclosure Pledge</div>
                  <div style={{ color: T.muted, fontSize: "0.74rem", lineHeight: 1.55, marginBottom: "0.65rem" }}>
                    Sending a WDIWF dossier means you're committed to candidate transparency — not just placement velocity. This is what separates a bad-ass recruiter from one who just fills requisitions.
                  </div>
                  <label style={{ display: "flex", alignItems: "flex-start", gap: "0.65rem", cursor: "pointer" }}>
                    <input type="checkbox" checked={recDisclosed} onChange={e => setRecDisclosed(e.target.checked)} style={{ accentColor: T.green, marginTop: "0.1rem", flexShrink: 0 }} />
                    <div style={{ fontSize: "0.78rem", color: T.fg, lineHeight: 1.55 }}>
                      <span style={{ fontWeight: 700 }}>I have reviewed the employer signal data in this dossier</span> and I am disclosing it to my candidate — including the signals that are unfavorable. I am placing this candidate with their full informed consent, not just with their enthusiasm for the opportunity.
                    </div>
                  </label>
                </div>

                {/* Generate / Preview */}
                <div className="section">
                  <div style={{ fontWeight: 800, fontSize: "1rem", marginBottom: "0.65rem" }}>Generate Candidate Brief</div>
                  {!isReady && (
                    <div style={{ padding: "0.55rem 0.75rem", background: `${T.gold}10`, border: `1px solid ${T.gold}30`, borderRadius: 8, marginBottom: "0.65rem" }}>
                      <div style={{ color: T.gold, fontSize: "0.74rem", fontWeight: 600 }}>
                        {!recName ? "Add your name to continue." : "Select at least one dossier section to include."}
                      </div>
                    </div>
                  )}
                  <div style={{ display: "flex", gap: "0.55rem", flexWrap: "wrap" }}>
                    <button onClick={() => isReady && setRecPreview(p => !p)}
                      style={{ flex: 1, minWidth: 160, padding: "0.6rem 1rem", background: isReady ? (recPreview ? T.fg : T.gold) : "#DDDAD2", border: "none", borderRadius: 9, cursor: isReady ? "pointer" : "not-allowed", fontFamily: "'DM Sans',sans-serif", fontWeight: 800, fontSize: "0.82rem", color: isReady ? (recPreview ? T.gold : T.fg) : T.muted, transition: "all 0.2s" }}>
                      {recPreview ? "← Edit Package" : "Preview Candidate Brief →"}
                    </button>
                    <button onClick={() => {}}
                      style={{ flex: 1, minWidth: 160, padding: "0.6rem 1rem", background: isReady && recDisclosed ? T.green : "#DDDAD2", border: "none", borderRadius: 9, cursor: isReady && recDisclosed ? "pointer" : "not-allowed", fontFamily: "'DM Sans',sans-serif", fontWeight: 800, fontSize: "0.82rem", color: isReady && recDisclosed ? "#fff" : T.muted, transition: "all 0.2s" }}>
                      {isReady && recDisclosed ? "📤 Copy Candidate Link" : "Complete Pledge to Send"}
                    </button>
                  </div>
                </div>

                {/* Preview panel */}
                {recPreview && isReady && (
                  <div style={{ border: `2px solid ${T.gold}`, borderRadius: 14, overflow: "hidden" }}>
                    <div style={{ background: T.gold, padding: "0.5rem 1rem" }}>
                      <div style={{ fontWeight: 800, fontSize: "0.72rem", color: T.fg, fontFamily: "'DM Mono',monospace" }}>CANDIDATE PREVIEW — This is what your candidate will receive</div>
                    </div>
                    <div style={{ background: T.fg, padding: "1.1rem 1.25rem" }}>
                      <div style={{ color: T.gold, fontWeight: 900, fontSize: "1.05rem", marginBottom: "0.15rem" }}>WDIWF Interview Dossier</div>
                      <div style={{ color: "rgba(240,235,224,0.5)", fontSize: "0.7rem", fontFamily: "'DM Mono',monospace", marginBottom: "0.75rem" }}>{co.emoji} {co.name} · Prepared by {recName}{recTitle ? `, ${recTitle}` : ""}{recFirm ? ` · ${recFirm}` : ""}</div>
                      {recNote && (
                        <div style={{ background: `${T.gold}15`, border: `1px solid ${T.gold}30`, borderRadius: 10, padding: "0.75rem 0.9rem", marginBottom: "0.75rem" }}>
                          <div style={{ color: T.gold, fontSize: "0.62rem", fontWeight: 800, fontFamily: "'DM Mono',monospace", marginBottom: "0.3rem" }}>A NOTE FROM YOUR RECRUITER</div>
                          <div style={{ color: "rgba(240,235,224,0.85)", fontSize: "0.77rem", lineHeight: 1.6, whiteSpace: "pre-line" }}>{recNote}</div>
                          {recEmail && <div style={{ color: T.gold, fontSize: "0.68rem", marginTop: "0.45rem", fontFamily: "'DM Mono',monospace" }}>Reply: {recEmail}</div>}
                        </div>
                      )}
                      <div style={{ color: "rgba(240,235,224,0.6)", fontSize: "0.7rem", marginBottom: "0.4rem", fontFamily: "'DM Mono',monospace" }}>INCLUDED IN THIS DOSSIER</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", marginBottom: "0.7rem" }}>
                        {Object.entries(sectionLabels).filter(([k]) => recSections[k]).map(([k, label]) => (
                          <div key={k} style={{ background: `${T.green}20`, border: `1px solid ${T.green}40`, borderRadius: 50, padding: "0.2rem 0.6rem", fontSize: "0.67rem", fontWeight: 700, color: T.green, fontFamily: "'DM Mono',monospace" }}>✓ {label}</div>
                        ))}
                      </div>
                      {recDisclosed && (
                        <div style={{ padding: "0.45rem 0.65rem", background: `${T.blue}20`, border: `1px solid ${T.blue}40`, borderRadius: 7 }}>
                          <div style={{ color: T.blue, fontSize: "0.67rem", fontWeight: 700, fontFamily: "'DM Mono',monospace" }}>
                            ✓ FULL DISCLOSURE — Your recruiter has reviewed and disclosed all employer signal data in this dossier, including unfavorable signals. You have everything they have.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </div>
    </>
  );
}
