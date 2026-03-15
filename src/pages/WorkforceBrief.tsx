import { WorkNewsTicker } from "@/components/news/WorkNewsTicker";
import { WorkNewsRepository } from "@/components/news/WorkNewsRepository";
import { usePageSEO } from "@/hooks/use-page-seo";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function WorkforceBrief() {
  usePageSEO({
    title: "Workforce Intelligence Brief — Global Work News | Who Do I Work For?",
    description: "Live workforce intelligence: labor laws, AI hiring, pay equity, layoffs, and regulation. Powered by GDELT. Free, real-time, and source-cited.",
    path: "/workforce-brief",
  });

  // Check if user has Pro access
  const { data: session } = useQuery({
    queryKey: ["auth-session-brief"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const { data: subscription } = useQuery({
    queryKey: ["user-subscription-brief", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const { data } = await supabase
        .from("user_subscriptions")
        .select("plan_id, plans(name)")
        .eq("user_id", session.user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!session?.user?.id,
  });

  const planName = (subscription?.plans as any)?.name?.toLowerCase() || "";
  const isPro = !!subscription?.plan_id && planName !== "free";

  return (
    <div className="min-h-screen bg-background">
      <WorkNewsTicker />

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-black text-foreground tracking-tight">
            Workforce Intelligence Brief
          </h1>
          <p className="text-muted-foreground text-sm mt-2 max-w-2xl">
            Real-time global workforce signals — labor laws, AI hiring, pay equity, regulation,
            and more. Powered by GDELT open intelligence. Updated every 4 hours.
          </p>
        </div>

        <WorkNewsRepository isPro={isPro} maxFreeCards={3} />
      </div>
    </div>
  );
}
