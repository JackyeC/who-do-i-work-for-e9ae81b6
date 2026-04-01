import { PendingReviewsDashboard } from "@/components/admin/PendingReviewsDashboard";
import { ResearchPublishQueue } from "@/components/admin/ResearchPublishQueue";
import { CertificationQueue } from "@/components/admin/CertificationQueue";
import { JobApprovalQueue } from "@/components/admin/JobApprovalQueue";
import { CareerWaitlistQueue } from "@/components/admin/CareerWaitlistQueue";

export function ReviewQueueTab() {
  return (
    <div className="space-y-8">
      <PendingReviewsDashboard />
      <ResearchPublishQueue />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CertificationQueue />
        <JobApprovalQueue />
      </div>
      <CareerWaitlistQueue />
    </div>
  );
}
