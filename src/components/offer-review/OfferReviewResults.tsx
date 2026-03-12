import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Briefcase, DollarSign, Shield, FileWarning, Heart,
  Building2, MapPin, Calendar, Users, Trash2, Loader2, RefreshCw
} from "lucide-react";
import {
  OfferCheckSnapshot,
  buildDefaultSections,
  deriveSnapshotVerdict,
  generateSnapshotJackyeTake,
} from "@/components/OfferCheckSnapshot";

interface OfferReviewResultsProps {
  review: any;
  onDelete?: () => void;
  onRerun?: () => void;
  deleting?: boolean;
}

const CONFIDENCE_COLORS: Record<string, string> = {
  high: "text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/30",
  medium: "text-primary border-primary/30",
  low: "text-muted-foreground border-border",
};

const CLAUSE_ICONS: Record<string, typeof Shield> = {
  arbitration: FileWarning,
  non_compete: Shield,
  non_solicitation: Shield,
  confidentiality: Shield,
  repayment_clawback: DollarSign,
  at_will: FileWarning,
  probationary: FileWarning,
  severance: DollarSign,
  other: FileWarning,
};

export function OfferReviewResults({ review, onDelete, onRerun, deleting }: OfferReviewResultsProps) {
  const snapshot = review.offer_snapshot || {};
  const terms = (review.extracted_terms || []) as any[];
  const clauses = (review.detected_clauses || []) as any[];

  if (review.processing_status === "processing" || review.processing_status === "pending") {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">Analyzing your document...</p>
          <p className="text-xs text-muted-foreground mt-1">This usually takes 15-30 seconds.</p>
        </CardContent>
      </Card>
    );
  }

  if (review.processing_status === "failed") {
    return (
      <Card className="border-destructive/30">
        <CardContent className="p-6 text-center">
          <FileWarning className="w-8 h-8 text-destructive mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">Analysis failed</p>
          <p className="text-xs text-muted-foreground mb-3">{review.error_message || "An error occurred during processing."}</p>
          {onRerun && <Button size="sm" variant="outline" onClick={onRerun} className="gap-1.5"><RefreshCw className="w-3.5 h-3.5" /> Try Again</Button>}
        </CardContent>
      </Card>
    );
  }

  const termsByCategory: Record<string, any[]> = terms.reduce((acc: Record<string, any[]>, t: any) => {
    const cat = t.category || "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(t);
    return acc;
  }, {} as Record<string, any[]>);

  const categoryLabels: Record<string, string> = {
    compensation: "Compensation Terms",
    benefits: "Benefits References",
    work_arrangement: "Work Arrangement",
    contingencies: "Contingencies",
    reporting: "Reporting Structure",
    other: "Other Terms",
  };

  // Build snapshot from offer data
  const snapshotSections = buildDefaultSections({
    offerStrength: snapshot.base_salary ? "average" : "unknown",
  });
  const snapshotVerdict = deriveSnapshotVerdict(snapshotSections);
  const snapshotJackyeTake = generateSnapshotJackyeTake(snapshotVerdict, snapshotSections);

  return (
    <div className="space-y-5">
      {/* Offer Check Snapshot — decision-ready summary before the full report */}
      <OfferCheckSnapshot
        companyName={snapshot.company_name || review.company_name || "Company"}
        roleTitle={snapshot.role_title}
        location={snapshot.work_location}
        verdict={snapshotVerdict}
        sections={snapshotSections}
        jackyeTake={snapshotJackyeTake}
      />

      {/* Offer Snapshot */}
      {Object.keys(snapshot).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Briefcase className="w-4.5 h-4.5 text-primary" />
              Offer Snapshot
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {snapshot.role_title && (
                <div className="flex items-start gap-2">
                  <Users className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground">Role</p>
                    <p className="text-sm text-foreground">{snapshot.role_title}</p>
                  </div>
                </div>
              )}
              {snapshot.base_salary && (
                <div className="flex items-start gap-2">
                  <DollarSign className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground">Compensation</p>
                    <p className="text-sm text-foreground">{snapshot.base_salary}</p>
                  </div>
                </div>
              )}
              {snapshot.work_location && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground">Location</p>
                    <p className="text-sm text-foreground">{snapshot.work_location}</p>
                  </div>
                </div>
              )}
              {snapshot.work_arrangement && (
                <div className="flex items-start gap-2">
                  <Building2 className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground">Arrangement</p>
                    <p className="text-sm text-foreground">{snapshot.work_arrangement}</p>
                  </div>
                </div>
              )}
              {snapshot.start_date && (
                <div className="flex items-start gap-2">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground">Start Date</p>
                    <p className="text-sm text-foreground">{snapshot.start_date}</p>
                  </div>
                </div>
              )}
              {snapshot.department && (
                <div className="flex items-start gap-2">
                  <Users className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground">Department</p>
                    <p className="text-sm text-foreground">{snapshot.department}</p>
                  </div>
                </div>
              )}
            </div>
            {snapshot.compensation_summary && (
              <p className="text-xs text-muted-foreground mt-3 border-t border-border pt-2">{snapshot.compensation_summary}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Extracted Terms by Category */}
      {Object.entries(termsByCategory).map(([cat, catTerms]: [string, any[]]) => (
        <Card key={cat}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Heart className="w-4.5 h-4.5 text-primary" />
              {categoryLabels[cat] || cat}
              <Badge variant="secondary" className="text-[10px] ml-auto">{catTerms.length} term{catTerms.length !== 1 ? "s" : ""}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {catTerms.map((term: any, i: number) => (
              <div key={i} className="py-2.5 border-b border-border last:border-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-sm font-medium text-foreground">{term.term_name}</span>
                  <Badge variant="outline" className={`text-[10px] shrink-0 ${CONFIDENCE_COLORS[term.confidence] || CONFIDENCE_COLORS.low}`}>
                    {term.confidence}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground italic">"{term.extracted_text}"</p>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {/* Detected Clauses */}
      {clauses.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-4.5 h-4.5 text-primary" />
              Clause Signals
              <Badge variant="secondary" className="text-[10px] ml-auto">{clauses.length} clause{clauses.length !== 1 ? "s" : ""}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {clauses.map((clause: any, i: number) => {
              const Icon = CLAUSE_ICONS[clause.clause_type] || FileWarning;
              return (
                <div key={i} className="py-2.5 border-b border-border last:border-0">
                  <div className="flex items-start gap-2 mb-1">
                    <Icon className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-foreground">{clause.label}</span>
                        <Badge variant="outline" className={`text-[10px] shrink-0 ${CONFIDENCE_COLORS[clause.confidence] || CONFIDENCE_COLORS.low}`}>
                          Clause detected
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground italic mt-0.5">"{clause.extracted_text}"</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-[10px] text-muted-foreground">
          Analyzed {new Date(review.created_at).toLocaleDateString()} · Private to you
        </p>
        <div className="flex gap-2">
          {onRerun && (
            <Button variant="outline" size="sm" onClick={onRerun} className="gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" /> Rerun
            </Button>
          )}
          {onDelete && (
            <Button variant="outline" size="sm" onClick={onDelete} disabled={deleting} className="gap-1.5 text-destructive hover:text-destructive">
              {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              Delete
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
