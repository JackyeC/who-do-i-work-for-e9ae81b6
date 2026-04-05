/**
 * DossierSEOContent — Crawlable text block for company dossier pages.
 * Provides structured, indexable content for Google and AI systems
 * WITHOUT changing visible UX (minimal, non-intrusive bottom section).
 */
import { useEffect } from "react";

interface DossierSEOContentProps {
  company: {
    name: string;
    slug: string;
    industry: string;
    state: string;
    description?: string | null;
    employee_count?: string | null;
    civic_footprint_score: number;
    employer_clarity_score?: number | null;
    total_pac_spending?: number;
    lobbying_spend?: number | null;
    government_contracts?: number | null;
    corporate_pac_exists?: boolean;
    is_publicly_traded?: boolean | null;
    parent_company?: string | null;
  };
  eeocCount: number;
  executiveCount: number;
  lobbyingCount: number;
  contractCount: number;
}

export function DossierSEOContent({
  company,
  eeocCount,
  executiveCount,
  lobbyingCount,
  contractCount,
}: DossierSEOContentProps) {
  const name = company.name;
  const hasPAC = company.corporate_pac_exists || (company.total_pac_spending ?? 0) > 0;
  const lobbyingSpend = company.lobbying_spend ?? 0;
  const pacSpend = company.total_pac_spending ?? 0;

  // Inject JSON-LD structured data
  useEffect(() => {
    const existing = document.querySelector('script[data-dossier-ld]');
    if (existing) existing.remove();

    const faqItems = buildFAQ(company, eeocCount, executiveCount, hasPAC, lobbyingSpend);

    const jsonLd = [
      // Organization schema
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: company.name,
        description: company.description || `${company.name} is a ${company.industry} company based in ${company.state}.`,
        ...(company.employee_count ? { numberOfEmployees: { "@type": "QuantitativeValue", value: company.employee_count } } : {}),
        address: { "@type": "PostalAddress", addressRegion: company.state, addressCountry: "US" },
      },
      // FAQ schema
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqItems.map(faq => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
      },
      // Article/Analysis schema
      {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: `Who Do You Really Work For at ${company.name}?`,
        description: `Employer intelligence report for ${company.name}: leadership influence, political spending, workplace signals, and compensation transparency from public records.`,
        author: { "@type": "Person", name: "Jackye Clayton" },
        publisher: { "@type": "Organization", name: "Who Do I Work For?" },
        url: `https://who-do-i-work-for.lovable.app/dossier/${company.slug}`,
        about: { "@type": "Organization", name: company.name },
      },
      // BreadcrumbList schema
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://who-do-i-work-for.lovable.app/" },
          { "@type": "ListItem", position: 2, name: "Browse Companies", item: "https://who-do-i-work-for.lovable.app/browse" },
          { "@type": "ListItem", position: 3, name: company.name, item: `https://who-do-i-work-for.lovable.app/dossier/${company.slug}` },
        ],
      },
    ];

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute("data-dossier-ld", "true");
    script.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(script);

    return () => {
      const el = document.querySelector('script[data-dossier-ld]');
      if (el) el.remove();
    };
  }, [company.slug]);

  const faqItems = buildFAQ(company, eeocCount, executiveCount, hasPAC, lobbyingSpend);

  return (
    <div className="mt-8 pt-6 border-t border-border/20 space-y-6">
      {/* H1 for crawlers — visually subtle */}
      <h1 className="text-lg font-semibold text-foreground">
        Who Do You Really Work For at {name}?
      </h1>
      <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
        This employer intelligence report compiles public records on {name}, including
        leadership structure, political spending, labor compliance, and workplace signals.
        {company.industry && ` ${name} operates in the ${company.industry} sector`}
        {company.state && ` with operations in ${company.state}`}.
        All data is sourced from FEC, SEC, OSHA, NLRB, BLS, USASpending.gov, and other
        government databases.
      </p>

      {/* Structured text sections */}
      <div className="grid gap-4 text-sm text-muted-foreground">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1">
            Ownership & Leadership Influence
          </h2>
          <p className="leading-relaxed">
            {executiveCount > 0
              ? `${name} has ${executiveCount} executive(s) and board members on public record.`
              : `Executive leadership data for ${name} is being compiled from public filings.`}
            {company.is_publicly_traded && ` ${name} is publicly traded, with proxy statements and SEC filings available for review.`}
            {company.parent_company && ` ${name} operates as a subsidiary of ${company.parent_company}.`}
          </p>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1">
            Political & Financial Signals
          </h2>
          <p className="leading-relaxed">
            {hasPAC
              ? `${name} maintains a corporate PAC with $${pacSpend.toLocaleString()} in documented political spending.`
              : `No corporate PAC activity has been identified for ${name} in FEC records.`}
            {lobbyingSpend > 0 && ` Lobbying expenditures total $${lobbyingSpend.toLocaleString()} across ${lobbyingCount} linked filing(s).`}
            {contractCount > 0 && ` ${name} holds ${contractCount} federal contract(s) tracked via USASpending.gov.`}
          </p>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1">
            Workforce & Hiring Patterns
          </h2>
          <p className="leading-relaxed">
            {company.employee_count
              ? `${name} employs approximately ${company.employee_count} workers.`
              : `Workforce size data for ${name} is sourced from public disclosures.`}
            {` Hiring patterns, WARN Act filings, and workforce composition signals are monitored continuously.`}
          </p>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1">
            Employee Sentiment Signals
          </h2>
          <p className="leading-relaxed">
            {eeocCount > 0
              ? `${eeocCount} EEOC case(s) involving ${name} appear in public records.`
              : `No EEOC cases involving ${name} were found in current public filings.`}
            {` Sentiment signals are aggregated from regulatory databases and public disclosures — not anonymous reviews.`}
          </p>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1">
            Compensation & Transparency Signals
          </h2>
          <p className="leading-relaxed">
            {company.employer_clarity_score != null
              ? `${name} scores ${company.employer_clarity_score}/100 on employer transparency, measured across public disclosure depth and data availability.`
              : `Transparency scoring for ${name} is based on the breadth of publicly available employer data.`}
            {` Compensation benchmarks are sourced from BLS wage data and SEC proxy filings where available.`}
          </p>
        </div>
      </div>

      {/* Quick Answers for GEO */}
      <div className="pt-4 border-t border-border/10">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mb-3">
          Quick Answers
        </h2>
        <div className="space-y-3">
          {faqItems.map((faq, i) => (
            <div key={i}>
              <p className="text-sm font-medium text-foreground">{faq.question}</p>
              <p className="text-sm text-muted-foreground leading-relaxed mt-0.5">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function buildFAQ(
  company: DossierSEOContentProps["company"],
  eeocCount: number,
  executiveCount: number,
  hasPAC: boolean,
  lobbyingSpend: number,
) {
  const name = company.name;
  return [
    {
      question: `Is ${name} a good place to work?`,
      answer: `${name} has a civic footprint score of ${company.civic_footprint_score}/100 based on public records including labor compliance, political spending, and workplace transparency. ${eeocCount > 0 ? `There are ${eeocCount} EEOC case(s) on file.` : "No EEOC cases were found in current filings."} Review the full intelligence report for detailed signals.`,
    },
    {
      question: `Who influences decisions at ${name}?`,
      answer: `${executiveCount > 0 ? `${executiveCount} executive(s) and board members are tracked from public filings.` : "Executive data is being compiled from SEC and corporate disclosures."} ${hasPAC ? `The company maintains an active corporate PAC.` : "No corporate PAC activity was found in FEC records."} ${lobbyingSpend > 0 ? `Lobbying spend totals $${lobbyingSpend.toLocaleString()}.` : ""}`,
    },
    {
      question: `What should candidates know about ${name}?`,
      answer: `Before applying to ${name}, review leadership stability, political spending patterns, and labor compliance history. This report aggregates signals from FEC, SEC, OSHA, NLRB, and BLS — public records that reveal employer behavior beyond the careers page.`,
    },
    {
      question: `Does ${name} have political spending?`,
      answer: hasPAC
        ? `Yes. ${name} has $${(company.total_pac_spending ?? 0).toLocaleString()} in documented PAC spending on file with the FEC.${lobbyingSpend > 0 ? ` Additionally, $${lobbyingSpend.toLocaleString()} in lobbying expenditures are recorded.` : ""}`
        : `No corporate PAC activity was identified for ${name} in current FEC filings.${lobbyingSpend > 0 ? ` However, $${lobbyingSpend.toLocaleString()} in lobbying expenditures are on record.` : ""}`,
    },
    {
      question: `How transparent is ${name} as an employer?`,
      answer: company.employer_clarity_score != null
        ? `${name} scores ${company.employer_clarity_score}/100 on employer transparency, based on the depth and availability of public records across government databases. A higher score indicates more comprehensive public disclosure.`
        : `Transparency scoring for ${name} is calculated from the breadth of available public records across FEC, SEC, OSHA, NLRB, and BLS databases.`,
    },
  ];
}
