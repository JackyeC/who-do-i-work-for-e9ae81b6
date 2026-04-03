import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, Mail, CheckCircle2, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface IntelligenceRequestCardProps {
  companyName: string;
  companyId?: string;
  onDiscovered?: (companyId: string, slug: string) => void;
}

export function IntelligenceRequestCard({ companyName, companyId, onDiscovered }: IntelligenceRequestCardProps) {
  const [scanning, setScanning] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [submittingEmail, setSubmittingEmail] = useState(false);
  const navigate = useNavigate();

  const handleScan = async () => {
    setScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke("company-discover", {
        body: { companyName, searchQuery: companyName },
      });
      if (error) throw error;
      if (data?.companyId && data?.slug) {
        toast.success("Intelligence scan initiated. Building dossier...");
        if (onDiscovered) {
          onDiscovered(data.companyId, data.slug);
        } else {
          navigate(`/dossier/${data.slug}`);
        }
      } else {
        toast.error("Could not match company. Try a different name.");
      }
    } catch (e: any) {
      console.error("Discovery failed:", e);
      toast.error("Intelligence scan failed. Please try again.");
    } finally {
      setScanning(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@") || !email.includes(".")) return;
    setSubmittingEmail(true);
    try {
      await supabase.from("scan_notify_requests").insert({
        email,
        company_id: companyId || null,
        company_name: companyName,
      });
      setEmailSubmitted(true);
      toast.success("You'll be notified when this dossier is ready.");
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setSubmittingEmail(false);
    }
  };

  return (
    <Card className="border-primary/30 bg-gradient-to-b from-primary/5 to-transparent overflow-hidden">
      <CardContent className="p-0">
        {/* Header bar */}
        <div className="bg-primary/10 border-b border-primary/20 px-6 py-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold uppercase tracking-widest text-primary">
            Intelligence Pending
          </span>
        </div>

        <div className="px-6 py-8 text-center space-y-5">
          <div>
            <h3 className="text-lg font-bold text-foreground mb-1">
              No public records found for{" "}
              <span className="text-primary">{companyName}</span> — yet.
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Request an intelligence report and we'll scan SEC filings, PAC spending, OSHA records, WARN notices, and more.
            </p>
          </div>

          {/* CTA Button */}
          <Button
            size="lg"
            onClick={handleScan}
            disabled={scanning}
            className="gap-2 text-base font-bold px-8 py-6 shadow-lg shadow-primary/20"
          >
            {scanning ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Scanning sources...
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                Request Intelligence Report
              </>
            )}
          </Button>

          {/* Email capture */}
          <div className="max-w-sm mx-auto">
            {emailSubmitted ? (
              <div className="flex items-center justify-center gap-2 text-sm text-primary py-2">
                <CheckCircle2 className="w-4 h-4" />
                <span className="font-medium">We'll notify you when this dossier is ready.</span>
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground mb-2">
                  We'll notify you in ~2 hours when this dossier is ready
                </p>
                <form onSubmit={handleEmailSubmit} className="flex gap-2">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="h-10 text-sm"
                  />
                  <Button
                    type="submit"
                    variant="outline"
                    size="sm"
                    disabled={submittingEmail}
                    className="gap-1.5 shrink-0 h-10 border-primary/30 text-primary hover:bg-primary/10"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    {submittingEmail ? "..." : "Notify Me"}
                  </Button>
                </form>
              </>
            )}
          </div>

          <Badge variant="outline" className="text-[10px] text-muted-foreground">
            Sources: SEC · FEC · OSHA · WARN · BLS · NLRB · News
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
