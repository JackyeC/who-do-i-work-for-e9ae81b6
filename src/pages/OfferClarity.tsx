import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { OfferClarityWizard } from "@/components/offer-clarity/OfferClarityWizard";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck } from "lucide-react";

export default function OfferClarity() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <Badge variant="outline" className="mb-3 text-xs gap-1.5">
            <ShieldCheck className="w-3 h-3" /> Offer Check™
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-3">
            Is this offer actually good?
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Answer a few quick questions. The system evaluates five areas that determine whether an offer is strong, risky, or misaligned — and produces an <span className="font-semibold text-foreground">Offer Clarity Score (0–100)</span>.
          </p>
        </div>
        <OfferClarityWizard />
      </main>
      <Footer />
    </div>
  );
}
