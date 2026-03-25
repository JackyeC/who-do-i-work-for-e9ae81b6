// HR Tech Ecosystem Data for WDIWF
// This file contains the vendor intelligence data for the HR Tech page

export type VendorRating = "aligns" | "mixed" | "follow-the-money";

export interface HRTechVendor {
  name: string;
  slug: string;
  category: string;
  rating: VendorRating;
  ratingNote?: string;
  ticker?: string;
  overview: string;
  ownership: string;
  politicalSpend?: string;
  lobbying?: string;
  keyFinding: string;
  laborPractices?: string;
  deiStatus?: string;
  govContracts?: string;
  sources: { label: string; url: string }[];
}

export interface PEOwner {
  name: string;
  slug: string;
  rating: VendorRating;
  aum?: string;
  politicalSpend?: string;
  keyFinding: string;
  portfolioHRTech: string[];
  sources: { label: string; url: string }[];
}

export const HR_TECH_VENDORS: HRTechVendor[] = [
  // === FOLLOW THE MONEY ===
  {
    name: "Oracle HCM Cloud",
    slug: "oracle-hcm",
    category: "Enterprise HCM",
    rating: "follow-the-money",
    ticker: "ORCL",
    overview: "Enterprise HR platform from Oracle Corporation. One of the most politically active tech companies in the US.",
    ownership: "Publicly traded. Founded by Larry Ellison (2nd wealthiest person, ~$276B net worth).",
    politicalSpend: "$6.13M total (2024 cycle). Larry Ellison personally gave $1M to Trump-aligned Preserve America PAC.",
    lobbying: "$11.86M/year in federal lobbying — 66 lobbyists, 54 are former government officials.",
    keyFinding: "Ellison's $1M Trump donation. $11.8M/yr lobbying. DHS/ICE cloud infrastructure provider. Fought to win ICE cloud contract. Pentagon JWCC partner. $199M DOJ fraud settlement. $23M SEC bribery settlement.",
    laborPractices: "$199M DOJ fraud settlement (2011). $23M SEC Foreign Corrupt Practices Act settlement for bribery (Turkey, UAE, India).",
    deiStatus: "No formal rollback announced, but Ellison's Trump alignment raises questions about direction.",
    govContracts: "Pentagon JWCC ($9B cloud contract). DHS/ICE authorized cloud provider. Fought exclusion from ICE cloud contract. $1B+ annual federal healthcare contracts.",
    sources: [
      { label: "OpenSecrets — Oracle Corp", url: "https://www.opensecrets.org/orgs/oracle-corp/summary?id=D000000422" },
      { label: "OpenSecrets — Oracle TikTok Lobbying", url: "https://www.opensecrets.org/news/2025/09/oracle-invested-millions-in-government-influence-before-winning-a-major-stake-in-tiktok/" },
      { label: "Dirt Diggers Digest", url: "https://dirtdiggersdigest.substack.com/p/the-ellisons-prosper-by-aligning" },
      { label: "AFSC — High Tech Surveillance", url: "https://investigate.afsc.org/high-tech-surveillance-immigrants" },
    ],
  },
  {
    name: "Salesforce",
    slug: "salesforce",
    category: "Employee Experience / CRM",
    rating: "follow-the-money",
    ticker: "CRM",
    overview: "CRM and enterprise cloud platform with HR tools (Slack, Work.com, Agentforce). CEO Marc Benioff positions as 'values-driven' while pursuing government enforcement contracts.",
    ownership: "Publicly traded. CEO Marc Benioff.",
    politicalSpend: "Large corporate and individual contributions. Historically Democrat-leaning.",
    lobbying: "Significant enterprise lobbying operations.",
    keyFinding: "Pitched AI platform to ICE for recruiting 10,000 agents and reviewing tip-line submissions. 1,400+ employees signed open letter opposing ICE contracts. Benioff joked about ICE watching international employees at company all-hands. Maintained CBP contract despite 650+ employee petition in 2018.",
    laborPractices: "RAICES refused Salesforce's $250K donation, calling it a 'hand-washing operation' after Salesforce maintained its CBP contract.",
    deiStatus: "Historically strong DEI advocate; direction questionable given Trump administration courtship.",
    govContracts: "Active CBP contract. Pitched Agentforce AI to ICE. Offered Slack discounts to government entities.",
    sources: [
      { label: "CNBC — Employee Letter on ICE", url: "https://www.cnbc.com/2026/02/10/salesforce-employees-call-on-ceo-benioff-to-cancel-ice-opportunities.html" },
      { label: "Wired — Benioff ICE Comments", url: "https://www.wired.com/story/letter-salesforce-employees-sent-after-marc-benioffs-ice-comments/" },
    ],
  },
  {
    name: "HireVue",
    slug: "hirevue",
    category: "AI Hiring Tools",
    rating: "follow-the-money",
    ratingNote: "Worker impact",
    overview: "Video interviewing and AI hiring assessment platform. Used by 700+ organizations. Has processed millions of candidate assessments using opaque algorithmic scoring.",
    ownership: "Private. Backed by Goldman Sachs Growth Equity, Sequoia Capital, TCV.",
    keyFinding: "FTC complaint filed for 'unfair and deceptive' AI practices — scoring candidates on facial analysis, voice patterns, word choice. Dropped facial recognition after public pressure but continues biometric voice/behavior analysis. EEOC and DOJ warned its tools may violate ADA. Collects tens of thousands of data points per candidate with no accountability.",
    laborPractices: "EPIC FTC complaint (2019) for opaque, unaudited AI scoring. Dropped facial analysis (2021) but continues biometric voice analysis. EEOC/DOJ guidance specifically highlighted HireVue.",
    sources: [
      { label: "Seattle Times — FTC Complaint", url: "https://www.seattletimes.com/business/rights-group-files-federal-complaint-against-ai-hiring-firm-hirevue-citing-unfair-and-deceptive-practices/" },
      { label: "EPIC — Facial Recognition Halted", url: "https://epic.org/hirevue-facing-ftc-complaint-from-epic-halts-use-of-facial-recognition/" },
      { label: "NPR — EEOC/DOJ AI Warning", url: "https://www.npr.org/2022/05/12/1098601458/artificial-intelligence-job-discrimination-disabilities/" },
    ],
  },
  {
    name: "Cornerstone OnDemand",
    slug: "cornerstone",
    category: "Learning & Talent Management",
    rating: "follow-the-money",
    ratingNote: "PE ownership",
    overview: "Cloud talent management (learning, performance, succession). Taken private by Clearlake Capital in 2021 for $5.8B.",
    ownership: "Clearlake Capital (PE). Vector Capital minority stake.",
    keyFinding: "History of aggressive, poorly managed layoffs — including notifying an employee while on paternity leave. Cut 60% of sales RVPs and 80% of solution architects from recently acquired Saba. PE extraction model drives cost-cutting over worker welfare.",
    laborPractices: "6% workforce cut (2017). Abruptly laid off 60% of Saba sales RVPs and 80% of solution architects post-acquisition. At least one person notified while on paternity leave.",
    sources: [
      { label: "ERE — Cornerstone Layoffs", url: "https://www.ere.net/articles/cornerstone-ondemand-shiftgig-layoffs" },
      { label: "OpenSecrets — Clearlake Capital", url: "https://www.opensecrets.org/orgs/clearlake-capital-group/summary?all=A&id=D000072167" },
    ],
  },

  // === MIXED / NEUTRAL ===
  {
    name: "ADP",
    slug: "adp",
    category: "Enterprise Payroll & HCM",
    rating: "mixed",
    ticker: "ADP",
    overview: "One of the world's largest payroll companies. Processes payroll for approximately 1 in 6 US workers. Not actively anti-labor, but its lobbying shapes rules to benefit its own products.",
    ownership: "Publicly traded. Major institutional shareholders: Vanguard, BlackRock, State Street.",
    politicalSpend: "$192,575 (2024 cycle) — predominantly Democrat-leaning at individual level.",
    lobbying: "$620K (2024). Lobbies on payroll tax administration, worker classification. Positioned as 'CARES Act navigator' during COVID to influence Treasury guidance favoring its compliance products.",
    keyFinding: "Described as 'Treasury whisperers' — shaped IRS/Treasury guidance during COVID to benefit its own compliance products. $620K lobbying. No smoking guns, but size and lobbying tilt rules toward large payroll processors.",
    laborPractices: "California Supreme Court ruled ADP not liable as employer of payroll clients' workers — limiting worker recourse.",
    deiStatus: "Standard corporate DEI programs maintained. Publishes annual ESG report.",
    sources: [
      { label: "OpenSecrets — ADP", url: "https://www.opensecrets.org/orgs/automatic-data-processing-inc/summary?id=D000031719" },
      { label: "Snark Attack HR Tech", url: "https://mattcharney.com/2025/10/15/the-system-is-broken-hr-technology-and-trump/" },
    ],
  },
  {
    name: "Workday",
    slug: "workday",
    category: "Enterprise HCM",
    rating: "mixed",
    ratingNote: "Trending toward Follow the Money on AI policy",
    ticker: "WDAY",
    overview: "Major cloud HCM and financial management software. Markets itself as ethical and employee-first. Its lobbying to weaken AI regulation contradicts that brand.",
    ownership: "Publicly traded. Co-founded by Dave Duffield and Aneel Bhusri.",
    politicalSpend: "$385,509 from individuals. Gave $120K each to Democratic and Republican Governors Associations. $1.36M lobbying.",
    lobbying: "$1.36M (2024). Aggressively promoting model AI legislation that civil liberties advocates say creates loopholes protecting companies from accountability. Model bills remove workers' right to sue and allow self-auditing.",
    keyFinding: "Lobbying to gut AI regulation in 6+ states — bills remove workers' right to sue, allow self-auditing instead of independent audits. Meanwhile facing Mobley v. Workday class action alleging AI hiring discrimination against Black, disabled, and older applicants. EEOC filed amicus brief supporting plaintiffs.",
    laborPractices: "Mobley v. Workday: class action alleging AI-based hiring discrimination. Judge granted conditional ADEA certification covering potentially millions of applicants. Ordered Workday to identify all employers using HiredScore AI. Laid off ~1,750 (2025) and ~375 (2026).",
    sources: [
      { label: "The Record — Workday AI Legislation", url: "https://therecord.media/human-resources-artificial-intelligence-state-legislation-workday" },
      { label: "CDF Labor Law — Mobley v. Workday", url: "https://www.callaborlaw.com/entry/federal-court-grants-preliminary-certification-in-landmark-ai-hiring-bias-case" },
      { label: "HR Dive — HiredScore AI Ruling", url: "https://www.hrdive.com/news/workday-must-supply-list-of-employers-who-enabled-hiredscore-ai/756506/" },
      { label: "OpenSecrets — Workday", url: "https://www.opensecrets.org/orgs/workday-inc/summary?id=D000058709" },
    ],
  },
  {
    name: "UKG",
    slug: "ukg",
    category: "Workforce Management & HCM",
    rating: "mixed",
    overview: "Formed by merger of Kronos and Ultimate Software (2020). Provides workforce management, scheduling, and HCM. The Kronos ransomware attack affected millions of workers.",
    ownership: "Private. Owned by Hellman & Friedman (lead) and Blackstone. CPP Investments minority.",
    keyFinding: "Owned by Blackstone ($48M political spending, child labor scandal, union-busting). Kronos ransomware outage (2021) caused widespread wage theft — millions of workers weren't paid correctly while UKG continued collecting fees. Class action settlements: Coca-Cola $3M, Honda $2.3M, dozens more.",
    laborPractices: "The 2021 Kronos ransomware attack took systems offline for weeks. Workers were underpaid, missed overtime, or paid on estimates. Settlements reveal workers — not the vendor — absorbed the cost.",
    sources: [
      { label: "Top Class Actions — Coca-Cola Settlement", url: "https://topclassactions.com/lawsuit-settlements/employment-labor/coca-cola-class-action-claims-workers-not-paid-correctly-following-kronos-hack/" },
      { label: "HR Dive — Honda Settlement", url: "https://www.hrdive.com/news/honda-agrees-to-23-million-dollar-settlement-kronos-outage-lawsuits/814177/" },
      { label: "OpenSecrets — Blackstone", url: "https://www.opensecrets.org/orgs/blackstone-group/summary?id=D000021873" },
    ],
  },
  {
    name: "SAP SuccessFactors",
    slug: "sap-successfactors",
    category: "Enterprise HCM",
    rating: "mixed",
    ticker: "SAP",
    overview: "Enterprise HCM software from German multinational SAP SE. Significant US federal government presence.",
    ownership: "Publicly traded (NYSE: SAP). No PE ownership. Hasso Plattner founding family.",
    politicalSpend: "~$640K total (2024). SAP America PAC: $151K. Predominantly Democrat-leaning.",
    lobbying: "$2.72M (2024). 47 lobbyists, 32 are revolving-door former government officials. SAP National Security Services: $75K additional.",
    keyFinding: "$2.72M lobbying with 32 revolving-door lobbyists. Fieldglass product helps agencies use contingent labor in ways that may reduce worker protections. National security subsidiary has defense contracts.",
    sources: [
      { label: "OpenSecrets — SAP SE", url: "https://www.opensecrets.org/orgs/sap-se/summary?id=D000043247" },
    ],
  },
  {
    name: "Microsoft / LinkedIn",
    slug: "microsoft-linkedin",
    category: "Enterprise / Professional Network",
    rating: "mixed",
    ticker: "MSFT",
    overview: "Owns LinkedIn (world's largest professional network) and Microsoft Viva (employee experience). One of the largest tech political spenders.",
    ownership: "Publicly traded.",
    politicalSpend: "$14.67M (2024 cycle) — one of the largest tech political spenders. Strongly Democrat-leaning but maintains GOP giving. PAC: $789K.",
    lobbying: "$10.35M (2024). LinkedIn lobbied separately: $145K. Issues: AI regulation, data privacy, H-1B, antitrust.",
    keyFinding: "$14.67M in political spending. Maintained $19.4M ICE cloud contract despite 100+ employee protests and 300K petition signatures. Azure is DHS-authorized for sensitive ICE data. Satya Nadella called family separation 'abhorrent' but kept the contract.",
    laborPractices: "Maintained ICE cloud contract despite employee and public pressure. CEO's words contradicted by company's actions.",
    govContracts: "One of largest US government cloud providers. Active ICE/DHS infrastructure. Pentagon JWCC partner.",
    sources: [
      { label: "OpenSecrets — Microsoft", url: "https://www.opensecrets.org/orgs/microsoft-corp/summary?id=d000000115" },
      { label: "NYT — Microsoft ICE Contract", url: "https://www.nytimes.com/2018/06/19/technology/tech-companies-immigration-border.html" },
      { label: "GeekWire — 300K Signatures", url: "https://www.geekwire.com/2018/immigration-activists-deliver-300k-signatures-microsoft-hq-demanding-end-ice-contract/" },
    ],
  },
  {
    name: "Ceridian / Dayforce",
    slug: "dayforce",
    category: "HCM & Payroll",
    rating: "mixed",
    ratingNote: "Now owned by Thoma Bravo — watch this space",
    overview: "Global HCM/payroll platform. Was relatively benign until Thoma Bravo acquired it for $12.3B in February 2026.",
    ownership: "Thoma Bravo (PE) — acquired Feb 2026. Abu Dhabi Investment Authority minority investor.",
    politicalSpend: "~$25K (2024, pre-acquisition). Predominantly Democrat-leaning.",
    keyFinding: "Thoma Bravo acquisition is the story. Thoma Bravo: 67% Republican donations, owns RealPage (DOJ antitrust probe for AI rent-fixing), lobbying DOJ to stop investigation. Dayforce Wallet earns interchange revenue from workers using earned wage access — monetizing financial stress.",
    sources: [
      { label: "Thoma Bravo — Dayforce Acquisition", url: "https://www.thomabravo.com/press-releases/thoma-bravo-completes-acquisition-of-dayforce" },
      { label: "OpenSecrets — Dayforce", url: "https://www.opensecrets.org/orgs/dayforce-inc/summary?id=D000024685" },
      { label: "OpenSecrets — Thoma Bravo", url: "https://www.opensecrets.org/orgs/thoma-bravo-lp/totals?cycle=A&id=D000063704" },
    ],
  },
  {
    name: "Paycom",
    slug: "paycom",
    category: "Mid-Market Payroll & HCM",
    rating: "mixed",
    ticker: "PAYC",
    overview: "Cloud-based payroll and HR. CEO Chad Richison signed the Giving Pledge but company has NLRB complaints.",
    ownership: "Publicly traded. Founded by Chad Richison (Oklahoma).",
    politicalSpend: "$33,556 (2024). ~80% Democrat via Hill Harper donation.",
    keyFinding: "NLRB complaint: charges included discharge for concerted activities, coercive statements (threats), coercive rules, and surveillance. Employees describe high-pressure, toxic sales culture on Glassdoor/Reddit.",
    laborPractices: "NLRB Case 14-CA-309672: charges of retaliation, coercive statements, surveillance. Resolved 2024.",
    sources: [
      { label: "OpenSecrets — Paycom", url: "https://www.opensecrets.org/orgs/paycom-software/summary?id=D000074339" },
      { label: "NLRB Case", url: "https://www.nlrb.gov/case/14-CA-309672" },
    ],
  },
  {
    name: "Paychex",
    slug: "paychex",
    category: "Mid-Market Payroll",
    rating: "mixed",
    ticker: "PAYX",
    overview: "Second only to ADP in payroll market share. Processes payroll for political campaigns across the spectrum ($26M+ in 2024 cycle).",
    ownership: "Publicly traded. Founded by Tom Golisano.",
    politicalSpend: "$139,622 from individuals. $810K lobbying (2024).",
    lobbying: "$810K–$840K/year. Like ADP, positioned as 'CARES Act navigator' during COVID to shape Treasury guidance.",
    keyFinding: "$810K lobbying. Like ADP, shaped COVID Treasury guidance to benefit own compliance products. Founder Tom Golisano is a major bipartisan political donor ($1M to DNC convention 2008, $5M+ to bipartisan NY groups).",
    sources: [
      { label: "OpenSecrets — Paychex", url: "https://www.opensecrets.org/orgs/paychex-inc/summary?id=D000069826" },
      { label: "InfluenceWatch — Tom Golisano", url: "https://www.influencewatch.org/person/tom-golisano/" },
    ],
  },
  {
    name: "ServiceNow",
    slug: "servicenow",
    category: "HR Service Delivery",
    rating: "mixed",
    ticker: "NOW",
    overview: "Enterprise IT service management with growing HR module. $1.6M in lobbying. Government IT contracts.",
    ownership: "Publicly traded.",
    politicalSpend: "$293,862 (2024). Skews moderately Democratic.",
    lobbying: "$1.6M (2024).",
    keyFinding: "$1.6M lobbying on enterprise software and government IT modernization. Government discounts on software. Low concern on labor issues specifically.",
    sources: [
      { label: "OpenSecrets — ServiceNow", url: "https://www.opensecrets.org/orgs/servicenow/summary?id=D000073991" },
    ],
  },
  {
    name: "Rippling",
    slug: "rippling",
    category: "HR / IT / Finance Platform",
    rating: "mixed",
    overview: "HR, IT, and finance platform. CEO publicly opposed Trump. But backed by Founders Fund (Peter Thiel).",
    ownership: "Private. Sequoia, Kleiner Perkins, Founders Fund (Peter Thiel), Goldman Sachs.",
    keyFinding: "CEO Parker Conrad publicly backed Harris in 2024 and called tech execs supporting Trump 'very stupid.' But Founders Fund (Peter Thiel, major Trump supporter) is an investor. Also embroiled in RICO lawsuit alleging Deel planted a corporate spy. Valued at $16.8B.",
    sources: [
      { label: "SFGate — Parker Conrad on Trump", url: "https://www.sfgate.com/tech/article/ceo-parker-conrad-rippling-newcomer-19895194.php" },
      { label: "TechCrunch — Rippling/Deel Spy Scandal", url: "https://techcrunch.com/2026/01/23/the-rippling-deel-corporate-spying-scandal-may-have-taken-another-wild-turn/" },
    ],
  },
  {
    name: "Eightfold AI",
    slug: "eightfold-ai",
    category: "AI Talent Intelligence",
    rating: "mixed",
    overview: "AI talent intelligence platform using LLMs for skills-based matching. Deep workforce analytics capabilities.",
    ownership: "Private. SoftBank Vision Fund (lead), General Atlantic, Capital One Ventures.",
    keyFinding: "SoftBank CEO Masayoshi Son made $100B investment pledge to Trump after 2024 election. Eightfold's AI can identify workers at risk of leaving, flag skill gaps — tools that can optimize workforce decisions in ways that may not benefit workers.",
    sources: [
      { label: "Eightfold AI", url: "https://eightfold.ai/" },
    ],
  },
  {
    name: "iCIMS",
    slug: "icims",
    category: "Applicant Tracking System",
    rating: "mixed",
    overview: "Cloud-based recruiting platform. Shaped primarily by Vista Equity Partners ownership.",
    ownership: "Vista Equity Partners (majority). TA Associates (minority).",
    keyFinding: "Vista Equity Partners majority ownership. Vista is Democrat-leaning but uses aggressive PE extraction tactics at portfolio companies. No major worker harms identified at iCIMS specifically.",
    sources: [
      { label: "iCIMS — Transaction Complete", url: "https://www.icims.com/company/newsroom/transactioncomplete2022/" },
      { label: "OpenSecrets — Vista Equity", url: "https://www.opensecrets.org/orgs/vista-equity-partners/summary?id=D000030850" },
    ],
  },

  // === ALIGNS WITH WORKERS ===
  {
    name: "Greenhouse",
    slug: "greenhouse",
    category: "Applicant Tracking System",
    rating: "aligns",
    overview: "Recruiting software built around structured, equitable hiring. Product philosophy actively supports fairer hiring outcomes by design.",
    ownership: "Private. Investors: Thrive Capital, Iconiq Growth.",
    keyFinding: "Anti-bias structured hiring built into the product. Vocal proponent of reducing discrimination in hiring. Extensive DEI resources. Minimal political footprint. No government enforcement contracts.",
    deiStatus: "Actively promotes DEI in product and marketing. Structured hiring methodology designed to reduce bias.",
    sources: [
      { label: "Greenhouse — DEI Resources", url: "https://www.greenhouse.com/resources/dei" },
    ],
  },
  {
    name: "BambooHR",
    slug: "bamboohr",
    category: "SMB HR Platform",
    rating: "aligns",
    overview: "Cloud HR software for small and medium businesses. Known for employee-friendly culture and strong DEI commitment.",
    ownership: "Evergreen Coast Capital (PE). Previously owned by Vista Equity Partners.",
    keyFinding: "Notably employee-friendly brand and culture. Strong Glassdoor ratings. Active DEI programs. No NLRB complaints. No government enforcement contracts. No significant lobbying.",
    deiStatus: "Active DEI promotion in platform and marketing. Extensive DEI resources and glossary.",
    sources: [
      { label: "BambooHR", url: "https://www.bamboohr.com/" },
    ],
  },
  {
    name: "Gusto",
    slug: "gusto",
    category: "SMB Payroll & Benefits",
    rating: "aligns",
    overview: "Cloud payroll, benefits, and HR for small businesses. Product philosophy centered on making benefits accessible to workers who might otherwise lack them.",
    ownership: "Private. General Atlantic, T. Rowe Price, Dragoneer. No single PE firm controls.",
    politicalSpend: "$46,915 (2024). Predominantly Democrat-leaning. Donated to Forward Party (bipartisan centrist).",
    lobbying: "$170K (2024) — on small business payroll issues.",
    keyFinding: "Worker-aligned product: makes payroll and benefits accessible to small business employees. Democratic-leaning. Modest lobbying on small business policy. No government enforcement contracts. No NLRB complaints.",
    deiStatus: "Active DEI commitments. No rollbacks.",
    sources: [
      { label: "OpenSecrets — Gusto", url: "https://www.opensecrets.org/orgs/gusto-inc/summary?id=D000074913" },
    ],
  },
  {
    name: "Paylocity",
    slug: "paylocity",
    category: "Mid-Market Payroll & HCM",
    rating: "aligns",
    ticker: "PCTY",
    overview: "Cloud payroll and HCM company. No federal lobbying. No red flags.",
    ownership: "Publicly traded.",
    politicalSpend: "$33,404 (2024). Democrat-leaning. No PAC.",
    keyFinding: "No federal lobbying. No NLRB complaints. No government enforcement contracts. Democratic-leaning individual donations. Clean record.",
    deiStatus: "No rollbacks announced.",
    sources: [
      { label: "OpenSecrets — Paylocity", url: "https://www.opensecrets.org/orgs/paylocity/summary?id=D000070098" },
    ],
  },
  {
    name: "IBM Watson Talent",
    slug: "ibm",
    category: "Enterprise AI / Talent Analytics",
    rating: "aligns",
    ratingNote: "On political spending — DEI rollback is concerning",
    ticker: "IBM",
    overview: "IBM has a century-old policy of never donating to political candidates — no PAC, no candidate donations. Genuinely distinctive in corporate America.",
    ownership: "Publicly traded.",
    keyFinding: "Century-old no-PAC, no-candidate-donations policy instated by founder Thomas J. Watson. Current CEO Arvind Krishna maintains the policy. However, IBM rolled back DEI supplier diversity targets in 2025, shifting away from race/gender benchmarks.",
    deiStatus: "Rolled back supplier diversity objectives (April 2025) — moved away from race/gender targets, ceased linking executive pay to diversity hiring benchmarks.",
    sources: [
      { label: "NYT — IBM No Corporate Donations", url: "https://www.nytimes.com/2021/01/12/business/dealbook/corporate-donations-ibm.html" },
      { label: "Forbes — IBM DEI Rollback", url: "https://www.forbes.com/sites/conormurray/2025/04/11/ibm-reportedly-walks-back-diversity-policies-citing-inherent-tensions-here-are-all-the-companies-rolling-back-dei-programs/" },
    ],
  },
  {
    name: "Beamery",
    slug: "beamery",
    category: "AI Talent Operating System",
    rating: "aligns",
    overview: "AI talent platform focusing on skills development, upskilling, and workforce adaptation. Most worker-aligned philosophy among AI recruiting tools.",
    ownership: "Private. EQT Ventures, Index Ventures.",
    keyFinding: "Mission explicitly includes fostering diverse work environments and supporting upskilling/redeployment. 2025 Workforce Intelligence Suite addresses helping organizations adapt worker skills rather than eliminate roles. No red flags identified.",
    deiStatus: "Explicit product commitment to diverse work environments and worker development.",
    sources: [
      { label: "Beamery", url: "https://beamery.com/" },
    ],
  },
];

