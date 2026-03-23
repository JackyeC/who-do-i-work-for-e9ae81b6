import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { usePageSEO } from "@/hooks/use-page-seo";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PacCycleSummary {
  metric: string;
  amount: string;
  color?: "red" | "blue";
}

interface BillSponsor {
  member: string;
  district: string;
  role: string;
  date: string;
  highlight?: boolean;
}

interface HR349Sponsor {
  member: string;
  party: string;
  metaPac: string;
  note: string;
  confirmed?: boolean;
  highlight?: boolean;
}

interface LobbyingYear {
  year: string;
  totalSpent: string;
  yoyChange: string;
  changeColor?: "red" | "amber";
}

interface BillLobbied {
  bill: string;
  topic: string;
  reports: string;
}

interface ProgramDismantled {
  program: string;
  status: string;
  badgeColor?: "red";
}

interface TimelineEntry {
  date: string;
  dotColor: "red" | "amber" | "green" | "muted";
  title: string;
  description: string;
  sourceUrl?: string;
  sourceLabel?: string;
}

interface WarnFiling {
  location: string;
  employees: string;
  noticeDate: string;
  layoffDate: string;
}

interface FederalContract {
  contract: string;
  agency: string;
  amount: string;
  description: string;
}

interface AdfScore {
  category: string;
  score: string;
  highlight?: boolean;
  color?: "red";
}

interface TenKFiling {
  year: string;
  yearDetail: string;
  status: string;
  statusType: "confirmed" | "reduced" | "dismantled";
  keyChanges: string;
}

interface LobbyingFirm {
  firm: string;
  amount: string;
  lobbyists: string;
}

interface ReceiptRow {
  category: string;
  finding: string;
  status: "confirmed" | "data-gap" | "research-incomplete";
}

interface DataGapRow {
  priority: "high" | "medium" | "lower";
  gap: string;
  sourceLabel: string;
  sourceUrl: string;
}

interface SourceEntry {
  label: string;
  links: { text: string; url: string }[];
}

interface QuoteEntry {
  text: string;
  source: string;
  sourceUrl?: string;
  accent?: "red";
}

interface MetaReportData {
  slug: string;
  companyName: string;
  ticker: string;
  location: string;
  products: string;
  reportDate: string;
  stats: { label: string; value: string; detail: string; trend?: "down" }[];
  integrityGap: {
    quotes: QuoteEntry[];
    diversityNote: string;
    pacName: string;
    fecId: string;
    treasurer: string;
    pacCycle: PacCycleSummary[];
    pacSourceUrl: string;
    pacSourceLabel: string;
    pacTiltNote: string;
    hr4673: {
      intro: string;
      sponsors: BillSponsor[];
      sourceUrl: string;
      sourceLabel: string;
      keyFinding: string;
      dataGap: string;
      dataGapUrl: string;
    };
    hr349: {
      intro: string;
      sponsors: HR349Sponsor[];
      sourceUrls: { text: string; url: string }[];
    };
    lobbying: {
      years: LobbyingYear[];
      yearSourceUrls: { text: string; url: string }[];
      dailySpendNote: string;
      dailySpendSourceUrl: string;
      dailySpendSourceLabel: string;
      billsLobbied: BillLobbied[];
      billsSourceUrl: string;
      billsSourceLabel: string;
    };
  };
  laborImpact: {
    deiDate: string;
    announcementVehicle: string;
    deiQuotes: QuoteEntry[];
    programsDismantled: ProgramDismantled[];
    maxineWilliamsNote: string;
    maxineWilliamsSourceUrl: string;
    starbuckPreTargeting: string;
    starbuckSourceUrl: string;
    diversityReportHistory: string;
    diversityReportSourceUrl: string;
    layoffTimeline: TimelineEntry[];
    warnFilings: WarnFiling[];
    warnSourceUrl: string;
    warnSourceLabel: string;
    totalImpact: string;
  };
  safetyAlert: {
    federalContracts: FederalContract[];
    contractSourceUrl: string;
    contractSourceLabel: string;
    contractAdditionalNote: string;
    contractRelevanceNote: string;
    adfScores: AdfScore[];
    adfSourceUrls: { text: string; url: string }[];
    adfTrendNote: string;
    tenKFilings: TenKFiling[];
    tenKQuote: QuoteEntry;
    tenKSourceUrls: { text: string; url: string }[];
    starbuckTimeline: TimelineEntry[];
    starbuckKeyFinding: string;
  };
  connectedDots: {
    lobbyingOverview: string;
    lobbyingFirms: LobbyingFirm[];
    lobbyingFirmsSourceUrl: string;
    lobbyingFirmsSourceLabel: string;
    notable2026Hires: string;
    aiPreemption: string[];
    aiPreemptionKeyFinding: string;
    aiPreemptionDataGap: string;
    aiPreemptionDataGapUrl: string;
  };
  receiptsAtAGlance: ReceiptRow[];
  dataGaps: DataGapRow[];
  sources: SourceEntry[];
}

// ---------------------------------------------------------------------------
// Full Meta Report Data
// ---------------------------------------------------------------------------

