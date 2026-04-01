import { useState } from "react";
import { PendingReviewsDashboard } from "@/components/admin/PendingReviewsDashboard";
import { ResearchPublishQueue } from "@/components/admin/ResearchPublishQueue";
import { CertificationQueue } from "@/components/admin/CertificationQueue";
import { JobApprovalQueue } from "@/components/admin/JobApprovalQueue";
import { CareerWaitlistQueue } from "@/components/admin/CareerWaitlistQueue";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

function CollapsibleSection({ title, defaultOpen = true, children }: {
  title: string; defaultOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="space-y-3">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary transition-colors w-full text-left"
      >
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        {title}
      </button>
      {open && children}
    </div>
  );
}

export function ReviewQueueTab() {
  return (
    <div className="space-y-8">
      <CollapsibleSection title="Pending Company Reviews" defaultOpen={true}>
        <PendingReviewsDashboard />
      </CollapsibleSection>

      <CollapsibleSection title="Draft Research Review" defaultOpen={true}>
        <ResearchPublishQueue />
      </CollapsibleSection>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CollapsibleSection title="Employer Certification" defaultOpen={true}>
          <CertificationQueue />
        </CollapsibleSection>
        <CollapsibleSection title="Job Post Approval" defaultOpen={true}>
          <JobApprovalQueue />
        </CollapsibleSection>
      </div>

      <CollapsibleSection title="Career Waitlist" defaultOpen={false}>
        <CareerWaitlistQueue />
      </CollapsibleSection>
    </div>
  );
}
