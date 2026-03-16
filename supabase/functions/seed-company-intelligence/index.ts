/**
 * Seed Company Intelligence Database
 * Batch-inserts companies across target categories with enrichment metadata.
 * Uses ON CONFLICT DO NOTHING to avoid duplicates.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CompanySeed {
  name: string;
  slug: string;
  industry: string;
  sub_industry?: string;
  state: string;
  is_publicly_traded?: boolean;
  is_startup?: boolean;
  founded_year?: number;
  funding_stage?: string;
  founder_names?: string[];
  founder_previous_companies?: string[];
  category_tags: string[];
  employee_count?: string;
  description?: string;
}

const COMPANIES: CompanySeed[] = [
  // ── HR Tech ──
  { name: "Workday", slug: "workday", industry: "Technology", sub_industry: "HR Tech", state: "CA", is_publicly_traded: true, founded_year: 2005, category_tags: ["HR Tech", "Big Tech"], employee_count: "18,800", description: "Enterprise cloud applications for finance and human resources." },
  { name: "Greenhouse", slug: "greenhouse", industry: "Technology", sub_industry: "HR Tech", state: "NY", is_startup: true, founded_year: 2012, funding_stage: "Series D", category_tags: ["HR Tech", "Startups"], description: "Hiring software for growing companies." },
  { name: "Lever", slug: "lever", industry: "Technology", sub_industry: "HR Tech", state: "CA", is_startup: true, founded_year: 2012, funding_stage: "Series D", category_tags: ["HR Tech", "Startups"], description: "Talent acquisition suite combining ATS and CRM." },
  { name: "Ashby", slug: "ashby", industry: "Technology", sub_industry: "HR Tech", state: "CA", is_startup: true, founded_year: 2018, funding_stage: "Series C", category_tags: ["HR Tech", "Startups"], description: "All-in-one recruiting platform." },
  { name: "SmartRecruiters", slug: "smartrecruiters", industry: "Technology", sub_industry: "HR Tech", state: "CA", founded_year: 2010, category_tags: ["HR Tech"], description: "Enterprise talent acquisition platform." },
  { name: "iCIMS", slug: "icims", industry: "Technology", sub_industry: "HR Tech", state: "NJ", founded_year: 2000, category_tags: ["HR Tech"], description: "Cloud-based talent acquisition software." },
  { name: "SeekOut", slug: "seekout", industry: "Technology", sub_industry: "HR Tech", state: "WA", is_startup: true, founded_year: 2017, funding_stage: "Series C", category_tags: ["HR Tech", "Startups"], description: "AI-powered talent search and analytics." },
  { name: "Paradox", slug: "paradox", industry: "Technology", sub_industry: "HR Tech", state: "AZ", is_startup: true, founded_year: 2016, funding_stage: "Series C", category_tags: ["HR Tech", "Startups"], description: "Conversational AI for recruiting." },
  { name: "Eightfold AI", slug: "eightfold-ai", industry: "Technology", sub_industry: "HR Tech", state: "CA", is_startup: true, founded_year: 2016, funding_stage: "Series E", category_tags: ["HR Tech", "Startups"], description: "AI talent intelligence platform." },
  { name: "Gem", slug: "gem", industry: "Technology", sub_industry: "HR Tech", state: "CA", is_startup: true, founded_year: 2017, funding_stage: "Series C", category_tags: ["HR Tech", "Startups"], description: "Talent engagement platform for recruiting teams." },
  { name: "HireVue", slug: "hirevue", industry: "Technology", sub_industry: "HR Tech", state: "UT", founded_year: 2004, category_tags: ["HR Tech"], description: "Video interviewing and AI assessment platform." },
  { name: "Findem", slug: "findem", industry: "Technology", sub_industry: "HR Tech", state: "CA", is_startup: true, founded_year: 2019, funding_stage: "Series B", category_tags: ["HR Tech", "Startups"], description: "AI-powered talent data platform." },
  { name: "Textio", slug: "textio", industry: "Technology", sub_industry: "HR Tech", state: "WA", is_startup: true, founded_year: 2014, funding_stage: "Series B", category_tags: ["HR Tech", "Startups"], description: "Augmented writing platform for inclusive hiring." },
  { name: "GoodTime", slug: "goodtime", industry: "Technology", sub_industry: "HR Tech", state: "CA", is_startup: true, founded_year: 2016, funding_stage: "Series B", category_tags: ["HR Tech", "Startups"], description: "Interview scheduling and optimization." },
  { name: "Rippling", slug: "rippling", industry: "Technology", sub_industry: "HR Tech", state: "CA", is_startup: true, founded_year: 2016, funding_stage: "Series F", founder_names: ["Parker Conrad"], founder_previous_companies: ["Zenefits"], category_tags: ["HR Tech", "Startups"], description: "Unified workforce platform for HR, IT, and finance." },
  { name: "Gusto", slug: "gusto", industry: "Technology", sub_industry: "HR Tech", state: "CA", is_startup: true, founded_year: 2011, funding_stage: "Series E", category_tags: ["HR Tech", "Startups"], description: "People platform for payroll, benefits, and HR." },
  { name: "Deel", slug: "deel", industry: "Technology", sub_industry: "HR Tech", state: "CA", is_startup: true, founded_year: 2019, funding_stage: "Series D", category_tags: ["HR Tech", "Startups"], description: "Global payroll and compliance platform." },
  { name: "Remote", slug: "remote", industry: "Technology", sub_industry: "HR Tech", state: "NY", is_startup: true, founded_year: 2019, funding_stage: "Series C", category_tags: ["HR Tech", "Startups"], description: "Global HR platform for distributed teams." },
  { name: "BambooHR", slug: "bamboohr", industry: "Technology", sub_industry: "HR Tech", state: "UT", founded_year: 2008, category_tags: ["HR Tech"], description: "HR software for small and medium businesses." },
  { name: "Lattice", slug: "lattice", industry: "Technology", sub_industry: "HR Tech", state: "CA", is_startup: true, founded_year: 2015, funding_stage: "Series F", category_tags: ["HR Tech", "Startups"], description: "People management platform." },
  { name: "Phenom", slug: "phenom", industry: "Technology", sub_industry: "HR Tech", state: "PA", founded_year: 2010, category_tags: ["HR Tech"], description: "Intelligent talent experience platform." },
  { name: "Beamery", slug: "beamery", industry: "Technology", sub_industry: "HR Tech", state: "NY", is_startup: true, founded_year: 2013, funding_stage: "Series C", category_tags: ["HR Tech", "Startups"], description: "Talent lifecycle management platform." },
  
  // ── Finance ──
  { name: "JPMorgan Chase", slug: "jpmorgan-chase", industry: "Finance", sub_industry: "Investment Banking", state: "NY", is_publicly_traded: true, founded_year: 1799, category_tags: ["Finance", "Big Tech"], employee_count: "309,000", description: "Global financial services firm." },
  { name: "Morgan Stanley", slug: "morgan-stanley", industry: "Finance", sub_industry: "Investment Banking", state: "NY", is_publicly_traded: true, founded_year: 1935, category_tags: ["Finance"], employee_count: "82,000", description: "Global investment bank and financial services." },
  { name: "Citigroup", slug: "citigroup", industry: "Finance", sub_industry: "Banking", state: "NY", is_publicly_traded: true, founded_year: 1812, category_tags: ["Finance"], employee_count: "240,000", description: "Global banking and financial services." },
  { name: "BlackRock", slug: "blackrock", industry: "Finance", sub_industry: "Asset Management", state: "NY", is_publicly_traded: true, founded_year: 1988, category_tags: ["Finance"], employee_count: "19,800", description: "World's largest asset manager." },
  { name: "Charles Schwab", slug: "charles-schwab", industry: "Finance", sub_industry: "Brokerage", state: "TX", is_publicly_traded: true, founded_year: 1971, category_tags: ["Finance"], description: "Financial services and brokerage firm." },
  { name: "Fidelity Investments", slug: "fidelity-investments", industry: "Finance", sub_industry: "Asset Management", state: "MA", founded_year: 1946, category_tags: ["Finance"], employee_count: "74,000", description: "Financial services and asset management." },
  { name: "Visa", slug: "visa", industry: "Finance", sub_industry: "Payments", state: "CA", is_publicly_traded: true, founded_year: 1958, category_tags: ["Finance"], employee_count: "29,500", description: "Global payments technology company." },
  { name: "Mastercard", slug: "mastercard", industry: "Finance", sub_industry: "Payments", state: "NY", is_publicly_traded: true, founded_year: 1966, category_tags: ["Finance"], employee_count: "33,400", description: "Global payments and technology company." },
  { name: "PayPal", slug: "paypal", industry: "Finance", sub_industry: "Fintech", state: "CA", is_publicly_traded: true, founded_year: 1998, category_tags: ["Finance"], employee_count: "26,500", description: "Digital payments platform." },
  { name: "Stripe", slug: "stripe", industry: "Finance", sub_industry: "Fintech", state: "CA", is_startup: true, founded_year: 2010, funding_stage: "Series I", category_tags: ["Finance", "Startups"], description: "Online payment processing for internet businesses." },
  { name: "Square (Block)", slug: "block-square", industry: "Finance", sub_industry: "Fintech", state: "CA", is_publicly_traded: true, founded_year: 2009, category_tags: ["Finance"], description: "Financial technology company." },
  
  // ── Energy ──
  { name: "Chevron", slug: "chevron", industry: "Energy", sub_industry: "Oil & Gas", state: "CA", is_publicly_traded: true, founded_year: 1879, category_tags: ["Energy"], employee_count: "43,846", description: "Multinational energy corporation." },
  { name: "BP", slug: "bp", industry: "Energy", sub_industry: "Oil & Gas", state: "TX", is_publicly_traded: true, founded_year: 1909, category_tags: ["Energy"], description: "Global energy company." },
  { name: "Shell", slug: "shell", industry: "Energy", sub_industry: "Oil & Gas", state: "TX", is_publicly_traded: true, founded_year: 1907, category_tags: ["Energy"], description: "Global energy and petrochemical company." },
  { name: "ConocoPhillips", slug: "conocophillips", industry: "Energy", sub_industry: "Oil & Gas", state: "TX", is_publicly_traded: true, founded_year: 2002, category_tags: ["Energy"], description: "Independent exploration and production company." },
  { name: "NextEra Energy", slug: "nextera-energy", industry: "Energy", sub_industry: "Renewable Energy", state: "FL", is_publicly_traded: true, founded_year: 1925, category_tags: ["Energy"], description: "Largest producer of wind and solar energy." },
  { name: "Duke Energy", slug: "duke-energy", industry: "Energy", sub_industry: "Utilities", state: "NC", is_publicly_traded: true, founded_year: 1904, category_tags: ["Energy"], description: "Electric power and natural gas company." },
  { name: "Enphase Energy", slug: "enphase-energy", industry: "Energy", sub_industry: "Solar", state: "CA", is_publicly_traded: true, founded_year: 2006, category_tags: ["Energy", "Startups"], description: "Solar microinverter technology company." },
  
  // ── Healthcare ──
  { name: "UnitedHealth Group", slug: "unitedhealth-group", industry: "Healthcare", sub_industry: "Health Insurance", state: "MN", is_publicly_traded: true, founded_year: 1977, category_tags: ["Healthcare"], employee_count: "440,000", description: "Health care and insurance company." },
  { name: "Cigna", slug: "cigna", industry: "Healthcare", sub_industry: "Health Insurance", state: "CT", is_publicly_traded: true, founded_year: 1982, category_tags: ["Healthcare"], description: "Global health services organization." },
  { name: "Anthem (Elevance Health)", slug: "elevance-health", industry: "Healthcare", sub_industry: "Health Insurance", state: "IN", is_publicly_traded: true, founded_year: 2004, category_tags: ["Healthcare"], description: "Health benefits company." },
  { name: "HCA Healthcare", slug: "hca-healthcare", industry: "Healthcare", sub_industry: "Hospitals", state: "TN", is_publicly_traded: true, founded_year: 1968, category_tags: ["Healthcare"], employee_count: "275,000", description: "Largest for-profit hospital operator in the US." },
  { name: "CVS Health", slug: "cvs-health", industry: "Healthcare", sub_industry: "Pharmacy & Insurance", state: "RI", is_publicly_traded: true, founded_year: 1963, category_tags: ["Healthcare", "Retail"], employee_count: "300,000", description: "Health services and pharmacy chain." },
  { name: "Pfizer", slug: "pfizer", industry: "Healthcare", sub_industry: "Pharmaceuticals", state: "NY", is_publicly_traded: true, founded_year: 1849, category_tags: ["Healthcare"], employee_count: "83,000", description: "Global pharmaceutical company." },
  { name: "Johnson & Johnson", slug: "johnson-johnson", industry: "Healthcare", sub_industry: "Pharmaceuticals", state: "NJ", is_publicly_traded: true, founded_year: 1886, category_tags: ["Healthcare"], employee_count: "131,900", description: "Multinational healthcare products company." },
  { name: "Abbott Laboratories", slug: "abbott-laboratories", industry: "Healthcare", sub_industry: "Medical Devices", state: "IL", is_publicly_traded: true, founded_year: 1888, category_tags: ["Healthcare"], description: "Medical devices, diagnostics, and nutrition." },
  { name: "Merck", slug: "merck", industry: "Healthcare", sub_industry: "Pharmaceuticals", state: "NJ", is_publicly_traded: true, founded_year: 1891, category_tags: ["Healthcare"], employee_count: "69,000", description: "Global pharmaceutical company." },
  
  // ── Defense ──
  { name: "Lockheed Martin", slug: "lockheed-martin", industry: "Defense", sub_industry: "Aerospace & Defense", state: "MD", is_publicly_traded: true, founded_year: 1995, category_tags: ["Defense", "Government Contractors"], employee_count: "116,000", description: "Aerospace, defense, and security company." },
  { name: "Raytheon Technologies", slug: "raytheon-technologies", industry: "Defense", sub_industry: "Aerospace & Defense", state: "VA", is_publicly_traded: true, founded_year: 2020, category_tags: ["Defense", "Government Contractors"], employee_count: "180,000", description: "Aerospace and defense conglomerate." },
  { name: "Northrop Grumman", slug: "northrop-grumman", industry: "Defense", sub_industry: "Aerospace & Defense", state: "VA", is_publicly_traded: true, founded_year: 1994, category_tags: ["Defense", "Government Contractors"], employee_count: "95,000", description: "Global aerospace and defense technology." },
  { name: "General Dynamics", slug: "general-dynamics", industry: "Defense", sub_industry: "Defense Systems", state: "VA", is_publicly_traded: true, founded_year: 1899, category_tags: ["Defense", "Government Contractors"], employee_count: "106,500", description: "Aerospace and defense company." },
  { name: "L3Harris Technologies", slug: "l3harris-technologies", industry: "Defense", sub_industry: "Defense Electronics", state: "FL", is_publicly_traded: true, founded_year: 2019, category_tags: ["Defense", "Government Contractors"], description: "Defense and technology company." },
  { name: "BAE Systems", slug: "bae-systems", industry: "Defense", sub_industry: "Aerospace & Defense", state: "VA", is_publicly_traded: true, founded_year: 1999, category_tags: ["Defense", "Government Contractors"], description: "Multinational defense, security, and aerospace." },
  
  // ── Government Contractors ──
  { name: "Booz Allen Hamilton", slug: "booz-allen-hamilton", industry: "Consulting", sub_industry: "Government Consulting", state: "VA", is_publicly_traded: true, founded_year: 1914, category_tags: ["Government Contractors", "Consulting"], employee_count: "33,100", description: "Management and IT consulting for government." },
  { name: "SAIC", slug: "saic", industry: "Technology", sub_industry: "Government IT", state: "VA", is_publicly_traded: true, founded_year: 2013, category_tags: ["Government Contractors"], description: "Technology integrator for government." },
  { name: "Leidos", slug: "leidos", industry: "Technology", sub_industry: "Government IT", state: "VA", is_publicly_traded: true, founded_year: 2013, category_tags: ["Government Contractors"], employee_count: "47,000", description: "Defense, intelligence, and health IT solutions." },
  { name: "CACI International", slug: "caci-international", industry: "Technology", sub_industry: "Government IT", state: "VA", is_publicly_traded: true, founded_year: 1962, category_tags: ["Government Contractors"], description: "Information solutions for defense and intelligence." },
  { name: "ManTech International", slug: "mantech-international", industry: "Technology", sub_industry: "Government IT", state: "VA", founded_year: 1968, category_tags: ["Government Contractors"], description: "Technology solutions for national security." },
  { name: "Palantir Technologies", slug: "palantir-technologies", industry: "Technology", sub_industry: "Data Analytics", state: "CO", is_publicly_traded: true, founded_year: 2003, category_tags: ["Government Contractors", "Big Tech"], description: "Data analytics and software for government and enterprise." },
  
  // ── Retail ──
  { name: "Walmart", slug: "walmart", industry: "Retail", sub_industry: "Mass Retail", state: "AR", is_publicly_traded: true, founded_year: 1962, category_tags: ["Retail"], employee_count: "2,100,000", description: "Largest retailer in the world." },
  { name: "Target", slug: "target", industry: "Retail", sub_industry: "Mass Retail", state: "MN", is_publicly_traded: true, founded_year: 1962, category_tags: ["Retail"], employee_count: "440,000", description: "General merchandise retailer." },
  { name: "Costco", slug: "costco", industry: "Retail", sub_industry: "Warehouse Retail", state: "WA", is_publicly_traded: true, founded_year: 1983, category_tags: ["Retail"], employee_count: "316,000", description: "Membership warehouse club." },
  { name: "Home Depot", slug: "home-depot", industry: "Retail", sub_industry: "Home Improvement", state: "GA", is_publicly_traded: true, founded_year: 1978, category_tags: ["Retail"], employee_count: "475,000", description: "Home improvement retail chain." },
  { name: "Lowe's", slug: "lowes", industry: "Retail", sub_industry: "Home Improvement", state: "NC", is_publicly_traded: true, founded_year: 1946, category_tags: ["Retail"], employee_count: "300,000", description: "Home improvement retailer." },
  { name: "Kroger", slug: "kroger", industry: "Retail", sub_industry: "Grocery", state: "OH", is_publicly_traded: true, founded_year: 1883, category_tags: ["Retail"], employee_count: "430,000", description: "Grocery retail chain." },
  { name: "Nike", slug: "nike", industry: "Retail", sub_industry: "Athletic & Apparel", state: "OR", is_publicly_traded: true, founded_year: 1964, category_tags: ["Retail"], employee_count: "79,400", description: "Global athletic footwear and apparel." },
  { name: "Starbucks", slug: "starbucks", industry: "Retail", sub_industry: "Food & Beverage", state: "WA", is_publicly_traded: true, founded_year: 1971, category_tags: ["Retail"], employee_count: "381,000", description: "Coffeehouse chain and roastery." },
  { name: "Patagonia", slug: "patagonia", industry: "Retail", sub_industry: "Outdoor Apparel", state: "CA", founded_year: 1973, category_tags: ["Retail"], employee_count: "3,000", description: "Outdoor clothing and gear company committed to environmental activism." },
  
  // ── Big Tech (extras not already in DB) ──
  { name: "Netflix", slug: "netflix", industry: "Technology", sub_industry: "Streaming", state: "CA", is_publicly_traded: true, founded_year: 1997, category_tags: ["Big Tech"], employee_count: "13,000", description: "Global streaming entertainment service." },
  { name: "Uber", slug: "uber", industry: "Technology", sub_industry: "Ride-sharing", state: "CA", is_publicly_traded: true, founded_year: 2009, category_tags: ["Big Tech"], employee_count: "32,600", description: "Ride-sharing and delivery platform." },
  { name: "Airbnb", slug: "airbnb", industry: "Technology", sub_industry: "Travel Tech", state: "CA", is_publicly_traded: true, founded_year: 2008, category_tags: ["Big Tech"], employee_count: "6,907", description: "Online marketplace for lodging and experiences." },
  { name: "Snap Inc.", slug: "snap-inc", industry: "Technology", sub_industry: "Social Media", state: "CA", is_publicly_traded: true, founded_year: 2011, category_tags: ["Big Tech"], description: "Camera and social media company." },
  { name: "Pinterest", slug: "pinterest", industry: "Technology", sub_industry: "Social Media", state: "CA", is_publicly_traded: true, founded_year: 2009, category_tags: ["Big Tech"], description: "Visual discovery and social curation platform." },
  { name: "Spotify", slug: "spotify", industry: "Technology", sub_industry: "Streaming", state: "NY", is_publicly_traded: true, founded_year: 2006, category_tags: ["Big Tech"], employee_count: "9,000", description: "Audio streaming and media services." },
  { name: "Snowflake", slug: "snowflake", industry: "Technology", sub_industry: "Cloud Data", state: "MT", is_publicly_traded: true, founded_year: 2012, category_tags: ["Big Tech"], description: "Cloud computing data platform." },
  { name: "Databricks", slug: "databricks", industry: "Technology", sub_industry: "Data & AI", state: "CA", is_startup: true, founded_year: 2013, funding_stage: "Series I", category_tags: ["Big Tech", "Startups"], description: "Unified analytics platform for data and AI." },
  { name: "Figma", slug: "figma", industry: "Technology", sub_industry: "Design Tools", state: "CA", is_startup: true, founded_year: 2012, funding_stage: "Series E", category_tags: ["Big Tech", "Startups"], description: "Collaborative design platform." },
  { name: "Canva", slug: "canva", industry: "Technology", sub_industry: "Design Tools", state: "CA", is_startup: true, founded_year: 2012, funding_stage: "Series A", category_tags: ["Startups"], description: "Online visual communications platform." },
  
  // ── Consulting ──
  { name: "McKinsey & Company", slug: "mckinsey", industry: "Consulting", sub_industry: "Management Consulting", state: "NY", founded_year: 1926, category_tags: ["Consulting"], employee_count: "45,000", description: "Global management consulting firm." },
  { name: "Boston Consulting Group", slug: "bcg", industry: "Consulting", sub_industry: "Management Consulting", state: "MA", founded_year: 1963, category_tags: ["Consulting"], employee_count: "32,000", description: "International management consulting firm." },
  { name: "Bain & Company", slug: "bain-company", industry: "Consulting", sub_industry: "Management Consulting", state: "MA", founded_year: 1973, category_tags: ["Consulting"], employee_count: "18,500", description: "Global management consulting firm." },
  { name: "Deloitte", slug: "deloitte", industry: "Consulting", sub_industry: "Professional Services", state: "NY", founded_year: 1845, category_tags: ["Consulting"], employee_count: "457,000", description: "Professional services and consulting." },
  { name: "Accenture", slug: "accenture", industry: "Consulting", sub_industry: "IT Consulting", state: "NY", is_publicly_traded: true, founded_year: 1989, category_tags: ["Consulting"], employee_count: "733,000", description: "Professional services and IT consulting." },
  { name: "PricewaterhouseCoopers", slug: "pwc", industry: "Consulting", sub_industry: "Professional Services", state: "NY", founded_year: 1998, category_tags: ["Consulting"], employee_count: "364,000", description: "Professional services and accounting firm." },
  { name: "Ernst & Young", slug: "ernst-young", industry: "Consulting", sub_industry: "Professional Services", state: "NY", founded_year: 1989, category_tags: ["Consulting"], employee_count: "395,000", description: "Professional services and accounting firm." },
  { name: "KPMG", slug: "kpmg", industry: "Consulting", sub_industry: "Professional Services", state: "NY", founded_year: 1987, category_tags: ["Consulting"], employee_count: "265,000", description: "Professional services and accounting firm." },
  
  // ── Automotive / Manufacturing ──
  { name: "Tesla", slug: "tesla", industry: "Automotive", sub_industry: "Electric Vehicles", state: "TX", is_publicly_traded: true, founded_year: 2003, category_tags: ["Automotive"], employee_count: "140,000", description: "Electric vehicle and clean energy company." },
  { name: "Ford Motor Company", slug: "ford", industry: "Automotive", sub_industry: "Auto Manufacturing", state: "MI", is_publicly_traded: true, founded_year: 1903, category_tags: ["Automotive"], employee_count: "177,000", description: "Multinational automaker." },
  { name: "General Motors", slug: "general-motors", industry: "Automotive", sub_industry: "Auto Manufacturing", state: "MI", is_publicly_traded: true, founded_year: 1908, category_tags: ["Automotive"], employee_count: "163,000", description: "Multinational automotive manufacturer." },
  { name: "Rivian", slug: "rivian", industry: "Automotive", sub_industry: "Electric Vehicles", state: "CA", is_publicly_traded: true, is_startup: true, founded_year: 2009, category_tags: ["Automotive", "Startups"], description: "Electric vehicle manufacturer." },
  
  // ── Telecom / Media ──
  { name: "AT&T", slug: "att", industry: "Telecommunications", sub_industry: "Telecom", state: "TX", is_publicly_traded: true, founded_year: 1885, category_tags: ["Telecom"], employee_count: "160,700", description: "Multinational telecommunications conglomerate." },
  { name: "Verizon", slug: "verizon", industry: "Telecommunications", sub_industry: "Telecom", state: "NY", is_publicly_traded: true, founded_year: 1983, category_tags: ["Telecom"], employee_count: "105,400", description: "Telecommunications conglomerate." },
  { name: "T-Mobile", slug: "t-mobile", industry: "Telecommunications", sub_industry: "Wireless", state: "WA", is_publicly_traded: true, founded_year: 1994, category_tags: ["Telecom"], employee_count: "71,000", description: "Wireless network operator." },
  { name: "Comcast", slug: "comcast", industry: "Telecommunications", sub_industry: "Cable & Media", state: "PA", is_publicly_traded: true, founded_year: 1963, category_tags: ["Telecom"], employee_count: "186,000", description: "Telecommunications and media conglomerate." },
  { name: "Walt Disney Company", slug: "walt-disney", industry: "Entertainment", sub_industry: "Media & Entertainment", state: "CA", is_publicly_traded: true, founded_year: 1923, category_tags: ["Entertainment"], employee_count: "220,000", description: "Global entertainment and media conglomerate." },
  
  // ── Semiconductor / Hardware ──
  { name: "NVIDIA", slug: "nvidia", industry: "Technology", sub_industry: "Semiconductors", state: "CA", is_publicly_traded: true, founded_year: 1993, category_tags: ["Big Tech"], employee_count: "29,600", description: "GPU and AI chip designer." },
  { name: "AMD", slug: "amd", industry: "Technology", sub_industry: "Semiconductors", state: "CA", is_publicly_traded: true, founded_year: 1969, category_tags: ["Big Tech"], employee_count: "26,000", description: "Semiconductor company." },
  { name: "Intel", slug: "intel", industry: "Technology", sub_industry: "Semiconductors", state: "CA", is_publicly_traded: true, founded_year: 1968, category_tags: ["Big Tech"], employee_count: "124,800", description: "Semiconductor chip manufacturer." },
  { name: "Qualcomm", slug: "qualcomm", industry: "Technology", sub_industry: "Semiconductors", state: "CA", is_publicly_traded: true, founded_year: 1985, category_tags: ["Big Tech"], employee_count: "51,000", description: "Wireless technology and semiconductor company." },
  { name: "Broadcom", slug: "broadcom", industry: "Technology", sub_industry: "Semiconductors", state: "CA", is_publicly_traded: true, founded_year: 1991, category_tags: ["Big Tech"], description: "Semiconductor and infrastructure software." },
  
  // ── AI / Emerging Tech Startups ──
  { name: "OpenAI", slug: "openai", industry: "Technology", sub_industry: "Artificial Intelligence", state: "CA", is_startup: true, founded_year: 2015, funding_stage: "Series E", category_tags: ["Big Tech", "Startups"], description: "AI research and deployment company." },
  { name: "Anthropic", slug: "anthropic", industry: "Technology", sub_industry: "Artificial Intelligence", state: "CA", is_startup: true, founded_year: 2021, funding_stage: "Series D", category_tags: ["Startups"], description: "AI safety company." },
  { name: "Scale AI", slug: "scale-ai", industry: "Technology", sub_industry: "Artificial Intelligence", state: "CA", is_startup: true, founded_year: 2016, funding_stage: "Series F", category_tags: ["Startups"], description: "Data platform for AI." },
  { name: "Notion", slug: "notion", industry: "Technology", sub_industry: "Productivity", state: "CA", is_startup: true, founded_year: 2013, funding_stage: "Series C", category_tags: ["Startups"], description: "All-in-one workspace for notes, docs, and project management." },
  { name: "Vercel", slug: "vercel", industry: "Technology", sub_industry: "Developer Tools", state: "CA", is_startup: true, founded_year: 2015, funding_stage: "Series D", category_tags: ["Startups"], description: "Frontend cloud platform." },
  
  // ── Additional Big Companies ──
  { name: "3M", slug: "3m", industry: "Manufacturing", sub_industry: "Conglomerate", state: "MN", is_publicly_traded: true, founded_year: 1902, category_tags: ["Manufacturing"], employee_count: "92,000", description: "Diversified technology and manufacturing company." },
  { name: "Caterpillar", slug: "caterpillar", industry: "Manufacturing", sub_industry: "Heavy Equipment", state: "TX", is_publicly_traded: true, founded_year: 1925, category_tags: ["Manufacturing"], employee_count: "113,600", description: "Construction and mining equipment manufacturer." },
  { name: "Procter & Gamble", slug: "procter-gamble", industry: "Consumer Goods", sub_industry: "Consumer Products", state: "OH", is_publicly_traded: true, founded_year: 1837, category_tags: ["Consumer Goods"], employee_count: "107,000", description: "Multinational consumer goods corporation." },
  { name: "Coca-Cola", slug: "coca-cola", industry: "Consumer Goods", sub_industry: "Beverages", state: "GA", is_publicly_traded: true, founded_year: 1886, category_tags: ["Consumer Goods"], employee_count: "82,500", description: "Beverage company." },
  { name: "PepsiCo", slug: "pepsico", industry: "Consumer Goods", sub_industry: "Food & Beverages", state: "NY", is_publicly_traded: true, founded_year: 1965, category_tags: ["Consumer Goods"], employee_count: "315,000", description: "Multinational food, snack, and beverage corporation." },
  { name: "FedEx", slug: "fedex", industry: "Logistics", sub_industry: "Shipping", state: "TN", is_publicly_traded: true, founded_year: 1971, category_tags: ["Logistics"], employee_count: "530,000", description: "Multinational delivery services company." },
  { name: "UPS", slug: "ups", industry: "Logistics", sub_industry: "Shipping", state: "GA", is_publicly_traded: true, founded_year: 1907, category_tags: ["Logistics"], employee_count: "500,000", description: "Package delivery and supply chain management." },
  { name: "Delta Air Lines", slug: "delta-air-lines", industry: "Airlines", sub_industry: "Commercial Aviation", state: "GA", is_publicly_traded: true, founded_year: 1924, category_tags: ["Airlines"], employee_count: "100,000", description: "Major US airline." },
  { name: "United Airlines", slug: "united-airlines", industry: "Airlines", sub_industry: "Commercial Aviation", state: "IL", is_publicly_traded: true, founded_year: 1926, category_tags: ["Airlines"], employee_count: "92,795", description: "Major US airline." },
  { name: "Southwest Airlines", slug: "southwest-airlines", industry: "Airlines", sub_industry: "Commercial Aviation", state: "TX", is_publicly_traded: true, founded_year: 1967, category_tags: ["Airlines"], employee_count: "66,656", description: "Low-cost carrier airline." },
  
  // ── Insurance ──
  { name: "Berkshire Hathaway", slug: "berkshire-hathaway", industry: "Finance", sub_industry: "Conglomerate", state: "NE", is_publicly_traded: true, founded_year: 1839, category_tags: ["Finance"], employee_count: "383,000", description: "Multinational conglomerate holding company." },
  { name: "State Farm", slug: "state-farm", industry: "Insurance", sub_industry: "Insurance", state: "IL", founded_year: 1922, category_tags: ["Insurance"], employee_count: "53,000", description: "Insurance and financial services company." },
  { name: "Progressive", slug: "progressive", industry: "Insurance", sub_industry: "Auto Insurance", state: "OH", is_publicly_traded: true, founded_year: 1937, category_tags: ["Insurance"], description: "Insurance company." },
  
  // ── Real Estate / Hospitality ──
  { name: "Marriott International", slug: "marriott-international", industry: "Hospitality", sub_industry: "Hotels", state: "MD", is_publicly_traded: true, founded_year: 1927, category_tags: ["Hospitality"], employee_count: "411,000", description: "Multinational hospitality company." },
  { name: "Hilton", slug: "hilton", industry: "Hospitality", sub_industry: "Hotels", state: "VA", is_publicly_traded: true, founded_year: 1919, category_tags: ["Hospitality"], employee_count: "159,000", description: "Multinational hospitality company." },
  
  // ── Food / Restaurant ──
  { name: "McDonald's", slug: "mcdonalds", industry: "Restaurant", sub_industry: "Fast Food", state: "IL", is_publicly_traded: true, founded_year: 1940, category_tags: ["Restaurant"], employee_count: "150,000", description: "Global fast food restaurant chain." },
  { name: "Chipotle", slug: "chipotle", industry: "Restaurant", sub_industry: "Fast Casual", state: "CA", is_publicly_traded: true, founded_year: 1993, category_tags: ["Restaurant"], employee_count: "110,000", description: "Fast-casual restaurant chain." },
  
  // ── Enterprise Software ──
  { name: "ServiceNow", slug: "servicenow", industry: "Technology", sub_industry: "Enterprise Software", state: "CA", is_publicly_traded: true, founded_year: 2003, category_tags: ["Big Tech"], employee_count: "22,000", description: "Digital workflow platform for enterprises." },
  { name: "Atlassian", slug: "atlassian", industry: "Technology", sub_industry: "Developer Tools", state: "CA", is_publicly_traded: true, founded_year: 2002, category_tags: ["Big Tech"], description: "Team collaboration and productivity software." },
  { name: "HubSpot", slug: "hubspot", industry: "Technology", sub_industry: "Marketing Tech", state: "MA", is_publicly_traded: true, founded_year: 2006, category_tags: ["Big Tech"], employee_count: "7,600", description: "CRM and inbound marketing platform." },
  { name: "Twilio", slug: "twilio", industry: "Technology", sub_industry: "Cloud Communications", state: "CA", is_publicly_traded: true, founded_year: 2008, category_tags: ["Big Tech"], description: "Cloud communications platform." },
  { name: "Palo Alto Networks", slug: "palo-alto-networks", industry: "Technology", sub_industry: "Cybersecurity", state: "CA", is_publicly_traded: true, founded_year: 2005, category_tags: ["Big Tech"], employee_count: "15,521", description: "Cybersecurity platform company." },
  { name: "CrowdStrike", slug: "crowdstrike", industry: "Technology", sub_industry: "Cybersecurity", state: "TX", is_publicly_traded: true, founded_year: 2011, category_tags: ["Big Tech"], description: "Cloud-delivered endpoint protection." },
  { name: "Zscaler", slug: "zscaler", industry: "Technology", sub_industry: "Cybersecurity", state: "CA", is_publicly_traded: true, founded_year: 2007, category_tags: ["Big Tech"], description: "Cloud-native security platform." },
];

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const body = await req.json().catch(() => ({}));
    const dryRun = body.dryRun || false;
    const batchSize = body.batchSize || 50;

    console.log(`[seed-intelligence] START: ${COMPANIES.length} companies, dryRun=${dryRun}`);

    if (dryRun) {
      return new Response(JSON.stringify({
        success: true,
        dryRun: true,
        totalCompanies: COMPANIES.length,
        categories: [...new Set(COMPANIES.flatMap(c => c.category_tags))],
        industries: [...new Set(COMPANIES.map(c => c.industry))],
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let inserted = 0;
    let skipped = 0;
    const errors: string[] = [];

    // Process in batches
    for (let i = 0; i < COMPANIES.length; i += batchSize) {
      const batch = COMPANIES.slice(i, i + batchSize).map(c => ({
        name: c.name,
        slug: c.slug || slugify(c.name),
        industry: c.industry,
        sub_industry: c.sub_industry || null,
        state: c.state,
        is_publicly_traded: c.is_publicly_traded ?? null,
        is_startup: c.is_startup ?? false,
        founded_year: c.founded_year ?? null,
        funding_stage: c.funding_stage ?? null,
        founder_names: c.founder_names ?? null,
        founder_previous_companies: c.founder_previous_companies ?? null,
        category_tags: c.category_tags,
        employee_count: c.employee_count ?? null,
        description: c.description ?? null,
        record_status: "published",
        confidence_rating: "low",
        civic_footprint_score: 5,
        total_pac_spending: 0,
        corporate_pac_exists: false,
        creation_source: "seed_intelligence",
      }));

      const { data, error } = await supabase
        .from("companies")
        .upsert(batch, { onConflict: "slug", ignoreDuplicates: true })
        .select("id, name");

      if (error) {
        console.error(`[seed-intelligence] Batch error at offset ${i}:`, error);
        errors.push(`Batch ${i}: ${error.message}`);
      } else {
        inserted += data?.length || 0;
      }
    }

    skipped = COMPANIES.length - inserted;

    // Update category_tags for any existing companies that don't have them
    const { data: existingWithoutTags } = await supabase
      .from("companies")
      .select("id, slug")
      .or("category_tags.is.null,category_tags.eq.{}");

    if (existingWithoutTags?.length) {
      for (const existing of existingWithoutTags) {
        const seed = COMPANIES.find(c => c.slug === existing.slug);
        if (seed) {
          await supabase
            .from("companies")
            .update({ 
              category_tags: seed.category_tags,
              sub_industry: seed.sub_industry,
              is_startup: seed.is_startup,
              founded_year: seed.founded_year,
              funding_stage: seed.funding_stage,
            })
            .eq("id", existing.id);
        }
      }
    }

    console.log(`[seed-intelligence] DONE: inserted=${inserted}, skipped=${skipped}, errors=${errors.length}`);

    return new Response(JSON.stringify({
      success: true,
      inserted,
      skipped,
      total: COMPANIES.length,
      errors: errors.length > 0 ? errors : undefined,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("[seed-intelligence] Error:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Unknown error",
    }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
