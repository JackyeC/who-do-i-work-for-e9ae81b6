import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { usePageSEO } from "@/hooks/use-page-seo";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getViteSupabasePublishableKey, getViteSupabaseUrl } from "@/lib/supabase-vite-env";
import { isLikelyMissingSchemaObject } from "@/lib/supabase-errors";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2, XCircle, AlertTriangle, RefreshCw, ExternalLink, Shield,
} from "lucide-react";

type Status = "ok" | "warn" | "fail" | "pending";

interface CheckRow {
  id: string;
  label: string;
  status: Status;
  detail: string;
}

function maskUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}/…`;
  } catch {
    return url.length > 48 ? `${url.slice(0, 32)}…` : url;
  }
}

function statusIcon(s: Status) {
  if (s === "ok") return <CheckCircle2 className="w-4 h-4 text-[hsl(var(--civic-green))]" />;
  if (s === "warn") return <AlertTriangle className="w-4 h-4 text-[hsl(var(--civic-yellow))]" />;
  if (s === "fail") return <XCircle className="w-4 h-4 text-destructive" />;
  return <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />;
}

function statusBadge(s: Status) {
  const label = s === "ok" ? "Ready" : s === "warn" ? "Degraded" : s === "fail" ? "Blocked" : "Checking";
  const variant = s === "ok" ? "default" : s === "warn" ? "secondary" : s === "fail" ? "destructive" : "outline";
  return <Badge variant={variant as "default" | "secondary" | "destructive" | "outline"} className="text-[10px]">{label}</Badge>;
}

/**
 * Internal admin-only: live checks for migration-backed features, edge functions, and env.
 */
export default function LaunchHealthPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<CheckRow[]>([]);
  const [running, setRunning] = useState(false);

  usePageSEO({
    title: "Launch health — Internal",
    description: "Migration and edge function readiness.",
    path: "/admin/launch-health",
  });

  const runChecks = useCallback(async () => {
    if (!user?.id) return;
    setRunning(true);
    const next: CheckRow[] = [];

    const envUrl = getViteSupabaseUrl();
    const envKey = getViteSupabasePublishableKey();
    next.push({
      id: "env-url",
      label: "VITE_SUPABASE_URL",
      status: envUrl ? "ok" : "fail",
      detail: envUrl ? maskUrl(envUrl) : "Missing — frontend cannot reach Supabase.",
    });
    next.push({
      id: "env-anon",
      label: "VITE_SUPABASE_PUBLISHABLE_KEY or VITE_SUPABASE_ANON_KEY",
      status: envKey && envKey.length > 20 ? "ok" : "fail",
      detail: envKey ? `Set (${envKey.length} chars)` : "Missing — sign-in and API calls will fail.",
    });

    const { error: profileErr } = await (supabase as any)
      .from("profiles")
      .select("dream_job_profile")
      .eq("id", user.id)
      .maybeSingle();

    if (profileErr && isLikelyMissingSchemaObject(profileErr)) {
      next.push({
        id: "djp-cols",
        label: "Dream Job Profile (profiles.dream_job_profile)",
        status: "warn",
        detail: "Column may not be available yet. Check database status.",
      });
    } else if (profileErr) {
      next.push({
        id: "djp-cols",
        label: "Dream Job Profile (profiles)",
        status: "warn",
        detail: "Could not read profile row. Check RLS and network.",
      });
    } else {
      next.push({
        id: "djp-cols",
        label: "Dream Job Profile (profiles.dream_job_profile)",
        status: "ok",
        detail: "Column readable for your user.",
      });
    }

    const { error: dossierTableErr } = await (supabase as any)
      .from("application_email_dossiers")
      .select("id")
      .eq("user_id", user.id)
      .limit(1);

    if (dossierTableErr && isLikelyMissingSchemaObject(dossierTableErr)) {
      next.push({
        id: "dossier-table",
        label: "application_email_dossiers table",
        status: "fail",
        detail: "Table missing or not in schema cache — apply the same migration as above.",
      });
    } else if (dossierTableErr) {
      next.push({
        id: "dossier-table",
        label: "application_email_dossiers",
        status: "warn",
        detail: "Query failed — verify RLS and policies.",
      });
    } else {
      next.push({
        id: "dossier-table",
        label: "application_email_dossiers",
        status: "ok",
        detail: "Table reachable for your user.",
      });
    }

    const { data: genData, error: genFnErr } = await supabase.functions.invoke("generate-application-dossier", {
      body: {},
    });
    const genStatus = (genFnErr as { context?: { status?: number } } | null)?.context?.status;
    const payloadErr =
      typeof genData === "object" && genData && "error" in genData
        ? String((genData as { error?: string }).error || "")
        : "";
    /** Empty body → HTTP 400 from function = function is deployed and responding. */
    const genOk =
      genStatus === 400 || payloadErr.toLowerCase().includes("application_id");

    next.push({
      id: "fn-generate-dossier",
      label: "Edge function generate-application-dossier",
      status: genOk ? "ok" : "fail",
      detail: genOk
        ? "Deployed and responding (400 without application_id is expected)."
        : "Not reachable — deploy generate-application-dossier to this Supabase project or check project URL.",
    });

    const { error: matcherErr } = await supabase.functions.invoke("values-job-matcher", {
      body: { limit: 1 },
    });
    next.push({
      id: "fn-matcher",
      label: "Edge function values-job-matcher",
      status: matcherErr ? "fail" : "ok",
      detail: matcherErr
        ? "Matching unavailable until this function responds."
        : "Reachable — matched jobs / jobs feed can load.",
    });

    setRows(next);
    setRunning(false);
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) runChecks();
  }, [user?.id, runChecks]);

  const blocked = rows.filter((r) => r.status === "fail").length;
  const degraded = rows.filter((r) => r.status === "warn").length;

  return (
    <div className="min-h-screen bg-background">
      <main className="container max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-primary mb-1">Internal</p>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Launch health
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Readiness for Dream Job Profile, dossiers, and matching. Not shown to end users.
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 shrink-0" disabled={running} onClick={() => runChecks()}>
            <RefreshCw className={`w-3.5 h-3.5 ${running ? "animate-spin" : ""}`} />
            Re-run checks
          </Button>
        </div>

        <Card className="mb-6 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Summary</CardTitle>
            <CardDescription>
              {rows.length === 0
                ? "Running checks…"
                : blocked > 0
                  ? `${blocked} blocker(s) — fix before promising demos.`
                  : degraded > 0
                    ? `${degraded} warning(s) — demo may be degraded.`
                    : "Core checks passed for this browser + project."}
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="space-y-2 mb-8">
          {rows.length === 0 && running && (
            <p className="text-sm text-muted-foreground">Running checks…</p>
          )}
          {rows.map((r) => (
            <div
              key={r.id}
              className="flex items-start gap-3 rounded-lg border border-border/60 bg-card px-4 py-3"
            >
              <div className="mt-0.5">{statusIcon(r.status)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-foreground">{r.label}</span>
                  {statusBadge(r.status)}
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{r.detail}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 text-xs">
          <Button variant="outline" size="sm" asChild>
            <Link to="/founder-console">Founder console</Link>
          </Button>
          <Button variant="ghost" size="sm" className="gap-1" asChild>
            <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer">
              Supabase dashboard <ExternalLink className="w-3 h-3" />
            </a>
          </Button>
        </div>

        <p className="text-[11px] text-muted-foreground mt-8 leading-relaxed">
          Also see <code className="text-[10px] bg-muted px-1 rounded">LAUNCH_CHECKLIST.md</code> and{" "}
          <code className="text-[10px] bg-muted px-1 rounded">LAUNCH_NOTES.md</code> in the repo for deploy steps and the Monday demo script.
        </p>
      </main>
    </div>
  );
}
