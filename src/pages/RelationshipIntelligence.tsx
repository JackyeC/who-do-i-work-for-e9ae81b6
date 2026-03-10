import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { RelationshipDashboard } from "@/components/career/RelationshipDashboard";
import { Badge } from "@/components/ui/badge";
import { Network } from "lucide-react";

export default function RelationshipIntelligence() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center gap-3 mb-2">
          <Network className="w-6 h-6 text-primary" />
          <h1 className="text-heading-2 font-bold text-foreground">Relationship Intelligence</h1>
          <Badge variant="secondary" className="text-xs">Beta</Badge>
        </div>
        <p className="text-body text-muted-foreground mb-8 max-w-2xl">
          Turn your LinkedIn connections into a strategic relationship map connected to the company intelligence database.
        </p>
        <RelationshipDashboard />
      </main>
      <Footer />
    </div>
  );
}
