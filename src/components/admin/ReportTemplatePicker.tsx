import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { REPORT_TEMPLATES, type ReportTemplate } from "@/lib/report-templates";
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReportTemplatePickerProps {
  onSelect: (template: ReportTemplate) => void;
}

export function ReportTemplatePicker({ onSelect }: ReportTemplatePickerProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (template: ReportTemplate) => {
    onSelect(template);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <FileText className="w-3.5 h-3.5" /> Use Template
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-display">Report Templates</DialogTitle>
          <p className="text-xs text-muted-foreground">
            Pre-built structures aligned with signal-based reporting. Customize after applying.
          </p>
        </DialogHeader>
        <div className="grid gap-3 mt-4">
          {REPORT_TEMPLATES.map((t) => (
            <Card
              key={t.id}
              className={cn(
                "cursor-pointer hover:border-primary/40 transition-all hover:shadow-sm"
              )}
              onClick={() => handleSelect(t)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl mt-0.5">{t.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-foreground">{t.name}</h3>
                      <Badge variant="outline" className="text-[9px] shrink-0">
                        {t.report.report_type.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{t.description}</p>
                    <div className="flex gap-1.5 mt-2">
                      <Badge variant="secondary" className="text-[9px]">
                        {t.sections.length} sections
                      </Badge>
                      <Badge variant="secondary" className="text-[9px]">
                        {t.claims.length} claims
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
