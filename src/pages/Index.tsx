import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Eye, Shield, BookOpen, Building2, TrendingUp, Scale } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CompanyCard } from "@/components/CompanyCard";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { companies } from "@/data/sampleData";

const Index = () => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const featured = companies.slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="container mx-auto px-4 pt-20 pb-16 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-4 py-1.5 rounded-full mb-6">
              <Scale className="w-3.5 h-3.5" />
              Public data. Informed decisions.
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
              See where a company's money and influence go{" "}
              <span className="text-primary">before</span> you decide to work there, buy there, or back them
            </h1>
            <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
              Search public data on political spending, executive donations, lobbying, and influence networks 
              so you can make clearer decisions with your eyes open.
            </p>

            <form onSubmit={handleSearch} className="max-w-xl mx-auto flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search any company (e.g., Home Depot, Walmart)..."
                  className="pl-10 h-12 text-base"
                />
              </div>
              <Button type="submit" size="lg" className="h-12 px-6">
                Search
              </Button>
            </form>

            <p className="mt-4 text-sm text-muted-foreground">
              Currently tracking {companies.length} companies · Data from FEC, OpenSecrets &amp; public filings
            </p>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-foreground text-center mb-10">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {[
            { icon: Search, title: "Search a Company", desc: "Type any company name to see their political activity, lobbying, and influence network." },
            { icon: Eye, title: "Follow the Money", desc: "View PAC spending, executive donations, trade group memberships, lobbying, and flagged affiliations — each clearly labeled by type." },
            { icon: Shield, title: "Make Informed Choices", desc: "Compare public stances against actual spending. Decide if a company's civic footprint aligns with your values." },
          ].map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.15 }}
              className="text-center"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <step.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2 text-lg">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* What We Track */}
      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-foreground text-center mb-3">What We Track</h2>
          <p className="text-muted-foreground text-center mb-10 max-w-xl mx-auto">
            Not all money is the same. We separate types of influence so the picture stays honest.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {[
              { label: "Corporate PAC", desc: "Company-organized political action committee donations to candidates" },
              { label: "Executive Personal Giving", desc: "C-suite and board members' individual political contributions" },
              { label: "Lobbying", desc: "Corporate spending to influence legislation and regulation" },
              { label: "Trade Associations", desc: "Membership in industry groups that lobby on their behalf" },
              { label: "Flagged Org Ties", desc: "Connections to organizations flagged by civil rights watchdogs" },
              { label: "Public Stance vs. Spending", desc: "Where marketing language and money trail diverge" },
            ].map((item) => (
              <div key={item.label} className="bg-card rounded-lg border border-border p-4">
                <div className="font-medium text-foreground text-sm mb-1">{item.label}</div>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Companies */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Featured Companies</h2>
            <p className="text-sm text-muted-foreground mt-1">Recently updated profiles</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/browse")}>
            View All
          </Button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featured.map((company) => (
            <CompanyCard key={company.id} company={company} />
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            {[
              { value: companies.length, label: "Companies Tracked" },
              { value: "$100M+", label: "Political Spending Tracked" },
              { value: "2026", label: "Election Cycle Data" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl font-bold mb-1">{stat.value}</div>
                <div className="text-primary-foreground/70 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Methodology CTA */}
      <section className="container mx-auto px-4 py-16 text-center">
        <BookOpen className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-foreground mb-3">Transparent About Transparency</h2>
        <p className="text-muted-foreground max-w-lg mx-auto mb-6">
          We publish our methodology, data sources, and confidence ratings. Every claim is labeled as direct, inferred, or unverified.
        </p>
        <Button variant="outline" onClick={() => navigate("/methodology")}>
          Read Our Methodology
        </Button>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
