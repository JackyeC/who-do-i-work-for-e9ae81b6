import { SectionReveal } from "./SectionReveal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "Is my search private?",
    a: "Yes. Searches are not tied to your identity unless you create an account. We don't sell data, and we don't share your activity with employers.",
  },
  {
    q: "Where does the data come from?",
    a: "Every signal comes from public records: FEC filings, Senate lobbying disclosures, USAspending.gov contracts, SEC EDGAR filings, BLS wage data, and more. Every data point links to its source.",
  },
  {
    q: "Is this free?",
    a: "You get 3 free company scans and 1 offer analysis per month. For deeper intelligence, unlimited scans, and advanced features like the influence chain and EVP audit, upgrade to a paid plan.",
  },
  {
    q: "How is this different from Glassdoor?",
    a: "Glassdoor shows employee reviews. We show the financial and political reality: who your employer funds, what they lobby for, how they compare on compensation, and what signals the data reveals.",
  },
  {
    q: "Can my employer see that I searched them?",
    a: "No. Employer searches are anonymous. Companies cannot see who has viewed their intelligence report.",
  },
  {
    q: "How often is the data updated?",
    a: "Federal data (FEC, lobbying, contracts) refreshes as new filings are published. Company profiles are re-scanned regularly, and you can trigger a fresh scan anytime.",
  },
];

export function FAQSection() {
  return (
    <SectionReveal>
      <section className="px-6 lg:px-16 py-16 lg:py-20 max-w-[740px] mx-auto w-full">
        <div className="font-mono text-[9px] tracking-[0.25em] uppercase text-primary mb-3 text-center">
          Common Questions
        </div>
        <h2 className="text-xl lg:text-2xl mb-10 text-foreground text-center">
          Everything you need to know.
        </h2>
        <Accordion type="single" collapsible className="flex flex-col gap-px bg-border border border-border">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="bg-card border-none">
              <AccordionTrigger className="px-6 py-4 font-serif text-[15px] text-foreground hover:no-underline hover:text-primary transition-colors">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4 text-[13px] text-muted-foreground leading-relaxed">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </SectionReveal>
  );
}