export const PE_OWNERS: PEOwner[] = [
  {
    name: "Blackstone",
    slug: "blackstone",
    rating: "follow-the-money",
    aum: "$1T+",
    politicalSpend: "$48.6M (2024 cycle) — one of the largest single-organization political spenders in the US. Strongly Republican-leaning. CEO Steve Schwarzman is a major Trump ally.",
    keyFinding: "Child labor scandal at portfolio company PSSI — over 100 children employed in dangerous conditions at meat processing plants. $48M+ political spending (GOP-heavy). Lobbying for PE access to worker 401(k) retirement savings. Union-busting across portfolio — NY State Comptroller sent formal warning. Co-owns UKG.",
    portfolioHRTech: ["UKG"],
    sources: [
      { label: "OpenSecrets — Blackstone", url: "https://www.opensecrets.org/orgs/blackstone-group/summary?id=D000021873" },
      { label: "PESP — Child Labor Scandal", url: "https://pestakeholder.org/news/labor-issues-at-blackstone-company-generates-negative-attention/" },
      { label: "New Republic — Schwarzman/Trump", url: "https://newrepublic.com/article/201833/trump-oligarchy-stephen-schwarzman-economy" },
    ],
  },
  {
    name: "Thoma Bravo",
    slug: "thoma-bravo",
    rating: "follow-the-money",
    aum: "$150B+",
    politicalSpend: "$992,681 (2024). 67.63% to Republicans.",
    keyFinding: "Now owns Dayforce (payroll for millions). Also owns RealPage — under DOJ antitrust investigation for AI-enabled rent-fixing affecting millions of renters. Spent $420K lobbying DOJ to ease antitrust probe. World's largest software-focused PE firm.",
    portfolioHRTech: ["Dayforce (formerly Ceridian)"],
    sources: [
      { label: "OpenSecrets — Thoma Bravo", url: "https://www.opensecrets.org/orgs/thoma-bravo-lp/totals?cycle=A&id=D000063704" },
      { label: "Revolving Door Project — RealPage Lobbying", url: "https://therevolvingdoorproject.org/realpage-thoma-bravo-lobbying/" },
    ],
  },
  {
    name: "Hellman & Friedman",
    slug: "hellman-friedman",
    rating: "mixed",
    aum: "~$100B+",
    politicalSpend: "$829K (2024). Classic PE hedge: $50K to Lincoln Project (anti-Trump) AND $50K to MAGA Inc (pro-Trump).",
    keyFinding: "Co-owns UKG. Gave $50K to anti-Trump Lincoln Project and $50K to pro-Trump MAGA Inc simultaneously — a textbook PE hedge. Benefited from Kronos/UKG whose failure caused widespread wage theft. Led the $11B acquisition of Ultimate Software that created UKG.",
    portfolioHRTech: ["UKG"],
    sources: [
      { label: "OpenSecrets — Hellman & Friedman", url: "https://www.opensecrets.org/orgs/hellman-friedman/summary?id=D000034411" },
    ],
  },
  {
    name: "Vista Equity Partners",
    slug: "vista-equity",
    rating: "mixed",
    aum: "~$96B",
    politicalSpend: "$380K (2024). >80% to Democrats.",
    keyFinding: "Owns iCIMS. CEO Robert F. Smith pledged to pay Morehouse College Class of 2019 student loan debt — widely praised. However, Smith entered deferred prosecution agreement with DOJ for tax evasion, paying $139M in back taxes. PE model can conflict with worker interests regardless of politics.",
    portfolioHRTech: ["iCIMS"],
    sources: [
      { label: "OpenSecrets — Vista Equity", url: "https://www.opensecrets.org/orgs/vista-equity-partners/summary?id=D000030850" },
    ],
  },
];

