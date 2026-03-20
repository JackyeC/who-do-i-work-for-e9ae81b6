import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { usePageSEO } from "@/hooks/use-page-seo";
import ForceGraph2D, { type ForceGraphMethods } from "react-force-graph-2d";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search, Building2, X, ChevronRight, ExternalLink, Filter,
  DollarSign, RotateCcw, Zap, Eye, EyeOff, Maximize2,
  AlertTriangle, TrendingUp, Lightbulb, Route, Crosshair,
  Download, Share2, Users, Scale, FileText, Factory, Landmark,
  Loader2, ArrowRight, Shield, Globe, Minimize2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

// ─── Types ───

interface GraphNode {
  id: string;
  label: string;
  group: string;
  val: number;
  amount?: number;
  metadata?: Record<string, any>;
  cluster?: number;
  issueCategories?: string[];
  party?: string;
  state?: string;
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
}

interface GraphLink {
  source: string | any;
  target: string | any;
  label: string;
  amount?: number;
  linkType: string;
  issueCategory?: string;
  year?: number;
  confidence?: string;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

// ─── Constants ───

const GROUP_COLORS: Record<string, string> = {
  Company: "#D4A843",
  PAC: "#7C5CFC",
  Politician: "#3B82F6",
  Legislation: "#22C55E",
  Industry: "#EF4444",
  Agency: "#A855F7",
  Committee: "#14B8A6",
};

const GROUP_SHAPES: Record<string, string> = {
  Company: "◆",
  PAC: "●",
  Politician: "▲",
  Legislation: "■",
  Industry: "⬟",
  Agency: "★",
  Committee: "◎",
};

const GROUP_LABELS: Record<string, { icon: any; desc: string }> = {
  Company: { icon: Building2, desc: "Corporation" },
  PAC: { icon: DollarSign, desc: "Political Action Committee" },
  Politician: { icon: Landmark, desc: "Elected Official" },
  Legislation: { icon: FileText, desc: "Bill / Resolution" },
  Industry: { icon: Factory, desc: "Industry Sector" },
  Agency: { icon: Shield, desc: "Government Agency" },
  Committee: { icon: Users, desc: "Congressional Committee" },
};

const ISSUE_CATEGORIES = [
  "All", "Labor Rights", "Immigration", "Climate", "Gun Policy",
  "Civil Rights", "Healthcare", "Consumer Protection", "Defense",
  "Technology", "Education", "Financial Services", "Energy", "Housing",
];

const RELATIONSHIP_TYPES = [
  { key: "all", label: "All" },
  { key: "donation_to_member", label: "Donations" },
  { key: "lobbying_on_bill", label: "Lobbying" },
  { key: "dark_money_channel", label: "Dark Money" },
  { key: "committee_oversight_of_contract", label: "Contracts" },
  { key: "revolving_door", label: "Revolving Door" },
  { key: "member_on_committee", label: "Committee" },
];

const LINK_STYLES: Record<string, { dash: number[]; color: string; label: string }> = {
  donation_to_member:           { dash: [],       color: "rgba(76, 175, 80, 0.7)",  label: "Donated to" },
  trade_association_lobbying:   { dash: [6, 3],   color: "rgba(66, 133, 244, 0.7)", label: "Trade Lobbying" },
  lobbying_on_bill:             { dash: [6, 3],   color: "rgba(66, 133, 244, 0.7)", label: "Lobbied On" },
  dark_money_channel:           { dash: [2, 4],   color: "rgba(244, 67, 54, 0.6)",  label: "Dark Money" },
  member_on_committee:          { dash: [10, 5],  color: "rgba(158, 158, 158, 0.5)", label: "Committee Member" },
  committee_oversight_of_contract: { dash: [],    color: "rgba(255, 152, 0, 0.6)",  label: "Contract Oversight" },
  revolving_door:               { dash: [3, 3],   color: "rgba(156, 39, 176, 0.6)", label: "Revolving Door" },
  foundation_grant_to_district: { dash: [],       color: "rgba(0, 188, 212, 0.6)",  label: "Grant" },
  advisory_committee_appointment: { dash: [4, 4], color: "rgba(121, 85, 72, 0.6)",  label: "Advisory Role" },
  interlocking_directorate:     { dash: [2, 2],   color: "rgba(96, 125, 139, 0.6)", label: "Board Interlock" },
  state_lobbying_contract:      { dash: [],       color: "rgba(255, 193, 7, 0.6)",  label: "State Contract" },
  international_influence:      { dash: [8, 4],   color: "rgba(233, 30, 99, 0.6)",  label: "International" },
};

const CONFIDENCE_LABELS: Record<string, string> = {
  direct: "Direct — documented in public filings",
  likely: "Likely — strong circumstantial evidence",
  inferred: "Inferred — pattern-based connection",
  partial: "Partial — limited evidence available",
};

// ─── Helpers ───

function mapEntityType(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes("pac") || lower.includes("political_action")) return "PAC";
  if (lower.includes("politician") || lower.includes("member") || lower.includes("candidate") || lower.includes("congress")) return "Politician";
  if (lower.includes("bill") || lower.includes("legislation") || lower.includes("law")) return "Legislation";
  if (lower.includes("industry") || lower.includes("sector")) return "Industry";
  if (lower.includes("agency") || lower.includes("department") || lower.includes("government")) return "Agency";
  if (lower.includes("committee")) return "Committee";
  return "Company";
}

