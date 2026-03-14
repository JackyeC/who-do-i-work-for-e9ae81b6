import { useState, useEffect } from "react";
import { Bell, BellRing, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface FollowRivalryButtonProps {
  rivalryId: string;
  rivalryTitle: string;
  compact?: boolean;
}

export function FollowRivalryButton({ rivalryId, rivalryTitle, compact }: FollowRivalryButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("rivalry_follows")
      .select("id")
      .eq("user_id", user.id)
      .eq("rivalry_id", rivalryId)
      .maybeSingle()
      .then(({ data }) => setFollowing(!!data));
  }, [user, rivalryId]);

  const handleToggle = async () => {
    if (!user) {
      toast({ title: "Sign up to follow", description: `Create a free account to get alerts when "${rivalryTitle}" rankings change.`, variant: "destructive" });
      navigate("/login");
      return;
    }

    setLoading(true);
    try {
      if (following) {
        await supabase.from("rivalry_follows").delete().eq("user_id", user.id).eq("rivalry_id", rivalryId);
        setFollowing(false);
        toast({ title: "Unfollowed", description: `You'll no longer get alerts for "${rivalryTitle}".` });
      } else {
        const { error } = await supabase.from("rivalry_follows").insert({ user_id: user.id, rivalry_id: rivalryId });
        if (error) throw error;
        setFollowing(true);
        toast({ title: "Following!", description: `You'll get alerts when "${rivalryTitle}" rankings shift.` });
      }
    } catch {
      toast({ title: "Error", description: "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (compact) {
    return (
      <button
        onClick={handleToggle}
        disabled={loading}
        className="font-mono text-[9px] tracking-wider uppercase text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
      >
        {loading ? (
          <Loader2 className="w-2.5 h-2.5 animate-spin" />
        ) : following ? (
          <BellRing className="w-2.5 h-2.5 text-primary" />
        ) : (
          <Bell className="w-2.5 h-2.5" />
        )}
        {following ? "Following" : "Follow"}
      </button>
    );
  }

  return (
    <Button
      size="sm"
      variant={following ? "default" : "outline"}
      onClick={handleToggle}
      disabled={loading}
      className="text-[10px] font-mono"
    >
      {loading ? (
        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
      ) : following ? (
        <BellRing className="w-3 h-3 mr-1" />
      ) : (
        <Bell className="w-3 h-3 mr-1" />
      )}
      {following ? "Following" : "Follow Rivalry"}
    </Button>
  );
}
