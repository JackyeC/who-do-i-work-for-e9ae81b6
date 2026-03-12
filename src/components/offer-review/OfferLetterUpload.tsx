import { useState, useRef } from "react";
import { Upload, FileText, ClipboardPaste, Loader2, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface OfferLetterUploadProps {
  companyId: string;
  companyName: string;
  onReviewCreated: (reviewId: string) => void;
}

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function OfferLetterUpload({ companyId, companyName, onReviewCreated }: OfferLetterUploadProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"file" | "paste">("file");
  const [pastedText, setPastedText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [deleteAfter, setDeleteAfter] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type) && !file.name.endsWith(".txt")) {
      toast({ title: "Unsupported format", description: "Please upload a PDF, DOCX, or TXT file.", variant: "destructive" });
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast({ title: "File too large", description: "Maximum file size is 10MB.", variant: "destructive" });
      return;
    }
    setSelectedFile(file);
  };

  const handleSubmit = async () => {
    if (!user || !consent) return;
    if (mode === "file" && !selectedFile) return;
    if (mode === "paste" && pastedText.trim().length < 50) {
      toast({ title: "Too short", description: "Please paste more text from the offer letter.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      let filePath: string | null = null;
      let originalFilename: string | null = null;

      if (mode === "file" && selectedFile) {
        const ext = selectedFile.name.split(".").pop() || "pdf";
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("offer-letters")
          .upload(path, selectedFile);
        if (uploadError) throw uploadError;
        filePath = path;
        originalFilename = selectedFile.name;
      }

      // Create review record
      const { data: review, error: insertError } = await supabase
        .from("offer_letter_reviews" as any)
        .insert({
          user_id: user.id,
          company_id: companyId,
          file_path: filePath,
          file_deleted: deleteAfter,
          original_filename: originalFilename,
          input_type: mode === "file" ? "file" : "pasted_text",
          extracted_text: mode === "paste" ? pastedText.trim() : null,
          processing_status: "pending",
        } as any)
        .select("id")
        .single();

      if (insertError) throw insertError;

      const reviewId = (review as any).id;

      // Trigger extraction
      const { error: fnError } = await supabase.functions.invoke("extract-offer-terms", {
        body: { reviewId },
      });

      if (fnError) {
        console.error("Extraction error:", fnError);
        toast({ title: "Processing started", description: "Your document is being analyzed. Check back shortly." });
      }

      onReviewCreated(reviewId);
      toast({ title: "Upload complete", description: "Your offer letter is being analyzed privately." });
    } catch (e: any) {
      console.error(e);
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Private Offer Review</h3>
          <Badge variant="outline" className="text-[10px]">Private</Badge>
        </div>

        <p className="text-xs text-muted-foreground">
          Upload your offer letter from <span className="font-medium text-foreground">{companyName}</span> for a private, structured review. Your document is visible only to you.
        </p>

        {/* Mode toggle */}
        <div className="flex gap-2">
          <Button
            variant={mode === "file" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("file")}
            className="gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" /> Upload File
          </Button>
          <Button
            variant={mode === "paste" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("paste")}
            className="gap-1.5"
          >
            <ClipboardPaste className="w-3.5 h-3.5" /> Paste Text
          </Button>
        </div>

        {mode === "file" ? (
          <div>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/40 transition-colors"
            >
              {selectedFile ? (
                <div className="flex items-center justify-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  <span className="text-sm text-foreground">{selectedFile.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Click to upload PDF, DOCX, or TXT</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Max 10MB</p>
                </>
              )}
            </div>

            {selectedFile && (
              <label className="flex items-center gap-2 mt-3 cursor-pointer">
                <Checkbox
                  checked={deleteAfter}
                  onCheckedChange={(c) => setDeleteAfter(!!c)}
                />
                <span className="text-xs text-muted-foreground">Delete original file after analysis</span>
              </label>
            )}
          </div>
        ) : (
          <Textarea
            placeholder="Paste the text from your offer letter here..."
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            rows={8}
            className="text-sm"
          />
        )}

        {/* Disclaimer */}
        <div className="bg-muted/50 rounded-lg p-3 text-[11px] text-muted-foreground">
          This tool identifies terms and clauses from uploaded documents and compares them with publicly available company signals. It provides educational insights only — not legal, financial, or employment advice.
        </div>

        {/* Consent */}
        <label className="flex items-start gap-2 cursor-pointer">
          <Checkbox
            checked={consent}
            onCheckedChange={(c) => setConsent(!!c)}
            className="mt-0.5"
          />
          <span className="text-xs text-foreground">
            I understand this is not legal advice, I have the right to upload this document, and I agree to the <a href="/terms" target="_blank" className="text-primary hover:underline">Terms of Service</a>.
          </span>
        </label>

        <Button
          onClick={handleSubmit}
          disabled={!consent || uploading || (mode === "file" && !selectedFile) || (mode === "paste" && pastedText.trim().length < 50)}
          className="w-full gap-2"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
          {uploading ? "Analyzing..." : "Start Private Review"}
        </Button>
      </CardContent>
    </Card>
  );
}
