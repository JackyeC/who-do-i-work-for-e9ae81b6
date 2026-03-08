import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Upload, FileText, Shield, Loader2 } from "lucide-react";

interface Props {
  onUploadComplete: () => void;
}

export function DocumentUploader({ onUploadComplete }: Props) {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<string>("offer_letter");
  const [uploading, setUploading] = useState(false);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (selected.size > 10 * 1024 * 1024) {
      toast.error("File must be under 10MB");
      return;
    }
    setFile(selected);
  }, []);

  const handleUpload = async () => {
    if (!file || !user) return;
    setUploading(true);

    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "txt";
      const filePath = `${user.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("career_docs")
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: doc, error: insertError } = await supabase
        .from("user_documents")
        .insert({
          user_id: user.id,
          document_type: docType as any,
          file_path: filePath,
          original_filename: file.name,
        })
        .select()
        .single();
      if (insertError) throw insertError;

      toast.success("Document uploaded! Parsing in progress...");

      // Trigger parsing
      const { error: parseError } = await supabase.functions.invoke("parse-career-document", {
        body: { documentId: doc.id },
      });

      if (parseError) {
        console.error("Parse error:", parseError);
        toast.error("Upload successful but parsing failed. You can retry from Documents tab.");
      } else {
        toast.success("Document parsed successfully!");
      }

      setFile(null);
      onUploadComplete();
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Career Document
          </CardTitle>
          <CardDescription>
            Upload an offer letter, resume, or job description for AI signal analysis.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={docType} onValueChange={setDocType}>
            <SelectTrigger>
              <SelectValue placeholder="Document type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="offer_letter">Offer Letter</SelectItem>
              <SelectItem value="resume">Resume</SelectItem>
              <SelectItem value="job_description">Job Description</SelectItem>
            </SelectContent>
          </Select>

          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".pdf,.docx,.doc,.txt,.rtf"
              onChange={handleFileChange}
              className="hidden"
              id="career-doc-upload"
            />
            <label htmlFor="career-doc-upload" className="cursor-pointer">
              <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              {file ? (
                <p className="text-sm font-medium text-foreground">{file.name}</p>
              ) : (
                <>
                  <p className="text-sm font-medium text-foreground">Click to select a file</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, TXT — Max 10MB</p>
                </>
              )}
            </label>
          </div>

          <Button onClick={handleUpload} disabled={!file || uploading} className="w-full">
            {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
            {uploading ? "Uploading & Parsing..." : "Upload & Analyze"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-muted">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Privacy Protection</p>
              <p>Your documents are encrypted, accessible only to you, never shared publicly, and not used for AI training. You can delete them at any time.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
