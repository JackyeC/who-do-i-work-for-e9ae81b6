/**
 * Entity Resolution for People
 * 
 * Merges duplicate identities across executive, board, and contribution records
 * using name normalization, nickname expansion, and fuzzy matching.
 */

// Re-export nickname map from executive-utils pattern
const NICKNAME_MAP: Record<string, string> = {
  steve: "steven", bob: "robert", rob: "robert", bill: "william", will: "william",
  willie: "william", mike: "michael", mick: "michael", mickey: "michael",
  dave: "david", dan: "daniel", danny: "daniel", jim: "james", jimmy: "james",
  jamie: "james", joe: "joseph", joey: "joseph", tom: "thomas", tommy: "thomas",
  chris: "christopher", chuck: "charles", charlie: "charles", dick: "richard",
  rick: "richard", rich: "richard", ricky: "richard", nick: "nicholas",
  nicky: "nicholas", sam: "samuel", sammy: "samuel", andy: "andrew", drew: "andrew",
  tony: "anthony", ant: "anthony", matt: "matthew", matty: "matthew",
  pat: "patrick", paddy: "patrick", ted: "edward", ed: "edward", eddie: "edward",
  ned: "edward", jeff: "jeffrey", geoff: "geoffrey", greg: "gregory",
  ken: "kenneth", kenny: "kenneth", larry: "lawrence", len: "leonard",
  lenny: "leonard", pete: "peter", petey: "peter", phil: "philip",
  ron: "ronald", ronny: "ronald", tim: "timothy", timmy: "timothy",
  walt: "walter", wally: "walter", ben: "benjamin", benny: "benjamin",
  brad: "bradley", bret: "brett", don: "donald", donny: "donald",
  doug: "douglas", fred: "frederick", freddy: "frederick", hal: "harold",
  harry: "harold", hank: "henry", jack: "john", jake: "jacob", jay: "jason",
  jon: "jonathan", josh: "joshua",
  kate: "katherine", kathy: "katherine", katie: "katherine", kat: "katherine",
  sue: "susan", susie: "susan", liz: "elizabeth", beth: "elizabeth",
  betty: "elizabeth", lisa: "elizabeth", jen: "jennifer", jenny: "jennifer",
  jenn: "jennifer", meg: "margaret", maggie: "margaret", marge: "margaret",
  margie: "margaret", peg: "margaret", peggy: "margaret", nan: "nancy",
  barb: "barbara", bev: "beverly", carol: "caroline", carrie: "caroline",
  deb: "deborah", debbie: "deborah", dot: "dorothy", dottie: "dorothy",
  fran: "frances", frankie: "frances", abby: "abigail", jan: "janet",
  jo: "joanne", joanie: "joanne", judy: "judith", judi: "judith",
  lyn: "linda", lynda: "linda", lindy: "linda", patty: "patricia",
  tricia: "patricia", trish: "patricia", penny: "penelope", pam: "pamela",
  sandy: "sandra", sandi: "sandra", sherry: "sharon", steph: "stephanie",
  terri: "theresa", terry: "theresa", tess: "theresa", vicky: "victoria",
};

/* ─── Types ─── */
export type MergeConfidence = "high" | "medium" | "low";

export interface RawPersonRecord {
  id?: string;
  name: string;
  title: string;
  donations: number;
  source: "executive" | "board" | "candidate";
  photo_url?: string | null;
  is_independent?: boolean;
  committees?: string[] | null;
  party?: string;
  state?: string;
  verification_status?: string | null;
  departed_at?: string | null;
}

export interface ResolvedEntity {
  canonicalName: string;
  displayName: string;
  primaryId: string;
  title: string; // most senior / most recent
  totalDonations: number;
  contributionCount: number;
  source: "executive" | "board" | "candidate";
  photo_url: string | null;
  is_independent: boolean;
  committees: string[];
  mergedRecords: RawPersonRecord[];
  mergeConfidence: MergeConfidence;
  matchKey: string; // normalized key used for matching
}

/* ─── Name Parsing ─── */

interface ParsedName {
  first: string;        // canonical first name (nickname-resolved)
  rawFirst: string;     // original first name before nickname resolution
  last: string;
  middle: string | null; // middle name or initial
  suffix: string | null; // Jr, Sr, III, etc.
  full: string;         // original full name
}

const SUFFIX_RE = /\b(JR|SR|II|III|IV|V|ESQ|PHD|MD)\b\.?/gi;

