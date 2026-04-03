import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function FollowTheMoneyTeaser() {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-primary flex items-center gap-2">
          💰 Powered by Follow The Money
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground leading-relaxed">
          In the full version, this box will show real receipts from WDIWF's Follow The Money feature
          for companies like the ones in your story.
        </p>
      </CardContent>
    </Card>
  );
}
