import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, FileText, ClipboardPaste, Loader2, ShieldCheck, Trash2, ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default function OfferReviewDirect() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"file" | "paste">("file");
  const [pastedText, setPastedText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [consent, setConsent] = useState(false);
  const [deleteAfter, setDeleteAfter] = useState(false);
  const [uploading, setUploading] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center flex-col gap-4">
          <ShieldCheck className="w-10 h-10 text-primary" />
          <p className="text-muted-foreground">Sign in to use Private Offer Review.</p>
          <Button onClick={() => navigate("/login")}>Sign In</Button>
        </div>
        <Footer />
      </div>
    );
  }

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
      // Try to find or create company
      let companyId: string | null = null;
      if (companyName.trim()) {
        const { data: existing } = await supabase
          .from("companies")
          .select("id")
          .ilike("name", companyName.trim())
          .limit(1)
          .maybeSingle();
        companyId = existing?.id || null;
      }

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

      const insertPayload: any = {
        user_id: user.id,
        file_path: filePath,
        file_deleted: deleteAfter,
        original_filename: originalFilename,
        input_type: mode === "file" ? "file" : "pasted_text",
        extracted_text: mode === "paste" ? pastedText.trim() : null,
        processing_status: "pending",
      };

      if (companyId) {
        insertPayload.company_id = companyId;
      }

      const { data: review, error: insertError } = await supabase
        .from("offer_letter_reviews" as any)
        .insert(insertPayload)
        .select("id")
        .single();

      if (insertError) throw insertError;

      const reviewId = (review as any).id;

      await supabase.functions.invoke("extract-offer-terms", {
        body: { reviewId },
      });

      toast({ title: "Upload complete", description: "Your offer letter is being analyzed. This typically takes 30–60 seconds." });

      // Navigate to results
      if (companyId) {
        navigate(`/offer-review/${companyId}`);
      } else {
        navigate("/my-offer-reviews");
      }
    } catch (e: any) {
      console.error(e);
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <button
          onClick={() => navigate("/check?tab=offer")}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground font-display">Private Offer Review</h1>
          <Badge variant="outline" className="text-[10px]">Private</Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Upload your offer letter for a private, AI-powered review. Your document is visible only to you.
        </p>

        <Card className="border-primary/20">
          <CardContent className="p-6 space-y-5">
            {/* Optional company name */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Company Name (optional)</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Enter company name to link signals..."
                  className="pl-10"
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                If provided, your review will be linked to the company's public signals for comparison.
              </p>
            </div>

            {/* Mode toggle */}
            <div className="flex gap-2">
              <Button variant={mode === "file" ? "default" : "outline"} size="sm" onClick={() => setMode("file")} className="gap-1.5">
                <Upload className="w-3.5 h-3.5" /> Upload File
              </Button>
              <Button variant={mode === "paste" ? "default" : "outline"} size="sm" onClick={() => setMode("paste")} className="gap-1.5">
                <ClipboardPaste className="w-3.5 h-3.5" /> Paste Text
              </Button>
            </div>

            {mode === "file" ? (
              <div>
                <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" onChange={handleFileSelect} className="hidden" />
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/40 transition-colors"
                >
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      <span className="text-sm text-foreground">{selectedFile.name}</span>
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">Click to upload PDF, DOCX, or TXT</p>
                      <p className="text-[10px] text-muted-foreground mt-1">Max 10MB · Your document is encrypted and private</p>
                    </>
                  )}
                </div>
                {selectedFile && (
                  <label className="flex items-center gap-2 mt-3 cursor-pointer">
                    <Checkbox checked={deleteAfter} onCheckedChange={(c) => setDeleteAfter(!!c)} />
                    <span className="text-xs text-muted-foreground">Delete original file after analysis</span>
                  </label>
                )}
              </div>
            ) : (
              <Textarea
                placeholder="Paste the text from your offer letter here..."
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                rows={10}
                className="text-sm"
              />
            )}

            {/* Disclaimer */}
            <div className="bg-muted/50 rounded-lg p-3 text-[11px] text-muted-foreground">
              This tool identifies terms and clauses from uploaded documents. It provides educational insights only — not legal, financial, or employment advice. Analysis typically takes 30–60 seconds.
            </div>

            {/* Consent */}
            <label className="flex items-start gap-2 cursor-pointer">
              <Checkbox checked={consent} onCheckedChange={(c) => setConsent(!!c)} className="mt-0.5" />
              <span className="text-xs text-foreground">
                I confirm that I have the right to upload this document for personal review.
              </span>
            </label>

            <Button
              onClick={handleSubmit}
              disabled={!consent || uploading || (mode === "file" && !selectedFile) || (mode === "paste" && pastedText.trim().length < 50)}
              className="w-full gap-2"
              size="lg"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              {uploading ? "Analyzing..." : "Start Private Review"}
            </Button>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
