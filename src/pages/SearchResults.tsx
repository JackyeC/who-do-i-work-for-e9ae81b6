import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CompanyCard } from "@/components/CompanyCard";
import { searchCompanies } from "@/data/sampleData";

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);

  const results = useMemo(() => searchCompanies(initialQuery), [initialQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ q: query.trim() });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 flex-1">
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto flex gap-2 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search companies..."
              className="pl-10 h-11"
            />
          </div>
          <Button type="submit" className="h-11">Search</Button>
        </form>

        {initialQuery && (
          <p className="text-sm text-muted-foreground mb-6">
            {results.length} result{results.length !== 1 ? "s" : ""} for "{initialQuery}"
          </p>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((company) => (
            <CompanyCard key={company.id} company={company} />
          ))}
        </div>

        {results.length === 0 && initialQuery && (
          <div className="text-center py-20">
            <p className="text-lg text-muted-foreground mb-2">No companies found for "{initialQuery}"</p>
            <p className="text-sm text-muted-foreground">
              Try a different search term or browse our directory.
            </p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
