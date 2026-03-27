import { usePageSEO } from "@/hooks/use-page-seo";

const PeoplePuzzles = () => {
  usePageSEO({
    title: "PeoplePuzzles™ — The Recruiting Intelligence Game | WDIWF",
    description: "Every company runs a background check on you. This game teaches you to run one on them. 72 combos. 6 tiers. 8 certifications. Built on real recruiting intelligence by Jackye Clayton.",
    path: "/play"
  });

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", background: "#0A0A0E" }}>
      <iframe
        src="/peoplepuzzles-app.html"
        title="PeoplePuzzles™ by WDIWF"
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          display: "block",
        }}
        allow="clipboard-write"
      />
    </div>
  );
};

export default PeoplePuzzles;
