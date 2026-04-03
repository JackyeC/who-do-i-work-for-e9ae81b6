import { Helmet } from "react-helmet-async";
import { InterviewKit } from "@/components/interview/InterviewKit";

export default function InterviewKits() {
  return (
    <>
      <Helmet>
        <title>Interview Kits — Who Do I Work For?</title>
        <meta name="description" content="Integrity-aware interview prep kits with coaching tips, practice questions, and company-specific intelligence." />
      </Helmet>
      <div className="min-h-screen flex flex-col bg-background">
<main className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
          <h1 className="text-2xl font-bold font-display text-foreground mb-6">Interview Kits</h1>
          <InterviewKit />
        </main>
</div>
    </>
  );
}
