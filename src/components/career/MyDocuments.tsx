import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FileText, Trash2, RefreshCw, AlertTriangle, CheckCircle, Clock, Loader2 } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";

const typeLabels: Record<string, string> = {
  offer_letter: "Offer Letter",
  resume: "Resume",
  job_description: "Job Description",
};

const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
  pending: { icon: Clock, color: "text-muted-foreground", label: "Pending" },
  parsing: { icon: Loader2, color: "text-primary", label: "Parsing..." },
  parsed: { icon: CheckCircle, color: "text-civic-green", label: "Parsed" },
  error: { icon: AlertTriangle, color: "text-destructive", label: "Error" },
  deleted: { icon: Trash2, color: "text-muted-foreground", label: "Deleted" },
};

export function MyDocuments() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: docs, isLoading } = useQuery({
    queryKey: ["user-documents", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_documents")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const handleDelete = async (docId: string, filePath: string) => {
    try {
      await supabase.storage.from("career_docs").remove([filePath]);
      await supabase.from("user_documents").delete().eq("id", docId);
      queryClient.invalidateQueries({ queryKey: ["user-documents"] });
      toast.success("Document deleted");
    } catch (err: any) {
      toast.error("Failed to delete document");
    }
  };

  const handleRetry = async (docId: string) => {
    const { error } = await supabase.functions.invoke("parse-career-document", {
      body: { documentId: docId },
    });
    if (error) {
      toast.error("Retry failed");
    } else {
      toast.success("Re-parsing started!");
      queryClient.invalidateQueries({ queryKey: ["user-documents"] });
    }
  };

  if (isLoading) return <div className="text-center text-muted-foreground py-8">Loading documents...</div>;

  if (!docs?.length) {
    return <EmptyState icon={FileText} title="No documents yet" description="Upload an offer letter, resume, or job description to get started." />;
  }

  return (
    <div className="space-y-3">
      {docs.map((doc: any) => {
        const status = statusConfig[doc.status] || statusConfig.pending;
        const StatusIcon = status.icon;
        const signals = doc.parsed_signals || {};

        return (
          <Card key={doc.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">{typeLabels[doc.document_type] || doc.document_type}</Badge>
                    <span className={`flex items-center gap-1 text-xs ${status.color}`}>
                      <StatusIcon className={`w-3.5 h-3.5 ${doc.status === 'parsing' ? 'animate-spin' : ''}`} />
                      {status.label}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-foreground truncate">{doc.original_filename || "Unnamed"}</p>
                  <p className="text-xs text-muted-foreground">{new Date(doc.created_at).toLocaleDateString()}</p>

                  {doc.status === "parsed" && (
                    <div className="mt-2 space-y-1">
                      {doc.document_type === "offer_letter" && signals.financials && (
                        <div className="text-xs text-muted-foreground">
                          {signals.financials.base_salary && <span className="mr-3">💰 {signals.financials.base_salary}</span>}
                          {signals.risk_signals?.length > 0 && (
                            <span className="text-destructive">⚠️ {signals.risk_signals.length} risk signal(s)</span>
                          )}
                        </div>
                      )}
                      {doc.document_type === "resume" && (
                        <div className="text-xs text-muted-foreground">
                          {signals.seniority_level && <span className="mr-3">📊 {signals.seniority_level}</span>}
                          {signals.skills?.length > 0 && <span>{signals.skills.length} skills detected</span>}
                        </div>
                      )}
                      {doc.document_type === "job_description" && signals.role_title && (
                        <div className="text-xs text-muted-foreground">
                          🎯 {signals.role_title}
                          {signals.salary_transparency?.disclosed && <span className="ml-2 text-civic-green">💰 Salary disclosed</span>}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex gap-1">
                  {doc.status === "error" && (
                    <Button variant="ghost" size="icon" onClick={() => handleRetry(doc.id)}>
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(doc.id, doc.file_path)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
