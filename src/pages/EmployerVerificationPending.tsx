import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Clock, Upload, ShieldCheck, Mail, FileText, Scale } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const steps = [
  {
    id: "payment",
    icon: Check,
    label: "Payment Received",
    status: "complete" as const,
    description: "Your $499/yr Employer Certification subscription is active.",
  },
  {
    id: "docs",
    icon: Upload,
    label: "Upload Transparency Docs",
    status: "pending" as const,
    description: "Submit your DEI Report, ESG Statement, or Employee Handbook to support your Official Response.",
  },
  {
    id: "review",
    icon: Clock,
    label: "Jackye Review",
    status: "pending" as const,
    description: "24-hour turnaround. Jackye will review your documentation against the 3-point transparency audit.",
  },
];

const criteria = [
  { icon: Mail, label: "Identity Linkage", desc: "Verified corporate email domain matching your company." },
  { icon: FileText, label: "Documented Disclosure", desc: "Public-facing DEI, ESG, or handbook supporting your Official Response." },
  { icon: Scale, label: "Non-Interference Agreement", desc: "You may respond to insights, but cannot edit, remove, or suppress independent research." },
];

export default function EmployerVerificationPending() {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploaded, setUploaded] = useState(false);

  const handleUpload = async () => {
    if (!file || !user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `employer-docs/${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("career_docs").upload(path, file);
      if (error) throw error;
      setUploaded(true);
      toast.success("Document uploaded. Jackye will review within 24 hours.");
    } catch (e: any) {
      toast.error("Upload failed: " + e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-16 max-w-2xl">
        <div className="text-center mb-10">
          <Badge variant="secondary" className="mb-4 text-xs font-mono uppercase tracking-wider">
            Employer Certification
          </Badge>
          <h1 className="text-2xl font-bold text-foreground mb-3">
            Welcome to the Certification Process
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Your status is currently <span className="font-semibold text-foreground">Verified (Identity)</span>.
            Your <span className="font-semibold text-primary">Certified (Gold Shield)</span> status will
            activate once Jackye approves your documentation.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="space-y-4 mb-10">
          {steps.map((step, i) => {
            const isComplete = step.status === "complete" || (step.id === "docs" && uploaded);
            return (
              <Card key={step.id} className={`border-border/40 ${isComplete ? "bg-primary/5 border-primary/20" : ""}`}>
                <CardContent className="p-5 flex items-start gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    isComplete ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}>
                    {isComplete ? <Check className="w-4 h-4" /> : <step.icon className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                      {step.label}
                      {isComplete && <Badge variant="outline" className="text-[9px] bg-primary/10 text-primary border-primary/20">Complete</Badge>}
                      {!isComplete && <Badge variant="outline" className="text-[9px]">Pending</Badge>}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Upload Form */}
        {!uploaded && (
          <Card className="border-border/40 mb-10">
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Upload className="w-4 h-4 text-primary" />
                Upload Transparency Documentation
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Accepted: DEI Report, ESG Statement, Employee Handbook, or equivalent public-facing disclosure (PDF, DOC, DOCX).
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="text-sm text-muted-foreground file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all"
                />
                <Button
                  size="sm"
                  onClick={handleUpload}
                  disabled={!file || uploading}
                  className="gap-1.5"
                >
                  {uploading ? <Clock className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                  Upload
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Certification Criteria Reference */}
        <Card className="border-border/40 bg-muted/20">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              What Jackye Reviews (3-Point Transparency Audit)
            </h3>
            <div className="space-y-3">
              {criteria.map((c) => (
                <div key={c.label} className="flex items-start gap-2.5">
                  <c.icon className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-foreground">{c.label}</p>
                    <p className="text-xs text-muted-foreground">{c.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Important:</span> Paying for Certification
                grants the right to respond to Jackye Insights, but provides zero authority to edit, remove,
                or suppress any data found by AI or Jackye's independent research.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
