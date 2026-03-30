// ============================================================
// Source Bias & Factuality Map
// Based on AllSides, Ad Fontes Media, Media Bias/Fact Check,
// and Ground News aggregated ratings.
// ============================================================

export type BiasRating =
  | "Left"
  | "Lean Left"
  | "Center"
  | "Lean Right"
  | "Right"
  | "Unknown";

export type FactualityRating = "High" | "Mixed" | "Low" | "Unknown";

export interface SourceProfile {
  bias: BiasRating;
  factuality: FactualityRating;
}

/**
 * Known source bias ratings.
 * Key = lowercase source name for matching.
 * Compiled from AllSides, Ad Fontes Media, MBFC, and Ground News.
 */
const SOURCE_BIAS_DB: Record<string, SourceProfile> = {
  // -- Left --
  "mother jones": { bias: "Left", factuality: "Mixed" },
  "the nation": { bias: "Left", factuality: "Mixed" },
  "jacobin": { bias: "Left", factuality: "Mixed" },
  "daily kos": { bias: "Left", factuality: "Mixed" },
  "world socialist web site": { bias: "Left", factuality: "Mixed" },

  // -- Lean Left --
  "vox": { bias: "Lean Left", factuality: "High" },
  "cnn": { bias: "Lean Left", factuality: "Mixed" },
  "the new york times": { bias: "Lean Left", factuality: "High" },
  "washington post": { bias: "Lean Left", factuality: "High" },
  "the guardian": { bias: "Lean Left", factuality: "High" },
  "nbc news": { bias: "Lean Left", factuality: "High" },
  "cbs news": { bias: "Lean Left", factuality: "High" },
  "abc news": { bias: "Lean Left", factuality: "High" },
  "politico": { bias: "Lean Left", factuality: "High" },
  "npr": { bias: "Lean Left", factuality: "High" },
  "bloomberg": { bias: "Lean Left", factuality: "High" },
  "fortune": { bias: "Lean Left", factuality: "High" },
  "the motley fool": { bias: "Lean Left", factuality: "High" },
  "indiewire": { bias: "Lean Left", factuality: "High" },
  "techcrunch": { bias: "Lean Left", factuality: "High" },
  "ars technica": { bias: "Lean Left", factuality: "High" },
  "the verge": { bias: "Lean Left", factuality: "High" },
  "wired": { bias: "Lean Left", factuality: "High" },
  "slate": { bias: "Lean Left", factuality: "High" },
  "the atlantic": { bias: "Lean Left", factuality: "High" },
  "insider": { bias: "Lean Left", factuality: "Mixed" },
  "business insider": { bias: "Lean Left", factuality: "Mixed" },
  "huffpost": { bias: "Lean Left", factuality: "Mixed" },
  "cbc news": { bias: "Lean Left", factuality: "High" },

  // -- Center --
  "reuters": { bias: "Center", factuality: "High" },
  "associated press": { bias: "Center", factuality: "High" },
  "ap news": { bias: "Center", factuality: "High" },
  "bbc": { bias: "Center", factuality: "High" },
  "bbc news": { bias: "Center", factuality: "High" },
  "the hill": { bias: "Center", factuality: "High" },
  "usa today": { bias: "Center", factuality: "High" },
  "axios": { bias: "Center", factuality: "High" },
  "marketwatch": { bias: "Center", factuality: "High" },
  "cnbc": { bias: "Center", factuality: "High" },
  "benzinga": { bias: "Center", factuality: "High" },
  "dw (english)": { bias: "Center", factuality: "High" },
  "financial times": { bias: "Center", factuality: "High" },
  "the economist": { bias: "Center", factuality: "High" },
  "pbs": { bias: "Center", factuality: "High" },

  // -- Lean Right --
  "wall street journal": { bias: "Lean Right", factuality: "High" },
  "the wall street journal": { bias: "Lean Right", factuality: "High" },
  "forbes": { bias: "Lean Right", factuality: "High" },
  "reason": { bias: "Lean Right", factuality: "High" },
  "the dispatch": { bias: "Lean Right", factuality: "High" },
  "new york post": { bias: "Lean Right", factuality: "Mixed" },
  "the washington times": { bias: "Lean Right", factuality: "Mixed" },
  "financial post": { bias: "Lean Right", factuality: "High" },
  "hoover.org": { bias: "Lean Right", factuality: "High" },

  // -- Right --
  "fox news": { bias: "Right", factuality: "Mixed" },
  "breitbart news": { bias: "Right", factuality: "Low" },
  "breitbart": { bias: "Right", factuality: "Low" },
  "the daily wire": { bias: "Right", factuality: "Mixed" },
  "the daily caller": { bias: "Right", factuality: "Mixed" },
  "newsmax": { bias: "Right", factuality: "Mixed" },
  "the blaze": { bias: "Right", factuality: "Mixed" },
  "freerepublic.com": { bias: "Right", factuality: "Low" },

  // -- Research / Gov / Data (Center-coded, High factuality) --
  "bureau of labor statistics": { bias: "Center", factuality: "High" },
  "bls": { bias: "Center", factuality: "High" },
  "gallup": { bias: "Center", factuality: "High" },
  "pew research": { bias: "Center", factuality: "High" },
  "nber": { bias: "Center", factuality: "High" },
  "comptia": { bias: "Center", factuality: "High" },
  "adp research": { bias: "Center", factuality: "High" },
  "harvard school of engineering and applied sciences": { bias: "Center", factuality: "High" },
  "plos.org": { bias: "Center", factuality: "High" },

  // -- Government Records & Official Databases --
  "sec edgar": { bias: "Center", factuality: "High" },
  "fec": { bias: "Center", factuality: "High" },
  "openfec": { bias: "Center", factuality: "High" },
  "usaspending": { bias: "Center", factuality: "High" },
  "usaspending.gov": { bias: "Center", factuality: "High" },
  "lda": { bias: "Center", factuality: "High" },
  "lda.gov": { bias: "Center", factuality: "High" },
  "pacer": { bias: "Center", factuality: "High" },
  "courtlistener": { bias: "Center", factuality: "High" },
  "osha": { bias: "Center", factuality: "High" },
  "nlrb": { bias: "Center", factuality: "High" },
  "epa echo": { bias: "Center", factuality: "High" },
  "cfpb": { bias: "Center", factuality: "High" },
  "warn act": { bias: "Center", factuality: "High" },
  "data.gov": { bias: "Center", factuality: "High" },
  "census.gov": { bias: "Center", factuality: "High" },
  "fred": { bias: "Center", factuality: "High" },

  // -- Government Ethics & Disclosure --
  "oge": { bias: "Center", factuality: "High" },
  "office of government ethics": { bias: "Center", factuality: "High" },
  "fara": { bias: "Center", factuality: "High" },
  "foreign agents registration act": { bias: "Center", factuality: "High" },
  "irs form 990": { bias: "Center", factuality: "High" },

  // -- OSINT & Investigation Tools --
  "opensecrets": { bias: "Center", factuality: "High" },
  "opensecrets.org": { bias: "Center", factuality: "High" },
  "opencorporates": { bias: "Center", factuality: "High" },
  "littlesis": { bias: "Center", factuality: "High" },
  "littlesis.org": { bias: "Center", factuality: "High" },
  "propublica": { bias: "Lean Left", factuality: "High" },
  "propublica nonprofit explorer": { bias: "Center", factuality: "High" },
  "bellingcat": { bias: "Center", factuality: "High" },
  "pogo": { bias: "Center", factuality: "High" },
  "project on government oversight": { bias: "Center", factuality: "High" },
  "revolving door project": { bias: "Lean Left", factuality: "High" },
  "legistorm": { bias: "Center", factuality: "High" },
  "candid": { bias: "Center", factuality: "High" },
  "foundation center": { bias: "Center", factuality: "High" },
  "guidestar": { bias: "Center", factuality: "High" },

  // -- Watchdog & Civil Rights Organizations --
  "splc": { bias: "Lean Left", factuality: "High" },
  "southern poverty law center": { bias: "Lean Left", factuality: "High" },
  "adl": { bias: "Center", factuality: "High" },
  "anti-defamation league": { bias: "Center", factuality: "High" },
  "hrc": { bias: "Lean Left", factuality: "High" },
  "human rights campaign": { bias: "Lean Left", factuality: "High" },
  "prri": { bias: "Center", factuality: "High" },
  "public religion research institute": { bias: "Center", factuality: "High" },

  // -- Academic & International Data --
  "world bank": { bias: "Center", factuality: "High" },
  "imf": { bias: "Center", factuality: "High" },
  "oecd": { bias: "Center", factuality: "High" },
  "eurostat": { bias: "Center", factuality: "High" },
  "who": { bias: "Center", factuality: "High" },
  "ipums": { bias: "Center", factuality: "High" },
  "dryad": { bias: "Center", factuality: "High" },
  "dataone": { bias: "Center", factuality: "High" },
  "icpsr": { bias: "Center", factuality: "High" },

  // -- Media Monitoring --
  "gdelt": { bias: "Center", factuality: "High" },
  "newsapi": { bias: "Center", factuality: "Mixed" },
  "ground news": { bias: "Center", factuality: "High" },
  "allsides": { bias: "Center", factuality: "High" },
  "media bias fact check": { bias: "Center", factuality: "High" },
  "ad fontes media": { bias: "Center", factuality: "High" },

  // -- Industry / Trade --
  "globenewswire": { bias: "Center", factuality: "High" },
  "oilprice.com": { bias: "Lean Right", factuality: "Mixed" },
  "digital journal": { bias: "Center", factuality: "Mixed" },
  "livemint": { bias: "Center", factuality: "High" },
  "the times of india": { bias: "Center", factuality: "Mixed" },
  "the indian express": { bias: "Center", factuality: "High" },
  "japan today": { bias: "Center", factuality: "High" },
  "businessline": { bias: "Center", factuality: "High" },
};