function parseName(raw: string): ParsedName {
  // Handle "LAST, FIRST MIDDLE" format
  let normalized = raw.trim();
  let parts: string[];

  if (normalized.includes(",")) {
    const [lastPart, ...rest] = normalized.split(",").map(s => s.trim());
    const firstParts = rest.join(" ").trim();
    normalized = `${firstParts} ${lastPart}`;
  }

  // Remove suffixes
  let suffix: string | null = null;
  const suffixMatch = normalized.match(SUFFIX_RE);
  if (suffixMatch) {
    suffix = suffixMatch[0].replace(".", "").toUpperCase();
    normalized = normalized.replace(SUFFIX_RE, "").trim();
  }

  // Remove punctuation, normalize spaces
  normalized = normalized
    .replace(/[.]/g, "")
    .replace(/[-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  parts = normalized.split(" ").filter(Boolean);

  if (parts.length === 0) {
    return { first: "", rawFirst: "", last: "", middle: null, suffix, full: raw };
  }

  const rawFirst = parts[0].toLowerCase();
  const first = NICKNAME_MAP[rawFirst] || rawFirst;
  const last = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";

  // Middle: everything between first and last
  let middle: string | null = null;
  if (parts.length > 2) {
    const middleParts = parts.slice(1, -1);
    middle = middleParts.map(p => p.toLowerCase()).join(" ");
  }

  return { first, rawFirst, last, middle, suffix, full: raw };
}

/* ─── Match Key Generation ─── */

function matchKey(parsed: ParsedName): string {
  // Key: canonical_first + last — middle is optional for matching
  return `${parsed.first}|${parsed.last}`;
}

/* ─── Similarity (for fuzzy edge cases) ─── */

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] = b[i - 1] === a[j - 1]
        ? matrix[i - 1][j - 1]
        : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
    }
  }
  return matrix[b.length][a.length];
}

function nameSimilarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

/* ─── Canonical Display Name ─── */

function toTitleCase(s: string): string {
  return s.replace(/\b\w/g, c => c.toUpperCase());
}

function buildCanonicalDisplayName(records: RawPersonRecord[], parsed: ParsedName[]): string {
  // Pick the most complete name (longest middle, has suffix)
  let best = parsed[0];
  let bestScore = 0;

  for (const p of parsed) {
    let score = 0;
    if (p.middle) score += p.middle.length > 1 ? 3 : 2; // full middle > initial
    if (p.suffix) score += 1;
    if (p.rawFirst.length > (best.rawFirst?.length || 0)) score += 1; // prefer longer first name
    if (score > bestScore) {
      bestScore = score;
      best = p;
    }
  }

  const parts: string[] = [];
  parts.push(toTitleCase(best.rawFirst.length > best.first.length ? best.rawFirst : best.first));
  if (best.middle) {
    // If it's a single letter, show as initial with period
    parts.push(best.middle.length === 1 ? `${best.middle.toUpperCase()}.` : toTitleCase(best.middle));
  }
  parts.push(toTitleCase(best.last));
  if (best.suffix) parts.push(best.suffix);

  return parts.join(" ");
}

/* ─── Title Ranking (pick most senior) ─── */

const TITLE_RANK: [RegExp, number][] = [
  [/\b(CEO|Chief\s*Executive)\b/i, 0],
  [/\bPresident\b/i, 1],
  [/\b(COO|Chief\s*Operating)\b/i, 2],
  [/\b(CFO|Chief\s*Financial)\b/i, 3],
  [/\bChief\b/i, 4],
  [/\b(SVP|EVP|Senior\s*Vice\s*President|Executive\s*Vice\s*President)\b/i, 5],
  [/\b(VP|Vice\s*President)\b/i, 6],
  [/\bChair(man|woman|person)?\b/i, 1],
  [/\bDirector\b/i, 7],
];

function titleRank(title: string): number {
  for (const [re, rank] of TITLE_RANK) {
    if (re.test(title)) return rank;
  }
  return 99;
}

function pickBestTitle(records: RawPersonRecord[]): string {
  return records.reduce((best, r) => {
    return titleRank(r.title) < titleRank(best) ? r.title : best;
  }, records[0].title);
}

/* ─── Merge Confidence ─── */