export interface LaborDataPoint {
  label: string;
  value: string;
  context: string;
  source: string;
  sourceUrl: string;
  trend: "negative" | "neutral" | "positive" | "alert";
}

export const LABOR_MARKET_DATA: LaborDataPoint[] = [
  {
    label: "Jobs Lost (Feb 2026)",
    value: "-92,000",
    context: "Economists expected a gain of +50,000. A miss of ~150,000 jobs.",
    source: "Bureau of Labor Statistics",
    sourceUrl: "https://www.bls.gov/news.release/empsit.nr0.htm",
    trend: "negative",
  },
  {
    label: "Workers Struggling",
    value: "49%",
    context: "More workers struggling than thriving for the first time in Gallup's history.",
    source: "Gallup Workforce Wellbeing",
    sourceUrl: "https://www.gallup.com/workplace/703280/worker-thriving-declines-job-market-pessimism-grows.aspx",
    trend: "negative",
  },
  {
    label: "Employee Engagement",
    value: "31%",
    context: "Lowest in a decade. ~3.2 million fewer engaged workers year-over-year.",
    source: "Gallup",
    sourceUrl: "https://www.gallup.com/workplace/654911/employee-engagement-sinks-year-low.aspx",
    trend: "negative",
  },
  {
    label: "Feel Stuck at Work",
    value: "30%",
    context: "69% can't afford to lose their pay/benefits. 51% can't find comparable positions.",
    source: "Gallup — Great Detachment",
    sourceUrl: "https://www.gallup.com/workplace/653711/great-detachment-why-employees-feel-stuck.aspx",
    trend: "alert",
  },
  {
    label: "Healthcare: % of All Job Gains",
    value: "109%",
    context: "One sector making up for all job losses everywhere else — and then some.",
    source: "ADP Research",
    sourceUrl: "https://www.adpresearch.com/health-care-is-reshaping-the-labor-market/",
    trend: "neutral",
  },
  {
    label: "AI Replacing Zero Roles",
    value: "50%",
    context: "Half of companies say AI will not replace any roles or responsibilities in 2026.",
    source: "NBER / 750 CFOs",
    sourceUrl: "https://www.nber.org/papers/w34984",
    trend: "positive",
  },
  {
    label: "Tech Jobs Lost (2025)",
    value: "-33,624",
    context: "But 2026 projection: +185K jobs. AI-skilled roles leading the rebound.",
    source: "CompTIA State of Tech Workforce",
    sourceUrl: "https://www.comptia.org/en-us/resources/research/state-of-the-tech-workforce-2026/",
    trend: "neutral",
  },
  {
    label: "Unemployment Rate",
    value: "4.4%",
    context: "Up 0.1pp. Nearly a full percent above the recent low. Long-term unemployed: 1.9M.",
    source: "BLS",
    sourceUrl: "https://www.bls.gov/news.release/empsit.nr0.htm",
    trend: "negative",
  },
];

export const VENDOR_CATEGORIES = [
  "All",
  "Enterprise HCM",
  "Mid-Market Payroll & HCM",
  "Applicant Tracking System",
  "AI Hiring Tools",
  "SMB HR Platform",
  "SMB Payroll & Benefits",
  "Employee Experience / CRM",
  "Enterprise / Professional Network",
  "Learning & Talent Management",
  "HR Service Delivery",
  "Enterprise AI / Talent Analytics",
  "AI Talent Intelligence",
  "AI Talent Operating System",
  "HR / IT / Finance Platform",
  "HCM & Payroll",
] as const;
