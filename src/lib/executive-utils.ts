/**
 * Shared utilities for deduplicating, filtering, and sorting
 * executive and board member records in the display layer.
 *
 * ⚠️ Display-layer only — does NOT modify data pipelines or scoring.
 */

// ── Nickname mapping ──

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
  // Female nicknames
  kate: "katherine", kathy: "katherine", katie: "katherine", kat: "katherine",
  sue: "susan", susie: "susan", liz: "elizabeth", beth: "elizabeth",
  betty: "elizabeth", lisa: "elizabeth", jen: "jennifer", jenny: "jennifer",
  jenn: "jennifer", meg: "margaret", maggie: "margaret", marge: "margaret",
  margie: "margaret", peg: "margaret", peggy: "margaret", nan: "nancy",
  nance: "nancy", barb: "barbara", bev: "beverly", carol: "caroline",
  carrie: "caroline", deb: "deborah", debbie: "deborah", dee: "diana",
  di: "diana", dot: "dorothy", dottie: "dorothy", fran: "frances",
  frankie: "frances", gail: "abigail", abby: "abigail", jan: "janet",
  janie: "jane", jo: "joanne", joanie: "joanne", judy: "judith", judi: "judith",
  lyn: "linda", lynda: "linda", lindy: "linda", patty: "patricia",
  tricia: "patricia", trish: "patricia", penny: "penelope", pam: "pamela",
  pammy: "pamela", sandy: "sandra", sandi: "sandra", sherry: "sharon",
  sheri: "sharon", sherri: "sharon", steph: "stephanie", stevie: "stephanie",
  terri: "theresa", terry: "theresa", tess: "theresa", vicky: "victoria",
  vic: "victoria", vikki: "victoria",
};

// ── Known departures (temporary overrides until data pipeline catches up) ──

const KNOWN_DEPARTURES: string[] = [
  "amazon|steven kissel",
];

// ── Name normalization ──

function normalizeFirstName(firstName: string): string {
  return NICKNAME_MAP[firstName] || firstName;
}

function normalizeName(name: string): string {
  const parts = name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[.,]/g, "")
    .replace(/\b(jr|sr|ii|iii|iv)\b/g, "")
    .trim()
    .split(" ")
    .filter(Boolean);

  if (parts.length === 0) return name.toLowerCase();

  parts[0] = normalizeFirstName(parts[0]);
  return parts.join(" ");
}

// ── Completeness scoring ──

function scoreCompleteness(person: Record<string, unknown>): number {
  let score = 0;
  const fields = [
    "title", "bio", "photo_url", "committees",
    "previous_company", "start_year", "total_donations",
    "is_independent", "verification_status", "source",
  ];
  for (const f of fields) {
    const v = person[f];
    if (v !== null && v !== undefined && v !== "" && v !== 0) score++;
  }
  return score;
}

// ── Deduplication ──

export function deduplicatePeople<T extends { name: string }>(people: T[]): T[] {
  const seen = new Map<string, { index: number; person: T }>();
  const result: T[] = [];

  for (const person of people) {
    const key = normalizeName(person.name);
    const existing = seen.get(key);

    if (existing) {
      if (scoreCompleteness(person as any) > scoreCompleteness(existing.person as any)) {
        result[existing.index] = person;
        seen.set(key, { index: existing.index, person });
      }
    } else {
      seen.set(key, { index: result.length, person });
      result.push(person);
    }
  }

  return result;
}

// ── Current-member filter ──

export function isCurrentMember(person: Record<string, unknown>): boolean {
  if (person.departed_at) return false;
  if (person.end_date) return false;

  const status = (person.verification_status || person.status || "") as string;
  if (["former", "departed", "resigned", "terminated"].includes(status.toLowerCase())) return false;

  const endYear = person.end_year as number | undefined;
  if (endYear && endYear < new Date().getFullYear()) return false;

  const title = (person.title || "") as string;
  if (/\bformer\b/i.test(title)) return false;
  if (/\bex-/i.test(title)) return false;

  return true;
}

// ── Known departure check ──

export function isKnownDeparture(person: { name: string }, companyName: string): boolean {
  const key = `${companyName.toLowerCase()}|${normalizeName(person.name)}`;
  return KNOWN_DEPARTURES.includes(key);
}

// ── Executive sort ──

const EXEC_RANK: [RegExp, number][] = [
  [/\b(CEO|Chief\s*Executive\s*Officer)\b/i, 0],
  [/\bPresident\b/i, 1],
  [/\b(COO|Chief\s*Operating\s*Officer)\b/i, 2],
  [/\b(CFO|Chief\s*Financial\s*Officer)\b/i, 3],
  [/\b(CHRO|Chief\s*(People|Human\s*Resources?|HR)\s*Officer)\b/i, 4],
  [/\b(CTO|Chief\s*Technology\s*Officer)\b/i, 5],
  [/\b(CMO|Chief\s*Marketing\s*Officer)\b/i, 6],
  [/\b(CLO|Chief\s*Legal\s*Officer|General\s*Counsel)\b/i, 7],
  [/\bChief\b/i, 8],
  [/\b(SVP|EVP|Senior\s*Vice\s*President|Executive\s*Vice\s*President)\b/i, 9],
  [/\b(VP|Vice\s*President)\b/i, 10],
];

function execRank(title: string): number {
  for (const [re, rank] of EXEC_RANK) {
    if (re.test(title)) return rank;
  }
  return 11;
}

function lastName(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (parts[parts.length - 1] || "").toLowerCase();
}

export function sortExecutives<T extends { name: string; title: string }>(execs: T[]): T[] {
  return [...execs].sort((a, b) => {
    const ra = execRank(a.title);
    const rb = execRank(b.title);
    if (ra !== rb) return ra - rb;
    return lastName(a.name).localeCompare(lastName(b.name));
  });
}

// ── Board member sort ──

function boardRank(title: string): number {
  if (/\b(Chair(man|woman|person)?)\b/i.test(title) && !/\bLead\b/i.test(title)) return 0;
  if (/\bLead\s*(Independent)?\s*Director\b/i.test(title)) return 1;
  return 2;
}

export function sortBoardMembers<T extends { name: string; title: string }>(members: T[]): T[] {
  return [...members].sort((a, b) => {
    const ra = boardRank(a.title);
    const rb = boardRank(b.title);
    if (ra !== rb) return ra - rb;
    return lastName(a.name).localeCompare(lastName(b.name));
  });
}

// ── Full pipeline ──

export function processExecutives<T extends { name: string; title: string }>(raw: T[], companyName?: string): T[] {
  const filtered = companyName
    ? raw.filter(p => !isKnownDeparture(p, companyName))
    : raw;
  const current = filtered.filter(p => isCurrentMember(p as any));
  const deduped = deduplicatePeople(current);
  return sortExecutives(deduped);
}

export function processBoardMembers<T extends { name: string; title: string }>(raw: T[], companyName?: string): T[] {
  const filtered = companyName
    ? raw.filter(p => !isKnownDeparture(p, companyName))
    : raw;
  const current = filtered.filter(p => isCurrentMember(p as any));
  const deduped = deduplicatePeople(current);
  return sortBoardMembers(deduped);
}