const META_REPORT: MetaReportData = {
  slug: "meta",
  companyName: "META PLATFORMS, INC.",
  ticker: "NASDAQ: META",
  location: "Menlo Park, CA",
  products: "Facebook, Instagram, WhatsApp, Threads",
  reportDate: "March 2026",
  stats: [
    { label: "PAC Raised", value: "$341,607", detail: "2023–24 cycle" },
    { label: "Lobbying", value: "$24.4M", detail: "2024 total" },
    { label: "WARN Filings", value: "155", detail: "Jan 2017–Mar 2026" },
    { label: "ADF Score", value: "9% \u2193", detail: "Down from 15%", trend: "down" },
  ],

  // SECTION 1 — INTEGRITY GAP
  integrityGap: {
    quotes: [
      {
        text: "Meta\u2019s mission is to build the future of human connection and the technology that makes it possible.",
        source: "Official Mission Statement, about.meta.com",
      },
      {
        text: "At Meta, we\u2019re building innovative new ways to help people connect to each other, and the makeup of our company reflects the broad range of perspectives of the people who use our technologies.",
        source: '"Working at Meta" representation language',
      },
      {
        text: "We\u2019re committed to helping keep people safe and making a positive impact.",
        source: "Homepage commitment, about.meta.com",
      },
    ],
    diversityNote:
      'Meta publicly declared a commitment to "building a diverse and inclusive company \u2014 no matter how long it takes" in its diversity report series covering 2014\u20132022. That report series has since been discontinued.',
    pacName: "META PLATFORMS, INC. PAC",
    fecId: "C00502906",
    treasurer: "Ritika Robertson",
    pacCycle: [
      { metric: "Total Raised", amount: "$341,607" },
      { metric: "Total Spent", amount: "$333,503" },
      { metric: "Contributions to Federal Candidates", amount: "$197,300" },
      { metric: "% to Republicans", amount: "56.74%", color: "red" },
      { metric: "% to Democrats", amount: "40.22%", color: "blue" },
      { metric: "Individual Donor Contributions (\u2265$200)", amount: "$320,160" },
    ],
    pacSourceUrl: "https://www.opensecrets.org/political-action-committees-pacs/meta/C00502906/summary/2024",
    pacSourceLabel: "OpenSecrets \u2014 Meta PAC 2023\u20132024",
    pacTiltNote:
      "Meta\u2019s PAC tilted more Republican in 2023\u20132024 (56.74%) than in the 2019\u20132020 cycle (52.20%), tracking a broader rightward company pivot under CEO Mark Zuckerberg.",
    hr4673: {
      intro:
        'Introduced July 23, 2025 by Rep. Ashley Hinson (R-IA-2), the Save Our Bacon Act would override state-level standards on livestock and livestock products \u2014 including California\u2019s Proposition 12. The bill was incorporated as Section 12006 of the 2026 Farm Bill.',
      sponsors: [
        { member: "Rep. Ashley Hinson", district: "R-IA-2", role: "Sponsor", date: "07/23/2025", highlight: true },
        { member: "Rep. Randy Feenstra", district: "R-IA-4", role: "Cosponsor*", date: "07/23/2025" },
        { member: "Rep. Zachary Nunn", district: "R-IA-3", role: "Cosponsor*", date: "07/23/2025" },
        { member: "Rep. Mariannette Miller-Meeks", district: "R-IA-1", role: "Cosponsor*", date: "07/23/2025" },
        { member: "Rep. Sam Graves", district: "R-MO-6", role: "Cosponsor*", date: "07/23/2025" },
        { member: "Rep. David Rouzer", district: "R-NC-7", role: "Cosponsor*", date: "07/23/2025" },
        { member: "Rep. Gregory Murphy", district: "R-NC-3", role: "Cosponsor*", date: "07/23/2025" },
        { member: "Rep. Mark Messmer", district: "R-IN-8", role: "Cosponsor*", date: "07/23/2025" },
        { member: "Rep. Adrian Smith", district: "R-NE-3", role: "Cosponsor*", date: "07/23/2025" },
        { member: "Rep. Mike Flood", district: "R-NE-1", role: "Cosponsor*", date: "07/23/2025" },
        { member: "Rep. Doug LaMalfa", district: "R-CA-1", role: "Cosponsor*", date: "07/23/2025" },
        { member: "Rep. Mark Alford", district: "R-MO-4", role: "Cosponsor*", date: "07/23/2025" },
        { member: "Rep. Dusty Johnson", district: "R-SD-AL", role: "Cosponsor*", date: "07/23/2025" },
        { member: "Rep. Mike Bost", district: "R-IL-12", role: "Cosponsor*", date: "07/23/2025" },
        { member: "Rep. Dan Newhouse", district: "R-WA-4", role: "Cosponsor*", date: "07/23/2025" },
        { member: "Rep. Mark Harris", district: "R-NC-8", role: "Cosponsor*", date: "07/23/2025" },
        { member: "Rep. Brad Finstad", district: "R-MN-1", role: "Cosponsor*", date: "07/23/2025" },
        { member: "Rep. Tony Wied", district: "R-WI-8", role: "Cosponsor*", date: "07/23/2025" },
        { member: "Rep. John Rose", district: "R-TN-6", role: "Cosponsor*", date: "07/23/2025" },
        { member: "Rep. Don Bacon", district: "R-NE-2", role: "Cosponsor", date: "07/25/2025" },
        { member: "Rep. Michael Simpson", district: "R-ID-2", role: "Cosponsor", date: "07/29/2025" },
      ],
      sourceUrl: "https://www.congress.gov/bill/119th-congress/house-bill/4673/cosponsors",
      sourceLabel: "Congress.gov \u2014 H.R.4673 Cosponsors",
      keyFinding:
        "H.R. 4673 was introduced on July 23, 2025 \u2014 after the 2023\u20132024 FEC cycle closed. Meta\u2019s PAC donation records therefore predate the bill\u2019s introduction. However, the 2025\u20132026 FEC cycle is active and Meta\u2019s PAC (C00502906) may have donated to H.R. 4673 sponsors in the current cycle.",
      dataGap:
        "Query FEC disbursements for C00502906 to check 2025\u20132026 cycle donations to H.R. 4673 sponsors.",
      dataGapUrl: "https://www.fec.gov/data/disbursements/?committee_id=C00502906&two_year_transaction_period=2026",
    },
    hr349: {
      intro: "Goldie\u2019s Act would strengthen USDA enforcement of the Animal Welfare Act to protect dogs in federally licensed puppy mills.",
      sponsors: [
        { member: "Rep. Nicole Malliotakis", party: "R-NY", metaPac: "\u2014", note: "" },
        { member: "Rep. Raja Krishnamoorthi", party: "D-IL", metaPac: "$2,500 \u2713", note: "", confirmed: true, highlight: true },
        { member: "Rep. Brian Fitzpatrick", party: "R-PA", metaPac: "\u2014", note: "" },
        { member: "Rep. Mike Quigley", party: "D-IL", metaPac: "$1,000 \u2713", note: "", confirmed: true, highlight: true },
        { member: "Rep. Chris Smith", party: "R-NJ", metaPac: "\u2014", note: "" },
        { member: "Rep. Zach Nunn", party: "R-IA", metaPac: "\u2014", note: "Also cosponsors H.R. 4673", highlight: true },
      ],
      sourceUrls: [
        { text: "ASPCA Goldie\u2019s Act Explainer", url: "https://www.aspca.org/sites/default/files/119th_goldies_act_explainer_11.25.pdf" },
        { text: "GoldiesAct.org", url: "https://www.goldiesact.org" },
      ],
    },
    lobbying: {
      years: [
        { year: "2022", totalSpent: "~$10.6M", yoyChange: "\u2014" },
        { year: "2023", totalSpent: "$19,300,000", yoyChange: "+82%", changeColor: "red" },
        { year: "2024", totalSpent: "$24,430,000", yoyChange: "+27%", changeColor: "red" },
        { year: "2025 (Q4 alone)", totalSpent: "$6,500,000", yoyChange: "Leading Big Tech", changeColor: "amber" },
      ],
      yearSourceUrls: [
        { text: "OpenSecrets 2024", url: "https://www.opensecrets.org/federal-lobbying/clients/summary?cycle=2024&id=D000033563" },
        { text: "Axios Q4 2025", url: "https://www.axios.com/2026/01/21/meta-big-tech-lobbying-spending-q4" },
        { text: "OpenSecrets 2023", url: "https://www.opensecrets.org/federal-lobbying/clients/summary?cycle=2023&id=D000033563" },
      ],
      dailySpendNote:
        "Meta averaged approximately $220,000 per congressional session day in lobbying spending during H1 2024, combined with ByteDance \u2014 deploying 65 lobbyists (one per every 8 members of Congress).",
      dailySpendSourceUrl: "https://issueone.org/press/bytedance-and-meta-spent-over-200000-per-day-lobbying-in-first-half-of-2024/",
      dailySpendSourceLabel: "Issue One, July 2024",
      billsLobbied: [
        { bill: "S.1409", topic: "Kids Online Safety Act", reports: "17" },
        { bill: "S.1207", topic: "EARN IT Act", reports: "15" },
        { bill: "S.1418", topic: "Children\u2019s Online Privacy (COPPA 2.0)", reports: "15" },
        { bill: "S.1199", topic: "STOP CSAM Act", reports: "15" },
        { bill: "S.486", topic: "Honest Ads Act", reports: "12" },
        { bill: "S.2691", topic: "AI Labeling Act of 2023", reports: "12" },
        { bill: "S.4178", topic: "Future of AI Innovation Act", reports: "3" },
        { bill: "H.RES.66", topic: "AI resolution", reports: "2" },
      ],
      billsSourceUrl: "https://www.opensecrets.org/federal-lobbying/clients/bills?cycle=2024&id=D000033563",
      billsSourceLabel: "OpenSecrets \u2014 Meta Bills Lobbied 2024",
    },
  },

  // SECTION 2 — LABOR IMPACT
  laborImpact: {
    deiDate: "January 10, 2025",
    announcementVehicle: "Internal memo sent to all global employees by Janelle Gale, VP of People, via Meta\u2019s internal Workplace platform.",
    deiQuotes: [
      {
        text: "In light of the shifting legal and policy landscape, we are implementing the following adjustments: While we will continue to seek candidates from varied backgrounds, we will discontinue the Diverse Slate Approach. This practice has always been subject to public debate and is currently being challenged.",
        source: "Janelle Gale, VP of People, Meta internal memo, Jan. 10, 2025",
      },
      {
        text: "We are also concluding our supplier diversity efforts within our broader supplier strategy, which focused on sourcing from diverse-owned businesses; moving forward, we will prioritize supporting small and medium-sized enterprises.",
        source: "Same memo",
      },
      {
        text: "Rather than equity and inclusion training programs, we will create initiatives that emphasize fair and consistent practices to mitigate bias for everyone, regardless of their background.",
        source: "Same memo",
      },
      {
        text: "The DEI team will be disbanded, with Maxine Williams assuming a new role at Meta that emphasizes accessibility and engagement.",
        source: "Same memo",
        sourceUrl: "https://www.cnbc.com/2025/01/10/read-the-memo-meta-announces-end-of-its-dei-programs.html",
        accent: "red",
      },
    ],
    programsDismantled: [
      { program: "DEI Team (entire department)", status: "Disbanded", badgeColor: "red" },
      { program: "Chief Diversity Officer role", status: "Eliminated; Maxine Williams reassigned" },
      { program: "Diverse Slate Approach (hiring)", status: "Ended", badgeColor: "red" },
      { program: "Supplier Diversity Program", status: "Ended", badgeColor: "red" },
      { program: "Equity & Inclusion Training", status: "Ended", badgeColor: "red" },
      { program: "Representation goals (women, minorities)", status: "Previously eliminated; confirmed discontinued" },
      { program: "Diversity reports", status: "Not published since 2022 data" },
    ],
    maxineWilliamsNote:
      'Meta\u2019s Chief Diversity Officer and, per Bloomberg, "the company\u2019s highest-ranking Black woman." Reassigned to "accessibility and engagement" role.',
    maxineWilliamsSourceUrl: "https://www.bloomberg.com/news/articles/2025-01-10/meta-rolls-back-diveristy-and-inclusion-efforts-appeasing-trump",
    starbuckPreTargeting:
      'Conservative anti-DEI campaigner Robby Starbuck stated publicly: "I warned Meta in October [2024] that they were one of my DEI targets for 2025." Meta\u2019s DEI elimination came three days after the company ended its third-party fact-checking program.',
    starbuckSourceUrl: "https://www.cbsnews.com/news/meta-dei-programs-mcdonalds-walmart-ford-diversity/",
    diversityReportHistory:
      "Meta published annual diversity reports from 2014 through 2022 data. As of November 2025, Meta confirmed it would not publish a diversity report for 2025.",
    diversityReportSourceUrl: "https://www.wired.com/story/google-microsoft-and-meta-have-stopped-publishing-workforce-diversity-data/",
    layoffTimeline: [
      {
        date: "Nov 2022",
        dotColor: "red",
        title: "Layoff Wave 1 \u2014 ~11,000 employees",
        description:
          'Zuckerberg\u2019s statement: "I got this wrong" \u2014 attributed to pandemic-era overhiring and Meta\u2019s overextension into the metaverse. WARN notices filed across CA, covering Menlo Park, San Francisco, Sunnyvale, LA, Burlingame, and Fremont.',
      },
      {
        date: "Mar 2023",
        dotColor: "red",
        title: "Layoff Wave 2 \u2014 ~10,000 employees",
        description:
          'Part of Zuckerberg\u2019s declared "year of efficiency." Additional WARN filings in California for LA locations (73 + 35 employees).',
      },
      {
        date: "Feb 2025",
        dotColor: "red",
        title: "~3,600 employees (~5% of headcount)",
        description: "Continued restructuring.",
      },
      {
        date: "Mar 2026",
        dotColor: "amber",
        title: "Reported: Up to 20% of workforce (~15,000\u201316,000)",
        description: "Reuters reported plans driven by AI investment reallocation. Meta has not confirmed.",
        sourceUrl: "https://www.inc.com/ben-sherry/report-meta-plans-sweeping-layoffs-as-ai-woes-mount/91317274",
        sourceLabel: "Inc. Magazine, March 2026",
      },
    ],
    warnFilings: [
      { location: "Menlo Park (multiple filings)", employees: "632 + 60 + 142 + 140 + 241 + 139 + 32 + 85", noticeDate: "11/11/2022", layoffDate: "01/13/2023" },
      { location: "San Francisco", employees: "362", noticeDate: "11/11/2022", layoffDate: "01/13/2023" },
      { location: "Los Angeles", employees: "162", noticeDate: "11/11/2022", layoffDate: "01/13/2023" },
      { location: "Sunnyvale", employees: "139", noticeDate: "11/11/2022", layoffDate: "01/13/2023" },
      { location: "Burlingame (multiple)", employees: "46 + 34 + 32 + 67", noticeDate: "11/11/2022", layoffDate: "01/13/2023" },
      { location: "Fremont (multiple)", employees: "3 + 14 + 13 + 18 + 64", noticeDate: "11/11/2022", layoffDate: "01/13/2023" },
    ],
    warnSourceUrl: "https://www.warntracker.com/company/meta-facebook",
    warnSourceLabel: "WARN Tracker \u2014 Meta/Facebook CA filings",
    totalImpact:
      "Approximately 21,000 employees laid off across two waves (2022\u20132023), reducing headcount from ~87,000 to ~67,000. Meta/Facebook filed 155 WARN Act layoff notices from January 2017 to March 2026, affecting 11,675 employees in tracked notices across CA, NJ, NY, OR, TX, and WA.",
  },

  // SECTION 3 — SAFETY ALERT
  safetyAlert: {
    federalContracts: [
      {
        contract: "CONT_AWD_15DDHQ25P00000437",
        agency: "DEA / Dept. of Justice",
        amount: "$7,400",
        description: '"META-PROJECT INCEPTION" \u2014 advertising support services, Special Operations Division',
      },
    ],
    contractSourceUrl: "https://www.usaspending.gov/award/CONT_AWD_15DDHQ25P00000437_1524_-NONE-_-NONE-",
    contractSourceLabel: "USASpending.gov",
    contractAdditionalNote:
      "Additional contracts include U.S. Agency for Global Media (BBG/Voice of America) for social media services, plus subcontractor roles for DHS and Dept. of Education. Meta Platforms, Inc. and Facebook Technologies LLC are both registered in SAM.gov.",
    contractRelevanceNote:
      "As a federal contractor, Meta is subject to Executive Order 11246 on nondiscrimination. The Trump administration\u2019s 2025 executive orders targeting DEI in federal contracting create compliance context for Meta\u2019s January 2025 DEI rollback.",
    adfScores: [
      { category: "Overall Score", score: "9%", highlight: true, color: "red" },
      { category: "Market Score (Criteria 1)", score: "4%" },
      { category: "Workplace Score (Criteria 2)", score: "13%" },
      { category: "Public Square Score (Criteria 3)", score: "8%" },
    ],
    adfSourceUrls: [
      { text: "ADF VDS \u2014 Meta", url: "https://www.viewpointdiversityscore.org/company/meta" },
      { text: "Christian Post, June 2025", url: "https://www.christianpost.com/news/only-1-company-has-viewpoint-diversity-score-of-over-50.html" },
    ],
    adfTrendNote:
      "Meta\u2019s score declined from 15% (2024 index) to 9% (2025 index), a 6-percentage-point drop. The VDS measures alignment with conservative Christian free-speech and religious-freedom standards. The 2026 index may reflect Meta\u2019s DEI rollback.",
    tenKFilings: [
      {
        year: "2022 10-K",
        yearDetail: "filed 2023",
        status: "Full DEI section",
        statusType: "confirmed",
        keyChanges: "Diversity report references; representation goals; equity training; supplier diversity; Diverse Slate Approach",
      },
      {
        year: "2023 10-K",
        yearDetail: "filed 2024",
        status: "Reduced",
        statusType: "reduced",
        keyChanges: 'Removed some specific program descriptions; general "inclusive workforce" language maintained',
      },
      {
        year: "2024 10-K",
        yearDetail: "filed Jan 30, 2025",
        status: "Dismantled",
        statusType: "dismantled",
        keyChanges: '"Cognitive diversity" replaces DEI; removed DEI L&D courses; removed LGBTQ+/disability statistics; removed supplier diversity',
      },
    ],
    tenKQuote: {
      text: "We remain committed to having a skilled, inclusive and diverse workforce with a broad range of knowledge, skills, political views, backgrounds, and perspectives because we believe cognitive diversity fuels innovation.",
      source: "Meta 2024 10-K, verbatim",
      sourceUrl: "https://www.sec.gov/Archives/edgar/data/1326801/000132680125000017/meta-20241231.htm",
    },
    tenKSourceUrls: [
      { text: "WIRED, Jan 30, 2025", url: "https://www.wired.com/story/meta-2024-earnings-dei-trump/" },
      { text: "Legal Dive, Jan 30, 2025", url: "https://www.legaldive.com/news/meta-DEI-changes-fisher-phillips-latham-watkins/738800/" },
    ],
    starbuckTimeline: [
      {
        date: "Oct 2024",
        dotColor: "muted",
        title: "Public Warning",
        description: 'Starbuck publicly warned Meta it was "one of my DEI targets for 2025" (per his own X post).',
      },
      {
        date: "Aug 2024",
        dotColor: "muted",
        title: "AI Defamation Discovery",
        description: "Starbuck became aware Meta AI was spreading false information about him (claims of Jan. 6 involvement, Holocaust denial, criminal guilty plea).",
      },
      {
        date: "Jan 7, 2025",
        dotColor: "red",
        title: "Fact-Checking Ended",
        description: "Meta announced end of third-party fact-checking program.",
      },
      {
        date: "Jan 10, 2025",
        dotColor: "red",
        title: "DEI Disbanded",
        description: 'Meta disbanded DEI team. Starbuck claimed credit on X: "Massive news: Meta is ending DEI."',
      },
      {
        date: "Apr 2025",
        dotColor: "muted",
        title: "Defamation Lawsuit Filed",
        description: "Starbuck filed lawsuit against Meta in Delaware Superior Court, seeking >$5 million.",
        sourceUrl: "https://apnews.com/article/robby-starbuck-meta-ai-delaware-eb587d274fdc18681c51108ade54b095",
        sourceLabel: "AP News, April 30, 2025",
      },
      {
        date: "Aug 8, 2025",
        dotColor: "green",
        title: "Settlement Reached",
        description: 'Starbuck agreed to serve as Meta consultant advising on "political bias" in AI.',
        sourceUrl: "https://www.foxbusiness.com/media/robby-starbuck-meta-settle-lawsuit-after-ai-chatbot-defamed-him",
        sourceLabel: "Fox Business, August 8, 2025",
      },
      {
        date: "Aug 2025",
        dotColor: "muted",
        title: "Hired as Meta Advisor",
        description: "Meta hired Starbuck as advisor to its Product Policy team on AI bias reduction.",
        sourceUrl: "https://www.tennessean.com/story/news/2025/08/29/robby-starbuck-meta-lawsuit-ai-big-tech/85749468007/",
        sourceLabel: "Tennessean, August 29, 2025",
      },
    ],
    starbuckKeyFinding:
      "An external conservative pressure campaign publicly targeted Meta \u2192 Meta rapidly dismantled its DEI programs \u2192 Starbuck sued \u2192 Meta settled by making Starbuck a consultant. The result: a conservative activist with no AI expertise now advises one of the world\u2019s largest AI systems on content policy.",
  },

  // SECTION 4 — CONNECTED DOTS
  connectedDots: {
    lobbyingOverview:
      'Meta retained 65 lobbyists across 18+ external firms in 2024, plus extensive in-house staff. 81.54% are "revolvers" (former government officials). Total spend: $24,430,000.',
    lobbyingFirms: [
      { firm: "Avoq LLC", amount: "$320,000", lobbyists: "Steven Elmendorf, Stacey Alexander, Natalie Farr" },
      { firm: "Harbinger Strategies", amount: "$240,000", lobbyists: "John Leganski, Kyle Nevins, Manny Rossman, Steve Stombres" },
      { firm: "Stanton Park Group", amount: "$240,000", lobbyists: "James Derderian, Valerie Henry" },
      { firm: "S-3 Group", amount: "$240,000", lobbyists: "Matthew Bravo, Kevin Casey, Martin Delgado" },
      { firm: "Sternhell Group", amount: "$240,000", lobbyists: "Mike Ahern, Alex Sternhell" },
      { firm: "Stewart Strategies", amount: "$240,000", lobbyists: "Jennifer Stewart, Ebony Simpson" },
      { firm: "Capitol Tax Partners", amount: "$240,000", lobbyists: "Jonathan Talisman, Sarah Shive" },
      { firm: "Mindset", amount: "$200,000", lobbyists: "Rick Dearborn, Dana Gresham" },
      { firm: "Elevate Government Affairs", amount: "$200,000", lobbyists: "Robert Chamberlin" },
      { firm: "Off Hill Strategies", amount: "$200,000", lobbyists: "Jennifer Baird, Tripp Baird" },
      { firm: "theGROUP DC", amount: "$210,000", lobbyists: "Sudafi Henry, Saul Hernandez" },
      { firm: "Jeffries Strategies", amount: "$180,000", lobbyists: "Stewart Jeffries" },
      { firm: "Salt Point Strategies", amount: "$120,000", lobbyists: "David Redl, Ansley Erdel" },
      { firm: "Blue Mountain Strategies", amount: "$120,000", lobbyists: "Luke Albee" },
      { firm: "535 Group", amount: "$120,000", lobbyists: "Dave Lugar" },
      { firm: "Venable LLP", amount: "$120,000", lobbyists: "James Barnett" },
      { firm: "Mason Street Consulting", amount: "$80,000", lobbyists: "Susan Stoner Zook" },
      { firm: "Hollier & Assoc", amount: "$90,000", lobbyists: "William Hollier" },
    ],
    lobbyingFirmsSourceUrl: "https://www.opensecrets.org/federal-lobbying/clients/lobbyists?cycle=2024&id=D000033563",
    lobbyingFirmsSourceLabel: "OpenSecrets \u2014 Meta Lobbyists 2024",
    notable2026Hires:
      'Bill McGinley, former top lawyer for Elon Musk\u2019s DOGE, hired as lobbyist (Bloomberg, Jan. 8, 2026). Dina Powell McCormick, former Trump White House official, joined as President and Vice Chairman (Reuters, Jan. 12, 2026).',
    aiPreemption: [
      'August 2025: Meta launched "Mobilizing Economic Transformation Across California" (METAC) \u2014 a California-focused state super PAC to elect AI-friendly state candidates.',
      'September 24, 2025: Meta launched American Technology Excellence Project (ATEP) \u2014 a national multistate super PAC. Run by Democratic consulting firm Hilltop Public Solutions and Republican strategist Brian Baker. Goals include "Promoting and defending U.S. technology companies," "Advocating for AI progress," and "Putting parents in charge."',
      'December 11, 2025: White House Executive Order \u2014 "Ensuring a National Policy Framework for Artificial Intelligence" \u2014 directing federal agencies to challenge state AI laws on constitutional grounds, establishing an AI Litigation Task Force at DOJ.',
      "The $150M AI Lobbying War: Meta is part of an industry coalition with combined budget exceeding $150 million as of November 2025, advocating for unified federal AI law superseding state regulations.",
    ],
    aiPreemptionKeyFinding:
      "Both H.R. 4673 (agricultural preemption of state animal welfare laws) and Meta\u2019s AI preemption campaign share an identical structural argument: that federal standards should override state consumer protection laws. Meta has not publicly weighed in on H.R. 4673 specifically, but the company\u2019s institutional support for federal preemption as a principle may make it an implicit ally of the preemption-over-state-rights framework that H.R. 4673 represents.",
    aiPreemptionDataGap:
      "To determine whether any of Meta\u2019s 18 lobbying firms also represent agricultural commodity groups or meat industry associations supporting H.R. 4673, search each firm at lda.senate.gov and filter by Agriculture/Food/Meat Processing.",
    aiPreemptionDataGapUrl: "https://lda.senate.gov/filings/public/filing/search/",
  },

  // RECEIPTS AT A GLANCE
  receiptsAtAGlance: [
    { category: 'Mission claims "positive impact" and "broad range of perspectives"', finding: "Verbatim from about.meta.com", status: "confirmed" },
    { category: "PAC raised $341,607 in 2023\u20132024", finding: "56.74% to Republicans", status: "confirmed" },
    { category: "Meta PAC to Goldie\u2019s Act cosponsor Krishnamoorthi", finding: "$2,500 donation", status: "confirmed" },
    { category: "Meta PAC to Goldie\u2019s Act cosponsor Quigley", finding: "$1,000 donation", status: "confirmed" },
    { category: "Meta PAC to H.R. 4673 sponsors", finding: "Bill introduced July 2025; 2025\u201326 cycle data needed", status: "data-gap" },
    { category: "Lobbying: $24.43M (2024)", finding: "Up 27% year-over-year", status: "confirmed" },
    { category: "DEI team disbanded Jan. 10, 2025", finding: "Maxine Williams reassigned", status: "confirmed" },
    { category: "Diversity reports stopped after 2022", finding: "Last data: 2022", status: "confirmed" },
    { category: "21,000+ layoffs 2022\u20132023; 155 WARN filings", finding: "Across 6 states", status: "confirmed" },
    { category: "Federal contractor: YES", finding: "DEA/DOJ contract confirmed", status: "confirmed" },
    { category: "ADF Viewpoint Diversity Score: 9%", finding: "Down from 15% (2024 index)", status: "confirmed" },
    { category: "10-K DEI language stripped in 2024 filing", finding: '"Cognitive diversity" replaces DEI', status: "confirmed" },
    { category: "Robby Starbuck: targeted Meta \u2192 now consultant", finding: "Settled $5M+ lawsuit with consulting arrangement", status: "confirmed" },
    { category: "18 lobbying firms; 81.5% revolving door", finding: "No confirmed ag-preemption cross-interest yet", status: "research-incomplete" },
    { category: "AI federal preemption: 2 super PACs", finding: "ATEP + METAC launched 2025", status: "confirmed" },
  ],

  // DATA GAPS
  dataGaps: [
    { priority: "high", gap: "Meta PAC 2025\u20132026 donations to H.R. 4673 sponsors", sourceLabel: "FEC disbursements", sourceUrl: "https://www.fec.gov/data/disbursements/?committee_id=C00502906&two_year_transaction_period=2026" },
    { priority: "high", gap: "Meta lobbying firms\u2019 agricultural/animal-welfare clients", sourceLabel: "Senate LDA", sourceUrl: "https://lda.senate.gov/filings/public/filing/search/" },
    { priority: "medium", gap: "Full text of Meta\u2019s corporate principles (5 principles)", sourceLabel: "about.meta.com", sourceUrl: "https://about.meta.com/company-info/" },
    { priority: "medium", gap: "Meta\u2019s complete federal contract history", sourceLabel: "USASpending.gov", sourceUrl: "https://www.usaspending.gov/search" },
    { priority: "medium", gap: "Side-by-side 10-K DEI section text comparison (2022/2023/2024)", sourceLabel: "SEC EDGAR", sourceUrl: "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001326801&type=10-K" },
    { priority: "lower", gap: "Full Meta PAC 2023\u20132024 candidate recipient list", sourceLabel: "ProPublica Itemizer", sourceUrl: "https://projects.propublica.org/itemizer/committee/C00502906/2024" },
    { priority: "lower", gap: "Harbinger Strategies / other Meta firm agricultural clients", sourceLabel: "OpenSecrets firm profiles", sourceUrl: "https://www.opensecrets.org/federal-lobbying/firms" },
  ],

  // SOURCES
  sources: [
    { label: "Corporate Information", links: [{ text: "about.meta.com/company-info", url: "https://about.meta.com/company-info/" }] },
    { label: "PAC Data", links: [{ text: "OpenSecrets \u2014 Meta PAC 2023\u20132024", url: "https://www.opensecrets.org/political-action-committees-pacs/meta/C00502906/summary/2024" }] },
    { label: "H.R. 4673 Cosponsors", links: [{ text: "Congress.gov", url: "https://www.congress.gov/bill/119th-congress/house-bill/4673/cosponsors" }, { text: "Harvard Law School ALPP", url: "https://animal.law.harvard.edu/news-article/legislative-analysis-of-hr4673/" }] },
    { label: "Goldie\u2019s Act", links: [{ text: "ASPCA Explainer", url: "https://www.aspca.org/sites/default/files/119th_goldies_act_explainer_11.25.pdf" }, { text: "GoldiesAct.org", url: "https://www.goldiesact.org" }] },
    { label: "Lobbying", links: [{ text: "OpenSecrets 2024", url: "https://www.opensecrets.org/federal-lobbying/clients/summary?cycle=2024&id=D000033563" }, { text: "OpenSecrets 2023", url: "https://www.opensecrets.org/federal-lobbying/clients/summary?cycle=2023&id=D000033563" }, { text: "Axios Q4 2025", url: "https://www.axios.com/2026/01/21/meta-big-tech-lobbying-spending-q4" }] },
    { label: "Bills Lobbied", links: [{ text: "OpenSecrets \u2014 Meta Bills Lobbied 2024", url: "https://www.opensecrets.org/federal-lobbying/clients/bills?cycle=2024&id=D000033563" }] },
    { label: "Lobbyist Scale", links: [{ text: "Issue One, July 2024", url: "https://issueone.org/press/bytedance-and-meta-spent-over-200000-per-day-lobbying-in-first-half-of-2024/" }] },
    { label: "DEI Memo", links: [{ text: "CNBC, January 10, 2025", url: "https://www.cnbc.com/2025/01/10/read-the-memo-meta-announces-end-of-its-dei-programs.html" }] },
    { label: "Maxine Williams", links: [{ text: "Bloomberg, January 10, 2025", url: "https://www.bloomberg.com/news/articles/2025-01-10/meta-rolls-back-diveristy-and-inclusion-efforts-appeasing-trump" }] },
    { label: "Starbuck Context", links: [{ text: "CBS News, January 10, 2025", url: "https://www.cbsnews.com/news/meta-dei-programs-mcdonalds-walmart-ford-diversity/" }] },
    { label: "Diversity Reports Stopped", links: [{ text: "WIRED, November 7, 2025", url: "https://www.wired.com/story/google-microsoft-and-meta-have-stopped-publishing-workforce-diversity-data/" }] },
    { label: "WARN Act Filings", links: [{ text: "WARN Tracker \u2014 Meta/Facebook", url: "https://www.warntracker.com/company/meta-facebook" }] },
    { label: "Layoffs 2022\u20132023", links: [{ text: "SFist, March 2026", url: "https://sfist.com/2026/03/16/facebook-planning-to-lay-off-thousands-of-employees-in-ai-driven-move-to-cut-costs/" }, { text: "Forbes, March 2026", url: "https://www.forbes.com/sites/jonmarkman/2026/03/18/metas-biggest-layoff-since-2023-and-the-rise-of-an-automated-tech-giant/" }] },
    { label: "2026 Layoff Report", links: [{ text: "Inc. Magazine, March 2026", url: "https://www.inc.com/ben-sherry/report-meta-plans-sweeping-layoffs-as-ai-woes-mount/91317274" }] },
    { label: "Federal Contract", links: [{ text: "USASpending.gov \u2014 Meta DOJ Contract", url: "https://www.usaspending.gov/award/CONT_AWD_15DDHQ25P00000437_1524_-NONE-_-NONE-" }] },
    { label: "ADF Score", links: [{ text: "Viewpoint Diversity Score \u2014 Meta", url: "https://www.viewpointdiversityscore.org/company/meta" }, { text: "Christian Post, June 2025", url: "https://www.christianpost.com/news/only-1-company-has-viewpoint-diversity-score-of-over-50.html" }] },
    { label: "10-K Filing", links: [{ text: "SEC EDGAR \u2014 Meta 2024 10-K", url: "https://www.sec.gov/Archives/edgar/data/1326801/000132680125000017/meta-20241231.htm" }, { text: "WIRED, Jan 30, 2025", url: "https://www.wired.com/story/meta-2024-earnings-dei-trump/" }, { text: "Legal Dive, Jan 30, 2025", url: "https://www.legaldive.com/news/meta-DEI-changes-fisher-phillips-latham-watkins/738800/" }] },
    { label: "Starbuck Lawsuit/Settlement", links: [{ text: "AP News, April 30, 2025", url: "https://apnews.com/article/robby-starbuck-meta-ai-delaware-eb587d274fdc18681c51108ade54b095" }, { text: "Fox Business, August 8, 2025", url: "https://www.foxbusiness.com/media/robby-starbuck-meta-settle-lawsuit-after-ai-chatbot-defamed-him" }, { text: "Tennessean, August 29, 2025", url: "https://www.tennessean.com/story/news/2025/08/29/robby-starbuck-meta-lawsuit-ai-big-tech/85749468007/" }, { text: "WSJ, August 8, 2025", url: "https://www.wsj.com/tech/ai/meta-robby-starbuck-ai-lawsuit-settlement-6c6e9b0a" }] },
    { label: "Lobbyist Roster", links: [{ text: "OpenSecrets \u2014 Meta Lobbyists 2024", url: "https://www.opensecrets.org/federal-lobbying/clients/lobbyists?cycle=2024&id=D000033563" }] },
    { label: "2026 Hires", links: [{ text: "Bloomberg \u2014 McGinley hire, Jan 8, 2026", url: "https://www.bloomberg.com/news/articles/2026-01-08/meta-hires-former-doge-trump-election-lawyer-as-lobbyist" }, { text: "Reuters \u2014 Powell McCormick hire, Jan 12, 2026", url: "https://www.reuters.com/business/dina-powell-mccormick-joins-meta-president-vice-chairman-2026-01-12/" }] },
    { label: "AI Preemption", links: [{ text: "CIO Dive, September 24, 2025", url: "https://www.ciodive.com/news/meta-lobbying-state-ai-laws/761047/" }, { text: "Forbes, November 28, 2025", url: "https://www.forbes.com/sites/paulocarvao/2025/11/28/150-million-ai-lobbying-war-fuels-the-fight-over-preemption/" }, { text: "Buchanan Ingersoll, January 7, 2026", url: "https://www.bipc.com/new-executive-order-signals-federal-preemption-strategy-for-state-laws-on-artificial-intelligence" }] },
  ],
};