function formatAmount(amount: number | null | undefined): string {
  if (!amount) return "";
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

function mapLinkLabel(linkType: string): string {
  return LINK_STYLES[linkType]?.label || linkType.replace(/_/g, " ");
}

function assignClusters(nodes: GraphNode[], links: GraphLink[]): GraphNode[] {
  const adj = new Map<string, Set<string>>();
  for (const n of nodes) adj.set(n.id, new Set());
  for (const l of links) {
    const src = typeof l.source === "string" ? l.source : l.source.id;
    const tgt = typeof l.target === "string" ? l.target : l.target.id;
    adj.get(src)?.add(tgt);
    adj.get(tgt)?.add(src);
  }
  const visited = new Set<string>();
  let clusterId = 0;
  const clusterMap = new Map<string, number>();
  for (const node of nodes) {
    if (visited.has(node.id)) continue;
    const queue = [node.id];
    visited.add(node.id);
    while (queue.length > 0) {
      const curr = queue.shift()!;
      clusterMap.set(curr, clusterId);
      for (const neighbor of adj.get(curr) || []) {
        if (!visited.has(neighbor)) { visited.add(neighbor); queue.push(neighbor); }
      }
    }
    clusterId++;
  }
  return nodes.map(n => ({ ...n, cluster: clusterMap.get(n.id) ?? 0 }));
}

// BFS shortest path
function findPath(nodes: GraphNode[], links: GraphLink[], startId: string, endId: string): { nodeIds: string[]; linkIndices: number[] } | null {
  const adj = new Map<string, { nodeId: string; linkIdx: number }[]>();
  for (const n of nodes) adj.set(n.id, []);
  links.forEach((l, i) => {
    const src = typeof l.source === "string" ? l.source : l.source.id;
    const tgt = typeof l.target === "string" ? l.target : l.target.id;
    adj.get(src)?.push({ nodeId: tgt, linkIdx: i });
    adj.get(tgt)?.push({ nodeId: src, linkIdx: i });
  });
  const visited = new Set<string>([startId]);
  const queue: { id: string; path: string[]; linkPath: number[] }[] = [{ id: startId, path: [startId], linkPath: [] }];
  while (queue.length > 0) {
    const { id, path, linkPath } = queue.shift()!;
    if (id === endId) return { nodeIds: path, linkIndices: linkPath };
    for (const neighbor of adj.get(id) || []) {
      if (!visited.has(neighbor.nodeId)) {
        visited.add(neighbor.nodeId);
        queue.push({ id: neighbor.nodeId, path: [...path, neighbor.nodeId], linkPath: [...linkPath, neighbor.linkIdx] });
      }
    }
  }
  return null;
}

// Generate insights from current graph
function generateInsights(nodes: GraphNode[], links: GraphLink[]): string[] {
  const insights: string[] = [];
  const companyCounts = nodes.filter(n => n.group === "Company").length;
  const politicianCounts = nodes.filter(n => n.group === "Politician").length;
  const pacCounts = nodes.filter(n => n.group === "PAC").length;
  const legislationCounts = nodes.filter(n => n.group === "Legislation").length;

  // Hub detection
  const connectionCounts = new Map<string, number>();
  for (const l of links) {
    const src = typeof l.source === "string" ? l.source : l.source.id;
    const tgt = typeof l.target === "string" ? l.target : l.target.id;
    connectionCounts.set(src, (connectionCounts.get(src) || 0) + 1);
    connectionCounts.set(tgt, (connectionCounts.get(tgt) || 0) + 1);
  }
  const hub = [...connectionCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  const hubNode = hub ? nodes.find(n => n.id === hub[0]) : null;
  if (hubNode && hub[1] >= 3) {
    insights.push(`${hubNode.label} is the most connected entity in this network with ${hub[1]} relationships.`);
  }

  // Money flow
  const totalAmount = links.reduce((s, l) => s + (l.amount || 0), 0);
  if (totalAmount > 0) {
    insights.push(`${formatAmount(totalAmount)} in documented money flow across ${links.filter(l => l.amount).length} financial connections.`);
  }

  // Dark money
  const darkMoneyLinks = links.filter(l => l.linkType === "dark_money_channel");
  if (darkMoneyLinks.length > 0) {
    insights.push(`${darkMoneyLinks.length} dark money channel${darkMoneyLinks.length > 1 ? "s" : ""} detected — these represent undisclosed political spending paths.`);
  }

  // Multi-company overlap
  if (companyCounts > 1) {
    insights.push(`${companyCounts} companies appear in this network — potential shared influence infrastructure.`);
  }

  // PAC-to-politician ratio
  if (pacCounts > 0 && politicianCounts > 0) {
    const ratio = (politicianCounts / pacCounts).toFixed(1);
    insights.push(`Each PAC connects to an average of ${ratio} politicians in this network.`);
  }

  // Legislation reach
  if (legislationCounts > 0) {
    insights.push(`${legislationCounts} piece${legislationCounts > 1 ? "s" : ""} of legislation connected to this influence network.`);
  }

  return insights.slice(0, 5);
}

// ─── Sample data ───

const SAMPLE_NODES: GraphNode[] = [
  // ── Amazon (Technology, Consumer Protection, Defense, Labor Rights) ──
  { id: "amazon", label: "Amazon", group: "Company", val: 22, metadata: { industry: "Technology / E-Commerce", summary: "One of the largest corporate political spenders in tech, with extensive lobbying on AI regulation, antitrust, and labor policy." } },
  { id: "amazon-pac", label: "Amazon.com PAC", group: "PAC", val: 16, amount: 1_200_000, metadata: { summary: "Amazon's corporate PAC disbursing funds to candidates across both parties." } },
  { id: "sen-cantwell", label: "Sen. Maria Cantwell (D-WA)", group: "Politician", val: 12, party: "Democrat", state: "WA", issueCategories: ["Technology", "Consumer Protection"] },
  { id: "sen-wyden", label: "Sen. Ron Wyden (D-OR)", group: "Politician", val: 12, party: "Democrat", state: "OR", issueCategories: ["Technology", "Civil Rights"] },
  { id: "rep-delbene", label: "Rep. Suzan DelBene (D-WA)", group: "Politician", val: 10, party: "Democrat", state: "WA", issueCategories: ["Technology"] },
  { id: "rep-mcmorris", label: "Rep. Cathy McMorris Rodgers (R-WA)", group: "Politician", val: 10, party: "Republican", state: "WA", issueCategories: ["Technology", "Energy"] },
  { id: "commerce-committee", label: "Senate Commerce Committee", group: "Committee", val: 14, issueCategories: ["Technology", "Consumer Protection"] },
  { id: "finance-committee", label: "Senate Finance Committee", group: "Committee", val: 14, issueCategories: ["Financial Services"] },
  { id: "ai-regulation-bill", label: "AI Accountability Act (S.3312)", group: "Legislation", val: 12, issueCategories: ["Technology", "Labor Rights"], metadata: { status: "In Committee", description: "Requires algorithmic impact assessments for automated decision systems." } },
  { id: "data-privacy-bill", label: "American Data Privacy Act (H.R.8152)", group: "Legislation", val: 12, issueCategories: ["Consumer Protection", "Technology"], metadata: { status: "Passed House", description: "Comprehensive federal data privacy framework." } },
  { id: "tech-industry", label: "Technology Sector", group: "Industry", val: 16, issueCategories: ["Technology"] },
  { id: "ecommerce-industry", label: "E-Commerce & Retail", group: "Industry", val: 14, issueCategories: ["Consumer Protection"] },
  { id: "dod", label: "Dept. of Defense", group: "Agency", val: 18, amount: 10_000_000, issueCategories: ["Defense"] },

  // ── Microsoft (Technology, Defense) ──
  { id: "microsoft", label: "Microsoft", group: "Company", val: 18, metadata: { industry: "Technology", summary: "Major government contractor and political spender with interests in AI regulation." } },
  { id: "ms-pac", label: "Microsoft PAC", group: "PAC", val: 14, amount: 890_000 },

  // ── UnitedHealth Group (Healthcare) ──
  { id: "unitedhealth", label: "UnitedHealth Group", group: "Company", val: 20, metadata: { industry: "Healthcare / Insurance", summary: "Largest health insurer in the US. Massive lobbying on ACA, Medicare, and drug pricing legislation." } },
  { id: "uhg-pac", label: "UnitedHealth Group PAC", group: "PAC", val: 15, amount: 2_800_000, metadata: { summary: "One of the top healthcare PACs, donating heavily to both parties." } },
  { id: "sen-cassidy", label: "Sen. Bill Cassidy (R-LA)", group: "Politician", val: 11, party: "Republican", state: "LA", issueCategories: ["Healthcare"] },
  { id: "sen-murray", label: "Sen. Patty Murray (D-WA)", group: "Politician", val: 11, party: "Democrat", state: "WA", issueCategories: ["Healthcare", "Education"] },
  { id: "help-committee", label: "Senate HELP Committee", group: "Committee", val: 13, issueCategories: ["Healthcare", "Education"] },
  { id: "drug-pricing-bill", label: "Prescription Drug Pricing Reform Act", group: "Legislation", val: 11, issueCategories: ["Healthcare"], metadata: { status: "In Committee", description: "Would allow Medicare to negotiate drug prices and cap out-of-pocket costs." } },
  { id: "healthcare-industry", label: "Healthcare Sector", group: "Industry", val: 15, issueCategories: ["Healthcare"] },
  { id: "hhs", label: "Dept. of Health & Human Services", group: "Agency", val: 16, issueCategories: ["Healthcare"] },

  // ── Tyson Foods (Immigration, Labor Rights) ──
  { id: "tyson", label: "Tyson Foods", group: "Company", val: 16, metadata: { industry: "Food / Agriculture", summary: "One of the largest meatpacking companies. Heavily lobbied on immigration reform, guest worker programs, and OSHA standards." } },
  { id: "tyson-pac", label: "Tyson Foods PAC", group: "PAC", val: 12, amount: 420_000, metadata: { summary: "Funds candidates supporting agricultural labor and immigration reform." } },
  { id: "sen-cotton", label: "Sen. Tom Cotton (R-AR)", group: "Politician", val: 10, party: "Republican", state: "AR", issueCategories: ["Immigration", "Defense"] },
  { id: "rep-crawford", label: "Rep. Rick Crawford (R-AR)", group: "Politician", val: 9, party: "Republican", state: "AR", issueCategories: ["Immigration", "Labor Rights"] },
  { id: "judiciary-committee", label: "Senate Judiciary Committee", group: "Committee", val: 13, issueCategories: ["Immigration", "Civil Rights"] },
  { id: "farm-workforce-bill", label: "Farm Workforce Modernization Act (H.R.1603)", group: "Legislation", val: 11, issueCategories: ["Immigration", "Labor Rights"], metadata: { status: "Passed House", description: "Reforms H-2A visa program and provides path to legal status for farm workers." } },
  { id: "agriculture-industry", label: "Agriculture Sector", group: "Industry", val: 13, issueCategories: ["Labor Rights", "Immigration"] },

  // ── Starbucks (Labor Rights — Union organizing) ──
  { id: "starbucks", label: "Starbucks", group: "Company", val: 18, metadata: { industry: "Food & Beverage", summary: "Over 400 NLRB unfair labor practice complaints. Center of largest US union wave since the 1930s with Workers United/SBWU organizing 400+ stores." } },
  { id: "starbucks-pac", label: "Starbucks PAC", group: "PAC", val: 12, amount: 560_000 },
  { id: "sen-sanders", label: "Sen. Bernie Sanders (I-VT)", group: "Politician", val: 13, party: "Independent", state: "VT", issueCategories: ["Labor Rights", "Healthcare"] },
  { id: "labor-committee", label: "Senate HELP Committee (Labor)", group: "Committee", val: 14, issueCategories: ["Labor Rights", "Education"] },
  { id: "pro-act", label: "PRO Act (H.R.842)", group: "Legislation", val: 13, issueCategories: ["Labor Rights"], metadata: { status: "Passed House", description: "Protecting the Right to Organize Act — strengthens union organizing rights, bans captive audience meetings, adds penalties for labor law violations." } },
  { id: "nlrb-agency", label: "National Labor Relations Board", group: "Agency", val: 16, issueCategories: ["Labor Rights"] },
  { id: "labor-industry", label: "Organized Labor Sector", group: "Industry", val: 14, issueCategories: ["Labor Rights"] },

  // ── Dollar General (Labor Rights — OSHA severe violator) ──
  { id: "dollar-general", label: "Dollar General", group: "Company", val: 15, metadata: { industry: "Retail", summary: "Designated OSHA 'Severe Violator' for repeated willful safety violations including blocked exits, falling hazards, and understaffing across hundreds of stores." } },
  { id: "dol-agency", label: "Dept. of Labor", group: "Agency", val: 16, issueCategories: ["Labor Rights"] },
  { id: "workplace-safety-bill", label: "Workplace Violence Prevention Act (H.R.1195)", group: "Legislation", val: 11, issueCategories: ["Labor Rights"], metadata: { status: "In Committee", description: "Requires employers to develop and implement workplace violence prevention plans." } },

  // ── Tesla (Labor Rights — NLRB + safety) ──
  { id: "tesla", label: "Tesla", group: "Company", val: 18, metadata: { industry: "Automotive / EV", summary: "Multiple NLRB complaints including illegal anti-union tweets by CEO. OSHA violations at Fremont plant. UAW launched organizing campaign in 2023." } },
  { id: "tesla-pac", label: "Tesla PAC", group: "PAC", val: 11, amount: 280_000 },
  { id: "osha-agency", label: "OSHA", group: "Agency", val: 15, issueCategories: ["Labor Rights"] },

  // ── UPS (Labor Rights — Pro-union, Teamsters) ──
  { id: "ups", label: "UPS", group: "Company", val: 17, metadata: { industry: "Logistics", summary: "Largest unionized private employer in the US. 2023 Teamsters contract covering 340,000 workers was the largest private-sector union contract in US history." } },
  { id: "ups-pac", label: "UPS PAC", group: "PAC", val: 13, amount: 1_100_000 },
  

  // ── Costco (Labor Rights — Pro-worker) ──
  { id: "costco", label: "Costco", group: "Company", val: 16, metadata: { industry: "Retail", summary: "Known for above-average wages ($29.50/hr avg), comprehensive benefits, and relatively positive labor relations. CEO publicly opposed federal minimum wage cuts." } },

  // ── Apple (Labor Rights — Retail union drives) ──
  { id: "apple-retail", label: "Apple (Retail)", group: "Company", val: 17, metadata: { industry: "Technology / Retail", summary: "Facing retail union organizing at Apple Stores nationwide. IAM won first Apple Store union in Towson, MD. CWA organizing in multiple states." } },
  { id: "apple-pac", label: "Apple PAC", group: "PAC", val: 12, amount: 420_000 },

  // ── Google (Immigration — H-1B) ──
  { id: "google", label: "Google (Alphabet)", group: "Company", val: 20, metadata: { industry: "Technology", summary: "Top H-1B sponsor with 8,000+ Labor Condition Applications annually. Co-founded FWD.us immigration advocacy coalition. Active lobbying on high-skilled visa reform." } },
  { id: "google-pac", label: "Google NetPAC", group: "PAC", val: 14, amount: 1_400_000 },
  { id: "sen-padilla", label: "Sen. Alex Padilla (D-CA)", group: "Politician", val: 10, party: "Democrat", state: "CA", issueCategories: ["Immigration", "Technology"] },
  { id: "immigration-subcommittee", label: "Senate Judiciary Immigration Subcommittee", group: "Committee", val: 14, issueCategories: ["Immigration"] },
  { id: "eagle-act", label: "EAGLE Act (H.R.3648)", group: "Legislation", val: 12, issueCategories: ["Immigration"], metadata: { status: "Passed House", description: "Equal Access to Green cards for Legal Employment Act — eliminates per-country green card caps." } },
  { id: "fwd-us", label: "FWD.us (Tech Immigration Coalition)", group: "Industry", val: 14, issueCategories: ["Immigration", "Technology"], metadata: { summary: "Tech industry advocacy group co-founded by Mark Zuckerberg pushing for immigration reform." } },
  { id: "dol-flc", label: "DOL Foreign Labor Certification", group: "Agency", val: 15, issueCategories: ["Immigration"] },

  // ── Infosys (Immigration — Largest H-1B sponsor) ──
  { id: "infosys", label: "Infosys", group: "Company", val: 16, metadata: { industry: "IT Outsourcing", summary: "Largest H-1B sponsor by volume with 30,000+ annual LCAs. Paid $34M to settle visa fraud allegations in 2013." } },

  // ── Marriott (Immigration — H-2B hospitality) ──
  { id: "marriott", label: "Marriott International", group: "Company", val: 15, metadata: { industry: "Hospitality", summary: "Major H-2B hospitality visa sponsor for seasonal hotel workers across the US." } },
  { id: "marriott-pac", label: "Marriott PAC", group: "PAC", val: 12, amount: 680_000 },
  { id: "h2b-returning-bill", label: "H-2B Returning Worker Exception Act", group: "Legislation", val: 10, issueCategories: ["Immigration"], metadata: { status: "In Committee", description: "Exempts returning H-2B workers from the annual cap, expanding seasonal worker visas." } },
  { id: "hospitality-industry", label: "Hospitality Sector", group: "Industry", val: 13, issueCategories: ["Immigration"] },
  { id: "uscis", label: "USCIS", group: "Agency", val: 15, issueCategories: ["Immigration"] },

  // ── ExxonMobil (Climate, Energy) ──
  { id: "exxon", label: "ExxonMobil", group: "Company", val: 20, metadata: { industry: "Oil & Gas / Energy", summary: "One of the largest fossil fuel companies. Decades-long lobbying against climate regulation while publicly pledging carbon reduction." } },
  { id: "exxon-pac", label: "ExxonMobil PAC", group: "PAC", val: 15, amount: 1_650_000, metadata: { summary: "Funds candidates across parties, with concentration on energy and environment committee members." } },
  { id: "sen-manchin", label: "Sen. Joe Manchin (I-WV)", group: "Politician", val: 12, party: "Independent", state: "WV", issueCategories: ["Climate", "Energy"] },
  { id: "sen-capito", label: "Sen. Shelley Moore Capito (R-WV)", group: "Politician", val: 10, party: "Republican", state: "WV", issueCategories: ["Climate", "Energy"] },
  { id: "epw-committee", label: "Senate Environment & Public Works", group: "Committee", val: 13, issueCategories: ["Climate", "Energy"] },
  { id: "clean-energy-bill", label: "Clean Energy Innovation Act (S.2657)", group: "Legislation", val: 11, issueCategories: ["Climate", "Energy"], metadata: { status: "In Committee", description: "Authorizes DOE research programs for carbon capture and clean energy." } },
  { id: "energy-industry", label: "Oil & Gas Sector", group: "Industry", val: 15, issueCategories: ["Energy", "Climate"] },
  { id: "doe", label: "Dept. of Energy", group: "Agency", val: 15, issueCategories: ["Energy", "Climate"] },

  // ── Chevron (Climate — Major emitter, litigation target) ──
  { id: "chevron", label: "Chevron", group: "Company", val: 19, metadata: { industry: "Oil & Gas", summary: "Major integrated energy company. Target of multiple municipal climate lawsuits. Significant EPA GHGRP-reported emissions." } },
  { id: "chevron-pac", label: "Chevron PAC", group: "PAC", val: 14, amount: 1_300_000 },
  { id: "sen-barrasso", label: "Sen. John Barrasso (R-WY)", group: "Politician", val: 11, party: "Republican", state: "WY", issueCategories: ["Climate", "Energy"] },
  { id: "ira-clean-energy", label: "Inflation Reduction Act (Clean Energy)", group: "Legislation", val: 13, issueCategories: ["Climate", "Energy"], metadata: { status: "Enacted", description: "$369B in clean energy investments, tax credits for EVs, renewable energy, and carbon capture." } },
  { id: "climate-action-100", label: "Climate Action 100+ (Investor Coalition)", group: "Industry", val: 14, issueCategories: ["Climate"], metadata: { summary: "Investor-led initiative ensuring the world's largest corporate GHG emitters take necessary action on climate change." } },

  // ── Duke Energy (Climate — Largest US utility emitter) ──
  { id: "duke-energy", label: "Duke Energy", group: "Company", val: 17, metadata: { industry: "Utilities", summary: "Largest electric utility in the US by generation. Major EPA GHGRP reporter transitioning from coal to renewables." } },
  { id: "duke-pac", label: "Duke Energy PAC", group: "PAC", val: 13, amount: 920_000 },
  { id: "house-energy-committee", label: "House Energy & Commerce Committee", group: "Committee", val: 14, issueCategories: ["Climate", "Energy", "Healthcare"] },
  { id: "clean-air-amendments", label: "Clean Air Act Amendments", group: "Legislation", val: 12, issueCategories: ["Climate"], metadata: { status: "Ongoing", description: "Amendments to strengthen EPA authority to regulate power plant emissions under the Clean Air Act." } },

  // ── NextEra Energy (Climate — Largest US renewables) ──
  { id: "nextera", label: "NextEra Energy", group: "Company", val: 16, metadata: { industry: "Utilities / Renewables", summary: "Largest generator of wind and solar energy in the world. Leading the utility industry's renewable energy transition." } },
  { id: "nextera-pac", label: "NextEra Energy PAC", group: "PAC", val: 12, amount: 780_000 },

  // ── Marathon Petroleum (Climate — Largest US refiner) ──
  { id: "marathon", label: "Marathon Petroleum", group: "Company", val: 17, metadata: { industry: "Oil & Gas / Refining", summary: "Largest petroleum refiner in the US. Major EPA GHGRP emissions reporter. Lobbied against clean fuel standards." } },
  { id: "marathon-pac", label: "Marathon Petroleum PAC", group: "PAC", val: 13, amount: 1_050_000 },
  { id: "ogci", label: "Oil & Gas Climate Initiative", group: "Industry", val: 13, issueCategories: ["Climate", "Energy"], metadata: { summary: "CEO-led consortium of major oil and gas companies investing in low-carbon technologies." } },

  // ── Smith & Wesson / NSSF (Gun Policy) ──
  { id: "smith-wesson", label: "Smith & Wesson Brands", group: "Company", val: 14, metadata: { industry: "Firearms Manufacturing", summary: "Major US firearms manufacturer. Lobbies through NSSF trade association against gun safety legislation." } },
  { id: "nssf-pac", label: "NSSF PAC (Gun Industry)", group: "PAC", val: 13, amount: 780_000, metadata: { summary: "National Shooting Sports Foundation PAC — the gun industry's primary political spending vehicle." } },
  { id: "nra-pac", label: "NRA Political Victory Fund", group: "PAC", val: 18, amount: 14_000_000, metadata: { summary: "NRA's PAC — one of the most influential political spending vehicles in US politics. Grades politicians on gun policy stances." } },
  { id: "everytown-pac", label: "Everytown for Gun Safety PAC", group: "PAC", val: 14, amount: 6_500_000, metadata: { summary: "Gun safety advocacy PAC. Funded by Bloomberg Philanthropies. Supports universal background check legislation." } },
  { id: "giffords-org", label: "Giffords Law Center", group: "Industry", val: 13, issueCategories: ["Gun Policy"], metadata: { summary: "Gun violence prevention organization founded by former Rep. Gabby Giffords. Rates states on gun law strength." } },
  { id: "sen-thune", label: "Sen. John Thune (R-SD)", group: "Politician", val: 11, party: "Republican", state: "SD", issueCategories: ["Gun Policy"] },
  { id: "rep-hudson", label: "Rep. Richard Hudson (R-NC)", group: "Politician", val: 10, party: "Republican", state: "NC", issueCategories: ["Gun Policy"] },
  { id: "sen-murphy", label: "Sen. Chris Murphy (D-CT)", group: "Politician", val: 12, party: "Democrat", state: "CT", issueCategories: ["Gun Policy"] },
  { id: "gun-safety-bill", label: "Bipartisan Background Checks Act (H.R.8)", group: "Legislation", val: 11, issueCategories: ["Gun Policy"], metadata: { status: "Passed House", description: "Requires background checks for all firearm sales, including private and gun show transactions." } },
  { id: "safer-communities-act", label: "Bipartisan Safer Communities Act", group: "Legislation", val: 13, issueCategories: ["Gun Policy"], metadata: { status: "Enacted (2022)", description: "First major federal gun safety law in 30 years. Enhanced background checks for under-21 buyers, funding for state red flag laws." } },
  { id: "plcaa", label: "Protection of Lawful Commerce in Arms Act", group: "Legislation", val: 12, issueCategories: ["Gun Policy"], metadata: { status: "Enacted (2005)", description: "Shields gun manufacturers from civil liability in most cases. Key legal protection for firearms industry." } },
  { id: "firearms-industry", label: "Firearms Sector", group: "Industry", val: 12, issueCategories: ["Gun Policy"] },
  { id: "atf", label: "Bureau of Alcohol, Tobacco & Firearms", group: "Agency", val: 13, issueCategories: ["Gun Policy"] },
  { id: "house-judiciary", label: "House Judiciary Committee", group: "Committee", val: 14, issueCategories: ["Gun Policy", "Civil Rights", "Immigration"] },

  // ── Walmart (Gun Policy — Retailer that changed policy) ──
  { id: "walmart-guns", label: "Walmart (Gun Sales)", group: "Company", val: 16, metadata: { industry: "Retail", summary: "Largest US retailer. Sold firearms until 2019 when it stopped selling handgun ammunition and raised purchase age to 21 after El Paso shooting." } },

  // ── Dick's Sporting Goods (Gun Policy — Removed assault rifles) ──
  { id: "dicks-sporting", label: "Dick's Sporting Goods", group: "Company", val: 14, metadata: { industry: "Retail", summary: "Removed assault-style rifles from all 730+ stores after Parkland. CEO Ed Stack became corporate gun safety advocate. Destroyed $5M in firearms inventory." } },

  // ── Levi Strauss (Gun Policy — Corporate gun safety advocacy) ──
  { id: "levi-strauss", label: "Levi Strauss & Co", group: "Company", val: 13, metadata: { industry: "Apparel", summary: "CEO Chip Bergh launched 'Everytown Business Leaders for Gun Safety' corporate coalition. Donated $1M to gun safety organizations." } },

  // ── Pearson / McGraw Hill (Education) ──
  { id: "pearson", label: "Pearson Education", group: "Company", val: 14, metadata: { industry: "Education / Publishing", summary: "Largest education publisher globally. Lobbies on standardized testing mandates, EdTech procurement, and student data privacy." } },
  { id: "pearson-pac", label: "Pearson/Education Industry PAC", group: "PAC", val: 11, amount: 320_000, metadata: { summary: "EdTech industry PAC funding candidates who support standardized testing mandates." } },
  { id: "rep-scott", label: "Rep. Bobby Scott (D-VA)", group: "Politician", val: 10, party: "Democrat", state: "VA", issueCategories: ["Education", "Labor Rights"] },
  { id: "education-bill", label: "Student Data Privacy Act (S.1158)", group: "Legislation", val: 10, issueCategories: ["Education", "Consumer Protection"], metadata: { status: "In Committee", description: "Restricts how education technology companies can use student data." } },
  { id: "education-industry", label: "Education Sector", group: "Industry", val: 13, issueCategories: ["Education"] },
  { id: "dept-education", label: "Dept. of Education", group: "Agency", val: 14, issueCategories: ["Education"] },

  // ── Blackstone (Housing, Financial Services) ──
  { id: "blackstone", label: "Blackstone Group", group: "Company", val: 18, metadata: { industry: "Private Equity / Real Estate", summary: "Largest private equity firm and single-family home landlord in the US. Lobbies on housing deregulation, carried interest tax treatment, and financial services oversight." } },
  { id: "blackstone-pac", label: "Blackstone Group PAC", group: "PAC", val: 14, amount: 1_100_000, metadata: { summary: "Major financial services PAC. Top recipients sit on Banking and Finance committees." } },
  { id: "sen-scott-tim", label: "Sen. Tim Scott (R-SC)", group: "Politician", val: 11, party: "Republican", state: "SC", issueCategories: ["Housing", "Financial Services"] },
  { id: "sen-warren", label: "Sen. Elizabeth Warren (D-MA)", group: "Politician", val: 12, party: "Democrat", state: "MA", issueCategories: ["Housing", "Financial Services", "Consumer Protection"] },
  { id: "banking-committee", label: "Senate Banking Committee", group: "Committee", val: 14, issueCategories: ["Housing", "Financial Services"] },
  { id: "housing-bill", label: "Affordable Housing Credit Improvement Act (S.1557)", group: "Legislation", val: 11, issueCategories: ["Housing"], metadata: { status: "In Committee", description: "Expands Low-Income Housing Tax Credit and addresses housing supply crisis." } },
  { id: "carried-interest-bill", label: "Carried Interest Fairness Act (S.1598)", group: "Legislation", val: 10, issueCategories: ["Financial Services"], metadata: { status: "In Committee", description: "Would tax carried interest as ordinary income instead of capital gains." } },
  { id: "housing-industry", label: "Real Estate Sector", group: "Industry", val: 14, issueCategories: ["Housing"] },
  { id: "hud", label: "Dept. of Housing & Urban Development", group: "Agency", val: 14, issueCategories: ["Housing"] },
  { id: "financial-industry", label: "Financial Services Sector", group: "Industry", val: 15, issueCategories: ["Financial Services"] },

  // ── Koch Industries (Dark Money — Climate, Energy) ──
  { id: "koch", label: "Koch Industries", group: "Company", val: 20, metadata: { industry: "Conglomerate / Energy", summary: "Private conglomerate with one of the largest dark money networks in US politics. Funds 501(c)(4) groups that spend on elections without disclosing donors." } },
  { id: "koch-pac", label: "Koch Industries PAC", group: "PAC", val: 14, amount: 2_100_000, metadata: { summary: "Direct PAC spending — only the visible portion of Koch's political influence." } },
  { id: "americans-prosperity", label: "Americans for Prosperity (501c4)", group: "PAC", val: 18, amount: 65_000_000, metadata: { summary: "Koch-funded 501(c)(4) dark money group. Spent $65M+ on elections without disclosing donors. Opposes climate regulation and ACA." } },
  { id: "freedom-partners", label: "Freedom Partners Chamber", group: "PAC", val: 15, amount: 42_000_000, metadata: { summary: "Koch donor network hub. Distributed $42M to conservative groups opposing environmental and labor regulations." } },
  { id: "sen-cruz", label: "Sen. Ted Cruz (R-TX)", group: "Politician", val: 12, party: "Republican", state: "TX", issueCategories: ["Energy", "Climate"] },
  { id: "epa", label: "Environmental Protection Agency", group: "Agency", val: 15, issueCategories: ["Climate", "Energy"] },
  { id: "climate-deregulation-bill", label: "EPA Regulatory Reform Act", group: "Legislation", val: 11, issueCategories: ["Climate", "Energy"], metadata: { status: "In Committee", description: "Would restrict EPA authority to regulate greenhouse gas emissions from power plants." } },

  // ── Raytheon/RTX (Revolving Door — Defense) ──
  { id: "raytheon", label: "RTX (Raytheon)", group: "Company", val: 20, metadata: { industry: "Defense / Aerospace", summary: "Major defense contractor. Former executives rotate between Pentagon leadership roles and corporate board seats — textbook revolving door." } },
  { id: "raytheon-pac", label: "RTX PAC", group: "PAC", val: 15, amount: 2_400_000, metadata: { summary: "One of the top defense industry PACs. Donates to Armed Services committee members from both parties." } },
  { id: "lloyd-austin-node", label: "Lloyd Austin (Fmr. Raytheon Board → SecDef)", group: "Politician", val: 14, issueCategories: ["Defense"], metadata: { summary: "Served on Raytheon board before becoming Secretary of Defense. Classic revolving door." } },
  { id: "mark-esper-node", label: "Mark Esper (Fmr. Raytheon Lobbyist → SecDef)", group: "Politician", val: 13, issueCategories: ["Defense"], metadata: { summary: "Was Raytheon's VP of Government Relations before serving as Secretary of Defense under Trump." } },
  { id: "armed-services", label: "Senate Armed Services Committee", group: "Committee", val: 15, issueCategories: ["Defense"] },
  { id: "sen-reed", label: "Sen. Jack Reed (D-RI)", group: "Politician", val: 11, party: "Democrat", state: "RI", issueCategories: ["Defense"] },
  { id: "sen-wicker", label: "Sen. Roger Wicker (R-MS)", group: "Politician", val: 11, party: "Republican", state: "MS", issueCategories: ["Defense"] },
  { id: "ndaa-bill", label: "National Defense Authorization Act (NDAA)", group: "Legislation", val: 14, issueCategories: ["Defense"], metadata: { status: "Enacted Annually", description: "Annual defense spending bill. Raytheon lobbies heavily on weapons procurement provisions." } },
  { id: "defense-industry", label: "Defense Sector", group: "Industry", val: 16, issueCategories: ["Defense"] },

  // ── Comcast/NBCUniversal (Lobbying — Consumer Protection, Technology) ──
  { id: "comcast", label: "Comcast / NBCUniversal", group: "Company", val: 18, metadata: { industry: "Telecom / Media", summary: "Top corporate lobbyist in the US. Spends $14M+/year lobbying on net neutrality, media consolidation, and broadband regulation." } },
  { id: "comcast-pac", label: "Comcast PAC", group: "PAC", val: 14, amount: 1_800_000 },
  { id: "fcc", label: "Federal Communications Commission", group: "Agency", val: 15, issueCategories: ["Technology", "Consumer Protection"] },
  { id: "net-neutrality-bill", label: "Net Neutrality & Broadband Justice Act", group: "Legislation", val: 11, issueCategories: ["Technology", "Consumer Protection"], metadata: { status: "In Committee", description: "Would restore FCC authority to enforce net neutrality and regulate broadband as a utility." } },
  { id: "telecom-industry", label: "Telecom Sector", group: "Industry", val: 14, issueCategories: ["Technology", "Consumer Protection"] },

  // ── Goldman Sachs (Revolving Door — Financial Services) ──
  { id: "goldman", label: "Goldman Sachs", group: "Company", val: 20, metadata: { industry: "Investment Banking", summary: "The poster child for revolving door influence. Multiple former executives served as Treasury Secretary, Fed chairs, and White House advisors." } },
  { id: "goldman-pac", label: "Goldman Sachs PAC", group: "PAC", val: 15, amount: 1_900_000 },
  { id: "hank-paulson-node", label: "Hank Paulson (Goldman CEO → Treasury Sec.)", group: "Politician", val: 13, issueCategories: ["Financial Services"], metadata: { summary: "Goldman Sachs CEO who became Treasury Secretary during 2008 crisis. Oversaw bank bailouts." } },
  { id: "gary-cohn-node", label: "Gary Cohn (Goldman Pres. → NEC Director)", group: "Politician", val: 12, issueCategories: ["Financial Services"], metadata: { summary: "Goldman Sachs president who became Trump's National Economic Council director." } },
  { id: "treasury", label: "U.S. Treasury Department", group: "Agency", val: 16, issueCategories: ["Financial Services"] },
  { id: "sec", label: "Securities & Exchange Commission", group: "Agency", val: 15, issueCategories: ["Financial Services"] },
  { id: "dodd-frank-bill", label: "Dodd-Frank Wall Street Reform Act", group: "Legislation", val: 12, issueCategories: ["Financial Services", "Consumer Protection"], metadata: { status: "Enacted (under rollback)", description: "Post-2008 financial regulation. Goldman lobbied heavily on derivatives trading rules." } },

  // ── Purdue Pharma / Sacklers (Dark Money — Healthcare) ──
  { id: "purdue", label: "Purdue Pharma (Sackler Family)", group: "Company", val: 16, metadata: { industry: "Pharmaceuticals", summary: "Sackler family used philanthropic foundations and dark money channels to influence opioid policy while fueling the opioid crisis." } },
  { id: "sackler-foundation", label: "Sackler Family Foundations (501c3/c4)", group: "PAC", val: 14, amount: 18_000_000, metadata: { summary: "Sackler philanthropic entities that donated to institutions while lobbying against opioid restrictions." } },
  { id: "pain-care-forum", label: "Pain Care Forum (Industry Coalition)", group: "PAC", val: 13, amount: 740_000_000, metadata: { summary: "Pharma industry dark money coalition that spent $740M lobbying against opioid regulations over a decade." } },
  { id: "fda", label: "Food & Drug Administration", group: "Agency", val: 15, issueCategories: ["Healthcare"] },
  { id: "opioid-regulation-bill", label: "SUPPORT for Patients and Communities Act", group: "Legislation", val: 11, issueCategories: ["Healthcare"], metadata: { status: "Enacted", description: "Bipartisan opioid response legislation signed into law after years of pharma lobbying delays." } },
  { id: "pharma-industry", label: "Pharmaceutical Sector", group: "Industry", val: 15, issueCategories: ["Healthcare"] },

  // ── Disney (Civil Rights — LGBTQ advocacy) ──
  { id: "disney-cr", label: "Walt Disney Company", group: "Company", val: 17, metadata: { industry: "Entertainment", summary: "HRC CEI 100/100. Publicly opposed Florida 'Don't Say Gay' bill. Major corporate LGBTQ rights advocate." } },
  { id: "eeoc-agency", label: "EEOC (Equal Employment Opportunity Commission)", group: "Agency", val: 15, issueCategories: ["Civil Rights", "Labor Rights"] },
  { id: "hrc-index", label: "HRC Corporate Equality Index", group: "Industry", val: 13, issueCategories: ["Civil Rights"], metadata: { summary: "Human Rights Campaign annual benchmark of LGBTQ workplace policies. Rates 1,300+ companies." } },
  { id: "equality-act", label: "Equality Act (H.R.5)", group: "Legislation", val: 13, issueCategories: ["Civil Rights"], metadata: { status: "Passed House", description: "Would add sexual orientation and gender identity to federal civil rights protections in employment, housing, and public accommodations." } },
  { id: "civil-rights-industry", label: "Civil Rights Sector", group: "Industry", val: 14, issueCategories: ["Civil Rights"] },
  { id: "doj-civil-rights", label: "DOJ Civil Rights Division", group: "Agency", val: 14, issueCategories: ["Civil Rights"] },

  // ── Nike (Civil Rights — Racial equity, gender discrimination) ──
  { id: "nike-cr", label: "Nike", group: "Company", val: 16, metadata: { industry: "Apparel", summary: "Colin Kaepernick campaign. Gender discrimination lawsuits from female employees. HRC CEI 100/100. $140M racial equity commitment." } },

  // ── Target (Civil Rights — DEI, EEOC) ──
  { id: "target-cr", label: "Target Corporation", group: "Company", val: 15, metadata: { industry: "Retail", summary: "HRC CEI 100/100. EEOC settlement for discriminatory pre-employment tests. DEI rollback controversy in 2024." } },

  // ── Chick-fil-A (Civil Rights — Controversial donations) ──
  { id: "chick-fil-a", label: "Chick-fil-A", group: "Company", val: 14, metadata: { industry: "Food & Beverage", summary: "Documented donations to organizations opposing LGBTQ rights. Changed foundation policy in 2019 after sustained advocacy pressure." } },

  // ── Healthcare nodes ──
  { id: "unitedhealth", label: "UnitedHealth Group", group: "Company", val: 18, metadata: { industry: "Health Insurance", summary: "Largest US health insurer. $8.2M lobbying on ACA/Medicare Advantage. $3.1M on mental health parity." } },
  { id: "cvs-health", label: "CVS Health", group: "Company", val: 16, metadata: { industry: "Healthcare / Pharmacy", summary: "PBM/pharmacy giant. $6.7M healthcare lobbying on PBM transparency and drug pricing." } },
  { id: "pfizer-hc", label: "Pfizer", group: "Company", val: 17, metadata: { industry: "Pharmaceuticals", summary: "$7.8M lobbying on IRA drug pricing, patent protections, and vaccine policy." } },
  { id: "jnj-hc", label: "Johnson & Johnson", group: "Company", val: 16, metadata: { industry: "Pharmaceuticals", summary: "$5.4M lobbying on FDA approval processes, drug pricing negotiation under IRA." } },
  { id: "dol-ebsa", label: "DOL EBSA (Employee Benefits)", group: "Agency", val: 14, issueCategories: ["Healthcare"] },
  { id: "cms-agency", label: "CMS (Centers for Medicare & Medicaid)", group: "Agency", val: 15, issueCategories: ["Healthcare"] },
  { id: "ira-drug-pricing", label: "Inflation Reduction Act — Drug Pricing", group: "Legislation", val: 14, issueCategories: ["Healthcare"], metadata: { status: "Enacted 2022", description: "Allows Medicare to negotiate prices for select high-cost drugs. Caps insulin at $35/mo for Medicare." } },
  { id: "mhpaea", label: "Mental Health Parity Act (MHPAEA)", group: "Legislation", val: 13, issueCategories: ["Healthcare"], metadata: { status: "Enacted", description: "Requires insurers to cover mental health/substance abuse at parity with medical/surgical benefits." } },
  { id: "healthcare-industry", label: "Healthcare Sector", group: "Industry", val: 15, issueCategories: ["Healthcare"] },

  // ── Consumer Protection nodes ──
  { id: "wells-fargo-cp", label: "Wells Fargo", group: "Company", val: 18, metadata: { industry: "Banking", summary: "CFPB $3.7B penalty for fake accounts and wrongful foreclosures. Massive consumer complaint volume." } },
  { id: "equifax-cp", label: "Equifax", group: "Company", val: 16, metadata: { industry: "Credit Reporting", summary: "FTC $700M settlement for 2017 data breach exposing 147M consumers' personal data." } },
  { id: "epic-games-cp", label: "Epic Games", group: "Company", val: 14, metadata: { industry: "Gaming", summary: "FTC $520M for COPPA violations and dark patterns tricking Fortnite players." } },
  { id: "t-mobile-cp", label: "T-Mobile", group: "Company", val: 15, metadata: { industry: "Telecommunications", summary: "FCC $31.5M data breach settlement. 76.6M customer records exposed." } },
  { id: "capital-one-cp", label: "Capital One", group: "Company", val: 15, metadata: { industry: "Banking", summary: "106M credit applicant records exposed in 2019 data breach." } },
  { id: "cfpb-agency", label: "CFPB (Consumer Financial Protection Bureau)", group: "Agency", val: 16, issueCategories: ["Consumer Protection"] },
  { id: "ftc-agency", label: "FTC (Federal Trade Commission)", group: "Agency", val: 16, issueCategories: ["Consumer Protection"] },
  { id: "cpsc-agency", label: "CPSC (Consumer Product Safety Commission)", group: "Agency", val: 14, issueCategories: ["Consumer Protection"] },
  { id: "fda-agency", label: "FDA (Food & Drug Administration)", group: "Agency", val: 15, issueCategories: ["Consumer Protection", "Healthcare"] },
  { id: "consumer-privacy-act", label: "American Data Privacy & Protection Act", group: "Legislation", val: 13, issueCategories: ["Consumer Protection"], metadata: { status: "Proposed", description: "Federal consumer data privacy bill. Would establish national data privacy standards and FTC enforcement." } },
  { id: "coppa", label: "COPPA (Children's Online Privacy)", group: "Legislation", val: 13, issueCategories: ["Consumer Protection"], metadata: { status: "Enacted 1998", description: "Requires parental consent for collecting data from children under 13. FTC enforces." } },
  { id: "consumer-protection-industry", label: "Consumer Protection Sector", group: "Industry", val: 14, issueCategories: ["Consumer Protection"] },
];

const SAMPLE_LINKS: GraphLink[] = [
  // ── Amazon links ──
  { source: "amazon", target: "amazon-pac", label: "Funds", linkType: "donation_to_member", amount: 1_200_000, confidence: "direct" },
  { source: "amazon-pac", target: "sen-cantwell", label: "Donated $45K", linkType: "donation_to_member", amount: 45_000, year: 2024, confidence: "direct" },
  { source: "amazon-pac", target: "sen-wyden", label: "Donated $38K", linkType: "donation_to_member", amount: 38_000, year: 2024, confidence: "direct" },
  { source: "amazon-pac", target: "rep-delbene", label: "Donated $25K", linkType: "donation_to_member", amount: 25_000, year: 2024, confidence: "direct" },
  { source: "amazon-pac", target: "rep-mcmorris", label: "Donated $20K", linkType: "donation_to_member", amount: 20_000, year: 2023, confidence: "direct" },
  { source: "sen-cantwell", target: "commerce-committee", label: "Serves on", linkType: "member_on_committee", confidence: "direct" },
  { source: "sen-wyden", target: "finance-committee", label: "Serves on", linkType: "member_on_committee", confidence: "direct" },
  { source: "commerce-committee", target: "ai-regulation-bill", label: "Oversees", linkType: "lobbying_on_bill", confidence: "direct" },
  { source: "finance-committee", target: "data-privacy-bill", label: "Oversees", linkType: "lobbying_on_bill", confidence: "direct" },
  { source: "ai-regulation-bill", target: "tech-industry", label: "Impacts", linkType: "committee_oversight_of_contract", confidence: "likely" },
  { source: "data-privacy-bill", target: "ecommerce-industry", label: "Impacts", linkType: "committee_oversight_of_contract", confidence: "likely" },
  { source: "amazon", target: "dod", label: "AWS GovCloud Contract", linkType: "committee_oversight_of_contract", amount: 10_000_000, confidence: "direct" },
  { source: "amazon", target: "tech-industry", label: "Operates in", linkType: "trade_association_lobbying", confidence: "direct" },

  // ── Microsoft links ──
  { source: "microsoft", target: "ms-pac", label: "Funds", linkType: "donation_to_member", amount: 890_000, confidence: "direct" },
  { source: "ms-pac", target: "sen-cantwell", label: "Donated $30K", linkType: "donation_to_member", amount: 30_000, year: 2024, confidence: "direct" },
  { source: "microsoft", target: "dod", label: "JEDI Contract", linkType: "committee_oversight_of_contract", amount: 7_500_000, confidence: "direct" },
  { source: "microsoft", target: "tech-industry", label: "Operates in", linkType: "trade_association_lobbying", confidence: "direct" },

  // ── UnitedHealth links (Healthcare) ──
  { source: "unitedhealth", target: "uhg-pac", label: "Funds", linkType: "donation_to_member", amount: 2_800_000, confidence: "direct" },
  { source: "uhg-pac", target: "sen-cassidy", label: "Donated $52K", linkType: "donation_to_member", amount: 52_000, year: 2024, confidence: "direct" },
  { source: "uhg-pac", target: "sen-murray", label: "Donated $41K", linkType: "donation_to_member", amount: 41_000, year: 2024, confidence: "direct" },
  { source: "sen-cassidy", target: "help-committee", label: "Serves on", linkType: "member_on_committee", confidence: "direct" },
  { source: "sen-murray", target: "help-committee", label: "Chairs", linkType: "member_on_committee", confidence: "direct" },
  { source: "help-committee", target: "drug-pricing-bill", label: "Oversees", linkType: "lobbying_on_bill", confidence: "direct" },
  { source: "drug-pricing-bill", target: "healthcare-industry", label: "Impacts", linkType: "committee_oversight_of_contract", confidence: "likely" },
  { source: "unitedhealth", target: "hhs", label: "Medicare Advantage Contracts", linkType: "committee_oversight_of_contract", amount: 280_000_000, confidence: "direct" },
  { source: "unitedhealth", target: "healthcare-industry", label: "Operates in", linkType: "trade_association_lobbying", confidence: "direct" },

  // ── Tyson links (Immigration, Labor Rights) ──
  { source: "tyson", target: "tyson-pac", label: "Funds", linkType: "donation_to_member", amount: 420_000, confidence: "direct" },
  { source: "tyson-pac", target: "sen-cotton", label: "Donated $18K", linkType: "donation_to_member", amount: 18_000, year: 2024, confidence: "direct" },
  { source: "tyson-pac", target: "rep-crawford", label: "Donated $15K", linkType: "donation_to_member", amount: 15_000, year: 2023, confidence: "direct" },
  { source: "sen-cotton", target: "judiciary-committee", label: "Serves on", linkType: "member_on_committee", confidence: "direct" },
  { source: "judiciary-committee", target: "farm-workforce-bill", label: "Oversees", linkType: "lobbying_on_bill", confidence: "direct" },
  { source: "farm-workforce-bill", target: "agriculture-industry", label: "Impacts", linkType: "committee_oversight_of_contract", confidence: "likely" },
  { source: "tyson", target: "agriculture-industry", label: "Operates in", linkType: "trade_association_lobbying", confidence: "direct" },

  // ── Starbucks links (Labor Rights) ──
  { source: "starbucks", target: "starbucks-pac", label: "Funds", linkType: "donation_to_member", amount: 560_000, confidence: "direct" },
  { source: "starbucks-pac", target: "sen-murray", label: "Donated $22K", linkType: "donation_to_member", amount: 22_000, year: 2024, confidence: "direct" },
  { source: "starbucks", target: "nlrb-agency", label: "400+ ULP complaints filed", linkType: "committee_oversight_of_contract", confidence: "direct" },
  { source: "sen-sanders", target: "labor-committee", label: "Chairs", linkType: "member_on_committee", confidence: "direct" },
  { source: "labor-committee", target: "pro-act", label: "Oversees", linkType: "lobbying_on_bill", confidence: "direct" },
  { source: "starbucks", target: "labor-industry", label: "Opposing unionization", linkType: "lobbying_on_bill", amount: 3_200_000, confidence: "direct" },
  { source: "pro-act", target: "labor-industry", label: "Impacts", linkType: "committee_oversight_of_contract", confidence: "likely" },
  { source: "starbucks", target: "sen-sanders", label: "Subpoenaed by HELP Committee", linkType: "committee_oversight_of_contract", confidence: "direct" },

  // ── Dollar General links (Labor Rights — OSHA) ──
  { source: "dollar-general", target: "osha-agency", label: "Severe Violator designation", linkType: "committee_oversight_of_contract", confidence: "direct" },
  { source: "dollar-general", target: "dol-agency", label: "$15M+ in OSHA penalties", linkType: "committee_oversight_of_contract", amount: 15_000_000, confidence: "direct" },
  { source: "dol-agency", target: "workplace-safety-bill", label: "Enforces", linkType: "lobbying_on_bill", confidence: "direct" },
  { source: "dollar-general", target: "labor-industry", label: "Labor violations", linkType: "trade_association_lobbying", confidence: "direct" },

  // ── Tesla links (Labor Rights — NLRB) ──
  { source: "tesla", target: "tesla-pac", label: "Funds", linkType: "donation_to_member", amount: 280_000, confidence: "direct" },
  { source: "tesla", target: "nlrb-agency", label: "Multiple NLRB complaints", linkType: "committee_oversight_of_contract", confidence: "direct" },
  { source: "tesla", target: "osha-agency", label: "Fremont plant violations", linkType: "committee_oversight_of_contract", confidence: "direct" },
  { source: "tesla", target: "labor-industry", label: "Anti-union activity", linkType: "lobbying_on_bill", confidence: "direct" },

  // ── UPS links (Labor Rights — Pro-union) ──
  { source: "ups", target: "ups-pac", label: "Funds", linkType: "donation_to_member", amount: 1_100_000, confidence: "direct" },
  { source: "ups-pac", target: "rep-scott", label: "Donated $15K", linkType: "donation_to_member", amount: 15_000, year: 2024, confidence: "direct" },
  { source: "rep-scott", target: "labor-committee", label: "Serves on", linkType: "member_on_committee", confidence: "direct" },
  { source: "ups", target: "dol-agency", label: "Teamsters contract (340K workers)", linkType: "committee_oversight_of_contract", confidence: "direct" },
  { source: "ups", target: "labor-industry", label: "Largest private union employer", linkType: "trade_association_lobbying", confidence: "direct" },

  // ── Costco links (Labor Rights — Pro-worker) ──
  { source: "costco", target: "labor-industry", label: "Above-avg wages ($29.50/hr)", linkType: "trade_association_lobbying", confidence: "direct" },
  { source: "costco", target: "dol-agency", label: "Clean compliance record", linkType: "committee_oversight_of_contract", confidence: "direct" },

  // ── Apple Retail links (Labor Rights) ──
  { source: "apple-retail", target: "apple-pac", label: "Funds", linkType: "donation_to_member", amount: 420_000, confidence: "direct" },
  { source: "apple-retail", target: "nlrb-agency", label: "Retail union elections", linkType: "committee_oversight_of_contract", confidence: "direct" },
  { source: "apple-retail", target: "labor-industry", label: "IAM/CWA union drives", linkType: "trade_association_lobbying", confidence: "direct" },

  // ── Google links (Immigration — H-1B) ──
  { source: "google", target: "google-pac", label: "Funds", linkType: "donation_to_member", amount: 1_400_000, confidence: "direct" },
  { source: "google-pac", target: "sen-padilla", label: "Donated $28K", linkType: "donation_to_member", amount: 28_000, year: 2024, confidence: "direct" },
  { source: "sen-padilla", target: "immigration-subcommittee", label: "Serves on", linkType: "member_on_committee", confidence: "direct" },
  { source: "immigration-subcommittee", target: "eagle-act", label: "Oversees", linkType: "lobbying_on_bill", confidence: "direct" },
  { source: "eagle-act", target: "fwd-us", label: "Impacts", linkType: "committee_oversight_of_contract", confidence: "likely" },
  { source: "google", target: "fwd-us", label: "Co-founded coalition", linkType: "trade_association_lobbying", confidence: "direct" },
  { source: "google", target: "dol-flc", label: "8,000+ H-1B LCAs/year", linkType: "committee_oversight_of_contract", confidence: "direct" },
  { source: "google", target: "tech-industry", label: "Operates in", linkType: "trade_association_lobbying", confidence: "direct" },

  // ── Infosys links (Immigration — Largest H-1B) ──
  { source: "infosys", target: "dol-flc", label: "30,000+ H-1B LCAs/year", linkType: "committee_oversight_of_contract", confidence: "direct" },
  { source: "infosys", target: "fwd-us", label: "Industry member", linkType: "trade_association_lobbying", confidence: "likely" },
  { source: "infosys", target: "uscis", label: "$34M visa fraud settlement (2013)", linkType: "committee_oversight_of_contract", confidence: "direct" },

  // ── Marriott links (Immigration — H-2B) ──
  { source: "marriott", target: "marriott-pac", label: "Funds", linkType: "donation_to_member", amount: 680_000, confidence: "direct" },
  { source: "marriott", target: "dol-flc", label: "H-2B seasonal worker visas", linkType: "committee_oversight_of_contract", confidence: "direct" },
  { source: "marriott", target: "hospitality-industry", label: "Operates in", linkType: "trade_association_lobbying", confidence: "direct" },
  { source: "marriott-pac", target: "sen-padilla", label: "Donated $12K", linkType: "donation_to_member", amount: 12_000, year: 2024, confidence: "direct" },
  { source: "immigration-subcommittee", target: "h2b-returning-bill", label: "Oversees", linkType: "lobbying_on_bill", confidence: "direct" },
  { source: "h2b-returning-bill", target: "hospitality-industry", label: "Impacts", linkType: "committee_oversight_of_contract", confidence: "likely" },

  // ── Tyson immigration links ──
  { source: "tyson", target: "dol-flc", label: "H-2A/H-2B agricultural visas", linkType: "committee_oversight_of_contract", confidence: "direct" },
  { source: "tyson", target: "uscis", label: "ICE enforcement history", linkType: "committee_oversight_of_contract", confidence: "direct" },
  { source: "judiciary-committee", target: "eagle-act", label: "Oversees", linkType: "lobbying_on_bill", confidence: "direct" },

  // ── ExxonMobil links (Climate, Energy) ──
  { source: "exxon", target: "exxon-pac", label: "Funds", linkType: "donation_to_member", amount: 1_650_000, confidence: "direct" },
  { source: "exxon-pac", target: "sen-manchin", label: "Donated $65K", linkType: "donation_to_member", amount: 65_000, year: 2024, confidence: "direct" },
  { source: "exxon-pac", target: "sen-capito", label: "Donated $40K", linkType: "donation_to_member", amount: 40_000, year: 2023, confidence: "direct" },
  { source: "sen-manchin", target: "epw-committee", label: "Serves on", linkType: "member_on_committee", confidence: "direct" },
  { source: "sen-capito", target: "epw-committee", label: "Ranking Member", linkType: "member_on_committee", confidence: "direct" },
  { source: "epw-committee", target: "clean-energy-bill", label: "Oversees", linkType: "lobbying_on_bill", confidence: "direct" },
  { source: "clean-energy-bill", target: "energy-industry", label: "Impacts", linkType: "committee_oversight_of_contract", confidence: "likely" },
  { source: "exxon", target: "doe", label: "Carbon Capture R&D Grant", linkType: "committee_oversight_of_contract", amount: 3_200_000, confidence: "direct" },
  { source: "exxon", target: "energy-industry", label: "Operates in", linkType: "trade_association_lobbying", confidence: "direct" },
  { source: "exxon", target: "epa", label: "EPA GHGRP top reporter", linkType: "committee_oversight_of_contract", confidence: "direct" },
  { source: "exxon", target: "climate-action-100", label: "Investor target", linkType: "trade_association_lobbying", confidence: "direct" },

  // ── Chevron links (Climate) ──
  { source: "chevron", target: "chevron-pac", label: "Funds", linkType: "donation_to_member", amount: 1_300_000, confidence: "direct" },
  { source: "chevron-pac", target: "sen-barrasso", label: "Donated $42K", linkType: "donation_to_member", amount: 42_000, year: 2024, confidence: "direct" },
  { source: "sen-barrasso", target: "epw-committee", label: "Serves on", linkType: "member_on_committee", confidence: "direct" },
  { source: "chevron", target: "epa", label: "EPA GHGRP major emitter", linkType: "committee_oversight_of_contract", confidence: "direct" },
  { source: "chevron", target: "energy-industry", label: "Operates in", linkType: "trade_association_lobbying", confidence: "direct" },
  { source: "chevron", target: "climate-action-100", label: "Investor target", linkType: "trade_association_lobbying", confidence: "direct" },
  { source: "chevron", target: "ogci", label: "Member company", linkType: "trade_association_lobbying", confidence: "direct" },
  { source: "epw-committee", target: "ira-clean-energy", label: "Oversees implementation", linkType: "lobbying_on_bill", confidence: "direct" },

  // ── Duke Energy links (Climate) ──
  { source: "duke-energy", target: "duke-pac", label: "Funds", linkType: "donation_to_member", amount: 920_000, confidence: "direct" },
  { source: "duke-pac", target: "sen-capito", label: "Donated $25K", linkType: "donation_to_member", amount: 25_000, year: 2024, confidence: "direct" },
  { source: "duke-energy", target: "epa", label: "Top utility emitter (EPA GHGRP)", linkType: "committee_oversight_of_contract", confidence: "direct" },
  { source: "duke-energy", target: "house-energy-committee", label: "Lobbied on emissions rules", linkType: "lobbying_on_bill", amount: 4_800_000, confidence: "direct" },
  { source: "house-energy-committee", target: "clean-air-amendments", label: "Oversees", linkType: "lobbying_on_bill", confidence: "direct" },
  { source: "duke-energy", target: "energy-industry", label: "Operates in", linkType: "trade_association_lobbying", confidence: "direct" },

  // ── NextEra Energy links (Climate — Renewables leader) ──
  { source: "nextera", target: "nextera-pac", label: "Funds", linkType: "donation_to_member", amount: 780_000, confidence: "direct" },
  { source: "nextera-pac", target: "sen-manchin", label: "Donated $20K", linkType: "donation_to_member", amount: 20_000, year: 2024, confidence: "direct" },
  { source: "nextera", target: "doe", label: "Clean energy tax credits recipient", linkType: "committee_oversight_of_contract", confidence: "direct" },
  { source: "nextera", target: "energy-industry", label: "Largest wind/solar generator", linkType: "trade_association_lobbying", confidence: "direct" },
  { source: "nextera", target: "ira-clean-energy", label: "Beneficiary of IRA credits", linkType: "committee_oversight_of_contract", confidence: "direct" },

  // ── Marathon Petroleum links (Climate) ──
  { source: "marathon", target: "marathon-pac", label: "Funds", linkType: "donation_to_member", amount: 1_050_000, confidence: "direct" },
  { source: "marathon-pac", target: "sen-barrasso", label: "Donated $30K", linkType: "donation_to_member", amount: 30_000, year: 2024, confidence: "direct" },
  { source: "marathon", target: "epa", label: "Largest US refiner (EPA GHGRP)", linkType: "committee_oversight_of_contract", confidence: "direct" },
  { source: "marathon", target: "energy-industry", label: "Operates in", linkType: "trade_association_lobbying", confidence: "direct" },
  { source: "marathon", target: "ogci", label: "Industry climate initiative", linkType: "trade_association_lobbying", confidence: "likely" },

  // ── Smith & Wesson links (Gun Policy) ──
  { source: "smith-wesson", target: "nssf-pac", label: "Funds via NSSF", linkType: "trade_association_lobbying", amount: 780_000, confidence: "likely" },
  { source: "nssf-pac", target: "sen-thune", label: "Donated $35K", linkType: "donation_to_member", amount: 35_000, year: 2024, confidence: "direct" },
  { source: "nssf-pac", target: "rep-hudson", label: "Donated $28K", linkType: "donation_to_member", amount: 28_000, year: 2023, confidence: "direct" },
  { source: "nra-pac", target: "sen-thune", label: "Donated $22K + A rating", linkType: "donation_to_member", amount: 22_000, year: 2024, confidence: "direct" },
  { source: "nra-pac", target: "rep-hudson", label: "Donated $15K + A rating", linkType: "donation_to_member", amount: 15_000, year: 2023, confidence: "direct" },
  { source: "rep-hudson", target: "house-judiciary", label: "Serves on", linkType: "member_on_committee", confidence: "direct" },
  { source: "rep-hudson", target: "gun-safety-bill", label: "Opposes", linkType: "lobbying_on_bill", confidence: "direct" },
  { source: "sen-murphy", target: "judiciary-committee", label: "Serves on", linkType: "member_on_committee", confidence: "direct" },
  { source: "sen-murphy", target: "safer-communities-act", label: "Lead author", linkType: "lobbying_on_bill", confidence: "direct" },
  { source: "everytown-pac", target: "sen-murphy", label: "Supported $1.2M", linkType: "donation_to_member", amount: 1_200_000, year: 2024, confidence: "direct" },
  { source: "house-judiciary", target: "gun-safety-bill", label: "Oversees", linkType: "lobbying_on_bill", confidence: "direct" },
  { source: "judiciary-committee", target: "safer-communities-act", label: "Oversees", linkType: "lobbying_on_bill", confidence: "direct" },
  { source: "gun-safety-bill", target: "firearms-industry", label: "Impacts", linkType: "committee_oversight_of_contract", confidence: "likely" },
  { source: "plcaa", target: "firearms-industry", label: "Protects", linkType: "committee_oversight_of_contract", confidence: "direct" },
  { source: "smith-wesson", target: "atf", label: "Regulatory Oversight", linkType: "committee_oversight_of_contract", confidence: "direct" },
  { source: "smith-wesson", target: "firearms-industry", label: "Operates in", linkType: "trade_association_lobbying", confidence: "direct" },
  { source: "smith-wesson", target: "plcaa", label: "Protected by", linkType: "committee_oversight_of_contract", confidence: "direct" },

  // ── Walmart gun links ──
  { source: "walmart-guns", target: "atf", label: "FFL Dealer (restricted 2019)", linkType: "committee_oversight_of_contract", confidence: "direct" },
  { source: "walmart-guns", target: "firearms-industry", label: "Restricted sales", linkType: "trade_association_lobbying", confidence: "direct" },
  { source: "walmart-guns", target: "safer-communities-act", label: "Supported passage", linkType: "lobbying_on_bill", confidence: "likely" },

  // ── Dick's Sporting Goods gun links ──
  { source: "dicks-sporting", target: "atf", label: "Removed assault rifles", linkType: "committee_oversight_of_contract", confidence: "direct" },
  { source: "dicks-sporting", target: "firearms-industry", label: "Exited category", linkType: "trade_association_lobbying", confidence: "direct" },
  { source: "dicks-sporting", target: "giffords-org", label: "Corporate advocacy partner", linkType: "trade_association_lobbying", confidence: "likely" },

  // ── Levi Strauss gun links ──
  { source: "levi-strauss", target: "everytown-pac", label: "Co-founded business leaders coalition", linkType: "trade_association_lobbying", amount: 1_000_000, confidence: "direct" },
  { source: "levi-strauss", target: "giffords-org", label: "Donated to gun safety org", linkType: "trade_association_lobbying", confidence: "likely" },
  { source: "levi-strauss", target: "safer-communities-act", label: "Advocated for passage", linkType: "lobbying_on_bill", confidence: "likely" },

  // ── NRA / Everytown ecosystem ──
  { source: "nra-pac", target: "plcaa", label: "Lobbied for passage", linkType: "lobbying_on_bill", amount: 3_500_000, confidence: "direct" },
  { source: "everytown-pac", target: "gun-safety-bill", label: "Advocates for", linkType: "lobbying_on_bill", confidence: "direct" },
  { source: "giffords-org", target: "safer-communities-act", label: "Advocates for", linkType: "lobbying_on_bill", confidence: "direct" },

  // ── Pearson links (Education) ──
  { source: "pearson", target: "pearson-pac", label: "Funds", linkType: "donation_to_member", amount: 320_000, confidence: "direct" },
  { source: "pearson-pac", target: "rep-scott", label: "Donated $12K", linkType: "donation_to_member", amount: 12_000, year: 2024, confidence: "direct" },
  { source: "pearson-pac", target: "sen-murray", label: "Donated $15K", linkType: "donation_to_member", amount: 15_000, year: 2023, confidence: "direct" },
  { source: "rep-scott", target: "help-committee", label: "Serves on", linkType: "member_on_committee", confidence: "direct" },
  { source: "help-committee", target: "education-bill", label: "Oversees", linkType: "lobbying_on_bill", confidence: "direct" },
  { source: "education-bill", target: "education-industry", label: "Impacts", linkType: "committee_oversight_of_contract", confidence: "likely" },
  { source: "pearson", target: "dept-education", label: "Testing Contracts", linkType: "committee_oversight_of_contract", amount: 15_000_000, confidence: "direct" },
  { source: "pearson", target: "education-industry", label: "Operates in", linkType: "trade_association_lobbying", confidence: "direct" },

  // ── Blackstone links (Housing, Financial Services) ──
  { source: "blackstone", target: "blackstone-pac", label: "Funds", linkType: "donation_to_member", amount: 1_100_000, confidence: "direct" },
  { source: "blackstone-pac", target: "sen-scott-tim", label: "Donated $48K", linkType: "donation_to_member", amount: 48_000, year: 2024, confidence: "direct" },
  { source: "blackstone-pac", target: "sen-warren", label: "Donated $0 (Opposes)", linkType: "donation_to_member", amount: 0, year: 2024, confidence: "direct" },
  { source: "sen-scott-tim", target: "banking-committee", label: "Serves on", linkType: "member_on_committee", confidence: "direct" },
  { source: "sen-warren", target: "banking-committee", label: "Serves on", linkType: "member_on_committee", confidence: "direct" },
  { source: "banking-committee", target: "housing-bill", label: "Oversees", linkType: "lobbying_on_bill", confidence: "direct" },
  { source: "banking-committee", target: "carried-interest-bill", label: "Oversees", linkType: "lobbying_on_bill", confidence: "direct" },
  { source: "housing-bill", target: "housing-industry", label: "Impacts", linkType: "committee_oversight_of_contract", confidence: "likely" },
  { source: "carried-interest-bill", target: "financial-industry", label: "Impacts", linkType: "committee_oversight_of_contract", confidence: "likely" },
  { source: "blackstone", target: "hud", label: "FHA-Backed Rentals", linkType: "committee_oversight_of_contract", amount: 45_000_000, confidence: "likely" },
  { source: "blackstone", target: "housing-industry", label: "Operates in", linkType: "trade_association_lobbying", confidence: "direct" },
  { source: "blackstone", target: "financial-industry", label: "Operates in", linkType: "trade_association_lobbying", confidence: "direct" },

  // ── Koch Industries links (Dark Money) ──
  { source: "koch", target: "koch-pac", label: "Funds (visible)", linkType: "donation_to_member", amount: 2_100_000, confidence: "direct" },
  { source: "koch", target: "americans-prosperity", label: "Funds via dark money", linkType: "dark_money_channel", amount: 65_000_000, confidence: "likely" },
  { source: "koch", target: "freedom-partners", label: "Koch donor network", linkType: "dark_money_channel", amount: 42_000_000, confidence: "likely" },
  { source: "americans-prosperity", target: "sen-cruz", label: "Election spending (undisclosed)", linkType: "dark_money_channel", amount: 8_500_000, confidence: "likely" },
  { source: "freedom-partners", target: "americans-prosperity", label: "Grants to AFP", linkType: "dark_money_channel", amount: 32_000_000, confidence: "likely" },
  { source: "sen-cruz", target: "epw-committee", label: "Serves on", linkType: "member_on_committee", confidence: "direct" },
  { source: "epw-committee", target: "climate-deregulation-bill", label: "Oversees", linkType: "lobbying_on_bill", confidence: "direct" },
  { source: "koch", target: "epa", label: "Lobbied against EPA rules", linkType: "lobbying_on_bill", amount: 12_000_000, confidence: "direct" },
  { source: "koch", target: "energy-industry", label: "Operates in", linkType: "trade_association_lobbying", confidence: "direct" },

  // ── Raytheon/RTX links (Revolving Door) ──
  { source: "raytheon", target: "raytheon-pac", label: "Funds", linkType: "donation_to_member", amount: 2_400_000, confidence: "direct" },
  { source: "raytheon", target: "lloyd-austin-node", label: "Board member → Secretary of Defense", linkType: "revolving_door", confidence: "direct" },
  { source: "raytheon", target: "mark-esper-node", label: "VP Gov Relations → Secretary of Defense", linkType: "revolving_door", confidence: "direct" },
  { source: "raytheon-pac", target: "sen-reed", label: "Donated $55K", linkType: "donation_to_member", amount: 55_000, year: 2024, confidence: "direct" },
  { source: "raytheon-pac", target: "sen-wicker", label: "Donated $48K", linkType: "donation_to_member", amount: 48_000, year: 2024, confidence: "direct" },
  { source: "sen-reed", target: "armed-services", label: "Chairs", linkType: "member_on_committee", confidence: "direct" },
  { source: "sen-wicker", target: "armed-services", label: "Ranking Member", linkType: "member_on_committee", confidence: "direct" },
  { source: "armed-services", target: "ndaa-bill", label: "Authors annually", linkType: "lobbying_on_bill", confidence: "direct" },
  { source: "lloyd-austin-node", target: "dod", label: "Leads as SecDef", linkType: "revolving_door", confidence: "direct" },
  { source: "mark-esper-node", target: "dod", label: "Led as SecDef", linkType: "revolving_door", confidence: "direct" },
  { source: "raytheon", target: "dod", label: "Weapons contracts", linkType: "committee_oversight_of_contract", amount: 28_000_000_000, confidence: "direct" },
  { source: "raytheon", target: "defense-industry", label: "Operates in", linkType: "trade_association_lobbying", confidence: "direct" },

  // ── Comcast links (Lobbying) ──
  { source: "comcast", target: "comcast-pac", label: "Funds", linkType: "donation_to_member", amount: 1_800_000, confidence: "direct" },
  { source: "comcast", target: "fcc", label: "Lobbied $14.4M/yr on broadband", linkType: "lobbying_on_bill", amount: 14_400_000, confidence: "direct" },
  { source: "comcast", target: "commerce-committee", label: "Lobbied on media consolidation", linkType: "lobbying_on_bill", amount: 5_200_000, confidence: "direct" },
  { source: "commerce-committee", target: "net-neutrality-bill", label: "Oversees", linkType: "lobbying_on_bill", confidence: "direct" },
  { source: "comcast", target: "telecom-industry", label: "Operates in", linkType: "trade_association_lobbying", confidence: "direct" },
  { source: "comcast-pac", target: "sen-cantwell", label: "Donated $22K", linkType: "donation_to_member", amount: 22_000, year: 2024, confidence: "direct" },

  // ── Goldman Sachs links (Revolving Door) ──
  { source: "goldman", target: "goldman-pac", label: "Funds", linkType: "donation_to_member", amount: 1_900_000, confidence: "direct" },
  { source: "goldman", target: "hank-paulson-node", label: "CEO → Treasury Secretary", linkType: "revolving_door", confidence: "direct" },
  { source: "goldman", target: "gary-cohn-node", label: "President → NEC Director", linkType: "revolving_door", confidence: "direct" },
  { source: "hank-paulson-node", target: "treasury", label: "Led Treasury during 2008 bailout", linkType: "revolving_door", confidence: "direct" },
  { source: "gary-cohn-node", target: "treasury", label: "Shaped tax reform policy", linkType: "revolving_door", confidence: "direct" },
  { source: "goldman", target: "sec", label: "Lobbied on derivatives rules", linkType: "lobbying_on_bill", amount: 4_800_000, confidence: "direct" },
  { source: "goldman-pac", target: "sen-scott-tim", label: "Donated $35K", linkType: "donation_to_member", amount: 35_000, year: 2024, confidence: "direct" },
  { source: "goldman", target: "financial-industry", label: "Operates in", linkType: "trade_association_lobbying", confidence: "direct" },
  { source: "banking-committee", target: "dodd-frank-bill", label: "Oversees", linkType: "lobbying_on_bill", confidence: "direct" },

  // ── Purdue Pharma links (Dark Money) ──
  { source: "purdue", target: "sackler-foundation", label: "Sackler family funding", linkType: "dark_money_channel", amount: 18_000_000, confidence: "likely" },
  { source: "purdue", target: "pain-care-forum", label: "Industry coalition funding", linkType: "dark_money_channel", amount: 740_000_000, confidence: "likely" },
  { source: "pain-care-forum", target: "fda", label: "Lobbied against opioid restrictions", linkType: "lobbying_on_bill", amount: 62_000_000, confidence: "likely" },
  { source: "sackler-foundation", target: "sen-cassidy", label: "Indirect support via healthcare orgs", linkType: "dark_money_channel", amount: 500_000, confidence: "likely" },
  { source: "help-committee", target: "opioid-regulation-bill", label: "Oversees", linkType: "lobbying_on_bill", confidence: "direct" },
  { source: "purdue", target: "fda", label: "Regulatory capture attempts", linkType: "revolving_door", confidence: "likely" },
  { source: "purdue", target: "pharma-industry", label: "Operates in", linkType: "trade_association_lobbying", confidence: "direct" },
  { source: "opioid-regulation-bill", target: "pharma-industry", label: "Impacts", linkType: "committee_oversight_of_contract", confidence: "likely" },

  // ── Disney civil rights links ──
  { source: "disney-cr", target: "hrc-index", label: "CEI Score: 100/100", linkType: "trade_association_lobbying", confidence: "direct" },
  { source: "disney-cr", target: "equality-act", label: "Publicly supported", linkType: "lobbying_on_bill", confidence: "direct" },
  { source: "disney-cr", target: "civil-rights-industry", label: "LGBTQ advocacy", linkType: "trade_association_lobbying", confidence: "direct" },
  { source: "judiciary-committee", target: "equality-act", label: "Oversees", linkType: "lobbying_on_bill", confidence: "direct" },
  { source: "equality-act", target: "civil-rights-industry", label: "Impacts", linkType: "committee_oversight_of_contract", confidence: "likely" },

  // ── Nike civil rights links ──
  { source: "nike-cr", target: "hrc-index", label: "CEI Score: 100/100", linkType: "trade_association_lobbying", confidence: "direct" },
  { source: "nike-cr", target: "eeoc-agency", label: "Gender discrimination lawsuits", linkType: "committee_oversight_of_contract", confidence: "direct" },
  { source: "nike-cr", target: "civil-rights-industry", label: "$140M racial equity commitment", linkType: "trade_association_lobbying", confidence: "direct" },

  // ── Target civil rights links ──
  { source: "target-cr", target: "eeoc-agency", label: "EEOC settlement (pre-employment tests)", linkType: "committee_oversight_of_contract", confidence: "direct" },
  { source: "target-cr", target: "hrc-index", label: "CEI Score: 100/100", linkType: "trade_association_lobbying", confidence: "direct" },
  { source: "target-cr", target: "civil-rights-industry", label: "DEI commitments (rollback 2024)", linkType: "trade_association_lobbying", confidence: "direct" },

  // ── Chick-fil-A civil rights links ──
  { source: "chick-fil-a", target: "civil-rights-industry", label: "Controversial donations to anti-LGBTQ orgs", linkType: "dark_money_channel", confidence: "likely" },
  { source: "chick-fil-a", target: "hrc-index", label: "Not rated", linkType: "trade_association_lobbying", confidence: "direct" },

  // ── EEOC / DOJ connections ──
  { source: "eeoc-agency", target: "doj-civil-rights", label: "Enforcement partnership", linkType: "committee_oversight_of_contract", confidence: "direct" },

  // ── Healthcare links ──
  { source: "unitedhealth", target: "ira-drug-pricing", label: "$8.2M lobbying", linkType: "lobbying_on_bill", confidence: "direct" },
  { source: "unitedhealth", target: "mhpaea", label: "$3.1M lobbying on parity", linkType: "lobbying_on_bill", confidence: "direct" },
  { source: "unitedhealth", target: "cms-agency", label: "Medicare Advantage contracts", linkType: "committee_oversight_of_contract", confidence: "direct" },
  { source: "unitedhealth", target: "healthcare-industry", label: "Largest US insurer", linkType: "trade_association_lobbying", confidence: "direct" },
  { source: "cvs-health", target: "ira-drug-pricing", label: "$6.7M PBM/drug pricing lobbying", linkType: "lobbying_on_bill", confidence: "direct" },
  { source: "cvs-health", target: "healthcare-industry", label: "PBM/pharmacy operations", linkType: "trade_association_lobbying", confidence: "direct" },
  { source: "pfizer-hc", target: "ira-drug-pricing", label: "$7.8M lobbying on drug pricing", linkType: "lobbying_on_bill", confidence: "direct" },
  { source: "pfizer-hc", target: "healthcare-industry", label: "Major pharmaceutical", linkType: "trade_association_lobbying", confidence: "direct" },
  { source: "jnj-hc", target: "ira-drug-pricing", label: "$5.4M lobbying", linkType: "lobbying_on_bill", confidence: "direct" },
  { source: "jnj-hc", target: "healthcare-industry", label: "Pharma/med devices", linkType: "trade_association_lobbying", confidence: "direct" },
  { source: "dol-ebsa", target: "mhpaea", label: "Enforces parity compliance", linkType: "committee_oversight_of_contract", confidence: "direct" },
  { source: "cms-agency", target: "ira-drug-pricing", label: "Implements drug negotiations", linkType: "committee_oversight_of_contract", confidence: "direct" },
  { source: "ira-drug-pricing", target: "healthcare-industry", label: "Impacts pricing", linkType: "committee_oversight_of_contract", confidence: "direct" },

  // ── Consumer Protection links ──
  { source: "wells-fargo-cp", target: "cfpb-agency", label: "$3.7B penalty — fake accounts", linkType: "committee_oversight_of_contract", confidence: "direct" },
  { source: "wells-fargo-cp", target: "consumer-protection-industry", label: "Massive consumer complaints", linkType: "trade_association_lobbying", confidence: "direct" },
  { source: "equifax-cp", target: "ftc-agency", label: "$700M data breach settlement", linkType: "committee_oversight_of_contract", confidence: "direct" },
  { source: "equifax-cp", target: "consumer-privacy-act", label: "Breach prompted legislation", linkType: "lobbying_on_bill", confidence: "likely" },
  { source: "equifax-cp", target: "consumer-protection-industry", label: "147M records exposed", linkType: "trade_association_lobbying", confidence: "direct" },
  { source: "epic-games-cp", target: "coppa", label: "FTC $520M COPPA violation", linkType: "committee_oversight_of_contract", confidence: "direct" },
  { source: "epic-games-cp", target: "consumer-protection-industry", label: "Dark patterns enforcement", linkType: "trade_association_lobbying", confidence: "direct" },
  { source: "t-mobile-cp", target: "consumer-protection-industry", label: "76.6M records exposed", linkType: "trade_association_lobbying", confidence: "direct" },
  { source: "t-mobile-cp", target: "consumer-privacy-act", label: "Breach prompted advocacy", linkType: "lobbying_on_bill", confidence: "likely" },
  { source: "capital-one-cp", target: "cfpb-agency", label: "CFPB enforcement", linkType: "committee_oversight_of_contract", confidence: "direct" },
  { source: "capital-one-cp", target: "consumer-protection-industry", label: "106M records exposed", linkType: "trade_association_lobbying", confidence: "direct" },
  { source: "cfpb-agency", target: "consumer-protection-industry", label: "Enforces consumer finance laws", linkType: "committee_oversight_of_contract", confidence: "direct" },
  { source: "cpsc-agency", target: "consumer-protection-industry", label: "Enforces product safety", linkType: "committee_oversight_of_contract", confidence: "direct" },
  { source: "fda-agency", target: "consumer-protection-industry", label: "Drug/device safety enforcement", linkType: "committee_oversight_of_contract", confidence: "direct" },
  { source: "coppa", target: "consumer-protection-industry", label: "Protects children's data", linkType: "committee_oversight_of_contract", confidence: "direct" },
];

// ─── Main Component ───

export default function FollowTheMoney() {
  usePageSEO({
    title: "Follow the Money — Corporate Political Influence Map",
    description: "Interactive influence graph showing corporate PAC donations, lobbying, dark money channels, and revolving door connections to Congress.",
    path: "/follow-the-money",
    jsonLd: {
      "@type": "WebApplication",
      name: "Follow the Money — Corporate Political Influence Map",
      description: "Interactive graph mapping corporate PAC donations, lobbying spend, dark money channels, and revolving door connections to Congress.",
      applicationCategory: "BusinessApplication",
      creator: { "@type": "Person", name: "Jackye Clayton" },
    },
  });

  const navigate = useNavigate();
  const graphRef = useRef<ForceGraphMethods>();
  const containerRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [selectedCompanyName, setSelectedCompanyName] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [allNodes, setAllNodes] = useState<GraphNode[]>(SAMPLE_NODES);
  const [allLinks, setAllLinks] = useState<GraphLink[]>(SAMPLE_LINKS);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeIssueFilter, setActiveIssueFilter] = useState("All");
  const [activeRelFilter, setActiveRelFilter] = useState("all");
  const [showLabels, setShowLabels] = useState(false);
  const [strongOnly, setStrongOnly] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [pathMode, setPathMode] = useState(false);
  const [pathStart, setPathStart] = useState<string | null>(null);
  const [pathEnd, setPathEnd] = useState<string | null>(null);
  const [activePath, setActivePath] = useState<{ nodeIds: string[]; linkIndices: number[] } | null>(null);
  const [graphExpanded, setGraphExpanded] = useState(false);
  const [hoverTooltip, setHoverTooltip] = useState<{ x: number; y: number; text: string } | null>(null);

  // Cluster foci positions by group type
  const CLUSTER_FOCI: Record<string, { x: number; y: number }> = {
    Company:     { x: 0,    y: 0 },
    PAC:         { x: -150, y: -100 },
    Politician:  { x: 150,  y: -100 },
    Legislation: { x: 200,  y: 100 },
    Industry:    { x: -200, y: 100 },
    Agency:      { x: 0,    y: 200 },
    Committee:   { x: 0,    y: -200 },
  };

  // D3 forces configured after graphData (defined below)

  // Resize observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width: Math.max(width, 300), height: Math.max(height, 300) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Filter graph
  const graphData: GraphData = useMemo(() => {
    let filteredLinks = [...allLinks];
    let relevantNodeIds = new Set(allNodes.map(n => n.id));

    // Relationship type filter
    if (activeRelFilter !== "all") {
      filteredLinks = filteredLinks.filter(l => l.linkType === activeRelFilter);
      relevantNodeIds = new Set<string>();
      for (const l of filteredLinks) {
        const src = typeof l.source === "string" ? l.source : l.source.id;
        const tgt = typeof l.target === "string" ? l.target : l.target.id;
        relevantNodeIds.add(src);
        relevantNodeIds.add(tgt);
      }
      if (selectedCompanyId) relevantNodeIds.add(selectedCompanyId);
    }

    // Issue filter
    if (activeIssueFilter !== "All") {
      const issueNodeIds = new Set(allNodes.filter(n => n.issueCategories?.includes(activeIssueFilter)).map(n => n.id));
      filteredLinks = filteredLinks.filter(l => {
        const src = typeof l.source === "string" ? l.source : l.source.id;
        const tgt = typeof l.target === "string" ? l.target : l.target.id;
        return issueNodeIds.has(src) || issueNodeIds.has(tgt) || l.issueCategory === activeIssueFilter;
      });
      relevantNodeIds = new Set<string>();
      for (const l of filteredLinks) {
        const src = typeof l.source === "string" ? l.source : l.source.id;
        const tgt = typeof l.target === "string" ? l.target : l.target.id;
        relevantNodeIds.add(src);
        relevantNodeIds.add(tgt);
      }
      if (selectedCompanyId) relevantNodeIds.add(selectedCompanyId);
    }

    // Strong connections only
    if (strongOnly) {
      filteredLinks = filteredLinks.filter(l => l.confidence === "direct" || (l.amount && l.amount >= 10000));
    }

    const filteredNodes = allNodes.filter(n => relevantNodeIds.has(n.id));
    const clustered = assignClusters(filteredNodes, filteredLinks);
    return { nodes: clustered, links: filteredLinks };
  }, [allNodes, allLinks, activeIssueFilter, activeRelFilter, strongOnly, selectedCompanyId]);

  // Configure D3 forces after graphData is ready
  useEffect(() => {
    const fg = graphRef.current;
    if (!fg) return;
    // @ts-ignore
    fg.d3Force("charge")?.strength(-120).distanceMax(400);
    // @ts-ignore
    fg.d3Force("link")?.distance(60);
    // @ts-ignore
    fg.d3Force("center")?.strength(0.05);

    // Add cluster foci forces
    if (fg.d3Force) {
      // @ts-ignore
      fg.d3Force("clusterX", (alpha: number) => {
        graphData.nodes.forEach((node: any) => {
          const foci = CLUSTER_FOCI[node.group] || { x: 0, y: 0 };
          node.vx = (node.vx || 0) + (foci.x - (node.x || 0)) * alpha * 0.03;
        });
      });
      // @ts-ignore
      fg.d3Force("clusterY", (alpha: number) => {
        graphData.nodes.forEach((node: any) => {
          const foci = CLUSTER_FOCI[node.group] || { x: 0, y: 0 };
          node.vy = (node.vy || 0) + (foci.y - (node.y || 0)) * alpha * 0.03;
        });
      });
    }
  }, [graphData]);

  useEffect(() => {
    if (!query.trim() || query.length < 2) { setSearchResults([]); return; }
    const timeout = setTimeout(async () => {
      const { data } = await supabase
        .from("companies")
        .select("id, name, slug")
        .ilike("name", `%${query}%`)
        .limit(8);
      setSearchResults(data || []);
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  // Load entity linkages
  const loadCompanyGraph = useCallback(async (companyId: string, companyName: string) => {
    setLoading(true);
    setSelectedCompanyId(companyId);
    setSelectedCompanyName(companyName);
    setQuery("");
    setSearchResults([]);
    setSelectedNode(null);
    setActiveIssueFilter("All");
    setActiveRelFilter("all");
    setPathMode(false);
    setActivePath(null);

    try {
      const { data: linkages } = await supabase
        .from("entity_linkages")
        .select("*")
        .eq("company_id", companyId)
        .order("amount", { ascending: false })
        .limit(150);

      if (!linkages || linkages.length === 0) {
        setAllNodes([{ id: companyId, label: companyName, group: "Company", val: 22 }]);
        setAllLinks([]);
        setLoading(false);
        return;
      }

      const nodeMap = new Map<string, GraphNode>();
      const links: GraphLink[] = [];

      nodeMap.set(companyId, {
        id: companyId, label: companyName, group: "Company", val: 22,
      });

      for (const link of linkages) {
        const srcId = link.source_entity_id || `src-${link.source_entity_name}`;
        if (!nodeMap.has(srcId) && link.source_entity_name !== companyName) {
          nodeMap.set(srcId, {
            id: srcId,
            label: link.source_entity_name,
            group: mapEntityType(link.source_entity_type),
            val: Math.max(6, Math.min(20, Math.log10((link.amount || 1000) + 1) * 3)),
            amount: link.amount || undefined,
          });
        }

        const tgtId = link.target_entity_id || `tgt-${link.target_entity_name}`;
        if (!nodeMap.has(tgtId)) {
          nodeMap.set(tgtId, {
            id: tgtId,
            label: link.target_entity_name,
            group: mapEntityType(link.target_entity_type),
            val: Math.max(6, Math.min(20, Math.log10((link.amount || 1000) + 1) * 3)),
            amount: link.amount || undefined,
          });
        }

        const sourceId = link.source_entity_name === companyName ? companyId : srcId;
        links.push({
          source: sourceId,
          target: tgtId,
          label: mapLinkLabel(link.link_type),
          amount: link.amount || undefined,
          linkType: link.link_type,
          confidence: link.confidence_score >= 0.8 ? "direct" : link.confidence_score >= 0.5 ? "likely" : "inferred",
          issueCategory: link.description?.match(/issue:\s*(.+)/i)?.[1] || undefined,
        });
      }

      setAllNodes(assignClusters(Array.from(nodeMap.values()), links));
      setAllLinks(links);
    } catch (err) {
      console.error("Failed to load graph:", err);
    }
    setLoading(false);
  }, []);

  const resetGraph = () => {
    setSelectedCompanyId(null);
    setSelectedCompanyName("");
    setAllNodes(SAMPLE_NODES);
    setAllLinks(SAMPLE_LINKS);
    setSelectedNode(null);
    setActiveIssueFilter("All");
    setActiveRelFilter("all");
    setPathMode(false);
    setActivePath(null);
    setPathStart(null);
    setPathEnd(null);
  };

  // Hover highlight — 1-hop neighbors only (not full BFS)
  const highlightedIds = useMemo(() => {
    // Path mode takes priority
    if (activePath) {
      return { nodes: new Set(activePath.nodeIds), links: new Set(activePath.linkIndices) };
    }
    if (!hoveredNode) return null;
    const ids = new Set<string>();
    const linkIds = new Set<number>();
    ids.add(hoveredNode);
    // Only direct neighbors (1-hop)
    graphData.links.forEach((l, i) => {
      const src = typeof l.source === "string" ? l.source : l.source.id;
      const tgt = typeof l.target === "string" ? l.target : l.target.id;
      if (src === hoveredNode) { ids.add(tgt); linkIds.add(i); }
      if (tgt === hoveredNode) { ids.add(src); linkIds.add(i); }
    });
    return { nodes: ids, links: linkIds };
  }, [hoveredNode, graphData, activePath]);

  // Path exploration
  useEffect(() => {
    if (pathStart && pathEnd && pathStart !== pathEnd) {
      const result = findPath(graphData.nodes, graphData.links, pathStart, pathEnd);
      setActivePath(result);
    } else {
      setActivePath(null);
    }
  }, [pathStart, pathEnd, graphData]);

  // Handle node click in path mode
  const handleNodeClick = useCallback((node: any) => {
    if (pathMode) {
      if (!pathStart) {
        setPathStart(node.id);
      } else if (!pathEnd && node.id !== pathStart) {
        setPathEnd(node.id);
      } else {
        setPathStart(node.id);
        setPathEnd(null);
        setActivePath(null);
      }
    } else {
      const n = graphData.nodes.find(gn => gn.id === node.id);
      setSelectedNode(prev => prev?.id === node.id ? null : (n || null));
    }
  }, [pathMode, pathStart, pathEnd, graphData.nodes]);

  // Connected edges for selected node
  const selectedEdges = useMemo(() => {
    if (!selectedNode) return [];
    return graphData.links.filter(l => {
      const src = typeof l.source === "string" ? l.source : l.source.id;
      const tgt = typeof l.target === "string" ? l.target : l.target.id;
      return src === selectedNode.id || tgt === selectedNode.id;
    });
  }, [selectedNode, graphData]);

  // Insights
  const insights = useMemo(() => generateInsights(graphData.nodes, graphData.links), [graphData]);

  // ─── Node paint ───
  const paintNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const r = Math.max(4, (node.val || 8) / globalScale * 1.5);
    const color = GROUP_COLORS[node.group] || "#888";
    const isHighlighted = !highlightedIds || highlightedIds.nodes.has(node.id);
    const isSelected = selectedNode?.id === node.id;
    const isPathNode = activePath?.nodeIds.includes(node.id);
    const isPathEndpoint = node.id === pathStart || node.id === pathEnd;
    const alpha = isHighlighted ? 1 : 0.12;

    ctx.globalAlpha = alpha;

    // Glow for path endpoints
    if (isPathEndpoint) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, r + 6, 0, 2 * Math.PI);
      ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2 / globalScale;
      ctx.stroke();
    }

    // Selected glow
    if (isSelected) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, r + 4, 0, 2 * Math.PI);
      ctx.fillStyle = color + "33";
      ctx.fill();
    }

    // Main node
    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();

    // Border
    if (isSelected || isPathNode) {
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = (isPathNode ? 2.5 : 2) / globalScale;
      ctx.stroke();
    }

    // Initials inside circle
    const initials = node.label.split(/[\s&]+/).filter(Boolean).slice(0, 2).map((w: string) => w[0]?.toUpperCase()).join("");
    const fontSize = Math.max(7, Math.min(r * 0.85, 14 / globalScale));
    ctx.font = `700 ${fontSize}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#fff";
    ctx.fillText(initials || "?", node.x, node.y);

    // Label — show on hover/selected/path, or when showLabels is toggled on
    const shouldShowLabel = showLabels || isSelected || (highlightedIds && highlightedIds.nodes.has(node.id));
    if (shouldShowLabel && globalScale > 0.4) {
      const labelSize = Math.max(7, 10 / globalScale);
      ctx.font = `600 ${labelSize}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = isHighlighted ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.25)";
      const label = node.label.length > 22 ? node.label.slice(0, 20) + "…" : node.label;
      ctx.fillText(label, node.x, node.y + r + 3);

      if (node.amount && globalScale > 0.7) {
        const amtSize = Math.max(6, 8 / globalScale);
        ctx.font = `${amtSize}px system-ui, sans-serif`;
        ctx.fillStyle = isHighlighted ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.15)";
        ctx.fillText(formatAmount(node.amount), node.x, node.y + r + 3 + labelSize + 2);
      }
    }

    ctx.globalAlpha = 1;
  }, [highlightedIds, selectedNode, showLabels, activePath, pathStart, pathEnd]);

  // ─── Link paint ───
  const paintLink = useCallback((link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const src = link.source;
    const tgt = link.target;
    if (!src.x || !tgt.x) return;

    const style = LINK_STYLES[link.linkType] || { dash: [], color: "rgba(150,150,150,0.4)", label: "" };
    const linkIdx = graphData.links.indexOf(link);
    const isHighlighted = !highlightedIds || highlightedIds.links.has(linkIdx);
    const isPathLink = activePath?.linkIndices.includes(linkIdx);
    const alpha = isHighlighted ? 1 : 0.06;

    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.setLineDash(style.dash);

    const baseWidth = link.amount ? Math.min(Math.max(Math.log10(link.amount) - 2, 0.5), 4) : 1;
    ctx.lineWidth = (isPathLink ? baseWidth * 2 : baseWidth) / globalScale;
    ctx.strokeStyle = isPathLink ? "#fff" : style.color;
    ctx.moveTo(src.x, src.y);
    ctx.lineTo(tgt.x, tgt.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Amount on link
    if (link.amount && globalScale > 0.8 && isHighlighted) {
      const midX = (src.x + tgt.x) / 2;
      const midY = (src.y + tgt.y) / 2;
      const fontSize = Math.max(6, 8 / globalScale);
      ctx.font = `600 ${fontSize}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = isPathLink ? "#fff" : "rgba(255,255,255,0.6)";
      ctx.fillText(formatAmount(link.amount), midX, midY - 6 / globalScale);
    }

    ctx.globalAlpha = 1;
  }, [highlightedIds, graphData.links, activePath]);

  // Path breadcrumb nodes
  const pathNodes = useMemo(() => {
    if (!activePath) return [];
    return activePath.nodeIds.map(id => graphData.nodes.find(n => n.id === id)).filter(Boolean) as GraphNode[];
  }, [activePath, graphData.nodes]);

  return (
    <div className="flex flex-col h-full">
      {/* ═══ HEADER ═══ */}
      <section className="border-b border-border/30 bg-gradient-to-b from-primary/[0.04] to-transparent">
        <div className="px-4 lg:px-6 py-5">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-primary" />
                </div>
                <span className="text-xs font-extrabold text-primary uppercase tracking-[0.15em]">Follow the Money</span>
              </div>
              <h1 className="text-2xl font-display font-bold text-foreground tracking-tight">
                Influence Network Map
              </h1>
              <p className="text-sm text-muted-foreground max-w-lg mt-0.5">
                See how companies, PACs, politicians, legislation, and industries connect through money and influence.
              </p>
            </div>

            {/* Search */}
            <div className="relative w-full lg:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search a company to map…"
                className="pl-10"
              />
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-xl shadow-lg z-50 py-1 max-h-60 overflow-y-auto">
                  {searchResults.map(c => (
                    <button
                      key={c.id}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-accent/50 transition-colors flex items-center gap-2"
                      onClick={() => loadCompanyGraph(c.id, c.name)}
                    >
                      <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CONTROLS BAR ═══ */}
      <div className="border-b border-border/30 bg-card/50">
        <div className="px-4 lg:px-6 py-2.5 space-y-2">
          {/* Issue filter row */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider shrink-0">Issue:</span>
            {ISSUE_CATEGORIES.slice(0, 8).map(cat => (
              <Button
                key={cat}
                variant={activeIssueFilter === cat ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveIssueFilter(cat)}
                className="rounded-full text-[10px] shrink-0 h-6 px-2.5"
              >
                {cat}
              </Button>
            ))}
          </div>

          {/* Relationship + controls row */}
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider shrink-0">Link:</span>
            {RELATIONSHIP_TYPES.map(rt => (
              <Button
                key={rt.key}
                variant={activeRelFilter === rt.key ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveRelFilter(rt.key)}
                className="rounded-full text-[10px] shrink-0 h-6 px-2.5"
              >
                {rt.label}
              </Button>
            ))}

            <div className="flex-1" />

            <Button
              variant={pathMode ? "default" : "outline"}
              size="sm"
              onClick={() => { setPathMode(!pathMode); setPathStart(null); setPathEnd(null); setActivePath(null); }}
              className="gap-1.5 text-[10px] h-7 shrink-0"
            >
              <Route className="w-3 h-3" />
              Path Trace
            </Button>
            <Button
              variant={strongOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setStrongOnly(!strongOnly)}
              className="gap-1 text-[10px] h-7 shrink-0"
            >
              <Zap className="w-3 h-3" />
              Strong Only
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-7 h-7 shrink-0"
              onClick={() => setShowLabels(!showLabels)}
            >
              {showLabels ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-7 h-7 shrink-0"
              onClick={resetGraph}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* ═══ PATH TRACE BREADCRUMB ═══ */}
      {pathMode && (
        <div className="border-b border-primary/20 bg-primary/[0.04] px-4 lg:px-6 py-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <Route className="w-4 h-4 text-primary shrink-0" />
            <span className="text-xs font-semibold text-primary">Path Trace:</span>

            {!pathStart && (
              <span className="text-xs text-muted-foreground italic">Click a starting node on the graph…</span>
            )}
            {pathStart && !pathEnd && (
              <>
                <Badge className="bg-primary text-primary-foreground text-[10px]">
                  {graphData.nodes.find(n => n.id === pathStart)?.label || "Start"}
                </Badge>
                <ArrowRight className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground italic">Click a destination node…</span>
              </>
            )}

            {activePath && pathNodes.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {pathNodes.map((node, i) => (
                  <div key={node.id} className="flex items-center gap-1.5">
                    {i > 0 && <ArrowRight className="w-3 h-3 text-muted-foreground" />}
                    <Badge
                      variant="outline"
                      className="text-[10px] gap-1 cursor-pointer hover:bg-accent/50"
                      style={{ borderColor: GROUP_COLORS[node.group] + "60" }}
                      onClick={() => { setSelectedNode(node); }}
                    >
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: GROUP_COLORS[node.group] }} />
                      {node.label}
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            {activePath === null && pathStart && pathEnd && (
              <span className="text-xs text-destructive font-medium">No path found between these nodes.</span>
            )}

            {(pathStart || pathEnd) && (
              <Button variant="ghost" size="sm" className="h-5 text-[10px] ml-auto" onClick={() => { setPathStart(null); setPathEnd(null); setActivePath(null); }}>
                Clear Path
              </Button>
            )}
          </div>
        </div>
      )}

      {/* ═══ MAIN LAYOUT ═══ */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Graph Canvas */}
        <div
          ref={containerRef}
          className={cn(
            "relative overflow-hidden transition-all",
            graphExpanded ? "flex-1" : "flex-1 lg:flex-[2]",
            "bg-[#0B0F1A]"
          )}
          style={{ minHeight: graphExpanded ? 600 : 420 }}
        >
          {/* Active company badge */}
          {selectedCompanyName && (
            <div className="absolute top-3 left-3 z-10">
              <Badge className="bg-card/90 backdrop-blur-sm text-foreground border border-border/40 gap-1.5 px-3 py-1.5 shadow-lg">
                <Building2 className="w-3 h-3" />
                {selectedCompanyName}
                <button onClick={resetGraph} className="ml-1 hover:text-destructive"><X className="w-3 h-3" /></button>
              </Badge>
            </div>
          )}

          {/* Top-right controls */}
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
            <Button variant="outline" size="icon" className="w-8 h-8 bg-card/90 backdrop-blur-sm" onClick={() => setGraphExpanded(!graphExpanded)}>
              {graphExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </Button>
            <Button variant="outline" size="icon" className="w-8 h-8 bg-card/90 backdrop-blur-sm" onClick={resetGraph}>
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Node count */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10">
            <Badge variant="outline" className="bg-card/80 backdrop-blur-sm text-[10px] text-muted-foreground border-border/30">
              {graphData.nodes.length} nodes · {graphData.links.length} connections
            </Badge>
          </div>

          {/* Legend */}
          <div className="absolute bottom-3 left-3 z-10 flex flex-wrap gap-1.5">
            {Object.entries(GROUP_COLORS).map(([group, color]) => (
              <div key={group} className="flex items-center gap-1.5 text-[9px] text-muted-foreground bg-background/60 backdrop-blur-sm px-2 py-1 rounded-full">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                {group}
              </div>
            ))}
          </div>

          {/* Loading overlay */}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-20">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm font-medium">Mapping influence network…</span>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!loading && graphData.nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="text-center max-w-sm">
                <Globe className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-muted-foreground mb-1">No connections match your filters</h3>
                <p className="text-xs text-muted-foreground/60 mb-3">Try broadening your filters or searching for a different company.</p>
                <Button variant="outline" size="sm" onClick={resetGraph} className="gap-1.5">
                  <RotateCcw className="w-3 h-3" /> Reset Filters
                </Button>
              </div>
            </div>
          )}

          <ForceGraph2D
            ref={graphRef}
            graphData={graphData}
            width={dimensions.width}
            height={dimensions.height}
            backgroundColor="transparent"
            nodeCanvasObject={paintNode}
            nodePointerAreaPaint={(node: any, color, ctx) => {
              const r = Math.max(6, (node.val || 8));
              ctx.fillStyle = color;
              ctx.beginPath();
              ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
              ctx.fill();
            }}
            linkCanvasObject={paintLink}
            linkDirectionalParticles={(link: any) => link.amount && link.amount > 10000 ? 2 : 0}
            linkDirectionalParticleWidth={2}
            linkDirectionalParticleColor={(link: any) =>
              LINK_STYLES[link.linkType]?.color || "rgba(150,150,150,0.5)"
            }
            onNodeHover={(node: any) => {
              setHoveredNode(node?.id || null);
              if (node) {
                const receipts = graphData.links
                  .filter(l => {
                    const src = typeof l.source === "string" ? l.source : l.source.id;
                    const tgt = typeof l.target === "string" ? l.target : l.target.id;
                    return src === node.id || tgt === node.id;
                  })
                  .filter(l => l.amount)
                  .slice(0, 3)
                  .map(l => {
                    const src = typeof l.source === "string" ? l.source : l.source.id;
                    const tgt = typeof l.target === "string" ? l.target : l.target.id;
                    const srcNode = graphData.nodes.find(n => n.id === src);
                    const tgtNode = graphData.nodes.find(n => n.id === tgt);
                    return `${srcNode?.label || src} → ${tgtNode?.label || tgt}: ${formatAmount(l.amount)}`;
                  });
                if (receipts.length > 0) {
                  setHoverTooltip({ x: node.x || 0, y: node.y || 0, text: receipts.join("\n") });
                } else {
                  setHoverTooltip(null);
                }
              } else {
                setHoverTooltip(null);
              }
            }}
            onNodeClick={handleNodeClick}
            onNodeDragEnd={(node: any) => { node.fx = node.x; node.fy = node.y; }}
            d3AlphaDecay={0.015}
            d3VelocityDecay={0.25}
            cooldownTicks={300}
            warmupTicks={100}
            enableNodeDrag={true}
            enableZoomInteraction={true}
            enablePanInteraction={true}
          />
        </div>

        {/* ═══ DETAIL PANEL ═══ */}
        {!graphExpanded && (
          <div className="w-full lg:w-[340px] bg-card border-l border-border/30 overflow-y-auto">
            {selectedNode ? (
              <div className="p-5 space-y-4">
                {/* Node header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold"
                      style={{ backgroundColor: GROUP_COLORS[selectedNode.group] + "22", color: GROUP_COLORS[selectedNode.group] }}
                    >
                      {GROUP_SHAPES[selectedNode.group]}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground font-display leading-tight">{selectedNode.label}</h3>
                      <Badge variant="outline" className="text-[9px] mt-0.5">{selectedNode.group}</Badge>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setSelectedNode(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Party / State (politicians) */}
                {selectedNode.party && (
                  <div className="flex items-center gap-2">
                    <Badge variant={selectedNode.party === "Democrat" ? "default" : "destructive"} className="text-[10px]">
                      {selectedNode.party}
                    </Badge>
                    {selectedNode.state && <span className="text-xs text-muted-foreground">{selectedNode.state}</span>}
                  </div>
                )}

                {/* Amount */}
                {selectedNode.amount && (
                  <div className="p-3 rounded-xl bg-primary/[0.06] border border-primary/10">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Documented Amount</p>
                    <p className="text-xl font-bold font-display text-foreground">{formatAmount(selectedNode.amount)}</p>
                  </div>
                )}

                {/* Metadata summary */}
                {selectedNode.metadata?.summary && (
                  <p className="text-xs text-muted-foreground leading-relaxed">{selectedNode.metadata.summary}</p>
                )}
                {selectedNode.metadata?.industry && (
                  <div className="flex items-center gap-1.5">
                    <Factory className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{selectedNode.metadata.industry}</span>
                  </div>
                )}
                {selectedNode.metadata?.status && (
                  <Badge variant="secondary" className="text-[10px]">{selectedNode.metadata.status}</Badge>
                )}
                {selectedNode.metadata?.description && (
                  <p className="text-xs text-muted-foreground leading-relaxed italic">"{selectedNode.metadata.description}"</p>
                )}

                {/* Issue Areas */}
                {selectedNode.issueCategories && selectedNode.issueCategories.length > 0 && (
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Issue Areas</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedNode.issueCategories.map(c => (
                        <Badge key={c} variant="secondary" className="text-[10px] cursor-pointer hover:bg-accent" onClick={() => setActiveIssueFilter(c)}>
                          {c}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Connections */}
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    Connections ({selectedEdges.length})
                  </h4>
                  <div className="space-y-1.5">
                    {selectedEdges.map((edge, i) => {
                      const src = typeof edge.source === "string" ? edge.source : edge.source.id;
                      const tgt = typeof edge.target === "string" ? edge.target : edge.target.id;
                      const isSource = src === selectedNode.id;
                      const otherNodeId = isSource ? tgt : src;
                      const otherNode = graphData.nodes.find(n => n.id === otherNodeId);
                      if (!otherNode) return null;
                      const style = LINK_STYLES[edge.linkType];
                      const confLabel = edge.confidence ? CONFIDENCE_LABELS[edge.confidence] : null;

                      return (
                        <button
                          key={i}
                          className="w-full text-left p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors border border-border/20 hover:border-border/40"
                          onClick={() => { setSelectedNode(otherNode); setHoveredNode(null); }}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: GROUP_COLORS[otherNode.group] }} />
                            <span className="text-xs font-semibold text-foreground truncate">{otherNode.label}</span>
                            <ChevronRight className="w-3 h-3 text-muted-foreground ml-auto shrink-0" />
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] text-muted-foreground">{isSource ? "→" : "←"} {edge.label}</span>
                            {style && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                                {style.label}
                              </span>
                            )}
                            {edge.amount && (
                              <Badge variant="secondary" className="text-[10px] font-mono">{formatAmount(edge.amount)}</Badge>
                            )}
                          </div>
                          {confLabel && (
                            <p className="text-[9px] text-muted-foreground/60 mt-1 italic">{confLabel}</p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1.5 pt-2 border-t border-border/30">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-1.5 text-xs"
                    onClick={() => {
                      setPathMode(true);
                      setPathStart(selectedNode.id);
                      setPathEnd(null);
                      setActivePath(null);
                    }}
                  >
                    <Route className="w-3 h-3" />
                    Trace path from here
                  </Button>
                  {selectedNode.group === "Company" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-1.5 text-xs"
                      onClick={() => navigate(`/search?q=${encodeURIComponent(selectedNode.label)}`)}
                    >
                      <ExternalLink className="w-3 h-3" />
                      View Company Snapshot
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              /* ═══ DEFAULT PANEL — How to Use + Insights ═══ */
              <div className="p-5 space-y-5">
                {/* Path mode instructions */}
                {pathMode && (
                  <div className="p-3 rounded-xl bg-primary/[0.06] border border-primary/10">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Route className="w-4 h-4 text-primary" />
                      <span className="text-xs font-bold text-foreground">Path Trace Mode</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Click two nodes on the graph to trace the path of influence between them. The system will find the shortest connection chain.
                    </p>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-bold text-foreground font-display mb-1.5">How to use</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Search for a company to map its influence network. <strong>Hover</strong> to trace influence paths. <strong>Click</strong> for details. <strong>Drag</strong> to rearrange. Use <strong>Path Trace</strong> to find connections between any two entities.
                  </p>
                </div>

                {/* Node type legend */}
                <div>
                  <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Entity Types</h4>
                  <div className="grid grid-cols-2 gap-1.5">
                    {Object.entries(GROUP_LABELS).map(([group, { icon: Icon, desc }]) => (
                      <div key={group} className="flex items-center gap-2 p-2 rounded-lg bg-muted/20">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px]" style={{ backgroundColor: GROUP_COLORS[group] + "22", color: GROUP_COLORS[group] }}>
                          {GROUP_SHAPES[group]}
                        </div>
                        <span className="text-[10px] text-foreground font-medium">{group}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Insights */}
                {insights.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Lightbulb className="w-3 h-3 text-primary" />
                      What Stands Out
                    </h4>
                    <div className="space-y-2">
                      {insights.map((insight, i) => (
                        <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-primary/[0.04] border border-primary/10">
                          <Zap className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                          <p className="text-[11px] text-foreground leading-relaxed">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Connection type legend */}
                <div>
                  <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Connection Types</h4>
                  <div className="space-y-1">
                    {[
                      { label: "Donation", desc: "FEC-documented financial contribution", color: LINK_STYLES.donation_to_member.color },
                      { label: "Lobbying", desc: "LDA-filed lobbying activity", color: LINK_STYLES.lobbying_on_bill.color },
                      { label: "Dark Money", desc: "501(c)(4) untraceable channel", color: LINK_STYLES.dark_money_channel.color },
                      { label: "Contract", desc: "Federal contract or grant", color: LINK_STYLES.committee_oversight_of_contract.color },
                      { label: "Revolving Door", desc: "Government ↔ private sector", color: LINK_STYLES.revolving_door.color },
                    ].map(item => (
                      <div key={item.label} className="flex items-start gap-2 py-1">
                        <div className="w-3 h-0.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: item.color.replace(/[\d.]+\)$/, "1)") }} />
                        <div>
                          <p className="text-[10px] font-medium text-foreground">{item.label}</p>
                          <p className="text-[9px] text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {!selectedCompanyId && (
                  <div className="p-3 rounded-xl bg-primary/[0.06] border border-primary/10">
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      <strong className="text-foreground">Demo mode:</strong> Showing a sample influence network.
                      Search for a tracked company to see real data from FEC, lobbying disclosures, and contract records.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══ INSIGHTS FOOTER ═══ */}
      {insights.length > 0 && graphExpanded && (
        <div className="border-t border-border/30 bg-card/50 px-4 lg:px-6 py-3">
          <div className="flex items-center gap-2 mb-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">What Stands Out</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {insights.slice(0, 3).map((insight, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs text-foreground">
                <Zap className="w-3 h-3 text-primary shrink-0" />
                {insight}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attribution */}
      <div className="border-t border-border/30 px-4 lg:px-6 py-2 text-center">
        <p className="text-[9px] text-muted-foreground">
          Built from FEC filings, Senate LDA lobbying disclosures, USASpending.gov contracts, and verified public records.
          Connections labeled "inferred" are pattern-based — not confirmed.
        </p>
      </div>
    </div>
  );
}
