import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CompanyCard } from "@/components/CompanyCard";
import { Button } from "@/components/ui/button";
import { companies, industries } from "@/data/sampleData";

export default function Browse() {
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"name" | "score">("score");

  const filtered = useMemo(() => {
    let list = selectedIndustry
      ? companies.filter((c) => c.industry === selectedIndustry)
      : companies;
    return [...list].sort((a, b) =>
      sortBy === "score"
        ? b.civicFootprintScore - a.civicFootprintScore
        : a.name.localeCompare(b.name)
    );
  }, [selectedIndustry, sortBy]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Company Directory</h1>
          <p className="text-muted-foreground">
            Browse {companies.length} companies and their civic footprint profiles.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-8">
          <Button
            variant={selectedIndustry === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedIndustry(null)}
          >
            All
          </Button>
          {industries.map((ind) => (
            <Button
              key={ind}
              variant={selectedIndustry === ind ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedIndustry(ind)}
            >
              {ind}
            </Button>
          ))}
          <div className="ml-auto flex gap-2">
            <Button
              variant={sortBy === "score" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setSortBy("score")}
            >
              By Footprint
            </Button>
            <Button
              variant={sortBy === "name" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setSortBy("name")}
            >
              A-Z
            </Button>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((company, i) => (
            <motion.div
              key={company.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: i * 0.03 }}
            >
              <CompanyCard company={company} />
            </motion.div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
