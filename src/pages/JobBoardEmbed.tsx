import { Header } from "@/components/Header";
import { usePageSEO } from "@/hooks/use-page-seo";

export default function JobBoardEmbed() {
  usePageSEO({
    title: "Job Board — Who Do I Work For?",
    description:
      "Every company has values. Find one that shares yours. Browse jobs at companies verified by public records — lobbying, labor, and funding data included.",
    path: "/job-board",
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex-1 w-full" style={{ marginTop: "100px" }}>
        <iframe
          src="https://who-do-i-work-for.cavuno.com"
          title="WDIWF Job Board"
          className="w-full border-0"
          style={{ height: "calc(100vh - 100px)", minHeight: "800px" }}
          allow="clipboard-write"
          loading="lazy"
        />
      </div>
    </div>
  );
}
