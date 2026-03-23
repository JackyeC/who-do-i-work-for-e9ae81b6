import { useState } from "react";
import { Code, Copy, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";

interface EmbedBadgeProps {
  slug: string;
  companyName: string;
}

export function EmbedBadge({ slug, companyName }: EmbedBadgeProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const scriptTag = `<script src="https://civic-align.lovable.app/embed/civiclens-badge.js" defer></script>`;

  const lightEmbed = `<!-- Who Do I Work For? Transparency Badge for ${companyName} -->
<div data-civiclens-badge="${slug}"></div>
${scriptTag}`;

  const darkEmbed = `<!-- Who Do I Work For? Transparency Badge for ${companyName} (Dark) -->
<div data-civiclens-badge="${slug}" data-theme="dark"></div>
${scriptTag}`;

  const handleCopy = (code: string, label: string) => {
    navigator.clipboard.writeText(code);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
    toast({ title: "Embed code copied" });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Code className="w-3.5 h-3.5" />
          Embed Badge
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Embed Transparency Badge</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Add this badge to your careers page or website to show your transparency profile. The badge links back to your full profile on Who Do I Work For?.
        </p>

        <Tabs defaultValue="light">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="light">Light Theme</TabsTrigger>
            <TabsTrigger value="dark">Dark Theme</TabsTrigger>
          </TabsList>

          <TabsContent value="light" className="space-y-3">
            {/* Preview */}
            <div className="p-4 bg-background rounded-lg border border-border">
              <div className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-lg border border-border bg-card">
                <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
                  <ExternalLink className="w-3.5 h-3.5 text-primary-foreground" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground font-medium tracking-wide">CIVIC FOOTPRINT</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Transparency Profile Available · WDIWF?</div>
                </div>
              </div>
            </div>

            {/* Code */}
            <div className="relative">
              <pre className="p-3 bg-muted rounded-lg text-xs overflow-x-auto whitespace-pre-wrap break-all font-mono text-foreground">
                {lightEmbed}
              </pre>
              <Button
                variant="ghost" size="icon"
                className="absolute top-2 right-2 h-7 w-7"
                onClick={() => handleCopy(lightEmbed, "light")}
              >
                {copied === "light" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="dark" className="space-y-3">
            <div className="p-4 rounded-lg" style={{ background: "#1e293b" }}>
              <div className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-lg" style={{ border: "1px solid #334155", background: "#1e293b" }}>
                <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
                  <ExternalLink className="w-3.5 h-3.5 text-primary-foreground" />
                </div>
                <div>
                  <div className="text-xs font-medium tracking-wide" style={{ color: "hsl(var(--muted-foreground))" }}>CIVIC FOOTPRINT</div>
                  <div className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>Transparency Profile Available · WDIWF?</div>
                </div>
              </div>
            </div>

            <div className="relative">
              <pre className="p-3 bg-muted rounded-lg text-xs overflow-x-auto whitespace-pre-wrap break-all font-mono text-foreground">
                {darkEmbed}
              </pre>
              <Button
                variant="ghost" size="icon"
                className="absolute top-2 right-2 h-7 w-7"
                onClick={() => handleCopy(darkEmbed, "dark")}
              >
                {copied === "dark" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <p className="text-xs text-muted-foreground">
          The badge automatically fetches live data. No API key required. Works on any website.
        </p>
      </DialogContent>
    </Dialog>
  );
}
