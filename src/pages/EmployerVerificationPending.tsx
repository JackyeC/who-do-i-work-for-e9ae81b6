import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  Clock,
  Upload,
  ShieldCheck,
  Mail,
  FileText,
  Link2,
  CalendarCheck,
  Briefcase,
  Timer,
  Shield,
} from "lucide-react";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

interface AuditStep {
  id: string;
  icon: React.ElementType;
  label: string;
  description: string;
  actionLabel?: string;
}

const auditSteps: AuditStep[] = [
  {
    id: "identity",
    icon: Mail,
    label: "Verify Identity",
    description:
      "Confirm your account is linked to a corporate email domain. Free-mail domains (Gmail, Yahoo, etc.) do not qualify.",
  },
  {
    id: "docs",
    icon: Upload,
    label: "Submit Disclosure Docs",
    description:
      "Upload your latest DEI report, ESG statement, or Employee Handbook. PDF, DOC, or DOCX accepted.",
    actionLabel: "Upload Document",
  },
  {
    id: "connection-chain",
    icon: Link2,
    label: "Review the Connection Chain",
    description:
      "Review our current public-data findings for your company and prepare your Official Response. This is what candidates will see.",
    actionLabel: "View Connection Chain",
  },
  {
    id: "audit-call",
    icon: CalendarCheck,
    label: "Schedule the Transparency Audit",
    description:
      "Book a 15-minute intro call to finalize your Certification. This is the last step before your Gold Shield goes live.",
    actionLabel: "Book 15-Min Intro Call",
  },
];

const FREE_EMAIL_DOMAINS = [
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "aol.com",
  "icloud.com",
  "mail.com",
  "protonmail.com",
  "zoho.com",
  "yandex.com",
];

function isCorporateEmail(email: string | undefined): boolean {
  if (!email) return false;
  const domain = email.split("@")[1]?.toLowerCase();
  return !!domain && !FREE_EMAIL_DOMAINS.includes(domain);
}

