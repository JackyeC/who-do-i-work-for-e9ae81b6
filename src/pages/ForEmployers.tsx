import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ShieldCheck, Search, Users, Check, ArrowRight, Loader2, Plus, X, ClipboardCheck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePageSEO } from "@/hooks/use-page-seo";
import { z } from "zod";

const MISSION_CATEGORIES = [
  "Climate", "Health Equity", "Education", "Civic/Policy", "Veterans",
  "Faith-Based", "Community/Social", "Economic Justice",
  "LGBTQ Rights", "Disability Rights", "Rural Development", "Other",
];

const ORG_TYPES = ["Nonprofit", "B Corp", "Social Enterprise", "For-Purpose"];

const VALUE_COLUMNS = [
  {
    icon: ClipboardCheck,
    title: "Get Verified",
    body: "We audit your organization using public data: Glassdoor, leadership tenure, impact reports, grant history, CSR disclosures. No questionnaire you fill out yourself. Just receipts.",
  },
  {
    icon: Search,
    title: "Get Found",
    body: "Verified organizations are featured in our repository. Mission-aligned candidates browse here specifically because they trust the vetting. They already want to work somewhere like you.",
  },
  {
    icon: Users,
    title: "Get Matched",
    body: "Access our talent pool of values-aligned candidates, scored against YOUR mission and culture — not a generic rubric.",
  },
];

interface OpenRole {
  id: string;
  title: string;
}

const formSchema = z.object({
  orgName: z.string().trim().min(1, "Organization name is required").max(200),
  website: z.string().trim().min(1, "Website is required").max(500),
  missionStatement: z.string().trim().min(1, "Mission statement is required").max(1000),
  missionCategory: z.string().min(1, "Please select a mission category"),
  orgType: z.string().min(1, "Please select an organization type"),
  roles: z.array(z.object({ id: z.string(), title: z.string().trim().min(1) })).max(5),
  email: z.string().trim().email("Please enter a valid email").max(255),
});

