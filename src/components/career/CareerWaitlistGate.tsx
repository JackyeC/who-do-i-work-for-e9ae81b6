import { useState } from "react";
import { useCareerWaitlist } from "@/hooks/use-career-waitlist";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Sparkles, Clock, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export function CareerWaitlistGate() {
  const { isPending, hasJoined, joinWaitlist } = useCareerWaitlist();
  const [reason, setReason] = useState("");

  if (hasJoined && isPending) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center min-h-[60vh]"
      >
        <Card className="max-w-md w-full border-primary/20">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <Clock className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground">You're on the list!</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We're reviewing your request. You'll get access as soon as a spot opens up.
              We'll notify you by email.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Position secured
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-center min-h-[60vh]"
    >
      <Card className="max-w-md w-full border-primary/20">
        <CardContent className="p-8 space-y-5">
          <div className="text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <Sparkles className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Career Intelligence Beta</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              AI-powered career mapping, resume tailoring, and aligned role alerts — available to early testers first.
              Join the waitlist to get access.
            </p>
          </div>

          <div className="space-y-3">
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="What are you hoping to use this for? (optional)"
              className="resize-none text-sm"
              rows={3}
              maxLength={500}
            />
            <Button
              onClick={() => joinWaitlist.mutate({ reason: reason.trim() || undefined })}
              disabled={joinWaitlist.isPending}
              className="w-full gap-2"
            >
              {joinWaitlist.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Join the Waitlist
            </Button>
          </div>

          <p className="text-xs text-muted-foreground/60 text-center">
            No spam. We'll email you when your spot is ready.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