// ---------------------------------------------------------------------------
// Slug → name map for Coming Soon
// ---------------------------------------------------------------------------

const COMPANY_NAMES: Record<string, string> = {
  meta: "Meta",
  google: "Google",
  amazon: "Amazon",
  microsoft: "Microsoft",
  boeing: "Boeing",
  "booz-allen-hamilton": "Booz Allen Hamilton",
  accenture: "Accenture",
  verizon: "Verizon",
  "t-mobile": "T-Mobile",
  att: "AT&T",
};

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

const TABS = [
  { id: "integrity-gap", label: "1. Integrity Gap" },
  { id: "labor-impact", label: "2. Labor Impact" },
  { id: "safety-alert", label: "3. Safety Alert" },
  { id: "connected-dots", label: "4. Connected Dots" },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ---------------------------------------------------------------------------
// Reusable sub-components
// ---------------------------------------------------------------------------

function QuoteCard({ q }: { q: QuoteEntry }) {
  return (
    <div className={cn("border-l-4 pl-5 py-3 my-4", q.accent === "red" ? "border-destructive" : "border-primary/40")}>
      <blockquote className="text-sm text-foreground italic leading-relaxed">"{q.text}"</blockquote>
      <p className="text-xs text-muted-foreground mt-2">
        — {q.source}
        {q.sourceUrl && (
          <>
            {" · Source: "}
            <a href={q.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              {q.sourceUrl.includes("cnbc") ? "CNBC, January 10, 2025" : "Source"}
            </a>
          </>
        )}
      </p>
    </div>
  );
}

function KeyFinding({ children, label = "Key Finding", variant = "primary" }: { children: React.ReactNode; label?: string; variant?: "primary" | "red" | "purple" }) {
  const borderColor = variant === "red" ? "border-destructive/25" : variant === "purple" ? "border-purple-500/25" : "border-primary";
  const bgColor = variant === "red" ? "bg-destructive/5" : variant === "purple" ? "bg-purple-500/5" : "bg-primary/5";
  const labelColor = variant === "red" ? "text-destructive" : variant === "purple" ? "text-purple-400" : "text-primary";
  return (
    <div className={cn("border-l-4 p-6 my-6 rounded-r", borderColor, bgColor)}>
      <p className={cn("font-mono text-xs tracking-wider uppercase mb-2", labelColor)}>{label}</p>
      <div className="text-sm text-foreground leading-relaxed">{children}</div>
    </div>
  );
}

function DataGap({ children, label = "Data Gap" }: { children: React.ReactNode; label?: string }) {
  return (
    <div className="border-l-4 border-muted-foreground/30 bg-muted/30 p-4 my-4 rounded-r">
      <p className="font-mono text-xs text-muted-foreground tracking-wider uppercase mb-2">{label}</p>
      <div className="text-sm text-muted-foreground leading-relaxed">{children}</div>
    </div>
  );
}

function SourceLine({ urls }: { urls: { text: string; url: string }[] }) {
  return (
    <p className="font-mono text-muted-foreground text-xs mt-2">
      Source{urls.length > 1 ? "s" : ""}:{" "}
      {urls.map((u, i) => (
        <span key={i}>
          {i > 0 && " · "}
          <a href={u.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground underline hover:text-primary">
            {u.text}
          </a>
        </span>
      ))}
    </p>
  );
}

function DataTable({ title, headers, children }: { title: string; headers: string[]; children: React.ReactNode }) {
  return (
    <div className="my-6 overflow-x-auto">
      <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-2">{title}</p>
      <table className="w-full text-sm border border-border">
        <thead>
          <tr className="bg-card">
            {headers.map((h) => (
              <th key={h} className="text-left px-3 py-2 border-b border-border text-muted-foreground font-medium text-xs">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Td({ children, className, mono, highlight }: { children: React.ReactNode; className?: string; mono?: boolean; highlight?: boolean }) {
  return (
    <td className={cn("px-3 py-2 border-b border-border", mono && "font-mono", highlight && "text-foreground font-medium", !highlight && "text-muted-foreground", className)}>
      {children}
    </td>
  );
}

function StatusBadge({ status }: { status: "confirmed" | "data-gap" | "research-incomplete" }) {
  if (status === "confirmed") {
    return <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Confirmed</span>;
  }
  if (status === "data-gap") {
    return <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">Data Gap</span>;
  }
  return <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">Research Incomplete</span>;
}

function PriorityBadge({ priority }: { priority: "high" | "medium" | "lower" }) {
  const colors = {
    high: "bg-destructive/20 text-destructive border-destructive/30",
    medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    lower: "bg-muted text-muted-foreground border-border",
  };
  return <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium border", colors[priority])}>{priority === "lower" ? "Lower" : priority.charAt(0).toUpperCase() + priority.slice(1)}</span>;
}

function Timeline({ entries }: { entries: TimelineEntry[] }) {
  const dotColors: Record<string, string> = {
    red: "bg-destructive",
    amber: "bg-amber-500",
    green: "bg-emerald-500",
    muted: "bg-muted-foreground",
  };
  return (
    <div className="relative pl-8 my-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-border">
      {entries.map((e, i) => (
        <div key={i} className="relative">
          <div className={cn("absolute -left-5 top-1.5 w-3 h-3 rounded-full ring-2 ring-background", dotColors[e.dotColor])} />
          <p className="font-mono text-xs text-muted-foreground mb-1">{e.date}</p>
          <h4 className="text-sm font-semibold text-foreground">{e.title}</h4>
          <p className="text-sm text-muted-foreground mt-1">
            {e.description}
            {e.sourceUrl && (
              <>
                {" Source: "}
                <a href={e.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  {e.sourceLabel || "Link"}
                </a>
              </>
            )}
          </p>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section renderers
// ---------------------------------------------------------------------------

function IntegrityGapSection({ data }: { data: MetaReportData }) {
  const ig = data.integrityGap;
  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs text-primary tracking-wider uppercase">Section 01</p>
        <h2 className="text-2xl font-bold text-foreground mt-1">Integrity Gap</h2>
        <p className="text-muted-foreground text-sm mt-1">The gap between what a company says and what it does.</p>
      </div>

      {/* What They Say */}
      <h3 className="text-lg font-semibold text-foreground">What They Say</h3>
      <p className="text-sm text-muted-foreground">
        Per Meta's company information page at{" "}
        <a href="https://about.meta.com/company-info/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
          about.meta.com
        </a>:
      </p>
      {ig.quotes.map((q, i) => <QuoteCard key={i} q={q} />)}
      <p className="text-sm text-muted-foreground">{ig.diversityNote}</p>

      {/* PAC Activity */}
      <h3 className="text-lg font-semibold text-foreground">What They Do: PAC Activity</h3>
      <p className="text-sm text-muted-foreground">
        <strong className="text-foreground">PAC Name:</strong> {ig.pacName} · <strong className="text-foreground">FEC Committee ID:</strong> {ig.fecId} · <strong className="text-foreground">Treasurer:</strong> {ig.treasurer}
      </p>

      <DataTable title="2023\u20132024 PAC Cycle Summary" headers={["Metric", "Amount"]}>
        {ig.pacCycle.map((row) => (
          <tr key={row.metric}>
            <Td highlight>{row.metric}</Td>
            <Td mono className={row.color === "red" ? "text-destructive" : row.color === "blue" ? "text-blue-400" : undefined}>{row.amount}</Td>
          </tr>
        ))}
      </DataTable>
      <SourceLine urls={[{ text: ig.pacSourceLabel, url: ig.pacSourceUrl }]} />
      <p className="text-sm text-muted-foreground">{ig.pacTiltNote}</p>

      {/* H.R. 4673 */}
      <h4 className="text-base font-semibold text-foreground mt-6">PAC Donations vs. H.R. 4673 (Save Our Bacon Act)</h4>
      <p className="text-sm text-muted-foreground">{ig.hr4673.intro}</p>

      <DataTable title="H.R. 4673 Sponsor and Cosponsors" headers={["Member", "State/District", "Role", "Date"]}>
        {ig.hr4673.sponsors.map((s) => (
          <tr key={s.member}>
            <Td highlight={s.highlight}>{s.member}</Td>
            <Td>{s.district}</Td>
            <Td>{s.role === "Sponsor" ? <StatusBadge status="confirmed" /> : s.role}</Td>
            <Td mono>{s.date}</Td>
          </tr>
        ))}
      </DataTable>
      <p className="font-mono text-muted-foreground text-xs">
        *Original cosponsor · Source:{" "}
        <a href={ig.hr4673.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground underline hover:text-primary">
          {ig.hr4673.sourceLabel}
        </a>
      </p>

      <KeyFinding>{ig.hr4673.keyFinding}</KeyFinding>
      <DataGap label="Data Gap \u2014 Requires FEC Lookup">
        <a href={ig.hr4673.dataGapUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
          {ig.hr4673.dataGap}
        </a>
      </DataGap>

      {/* H.R. 349 */}
      <h4 className="text-base font-semibold text-foreground mt-6">PAC Donations vs. H.R. 349 (Goldie's Act)</h4>
      <p className="text-sm text-muted-foreground">{ig.hr349.intro}</p>

      <DataTable title="H.R. 349 Primary Sponsors \u2014 Meta PAC Cross-Reference" headers={["Member", "Party", "Meta PAC (2023-24)", "Note"]}>
        {ig.hr349.sponsors.map((s) => (
          <tr key={s.member}>
            <Td highlight={s.highlight}>{s.member}</Td>
            <Td>{s.party}</Td>
            <Td mono className={s.confirmed ? "text-emerald-400" : undefined}>
              {s.metaPac}
              {s.confirmed && <StatusBadge status="confirmed" />}
            </Td>
            <Td className="text-amber-400 text-xs">{s.note}</Td>
          </tr>
        ))}
      </DataTable>
      <SourceLine urls={ig.hr349.sourceUrls} />

      {/* Lobbying */}
      <h4 className="text-base font-semibold text-foreground mt-6">Lobbying Expenditures</h4>

      <DataTable title="Annual Lobbying Spending \u2014 Meta Platforms" headers={["Year", "Total Spent", "YoY Change"]}>
        {ig.lobbying.years.map((y) => (
          <tr key={y.year}>
            <Td highlight>{y.year}</Td>
            <Td mono>{y.totalSpent}</Td>
            <Td mono className={y.changeColor === "red" ? "text-destructive" : y.changeColor === "amber" ? "text-amber-400" : undefined}>{y.yoyChange}</Td>
          </tr>
        ))}
      </DataTable>
      <SourceLine urls={ig.lobbying.yearSourceUrls} />

      <p className="text-sm text-muted-foreground">
        {ig.lobbying.dailySpendNote} Source:{" "}
        <a href={ig.lobbying.dailySpendSourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
          {ig.lobbying.dailySpendSourceLabel}
        </a>
      </p>

      <DataTable title="Top Bills Lobbied (2024) \u2014 by Number of Reports Filed" headers={["Bill", "Topic", "Reports"]}>
        {ig.lobbying.billsLobbied.map((b) => (
          <tr key={b.bill}>
            <Td highlight>{b.bill}</Td>
            <Td>{b.topic}</Td>
            <Td mono>{b.reports}</Td>
          </tr>
        ))}
      </DataTable>
      <SourceLine urls={[{ text: ig.lobbying.billsSourceLabel, url: ig.lobbying.billsSourceUrl }]} />
    </div>
  );
}

function LaborImpactSection({ data }: { data: MetaReportData }) {
  const li = data.laborImpact;
  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs text-primary tracking-wider uppercase">Section 02</p>
        <h2 className="text-2xl font-bold text-foreground mt-1">Labor Impact</h2>
        <p className="text-muted-foreground text-sm mt-1">What happened to workers.</p>
      </div>

      {/* DEI Dismantling */}
      <h3 className="text-lg font-semibold text-foreground">DEI Program Dismantling \u2014 {li.deiDate}</h3>
      <p className="text-sm text-muted-foreground">
        <strong className="text-foreground">Announcement vehicle:</strong> {li.announcementVehicle}
      </p>

      {li.deiQuotes.map((q, i) => <QuoteCard key={i} q={q} />)}

      <DataTable title="Programs Dismantled \u2014 January 10, 2025" headers={["Program", "Status"]}>
        {li.programsDismantled.map((p) => (
          <tr key={p.program}>
            <Td highlight>{p.program}</Td>
            <Td>
              {p.badgeColor === "red" ? (
                <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-destructive/20 text-destructive">{p.status}</span>
              ) : (
                <span className="text-muted-foreground text-sm">{p.status}</span>
              )}
            </Td>
          </tr>
        ))}
      </DataTable>

      <p className="text-sm text-muted-foreground">
        <strong className="text-foreground">Maxine Williams:</strong> {li.maxineWilliamsNote}{" "}
        <a href={li.maxineWilliamsSourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Bloomberg</a>
      </p>

      <p className="text-sm text-muted-foreground">
        <strong className="text-foreground">Context \u2014 Robby Starbuck pre-targeting:</strong> {li.starbuckPreTargeting}{" "}
        Source: <a href={li.starbuckSourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">CBS News, January 10, 2025</a>
      </p>

      <p className="text-sm text-muted-foreground">
        <strong className="text-foreground">Diversity Report History:</strong> {li.diversityReportHistory}{" "}
        Source: <a href={li.diversityReportSourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">WIRED, November 7, 2025</a>
      </p>

      {/* Mass Layoffs */}
      <h3 className="text-lg font-semibold text-foreground">Mass Layoffs \u2014 2022\u20132023</h3>
      <Timeline entries={li.layoffTimeline} />

      <DataTable title="California WARN Act Filings \u2014 Wave 1 (Selected)" headers={["Location", "Employees", "Notice Date", "Layoff Date"]}>
        {li.warnFilings.map((f) => (
          <tr key={f.location}>
            <Td highlight>{f.location}</Td>
            <Td mono>{f.employees}</Td>
            <Td mono>{f.noticeDate}</Td>
            <Td mono>{f.layoffDate}</Td>
          </tr>
        ))}
      </DataTable>
      <SourceLine urls={[{ text: li.warnSourceLabel, url: li.warnSourceUrl }]} />

      <KeyFinding label="Total Impact" variant="red">
        <p>
          Approximately <strong>21,000 employees</strong> laid off across two waves (2022\u20132023), reducing headcount from ~87,000 to ~67,000. Meta/Facebook filed <strong>155 WARN Act layoff notices</strong> from January 2017 to March 2026, affecting <strong>11,675 employees</strong> in tracked notices across CA, NJ, NY, OR, TX, and WA.
        </p>
      </KeyFinding>
    </div>
  );
}

function SafetyAlertSection({ data }: { data: MetaReportData }) {
  const sa = data.safetyAlert;
  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs text-primary tracking-wider uppercase">Section 03</p>
        <h2 className="text-2xl font-bold text-foreground mt-1">Safety Alert</h2>
        <p className="text-muted-foreground text-sm mt-1">Systemic risk indicators.</p>
      </div>

      {/* Federal Contractor Status */}
      <h3 className="text-lg font-semibold text-foreground">Federal Contractor Status</h3>
      <div className="mb-4">
        <StatusBadge status="confirmed" />
        <span className="ml-2 text-sm text-foreground font-medium">Confirmed Federal Contractor</span>
      </div>

      <DataTable title="Active Federal Contracts" headers={["Contract", "Agency", "Amount", "Description"]}>
        {sa.federalContracts.map((c) => (
          <tr key={c.contract}>
            <Td mono className="text-xs">{c.contract}</Td>
            <Td>{c.agency}</Td>
            <Td mono>{c.amount}</Td>
            <Td className="text-xs">{c.description}</Td>
          </tr>
        ))}
      </DataTable>
      <SourceLine urls={[{ text: sa.contractSourceLabel, url: sa.contractSourceUrl }]} />

      <p className="text-sm text-muted-foreground">{sa.contractAdditionalNote}</p>
      <p className="text-sm text-muted-foreground">
        <strong className="text-foreground">Relevance:</strong> {sa.contractRelevanceNote}
      </p>

      {/* ADF Score */}
      <h3 className="text-lg font-semibold text-foreground">ADF Viewpoint Diversity Score</h3>

      <DataTable title="Alliance Defending Freedom \u2014 Viewpoint Diversity Score" headers={["Category", "Score"]}>
        {sa.adfScores.map((s) => (
          <tr key={s.category}>
            <Td highlight={s.highlight}>{s.category}</Td>
            <Td mono className={cn(s.color === "red" && "text-destructive font-extrabold text-base")}>{s.score}</Td>
          </tr>
        ))}
      </DataTable>
      <SourceLine urls={sa.adfSourceUrls} />
      <p className="text-sm text-muted-foreground">{sa.adfTrendNote}</p>

      {/* 10-K */}
      <h3 className="text-lg font-semibold text-foreground">10-K / SEC Filing \u2014 DEI Language Evolution</h3>

      <DataTable title="DEI Disclosure Shift (2022\u20132024 Annual Filings)" headers={["Filing Year", "DEI Language Status", "Key Changes"]}>
        {sa.tenKFilings.map((f) => (
          <tr key={f.year}>
            <Td highlight>
              {f.year}
              <br />
              <span className="text-xs text-muted-foreground">({f.yearDetail})</span>
            </Td>
            <Td>
              {f.statusType === "confirmed" && <StatusBadge status="confirmed" />}
              {f.statusType === "reduced" && <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">Reduced</span>}
              {f.statusType === "dismantled" && <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-destructive/20 text-destructive">Dismantled</span>}
            </Td>
            <Td className="text-xs">{f.keyChanges}</Td>
          </tr>
        ))}
      </DataTable>

      <QuoteCard q={sa.tenKQuote} />
      <SourceLine urls={sa.tenKSourceUrls} />

      {/* Robby Starbuck Timeline */}
      <h3 className="text-lg font-semibold text-foreground">Robby Starbuck \u2014 Targeting of Meta</h3>
      <Timeline entries={sa.starbuckTimeline} />

      <KeyFinding label="Significance">{sa.starbuckKeyFinding}</KeyFinding>
    </div>
  );
}

function ConnectedDotsSection({ data }: { data: MetaReportData }) {
  const cd = data.connectedDots;
  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs text-primary tracking-wider uppercase">Section 04</p>
        <h2 className="text-2xl font-bold text-foreground mt-1">Connected Dots</h2>
        <p className="text-muted-foreground text-sm mt-1">Follow the money and the relationships.</p>
      </div>

      {/* Lobbying Firms */}
      <h3 className="text-lg font-semibold text-foreground">Meta's Lobbying Firms \u2014 2024 Roster</h3>
      <p className="text-sm text-muted-foreground">{cd.lobbyingOverview}</p>

      <DataTable title="Key External Firms and Amounts (2024)" headers={["Firm", "Amount Paid", "Notable Lobbyists"]}>
        {cd.lobbyingFirms.map((f) => (
          <tr key={f.firm}>
            <Td highlight>{f.firm}</Td>
            <Td mono>{f.amount}</Td>
            <Td className="text-xs">{f.lobbyists}</Td>
          </tr>
        ))}
      </DataTable>
      <SourceLine urls={[{ text: cd.lobbyingFirmsSourceLabel, url: cd.lobbyingFirmsSourceUrl }]} />

      <p className="text-sm text-muted-foreground">
        <strong className="text-foreground">Notable 2026 hires:</strong>{" "}
        <strong className="text-foreground">Bill McGinley</strong>, former top lawyer for Elon Musk's DOGE, hired as lobbyist (
        <a href="https://www.bloomberg.com/news/articles/2026-01-08/meta-hires-former-doge-trump-election-lawyer-as-lobbyist" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Bloomberg, Jan. 8, 2026</a>
        ). <strong className="text-foreground">Dina Powell McCormick</strong>, former Trump White House official, joined as President and Vice Chairman (
        <a href="https://www.reuters.com/business/dina-powell-mccormick-joins-meta-president-vice-chairman-2026-01-12/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Reuters, Jan. 12, 2026</a>
        ).
      </p>

      {/* AI Preemption */}
      <h3 className="text-lg font-semibold text-foreground">Meta's Position on AI Regulation \u2014 Federal Preemption</h3>
      <div className="mb-4">
        <StatusBadge status="confirmed" />
        <span className="ml-2 text-sm text-foreground font-medium">Confirmed Active Federal Preemption Campaign</span>
      </div>

      {cd.aiPreemption.map((p, i) => (
        <p key={i} className="text-sm text-muted-foreground">
          <strong className="text-foreground">{p.split(":")[0]}:</strong>{p.substring(p.indexOf(":"))}
          {i === 1 && (
            <>{" "}Source: <a href="https://www.ciodive.com/news/meta-lobbying-state-ai-laws/761047/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">CIO Dive, September 24, 2025</a></>
          )}
          {i === 2 && (
            <>{" "}Source: <a href="https://www.bipc.com/new-executive-order-signals-federal-preemption-strategy-for-state-laws-on-artificial-intelligence" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Buchanan Ingersoll analysis, January 7, 2026</a></>
          )}
          {i === 3 && (
            <>{" "}Source: <a href="https://www.forbes.com/sites/paulocarvao/2025/11/28/150-million-ai-lobbying-war-fuels-the-fight-over-preemption/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Forbes, November 28, 2025</a></>
          )}
        </p>
      ))}

      <KeyFinding label="Structural Parallel" variant="purple">{cd.aiPreemptionKeyFinding}</KeyFinding>

      <DataGap label="Data Gap \u2014 Requires LDA Research">
        {cd.aiPreemptionDataGap.split("lda.senate.gov")[0]}
        <a href={cd.aiPreemptionDataGapUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">lda.senate.gov</a>
        {" and filter by Agriculture/Food/Meat Processing."}
      </DataGap>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Demo Report Component (for Google, Amazon)
// ---------------------------------------------------------------------------

const DEMO_INTEGRITY = {
  google: {
    quotes: [
      { text: "Our mission is to organize the world's information and make it universally accessible and useful.", source: "Google Mission Statement, about.google" },
      { text: "We are committed to significantly increasing the leadership representation of underrepresented groups.", source: "Google Diversity Report, 2022 (discontinued)" },
    ],
    findings: [
      "Published diversity reports annually from 2014 to 2022 — then stopped.",
      "Hiring targets for underrepresented groups eliminated in February 2025, citing 'legal landscape changes.'",
      "PAC spending tilted 53% Republican in 2023–2024 cycle, up from 48% in 2021–2022.",
      "Lobbied on 24 bills in 2024 including AI regulation, antitrust, and content moderation.",
    ],
  },
  amazon: {
    quotes: [
      { text: "We strive to be Earth's most customer-centric company.", source: "Amazon Leadership Principles, aboutamazon.com" },
      { text: "Diversity and inclusion are good for business — and more fundamentally — simply right.", source: "Amazon DEI page, 2023 (removed)" },
    ],
    findings: [
      "14,000+ HR and corporate employees laid off in 2023–2024 restructuring.",
      "DEI programs described as 'wound down' in internal communications, December 2024.",
      "WARN Act: 4,085 employees affected in Washington state alone (2022–2026).",
      "Lobbying spend: $21.8M in 2024, up 18% year-over-year, focused on antitrust and labor regulation.",
    ],
  },
};

const DEMO_LABOR = {
  google: [
    { date: "Jan 2023", title: "12,000 employees laid off (~6% of workforce)", description: "CEO Sundar Pichai cited 'economic reality' and over-hiring during pandemic growth period. Affected every major division." },
    { date: "Throughout 2024", title: "Additional cuts across YouTube, Hardware, and Recruiting", description: "Targeted layoffs continued with reductions in YouTube content ops, Pixel hardware team, and internal recruiting organization." },
    { date: "2024–2025", title: "Role reposting patterns detected in engineering", description: "Multiple engineering positions reposted within 30–60 days of layoffs, suggesting backfill-at-lower-cost strategy." },
    { date: "2024–2025", title: "Hiring freeze in non-AI roles", description: "Internal communications indicated a company-wide hiring freeze for all roles not directly related to AI/ML product development." },
    { date: "Jan 2023", title: "WARN Act filings in California and New York", description: "California EDD and NY Department of Labor received WARN notices covering thousands of affected workers across Mountain View, Sunnyvale, and New York City offices." },
    { date: "Feb 2025", title: "Hiring diversity targets eliminated", description: "Internal memo confirmed all demographic hiring goals would be discontinued, citing 'legal landscape changes.'" },
  ],
  amazon: [
    { date: "Nov 2022 – Mar 2023", title: "27,000 layoffs across two major waves", description: "First wave (Nov 2022): 18,000 employees, the largest layoff in company history. Second wave (Mar 2023): 9,000 additional cuts targeting AWS, Twitch, advertising, and PXT (HR) divisions." },
    { date: "2023–2024", title: "14,000 additional corporate cuts", description: "Continued restructuring affecting corporate, operations, and HR teams across multiple business units." },
    { date: "2022–2026", title: "WARN Act: 4,085 employees in Washington state", description: "WARN filings submitted to Washington Employment Security Department covering Seattle, Bellevue, and Kent facilities." },
    { date: "Sep 2024", title: "Mandatory return-to-office 5 days/week", description: "CEO Andy Jassy mandated full-time in-office work for all corporate employees, reversing hybrid work policies established during pandemic." },
    { date: "2021–Present", title: "Union activity at multiple fulfillment centers (ALU)", description: "Amazon Labor Union (ALU) won historic election at Staten Island JFK8 facility. Ongoing organizing efforts at warehouses in Alabama, Kentucky, and California despite company opposition." },
    { date: "Dec 2024", title: "DEI programs quietly wound down", description: "Internal communications indicated diversity programs being 'streamlined' and 'deprioritized.' DEI page removed from public website." },
  ],
};

const DEMO_SAFETY = {
  google: [
    "OSHA complaint filed at a Google data center facility in 2023 regarding contractor working conditions.",
    "No major workplace safety violations on public OSHA record for Google corporate offices.",
    "Psychological safety concerns raised in internal Googler surveys (leaked 2024) — employees cited fear of retaliation for dissent and 'culture of silence' around layoff decisions.",
    "Antitrust ruling: Found to hold illegal monopoly in search (August 2024, DOJ v. Google).",
    "ADF Viewpoint Diversity Score: 12% (2025 index).",
  ],
  amazon: [
    "OSHA cited Amazon 17 times for safety violations at warehouses between 2022 and 2024, including ergonomic hazards and pace-of-work injuries.",
    "Injury rates at Amazon warehouses documented as 2× the industry average, per Strategic Organizing Center annual reports using Amazon's own data.",
    "Settlement reached with New York Attorney General over COVID-19 safety protocols at Staten Island and NYC-area fulfillment centers.",
    "Largest federal contractor in tech sector — $15B+ in active government contracts (AWS GovCloud).",
    "FTC antitrust complaint filed September 2023, alleging monopoly maintenance practices.",
    "Delivery driver classification disputes ongoing across multiple states.",
  ],
};

const DEMO_DOTS = {
  google: [
    "Sundar Pichai donated to Republican candidates in the 2024 election cycle.",
    "Board interlocks: Stanford University (multiple board members hold faculty/trustee positions), Salesforce (shared board member), John Doerr (KPCB venture capital, major Google investor and board advisor).",
    "53% of Google's lobbying spend in 2024 was directed at AI regulation — pushing for federal preemption of state-level AI laws.",
    "8 external lobbying firms retained in 2024, spending $13.4M on 24 bills.",
    "Former Google policy leads now holding positions at FTC, FCC, and White House OSTP.",
    "PAC donated to members on both Judiciary and Commerce committees overseeing tech regulation.",
  ],
  amazon: [
    "Andy Jassy PAC contributions leaned Republican in 2023–2024 cycle.",
    "Board interlocks: JPMorgan Chase (Jamie Dimon — shared advisory relationships), Starbucks (overlapping board/executive network).",
    "Amazon lobbying focused on four key areas: antitrust reform, labor regulation, AI governance, and drone delivery authorization.",
    "12 external lobbying firms retained in 2024, spending $21.8M — highest in company history.",
    "Former Amazon executives now serving on federal advisory boards for commerce and logistics.",
    "PAC contributions concentrated in Commerce and Labor committee members across both parties.",
  ],
};

function DemoReceiptsReport({ data, slug }: { data: { companyName: string; ticker: string; location: string; products: string; stats: any[] }; slug: string }) {
  const [activeTab, setActiveTab] = useState<TabId>("integrity-gap");
  const key = slug as "google" | "amazon";

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link to="/receipts" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-8">
          <ArrowLeft className="h-3 w-3" /> All Receipts
        </Link>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">{data.companyName}</h1>
            <Badge variant="secondary" className="text-xs">Demo Data</Badge>
          </div>
          <p className="text-muted-foreground text-sm mt-2 font-mono">{data.ticker} · {data.location} · {data.products}</p>
          <Badge className="mt-3 bg-primary/15 text-primary border-primary/30">March 2026</Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          {data.stats.map((s: any) => (
            <Card key={s.label} className="bg-card border border-border">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={cn("text-xl font-bold font-mono mt-1", s.trend === "down" ? "text-destructive" : "text-foreground")}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.detail}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex gap-0 border-b border-border mb-8 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors",
                activeTab === tab.id ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
            {activeTab === "integrity-gap" && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-xs text-primary tracking-wider uppercase">Section 01</p>
                    <Badge variant="secondary" className="text-xs">Demo Data</Badge>
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mt-1">Integrity Gap</h2>
                  <p className="text-muted-foreground text-sm mt-1">The gap between what a company says and what it does.</p>
                </div>
                <h3 className="text-lg font-semibold text-foreground">What They Say</h3>
                {DEMO_INTEGRITY[key]?.quotes.map((q, i) => <QuoteCard key={i} q={q} />)}
                <h3 className="text-lg font-semibold text-foreground">What We Found</h3>
                {DEMO_INTEGRITY[key]?.findings.map((f, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-primary mt-0.5 shrink-0">›</span>
                    <span>{f}</span>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground italic mt-4">This is a demonstration report. Full investigation in progress.</p>
              </div>
            )}
            {activeTab === "labor-impact" && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-xs text-primary tracking-wider uppercase">Section 02</p>
                    <Badge variant="secondary" className="text-xs">Demo Data</Badge>
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mt-1">Labor Impact</h2>
                  <p className="text-muted-foreground text-sm mt-1">How corporate decisions affect the workforce.</p>
                </div>
                <div className="relative pl-8 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-border">
                  {DEMO_LABOR[key]?.map((e, i) => (
                    <div key={i} className="relative">
                      <div className="absolute -left-5 top-1.5 w-3 h-3 rounded-full ring-2 ring-background bg-destructive" />
                      <p className="font-mono text-xs text-muted-foreground mb-1">{e.date}</p>
                      <h4 className="text-sm font-semibold text-foreground">{e.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{e.description}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground italic mt-4">This is a demonstration report. Full investigation in progress.</p>
              </div>
            )}
            {activeTab === "safety-alert" && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-xs text-primary tracking-wider uppercase">Section 03</p>
                    <Badge variant="secondary" className="text-xs">Demo Data</Badge>
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mt-1">Safety Alert</h2>
                  <p className="text-muted-foreground text-sm mt-1">Federal contracts, regulatory exposure, and accountability signals.</p>
                </div>
                {DEMO_SAFETY[key]?.map((s, i) => (
                  <div key={i} className="flex items-start gap-2 p-3 rounded-lg border border-border bg-card">
                    <span className="text-primary mt-0.5 shrink-0">›</span>
                    <span className="text-sm text-foreground">{s}</span>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground italic mt-4">This is a demonstration report. Full investigation in progress.</p>
              </div>
            )}
            {activeTab === "connected-dots" && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-xs text-primary tracking-wider uppercase">Section 04</p>
                    <Badge variant="secondary" className="text-xs">Demo Data</Badge>
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mt-1">Connected Dots</h2>
                  <p className="text-muted-foreground text-sm mt-1">Following the money from corporate treasury to political influence.</p>
                </div>
                {DEMO_DOTS[key]?.map((d, i) => (
                  <div key={i} className="flex items-start gap-2 p-3 rounded-lg border border-border bg-card">
                    <span className="text-primary mt-0.5 shrink-0">›</span>
                    <span className="text-sm text-foreground">{d}</span>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground italic mt-4">This is a demonstration report. Full investigation in progress.</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <p className="text-xs text-muted-foreground mt-16 italic text-center">
          This is a demonstration report using placeholder data. Full investigation report in progress — March 2026.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function ReceiptsReport() {
  const { slug } = useParams<{ slug: string }>();
  const [activeTab, setActiveTab] = useState<TabId>("integrity-gap");

  const companyName = slug ? COMPANY_NAMES[slug] || slug : "";

  usePageSEO({
    title: slug === "meta" ? "Meta Platforms \u2014 The Receipts" : `${companyName} \u2014 The Receipts`,
    description:
      slug === "meta"
        ? "Full investigation report on Meta Platforms, Inc. PAC spending, DEI dismantling, WARN Act filings, lobbying expenditures, and federal contractor status."
        : `Investigation report for ${companyName} coming soon.`,
    path: `/receipts/${slug}`,
  });

  // Companies with full demo reports
  const DEMO_REPORTS: Record<string, { companyName: string; ticker: string; location: string; products: string; stats: typeof META_REPORT.stats }> = {
    google: {
      companyName: "ALPHABET INC. (GOOGLE)",
      ticker: "NASDAQ: GOOGL",
      location: "Mountain View, CA",
      products: "Google Search, YouTube, Android, Cloud, Waymo",
      stats: [
        { label: "PAC Raised", value: "$478,200", detail: "2023–24 cycle" },
        { label: "Lobbying", value: "$13.4M", detail: "2024 total" },
        { label: "WARN Filings", value: "42", detail: "2022–2026" },
        { label: "Diversity Reports", value: "Stopped", detail: "After 11 years", trend: "down" },
      ],
    },
    amazon: {
      companyName: "AMAZON.COM, INC.",
      ticker: "NASDAQ: AMZN",
      location: "Seattle, WA",
      products: "AWS, Marketplace, Prime, Alexa, Whole Foods",
      stats: [
        { label: "PAC Raised", value: "$612,400", detail: "2023–24 cycle" },
        { label: "Lobbying", value: "$21.8M", detail: "2024 total" },
        { label: "WARN Filings", value: "87", detail: "2022–2026" },
        { label: "HR Cuts", value: "14,000+", detail: "Programs wound down", trend: "down" },
      ],
    },
  };

  const demoReport = slug ? DEMO_REPORTS[slug] : null;

  if (slug !== "meta" && !demoReport) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center px-4 py-24">
        <h2 className="text-3xl font-bold text-foreground mb-3">Report Coming Soon</h2>
        <p className="text-muted-foreground mb-6">We're building the full investigation for {companyName}.</p>
        <Link to="/receipts" className="inline-flex items-center gap-1 text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to all Receipts
        </Link>
      </div>
    );
  }

  if (demoReport) {
    return <DemoReceiptsReport data={demoReport} slug={slug!} />;
  }

  const data = META_REPORT;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back link */}
        <Link to="/receipts" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-8">
          <ArrowLeft className="h-3 w-3" /> All Receipts
        </Link>

        {/* Report Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">{data.companyName}</h1>
          <p className="text-muted-foreground text-sm mt-2 font-mono">
            {data.ticker} · {data.location} · {data.products}
          </p>
          <Badge className="mt-3 bg-primary/15 text-primary border-primary/30">{data.reportDate}</Badge>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          {data.stats.map((s) => (
            <Card key={s.label} className="bg-card border border-border">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={cn("text-xl font-bold font-mono mt-1", s.trend === "down" ? "text-destructive" : "text-foreground")}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.detail}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Section Tabs */}
        <div className="flex gap-0 border-b border-border mb-8 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors",
                activeTab === tab.id
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Section Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            {activeTab === "integrity-gap" && <IntegrityGapSection data={data} />}
            {activeTab === "labor-impact" && <LaborImpactSection data={data} />}
            {activeTab === "safety-alert" && <SafetyAlertSection data={data} />}
            {activeTab === "connected-dots" && <ConnectedDotsSection data={data} />}
          </motion.div>
        </AnimatePresence>

        {/* Receipts at a Glance */}
        <div className="mt-16">
          <h2 className="text-2xl font-extrabold text-foreground mb-6">The Receipts at a Glance</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-border">
              <thead>
                <tr className="bg-card">
                  <th className="text-left px-3 py-2 border-b border-border text-muted-foreground font-medium text-xs">Category</th>
                  <th className="text-left px-3 py-2 border-b border-border text-muted-foreground font-medium text-xs">Finding</th>
                  <th className="text-left px-3 py-2 border-b border-border text-muted-foreground font-medium text-xs">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.receiptsAtAGlance.map((r, i) => (
                  <tr key={i}>
                    <Td highlight>{r.category}</Td>
                    <Td>{r.finding}</Td>
                    <Td><StatusBadge status={r.status} /></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Outstanding Data Gaps */}
        <div className="mt-16">
          <h2 className="text-2xl font-extrabold text-foreground mb-2">Outstanding Data Gaps</h2>
          <p className="text-sm text-muted-foreground mb-6">The following gaps remain open and can be filled with publicly available sources.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-border">
              <thead>
                <tr className="bg-card">
                  <th className="text-left px-3 py-2 border-b border-border text-muted-foreground font-medium text-xs">Priority</th>
                  <th className="text-left px-3 py-2 border-b border-border text-muted-foreground font-medium text-xs">Gap</th>
                  <th className="text-left px-3 py-2 border-b border-border text-muted-foreground font-medium text-xs">Data Source</th>
                </tr>
              </thead>
              <tbody>
                {data.dataGaps.map((g, i) => (
                  <tr key={i}>
                    <Td><PriorityBadge priority={g.priority} /></Td>
                    <Td>{g.gap}</Td>
                    <Td className="text-xs">
                      <a href={g.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{g.sourceLabel}</a>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sources */}
        <div className="mt-16 mb-8">
          <h3 className="text-xl font-bold text-foreground mb-2">Sources</h3>
          <p className="text-xs text-muted-foreground mb-6">All data sourced from public records. Dollar amounts, dates, and bill numbers are drawn directly from primary sources cited below.</p>
          <div className="space-y-2">
            {data.sources.map((s) => (
              <div key={s.label} className="text-sm">
                <strong className="text-muted-foreground">{s.label}:</strong>{" "}
                {s.links.map((l, i) => (
                  <span key={i}>
                    {i > 0 && " · "}
                    <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{l.text}</a>
                  </span>
                ))}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-8 italic">
            Report compiled March 21, 2026. This is a demonstration template for investigative use; it does not constitute legal or financial advice.
          </p>
        </div>
      </div>
    </div>
  );
}
