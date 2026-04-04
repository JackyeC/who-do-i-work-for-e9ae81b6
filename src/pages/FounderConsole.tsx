import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { usePageSEO } from "@/hooks/use-page-seo";
import { useUserRole } from "@/hooks/use-user-role";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { TodayTab } from "@/components/founder/TodayTab";
import { ReviewQueueTab } from "@/components/founder/ReviewQueueTab";
import { SignalsDataTab } from "@/components/founder/SignalsDataTab";
import { UsersFeedbackTab } from "@/components/founder/UsersFeedbackTab";
import { NotesTab } from "@/components/founder/NotesTab";
import { DuplicateDetectionTab } from "@/components/founder/DuplicateDetectionTab";
import {
  LayoutDashboard, ClipboardList, Radio, Users, StickyNote, ExternalLink,
} from "lucide-react";

const TABS = [
  { id: "today", label: "Today", icon: LayoutDashboard },
  { id: "queue", label: "Review Queue", icon: ClipboardList },
  { id: "signals", label: "Signals & Data", icon: Radio },
  { id: "users", label: "Users & Feedback", icon: Users },
  { id: "notes", label: "Notes", icon: StickyNote },
] as const;

export default function FounderConsole() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "today";
  const [activeTab, setActiveTab] = useState(initialTab);

  usePageSEO({
    title: "Founder Console",
    description: "Internal operations console.",
  });

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && TABS.some(t => t.id === tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchParams(tab === "today" ? {} : { tab });
  };

  const lastUpdated = new Date().toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 container mx-auto px-4 py-6 max-w-5xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
          <div>
            <h1 className="text-lg font-bold text-foreground tracking-tight">Founder Console</h1>
            <p className="text-xs text-muted-foreground">
              Internal Operations · Updated {lastUpdated}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="text-xs gap-1.5" asChild>
              <Link to="/admin/launch-health">Launch health</Link>
            </Button>
            <a href="https://who-do-i-work-for.lovable.app" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="text-xs gap-1.5">
                <ExternalLink className="w-3.5 h-3.5" /> View Live Site
              </Button>
            </a>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="bg-muted/30 border border-border/40 p-1 mb-6 w-full justify-start overflow-x-auto">
            {TABS.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="text-xs gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <tab.icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="today"><TodayTab /></TabsContent>
          <TabsContent value="queue"><ReviewQueueTab /></TabsContent>
          <TabsContent value="signals"><SignalsDataTab /></TabsContent>
          <TabsContent value="users"><UsersFeedbackTab /></TabsContent>
          <TabsContent value="notes"><NotesTab /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
