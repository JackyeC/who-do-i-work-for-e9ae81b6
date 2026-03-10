import { useCallback, useState } from "react";
import { Upload, FileText, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConnections, parseLinkedInCSV } from "@/hooks/use-connections";
import { cn } from "@/lib/utils";

export function ConnectionUploader() {
  const { uploadConnections } = useConnections();
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      const text = await file.text();
      const parsed = parseLinkedInCSV(text);
      if (parsed.length === 0) {
        return;
      }
      uploadConnections.mutate(parsed);
    },
    [uploadConnections]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && (file.name.endsWith(".csv") || file.type === "text/csv")) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={cn(
        "rounded-2xl border-2 border-dashed p-10 text-center transition-colors",
        isDragging ? "border-primary bg-primary/5" : "border-border/40 bg-card",
        uploadConnections.isPending && "opacity-60 pointer-events-none"
      )}
    >
      {uploadConnections.isPending ? (
        <Loader2 className="w-10 h-10 mx-auto text-primary animate-spin mb-4" />
      ) : (
        <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-4" />
      )}
      <h3 className="text-body font-semibold text-foreground mb-2">
        Upload your LinkedIn connections
      </h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
        Map your network to companies in the platform. Drop a CSV file here or click to browse.
      </p>
      <label>
        <input
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleInputChange}
          disabled={uploadConnections.isPending}
        />
        <Button variant="outline" size="sm" className="gap-2 cursor-pointer" asChild>
          <span>
            <FileText className="w-4 h-4" />
            Select CSV File
          </span>
        </Button>
      </label>
      <div className="mt-4">
        <a
          href="https://www.linkedin.com/help/linkedin/answer/a1339364/downloading-your-account-data"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline inline-flex items-center gap-1"
        >
          How to download your LinkedIn data
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