function computeConfidence(records: RawPersonRecord[], parsed: ParsedName[]): MergeConfidence {
  if (records.length === 1) return "high"; // no merge needed

  // Check if all names have identical first+last after nickname resolution
  const keys = new Set(parsed.map(matchKey));
  if (keys.size > 1) return "low"; // shouldn't happen — but safety check

  // Check if raw first names are identical or nickname-mapped
  const rawFirsts = new Set(parsed.map(p => p.rawFirst));
  if (rawFirsts.size === 1) return "high"; // exact same first name

  // Check if all raw firsts resolve to same canonical
  const canonFirsts = new Set(parsed.map(p => p.first));
  if (canonFirsts.size === 1) {
    // Are the raw names very similar? (e.g., Tim vs Timothy)
    const firsts = [...rawFirsts];
    for (let i = 0; i < firsts.length; i++) {
      for (let j = i + 1; j < firsts.length; j++) {
        const sim = nameSimilarity(firsts[i], firsts[j]);
        if (sim < 0.5) return "medium"; // quite different raw forms
      }
    }
    return "high"; // nickname match, close forms
  }

  return "medium";
}

/* ═══ MAIN RESOLVER ═══ */

export function resolveEntities(records: RawPersonRecord[]): ResolvedEntity[] {
  // Filter out departed/former
  const active = records.filter(r => {
    if (r.departed_at) return false;
    if (r.verification_status === "former") return false;
    return true;
  });

  // Parse all names
  const withParsed = active.map(r => ({ record: r, parsed: parseName(r.name) }));

  // Group by match key
  const groups = new Map<string, { records: RawPersonRecord[]; parsed: ParsedName[] }>();

  for (const { record, parsed } of withParsed) {
    const key = matchKey(parsed);
    if (!key || key === "|") continue; // skip unparseable

    const existing = groups.get(key);
    if (existing) {
      existing.records.push(record);
      existing.parsed.push(parsed);
    } else {
      groups.set(key, { records: [record], parsed: [parsed] });
    }
  }

  // Try fuzzy merge across groups with similar keys
  const groupKeys = [...groups.keys()];
  const mergedInto = new Map<string, string>(); // key → merged-into key

  for (let i = 0; i < groupKeys.length; i++) {
    for (let j = i + 1; j < groupKeys.length; j++) {
      const a = groupKeys[i];
      const b = groupKeys[j];
      if (mergedInto.has(a) || mergedInto.has(b)) continue;

      const [aFirst, aLast] = a.split("|");
      const [bFirst, bLast] = b.split("|");

      // Last names must match exactly
      if (aLast !== bLast) continue;

      // Check first name similarity (for typos etc.)
      const sim = nameSimilarity(aFirst, bFirst);
      if (sim >= 0.9) {
        // Merge b into a
        const groupA = groups.get(a)!;
        const groupB = groups.get(b)!;
        groupA.records.push(...groupB.records);
        groupA.parsed.push(...groupB.parsed);
        mergedInto.set(b, a);
      }
    }
  }

  // Remove merged groups
  for (const key of mergedInto.keys()) {
    groups.delete(key);
  }

  // Build resolved entities
  const entities: ResolvedEntity[] = [];

  for (const [key, { records: recs, parsed }] of groups) {
    const canonicalName = buildCanonicalDisplayName(recs, parsed);
    const title = pickBestTitle(recs);
    const totalDonations = recs.reduce((s, r) => s + (r.donations || 0), 0);
    const contributionCount = recs.filter(r => r.donations > 0).length;
    const confidence = computeConfidence(recs, parsed);

    // Pick primary source: executive > board > candidate
    const source = recs.find(r => r.source === "executive")?.source
      || recs.find(r => r.source === "board")?.source
      || "candidate";

    // Pick best photo
    const photo = recs.find(r => r.photo_url)?.photo_url || null;

    // Merge committees
    const allCommittees = recs.flatMap(r => r.committees || []);
    const uniqueCommittees = [...new Set(allCommittees)];

    // Independent flag
    const isIndependent = recs.some(r => r.is_independent);

    // Primary ID: prefer executive ID, then board ID
    const primaryId = recs.find(r => r.source === "executive" && r.id)?.id
      || recs.find(r => r.source === "board" && r.id)?.id
      || recs[0].id
      || key;

    entities.push({
      canonicalName,
      displayName: canonicalName,
      primaryId,
      title,
      totalDonations,
      contributionCount,
      source: source as "executive" | "board" | "candidate",
      photo_url: photo,
      is_independent: isIndependent,
      committees: uniqueCommittees,
      mergedRecords: recs,
      mergeConfidence: confidence,
      matchKey: key,
    });
  }

  // Sort by total donations desc, then by title rank
  return entities.sort((a, b) => {
    if (b.totalDonations !== a.totalDonations) return b.totalDonations - a.totalDonations;
    return titleRank(a.title) - titleRank(b.title);
  });
}
