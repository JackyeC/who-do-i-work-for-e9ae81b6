import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface TOCItem {
  id: string;
  label: string;
}

const sections: TOCItem[] = [
  { id: "receipts-framework", label: "The Receipts Framework" },
  { id: "source-hierarchy", label: "Source Hierarchy" },
  { id: "revolving-door", label: "Revolving Door & Influence" },
  { id: "extremism-affiliation", label: "Extremism & Affiliation" },
  { id: "evidence-quality", label: "Evidence Quality Scoring" },
  { id: "entity-resolution", label: "Entity Resolution" },
  { id: "verification-badges", label: "Verification Badges" },
  { id: "media-bias", label: "Media Bias Transparency" },
  { id: "refresh-cadence", label: "Refresh Cadence" },
  { id: "employer-clarity", label: "Employer Clarity Score" },
  { id: "known-limitations", label: "Known Limitations" },
  { id: "corrections-disputes", label: "Corrections & Disputes" },
  { id: "our-standard", label: "Our Standard" },
];

export default function MethodologyTOC() {
  const [activeId, setActiveId] = useState<string>(sections[0].id);

  const onScroll = useCallback(() => {
    const scrollY = window.scrollY + 120; // offset for sticky nav
    let current = sections[0].id;

    for (const section of sections) {
      const el = document.getElementById(section.id);
      if (el && el.offsetTop <= scrollY) {
        current = section.id;
      }
    }
    setActiveId(current);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [onScroll]);

  const handleClick = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const offset = 80;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <nav className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2">
      <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-primary mb-3">
        On this page
      </p>
      <ul className="space-y-1">
        {sections.map((item) => (
          <li key={item.id}>
            <button
              onClick={() => handleClick(item.id)}
              className={cn(
                "w-full text-left text-xs leading-relaxed px-2 py-1.5 rounded-md transition-colors duration-200",
                activeId === item.id
                  ? "text-foreground bg-primary/10 font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
