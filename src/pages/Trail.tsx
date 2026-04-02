/**
 * WhoDoI Trail — Main game page.
 * Investigation game: choose-your-own-adventure + evidence board + reveal.
 */
import { Helmet } from "react-helmet-async";
import { TrailProvider } from "@/components/trail/TrailContext";
import { TrailTopBar } from "@/components/trail/TrailTopBar";
import { TrailSidebar } from "@/components/trail/TrailSidebar";
import { TrailBoard } from "@/components/trail/TrailBoard";
import { TrailDrawer } from "@/components/trail/TrailDrawer";
import { TrailRevealRail } from "@/components/trail/TrailRevealRail";
import { TrailRevealScreen } from "@/components/trail/TrailRevealScreen";

function TrailGame() {
  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: "#0F1118" }}>
      <TrailTopBar />
      <div className="flex flex-1 min-h-0">
        <TrailSidebar />
        <TrailBoard />
        <TrailDrawer />
      </div>
      <TrailRevealRail />
      <TrailRevealScreen />
    </div>
  );
}

export default function Trail() {
  return (
    <>
      <Helmet>
        <title>WhoDoI Trail — Interactive Investigation Game | WDIWF</title>
        <meta name="description" content="Investigate a company's public image, political influence, labor signals, and executive networks in this choose-your-own-adventure game." />
      </Helmet>
      <TrailProvider>
        <TrailGame />
      </TrailProvider>
    </>
  );
}
