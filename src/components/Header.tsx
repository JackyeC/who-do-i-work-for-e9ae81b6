import { Link } from "react-router-dom";
import { Search, Eye, BookOpen, Briefcase, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

export function Header() {
  const { user } = useAuth();

  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Eye className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground tracking-tight" style={{ fontFamily: "'Source Serif 4', serif" }}>
            CivicLens
          </span>
        </Link>
        <nav className="flex items-center gap-4">
          <Link to="/browse" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Browse
          </Link>
          <Link to="/methodology" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            Methodology
          </Link>
          <Link to="/search" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            <Search className="w-3.5 h-3.5" />
            Search
          </Link>
          <Link to="/add-company" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" />
            Add Company
          </Link>
          <Link to={user ? "/who-do-i-work-for" : "/login"}>
            <Button size="sm" variant="default" className="gap-1.5">
              <Briefcase className="w-3.5 h-3.5" />
              Who Do I Work For?
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
