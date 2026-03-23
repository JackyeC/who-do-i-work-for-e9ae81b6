import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { MAIN_SECTIONS } from "./TopBar";

function isSubItemActive(subPath: string, pathname: string, search: string) {
  const [base, qs] = subPath.split("?");
  if (qs) return pathname === base && search.includes(qs);
  return pathname === base;
}

export function ContextSidebar() {
  const location = useLocation();
  const { user } = useAuth();

  const activeSection = MAIN_SECTIONS.find(s => {
    return s.matchPaths.some(p => {
      if (p === "/") return false;
      return location.pathname.startsWith(p);
    });
  });

  if (!activeSection || activeSection.subItems.length === 0) return null;
  if ((activeSection as any).auth && !user) return null;

  return (
    <aside className="hidden lg:flex flex-col w-52 shrink-0 border-r border-border bg-card py-4 px-3">
      <div className="flex items-center gap-2 px-3 mb-4">
        <span className="font-mono text-micro uppercase tracking-[0.2em] text-muted-foreground">
          {activeSection.label}
        </span>
      </div>
      <nav className="space-y-0.5">
        {activeSection.subItems.map(sub => {
          const active = isSubItemActive(sub.path, location.pathname, location.search);
          return (
            <Link
              key={sub.path}
              to={sub.path}
              className={cn(
                "block px-3 py-2 text-xs transition-colors",
                active
                  ? "text-primary font-medium bg-primary/[0.08] border-l-2 border-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
              )}
            >
              {sub.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
