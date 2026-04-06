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
  const [mode, setMode] = useState<"file" | "paste">("paste");
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
    console.log("[OfferLetterUpload] Starting upload", { mode, fileSize: selectedFile?.size, textLength: pastedText.length });
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
      toast({ title: "Analysis complete", description: "Your offer terms have been analyzed. Nothing was stored." });
    } catch (e: any) {
      console.error("[OfferLetterUpload] Upload error:", e, JSON.stringify(e));
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
          <h3 className="font-semibold text-foreground">Check Your Offer Privately</h3>
          <Badge variant="outline" className="text-xs">Nothing Saved</Badge>
        </div>

        <p className="text-xs text-muted-foreground">
          Got an offer from <span className="font-medium text-foreground">{companyName}</span>? Paste only the terms you want reviewed. Do not include personal information such as name, address, or signature.
        </p>

        <p className="text-[10px] text-primary/80 font-medium">
          Your input is processed in-session and not stored.
        </p>

        {/* Mode toggle — paste is primary */}
        <div className="flex gap-2">
          <Button
            variant={mode === "paste" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("paste")}
            className="gap-1.5"
          >
            <ClipboardPaste className="w-3.5 h-3.5" /> Paste Terms
          </Button>
          <Button
            variant={mode === "file" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("file")}
            className="gap-1.5 text-muted-foreground"
          >
            <Upload className="w-3.5 h-3.5" /> Upload Redacted Doc
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
                   <p className="text-sm text-muted-foreground">Click to upload a redacted document</p>
                   <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, or TXT — max 10MB. Remove personal info first.</p>
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
            placeholder="Paste the offer terms you want reviewed here. Do not include your name, address, or signature."
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            rows={8}
            className="text-sm"
          />
        )}

        {/* Disclaimer */}
        <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
          Your input is processed in-session and not stored. We extract terms, flag clauses, and compare against public company signals so you can negotiate from a position of knowledge. This is not legal advice.
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