export default function ForEmployers() {
  usePageSEO({
    title: "For Employers — Prove You're the Real Thing",
    description: "WDIWF verifies your mission against public data. Get verified, get found, get matched with values-aligned talent.",
    path: "/for-employers",
  });

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Step 1
  const [orgName, setOrgName] = useState("");
  const [website, setWebsite] = useState("");
  const [missionStatement, setMissionStatement] = useState("");
  const [missionCategory, setMissionCategory] = useState("");
  const [orgType, setOrgType] = useState("");

  // Step 2
  const [roles, setRoles] = useState<OpenRole[]>([{ id: "1", title: "" }]);

  // Step 3
  const [email, setEmail] = useState("");

  const addRole = () => {
    if (roles.length >= 5) return;
    setRoles([...roles, { id: String(Date.now()), title: "" }]);
  };

  const removeRole = (id: string) => {
    setRoles(roles.filter((r) => r.id !== id));
  };

  const updateRole = (id: string, title: string) => {
    setRoles(roles.map((r) => (r.id === id ? { ...r, title } : r)));
  };

  const canAdvance = () => {
    if (step === 1) return orgName.trim() && website.trim() && missionStatement.trim() && missionCategory && orgType;
    if (step === 2) return true; // roles are optional
    if (step === 3) return email.trim().includes("@");
    return false;
  };

  const handleSubmit = async () => {
    const filledRoles = roles.filter((r) => r.title.trim());
    const parsed = formSchema.safeParse({
      orgName, website, missionStatement, missionCategory, orgType,
      roles: filledRoles, email,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || "Please check your inputs.");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("advisory_interest").insert({
        name: orgName,
        email,
        service_type: "employer_verification",
        message: JSON.stringify({
          website,
          mission_statement: missionStatement,
          mission_category: missionCategory,
          org_type: orgType,
          open_roles: filledRoles.map((r) => r.title),
        }),
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
      <main className="flex-1 flex items-center justify-center px-6 py-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-civic-green/10 flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-civic-green" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-4 font-serif">Submission received.</h2>
          <p className="text-muted-foreground leading-relaxed">
            We'll review your organization's public data and send you a preliminary Reality Check report within 48 hours. No bias. Just receipts.
          </p>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="flex-1">
        {/* Hero */}
        <section className="px-6 lg:px-16 pt-24 pb-12 max-w-[960px] mx-auto text-center">
          <Badge variant="secondary" className="mb-4 text-xs font-mono uppercase tracking-wider">
            For Employers
          </Badge>
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="text-3xl lg:text-4xl font-bold text-foreground mb-5 font-serif"
          >
            Prove you're the real thing.{" "}
            <span className="text-primary">Find people who believe in it.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }}
            className="text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            WDIWF verifies your mission against public data — not your marketing copy.
            If you pass, you get the badge. If there are gaps, we tell you before candidates see it.
          </motion.p>
        </section>

        {/* Three Value Columns */}
        <section className="px-6 lg:px-16 pb-16 max-w-[1100px] mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {VALUE_COLUMNS.map((col, i) => (
              <motion.div
                key={col.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.08, duration: 0.4 }}
              >
                <Card className="h-full border-border/40">
                  <CardContent className="p-6">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <col.icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-3">{col.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{col.body}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* 3-Step Form */}
        <section className="px-6 lg:px-16 pb-20 max-w-[640px] mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2 font-serif">Start Your Verification</h2>
            <p className="text-sm text-muted-foreground">Three steps. No credit card required.</p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <button
                  onClick={() => s < step && setStep(s)}
                  className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center transition-colors ${
                    s === step
                      ? "bg-primary text-primary-foreground"
                      : s < step
                        ? "bg-civic-green/20 text-civic-green cursor-pointer"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {s < step ? <Check className="w-4 h-4" /> : s}
                </button>
                {s < 3 && <div className={`w-12 h-px ${s < step ? "bg-civic-green/40" : "bg-border"}`} />}
              </div>
            ))}
          </div>

          <Card className="border-border/40">
            <CardContent className="p-6 space-y-5">
              {/* Step 1: Org basics */}
              {step === 1 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                  <h3 className="text-base font-semibold text-foreground">Organization Basics</h3>

                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Organization Name</label>
                    <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="e.g. GreenGrid Energy" maxLength={200} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Website</label>
                    <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yourorg.org" maxLength={500} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Mission Statement (in your own words)</label>
                    <textarea
                      value={missionStatement}
                      onChange={(e) => setMissionStatement(e.target.value)}
                      placeholder="What does your organization exist to do?"
                      maxLength={1000}
                      rows={3}
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                    />
                    <p className="text-[10px] text-muted-foreground/60 mt-1">{missionStatement.length}/1000</p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Mission Category</label>
                    <Select value={missionCategory} onValueChange={setMissionCategory}>
                      <SelectTrigger className="bg-card border-border"><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        {MISSION_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Organization Type</label>
                    <Select value={orgType} onValueChange={setOrgType}>
                      <SelectTrigger className="bg-card border-border"><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        {ORG_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Open roles */}
              {step === 2 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                  <h3 className="text-base font-semibold text-foreground">Open Roles</h3>
                  <p className="text-xs text-muted-foreground">Add up to 5 roles you're currently hiring for (optional).</p>

                  {roles.map((role, i) => (
                    <div key={role.id} className="flex items-center gap-2">
                      <Input
                        value={role.title}
                        onChange={(e) => updateRole(role.id, e.target.value)}
                        placeholder={`Role ${i + 1}, e.g. Program Director`}
                        maxLength={200}
                        className="flex-1"
                      />
                      {roles.length > 1 && (
                        <Button variant="ghost" size="icon" onClick={() => removeRole(role.id)} className="shrink-0">
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}

                  {roles.length < 5 && (
                    <Button variant="outline" size="sm" onClick={addRole} className="gap-1.5 text-xs">
                      <Plus className="w-3 h-3" /> Add Role
                    </Button>
                  )}
                </motion.div>
              )}

              {/* Step 3: Email */}
              {step === 3 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                  <h3 className="text-base font-semibold text-foreground">Verification Contact</h3>
                  <p className="text-xs text-muted-foreground">We'll send your preliminary Reality Check report to this address.</p>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Email Address</label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@yourorg.org"
                      maxLength={255}
                    />
                  </div>
                </motion.div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between pt-2">
                {step > 1 ? (
                  <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)}>Back</Button>
                ) : (
                  <div />
                )}
                {step < 3 ? (
                  <Button size="sm" disabled={!canAdvance()} onClick={() => setStep(step + 1)} className="gap-1.5">
                    Next <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    disabled={!canAdvance() || submitting}
                    onClick={handleSubmit}
                    className="gap-1.5"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                    Start My Verification
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </section>
    </main>
  );
}