export default function EmployerVerificationPending() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploaded, setUploaded] = useState(false);

  const identityVerified = useMemo(
    () => isCorporateEmail(user?.email),
    [user?.email]
  );

  // Fetch employer profile for job credits
  const { data: employerProfile } = useQuery({
    queryKey: ["employer-profile", user?.id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("employer_profiles")
        .select("job_credits, company_name")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data as { job_credits: number; company_name: string } | null;
    },
    enabled: !!user,
  });

  const jobCredits = employerProfile?.job_credits ?? 5;

  // Fetch company vetted_status for Gold Shield display
  const { data: companyData } = useQuery({
    queryKey: ["employer-company-status", employerProfile?.company_name],
    queryFn: async () => {
      const { data } = await supabase
        .from("companies")
        .select("vetted_status")
        .eq("name", employerProfile!.company_name)
        .maybeSingle();
      return data as { vetted_status: string | null } | null;
    },
    enabled: !!employerProfile?.company_name,
  });

  const goldShieldActive = companyData?.vetted_status === "certified";

  const handleUpload = async () => {
    if (!file || !user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `employer-docs/${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("career_docs")
        .upload(path, file);
      if (error) throw error;
      setUploaded(true);
      toast.success(
        "Document uploaded. Our team will review within 24 hours."
      );
    } catch (e: any) {
      toast.error("Upload failed: " + e.message);
    } finally {
      setUploading(false);
    }
  };

  function getStepStatus(stepId: string): "complete" | "pending" {
    if (stepId === "identity") return identityVerified ? "complete" : "pending";
    if (stepId === "docs") return uploaded ? "complete" : "pending";
    return "pending";
  }

  const completedCount = auditSteps.filter(
    (s) => getStepStatus(s.id) === "complete"
  ).length;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-16 max-w-2xl">
        {/* Hero Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-5">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          {goldShieldActive ? (
            <Badge className="mb-4 text-xs font-mono uppercase tracking-wider bg-[hsl(var(--civic-green))] text-white">
              🛡️ Gold Shield Active
            </Badge>
          ) : (
            <Badge
              variant="secondary"
              className="mb-4 text-xs font-mono uppercase tracking-wider"
            >
              Gold Shield — Pending Admin Approval
            </Badge>
          )}
          <Badge
            variant="secondary"
            className="mb-4 ml-2 text-xs font-mono uppercase tracking-wider"
          >
            Founding Partner Certification
          </Badge>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3 leading-tight">
            Welcome, Founding Partner.
          </h1>
          <p className="text-base text-muted-foreground max-w-lg mx-auto leading-relaxed">
            You are officially leading the movement for workforce transparency.
            Complete the audit below to activate your{" "}
            <span className="font-semibold text-primary">
              Gold Shield
            </span>{" "}
            status.
          </p>
        </div>

        {/* Progress Summary */}
        <div className="flex items-center justify-between mb-6 px-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Certification Audit
          </p>
          <Badge variant="outline" className="text-xs font-mono">
            {completedCount} / {auditSteps.length} Complete
          </Badge>
        </div>

        {/* 4-Step Audit Checklist */}
        <div className="space-y-4 mb-10">
          {auditSteps.map((step) => {
            const status = getStepStatus(step.id);
            const isComplete = status === "complete";

            return (
              <Card
                key={step.id}
                className={`border-border/40 ${
                  isComplete
                    ? "bg-primary/5 border-primary/20"
                    : ""
                }`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                        isComplete
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isComplete ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <step.icon className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground flex items-center gap-2 flex-wrap">
                        {step.label}
                        {isComplete && (
                          <Badge
                            variant="outline"
                            className="text-[9px] bg-primary/10 text-primary border-primary/20"
                          >
                            Complete
                          </Badge>
                        )}
                        {!isComplete && (
                          <Badge variant="outline" className="text-[9px]">
                            Pending
                          </Badge>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {step.description}
                      </p>

                      {/* Step-specific interactions */}
                      {step.id === "identity" && !isComplete && (
                        <p className="text-xs text-destructive mt-2 font-medium">
                          Your current email ({user?.email}) does not appear to
                          be a corporate domain. Update your email to proceed.
                        </p>
                      )}

                      {step.id === "docs" && !isComplete && (
                        <div className="mt-3 flex items-center gap-3">
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={(e) =>
                              setFile(e.target.files?.[0] || null)
                            }
                            className="text-sm text-muted-foreground file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all"
                          />
                          <Button
                            size="sm"
                            onClick={handleUpload}
                            disabled={!file || uploading}
                            className="gap-1.5 shrink-0"
                          >
                            {uploading ? (
                              <Clock className="w-3 h-3 animate-spin" />
                            ) : (
                              <Upload className="w-3 h-3" />
                            )}
                            Upload
                          </Button>
                        </div>
                      )}

                      {step.id === "connection-chain" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-3 gap-1.5"
                          onClick={() => navigate("/follow-the-money")}
                        >
                          <Link2 className="w-3 h-3" />
                          View Connection Chain
                        </Button>
                      )}

                      {step.id === "audit-call" && (
                        <Button
                          size="sm"
                          variant="premium"
                          className="mt-3 gap-1.5"
                          asChild
                        >
                          <a
                            href="https://calendly.com/jackye-clayton"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <CalendarCheck className="w-3 h-3" />
                            Book 15-Min Intro Call
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Job Credit Status */}
        <Card className="border-primary/20 bg-primary/5 mb-6">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Briefcase className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">
                Job Credit Status
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Your Founding Partner package includes value-aligned job
                credits.
              </p>
            </div>
            <Badge className="text-xs font-mono bg-primary text-primary-foreground px-3 py-1">
              {jobCredits} Credits Active
            </Badge>
          </CardContent>
        </Card>

        {/* Timeline Notice */}
        <Card className="border-border/40 bg-muted/20 mb-6">
          <CardContent className="p-5 flex items-start gap-4">
            <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
              <Timer className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Activation Timeline
              </p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Your Gold Shield and Job Posts will go live globally within{" "}
                <span className="font-semibold text-foreground">
                  24 hours
                </span>{" "}
                of document submission and manual review.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Non-Interference Notice */}
        <Card className="border-border/40 bg-muted/20">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <Shield className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-foreground mb-1">
                  Non-Interference Agreement
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your $599/yr Founding Partner Certification grants the right
                  to respond to Insider Context findings, but provides{" "}
                  <span className="font-semibold text-foreground">
                    zero authority
                  </span>{" "}
                  to edit, remove, or suppress any data found by AI or
                  independent research. Transparency isn't optional—it's
                  the product.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
