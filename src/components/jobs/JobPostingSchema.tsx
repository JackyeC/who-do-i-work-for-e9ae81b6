import { Helmet } from "react-helmet-async";

interface JobPostingSchemaProps {
  job: {
    id: string;
    title: string;
    description?: string | null;
    location?: string | null;
    work_mode?: string | null;
    salary_range?: string | null;
    employment_type?: string | null;
    created_at: string;
    expires_at?: string | null;
    url?: string | null;
    companies?: {
      name: string;
      slug: string;
      logo_url?: string | null;
      website_url?: string | null;
      description?: string | null;
    };
  };
}

function mapEmploymentType(type?: string | null): string {
  const map: Record<string, string> = {
    "full-time": "FULL_TIME",
    "part-time": "PART_TIME",
    contract: "CONTRACTOR",
    freelance: "CONTRACTOR",
    internship: "INTERN",
    temporary: "TEMPORARY",
  };
  return type ? map[type.toLowerCase()] || "FULL_TIME" : "FULL_TIME";
}

function parseLocationForSchema(location?: string | null, workMode?: string | null) {
  if (workMode === "remote") {
    return {
      jobLocationType: "TELECOMMUTE",
      addressLocality: location || undefined,
    };
  }

  if (!location) return {};

  const parts = location.split(",").map((p) => p.trim());
  return {
    addressLocality: parts[0],
    addressRegion: parts[1],
    addressCountry: parts[2] || "US",
  };
}

export function JobPostingSchema({ job }: JobPostingSchemaProps) {
  const co = job.companies;
  const loc = parseLocationForSchema(job.location, job.work_mode);

  const schema: Record<string, any> = {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    title: job.title,
    description: job.description || `${job.title} at ${co?.name || "Unknown Company"}`,
    datePosted: job.created_at,
    employmentType: mapEmploymentType(job.employment_type),
    hiringOrganization: {
      "@type": "Organization",
      name: co?.name || "Unknown",
      sameAs: co?.website_url || undefined,
      logo: co?.logo_url || undefined,
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        ...loc,
      },
    },
  };

  if (loc.jobLocationType) {
    schema.jobLocationType = loc.jobLocationType;
  }

  if (job.expires_at) {
    schema.validThrough = job.expires_at;
  }

  if (job.salary_range) {
    // Attempt to parse salary range like "$80,000 - $120,000" or "$80k-$120k"
    const salaryMatch = job.salary_range.match(/\$?([\d,]+k?)\s*[-–]\s*\$?([\d,]+k?)/i);
    if (salaryMatch) {
      const parseSalary = (s: string) => {
        const num = parseFloat(s.replace(/[,$]/g, ""));
        return s.toLowerCase().includes("k") ? num * 1000 : num;
      };
      schema.baseSalary = {
        "@type": "MonetaryAmount",
        currency: "USD",
        value: {
          "@type": "QuantitativeValue",
          minValue: parseSalary(salaryMatch[1]),
          maxValue: parseSalary(salaryMatch[2]),
          unitText: "YEAR",
        },
      };
    }
  }

  if (job.url) {
    schema.directApply = true;
    schema.url = job.url;
  }

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}
