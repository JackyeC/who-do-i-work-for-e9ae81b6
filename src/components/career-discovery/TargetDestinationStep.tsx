import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Compass, Sparkles } from "lucide-react";

const SUGGESTED_ROLES = [
  "Director of Talent Acquisition",
  "VP People",
  "Chief People Officer",
  "Head of Talent Strategy",
  "HR Tech Advisor",
  "People Analytics Lead",
  "Workforce Planning Director",
  "Talent Intelligence Manager",
];

interface Props {
  onComplete: (targetRole: string | null) => void;
}

export function TargetDestinationStep({ onComplete }: Props) {
  const [targetRole, setTargetRole] = useState("");
  const [skipTarget, setSkipTarget] = useState(false);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Compass className="w-4 h-4 text-primary" />
            Where Do You Want to Go?
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Choose a destination role, or let the AI suggest possible future roles based on your skills and experience.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Input
              placeholder="Type your target role..."
              value={targetRole}
              onChange={e => { setTargetRole(e.target.value); setSkipTarget(false); }}
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">Or choose from common roles:</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_ROLES.map(role => (
                <Badge key={role}
                  variant={targetRole === role ? "default" : "outline"}
                  className="cursor-pointer text-xs"
                  onClick={() => { setTargetRole(role); setSkipTarget(false); }}>
                  {role}
                </Badge>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <button
              onClick={() => { setSkipTarget(true); setTargetRole(""); }}
              className={`flex items-center gap-2 p-3 rounded-xl border w-full text-left transition-all ${
                skipTarget ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
              }`}>
              <Sparkles className={`w-4 h-4 ${skipTarget ? 'text-primary' : 'text-muted-foreground'}`} />
              <div>
                <p className="text-sm font-medium">Let AI suggest roles for me</p>
                <p className="text-xs text-muted-foreground">Based on your skills, experience, and values</p>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => onComplete(skipTarget ? null : targetRole)} disabled={!targetRole && !skipTarget}>
          Continue
        </Button>
      </div>
    </div>
  );
}