/**
 * Look up bias + factuality for a source name.
 * Tries exact match, then lowercase substring matching.
 */
export function getSourceProfile(sourceName: string | null): SourceProfile {
  if (!sourceName) return { bias: "Unknown", factuality: "Unknown" };
  const key = sourceName.toLowerCase().trim();

  // Exact match
  if (SOURCE_BIAS_DB[key]) return SOURCE_BIAS_DB[key];

  // Partial match (e.g. "CBS News" matches "cbs news")
  for (const [dbKey, profile] of Object.entries(SOURCE_BIAS_DB)) {
    if (key.includes(dbKey) || dbKey.includes(key)) return profile;
  }

  return { bias: "Unknown", factuality: "Unknown" };
}

/**
 * Returns a Tailwind color class for the bias label.
 */
export function getBiasColor(bias: BiasRating): string {
  switch (bias) {
    case "Left":       return "text-blue-400";
    case "Lean Left":  return "text-sky-400";
    case "Center":     return "text-emerald-400";
    case "Lean Right": return "text-orange-400";
    case "Right":      return "text-red-400";
    default:           return "text-muted-foreground/50";
  }
}

/**
 * Returns a short label for the bias (for tight ticker display).
 */
export function getBiasShortLabel(bias: BiasRating): string {
  switch (bias) {
    case "Left":       return "L";
    case "Lean Left":  return "LL";
    case "Center":     return "C";
    case "Lean Right": return "LR";
    case "Right":      return "R";
    default:           return "\u2014";
  }
}

/**
 * Returns a Tailwind color class for factuality.
 */
export function getFactualityColor(factuality: FactualityRating): string {
  switch (factuality) {
    case "High":  return "text-emerald-400";
    case "Mixed": return "text-amber-400";
    case "Low":   return "text-red-400";
    default:      return "text-muted-foreground/50";
  }
}
