import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Bell, Check } from "lucide-react";
import { toast } from "sonner";

export function JobAlertSubscribe() {
  const { user } = useAuth();
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = () => {
    if (!user) {
      toast.error("Sign in to set up job alerts");
      return;
    }
    // Placeholder — will wire up when job_alerts table is created
    setSubscribed(true);
    toast.success("Job alerts coming soon! We'll notify you when this feature launches.");
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1.5 text-xs shrink-0"
      onClick={handleSubscribe}
      disabled={subscribed}
    >
      {subscribed ? (
        <>
          <Check className="w-3 h-3" /> Subscribed
        </>
      ) : (
        <>
          <Bell className="w-3 h-3" /> Set alerts
        </>
      )}
    </Button>
  );
}
