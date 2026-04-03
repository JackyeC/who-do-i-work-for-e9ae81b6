import { MessageSquareWarning } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface JackyesInsightBlockProps {
  insight: string | null | undefined;
  description?: string | null | undefined;
}

export function JackyesInsightBlock({ insight, description }: JackyesInsightBlockProps) {
  const text = insight || description;
  if (!text) return null;

  return (
    <Card className="mb-6 border-primary/20 bg-primary/[0.03]">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <MessageSquareWarning className="w-5 h-5 text-primary mt-0.5 shrink-0" />
          <div>
            <h3 className="text-sm font-bold text-foreground mb-1.5">Based on What Is Visible</h3>
            <p className="text-sm text-foreground/85 leading-relaxed">{text}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
