import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, CheckCircle2, Loader2, Zap, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { toast } from "sonner";

interface AuditRequestFormProps {
  companyName: string;
  onClose?: () => void;
}

export function AuditRequestForm({ companyName, onClose }: AuditRequestFormProps) {
  const { user } = useAuth();
  const [name, setName] = useState(companyName);
  const [url, setUrl] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [email, setEmail] = useState(user?.email ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !user?.id) return;

    setSubmitting(true);
    try {
      const { error } = await (supabase as any)
        .from("audit_requests")
        .insert({
          company_name: name.trim(),
          company_url: url.trim() || null,
          role_title: roleTitle.trim() || null,
          email: email.trim(),
          user_id: user.id,
        });
      if (error) throw error;
      setSubmitted(true);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="border-primary/20 bg-primary/[0.03]">
        <CardContent className="p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6 text-primary" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif text-lg font-semibold text-foreground">
              Thanks — we've added this company to the audit queue.
            </h3>
            <p className="text-sm text-muted-foreground">
              We'll email you at <span className="font-medium text-foreground">{email}</span> when the intelligence report is ready.
            </p>
          </div>

          {/* Priority upsell */}
          <div className="pt-2 border-t border-border/30">
            <p className="text-xs text-muted-foreground mb-2">Need it faster?</p>
            <Link to="/pricing">
              <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                <Zap className="w-3 h-3" />
                Get a Priority Career Fit Report — $49
              </Button>
            </Link>
          </div>

          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="text-xs text-muted-foreground">
              Search another company
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/60">
      <CardContent className="p-6 space-y-5">
        <div className="space-y-2 text-center">
          <div className="w-10 h-10 rounded-full bg-muted/60 flex items-center justify-center mx-auto">
            <Search className="w-5 h-5 text-muted-foreground" />
          </div>
          <h3 className="font-serif text-lg font-semibold text-foreground">
            We don't have receipts on this company yet.
          </h3>
          <p className="text-sm text-muted-foreground">
            Request a full company scan and we'll add it to the queue.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Company name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Corp"
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Company website or LinkedIn URL
            </label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              type="url"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Role you're considering <Badge variant="outline" className="text-xs ml-1">optional</Badge>
            </label>
            <Input
              value={roleTitle}
              onChange={(e) => setRoleTitle(e.target.value)}
              placeholder="e.g. Senior Product Manager"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Email for notification
            </label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              type="email"
              required
            />
          </div>
          <Button type="submit" disabled={submitting} className="w-full gap-2">
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting…
              </>
            ) : (
              <>
                Request this audit
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </form>

        {/* Priority upsell */}
        <div className="pt-3 border-t border-border/30 text-center">
          <p className="text-xs text-muted-foreground mb-2">Need it faster?</p>
          <Link to="/pricing">
            <Button size="sm" variant="ghost" className="gap-1.5 text-xs text-primary">
              <Zap className="w-3 h-3" />
              Get a Priority Career Fit Report — $49
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
