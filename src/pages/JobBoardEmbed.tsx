import { useEffect, useRef } from "react";
import { Header } from "@/components/Header";
import { usePageSEO } from "@/hooks/use-page-seo";

export default function JobBoardEmbed() {
  usePageSEO({
    title: "Job Board — Who Do I Work For?",
    description:
      "Every company has values. Find one that shares yours. Browse jobs at companies verified by public records — lobbying, labor, and funding data included.",
    path: "/job-board",
  });

  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!widgetRef.current) return;

    const iframe = document.createElement("iframe");
    iframe.src = "https://who-do-i-work-for.cavuno.com/embed/jobs?limit=50";
    iframe.width = "100%";
    iframe.style.minHeight = "900px";
    iframe.style.height = "calc(100vh - 160px)";
    iframe.style.border = "none";
    iframe.loading = "lazy";
    iframe.title = "WDIWF Job Board";
    iframe.allow = "clipboard-write";

    widgetRef.current.appendChild(iframe);

    return () => {
      iframe.remove();
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="w-full max-w-5xl mx-auto px-4 pt-24 pb-6 text-center">
        <h1 className="text-3xl font-bold text-foreground mb-2">Job Board</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Every company has values. Find one that shares yours. Each listing connects to employer intelligence — lobbying records, labor data, and funding trails.
        </p>
      </div>
      <div className="flex-1 w-full px-4 max-w-5xl mx-auto" id="cavuno-jobs-widget" ref={widgetRef} />
    </div>
  );
}
