import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Plus, Download, Trash2, Clock, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const DOC_TYPES = [
  { value: "resume", label: "Tailored Resume", icon: "📄" },
  { value: "cover_letter", label: "Cover Letter", icon: "✍️" },
  { value: "dossier_snapshot", label: "Dossier Snapshot", icon: "🔍" },
  { value: "offer_risk_notes", label: "Offer Risk Notes", icon: "⚠️" },
  { value: "other", label: "Other", icon: "📎" },
];

interface DocumentVaultProps {
  applicationId: string;
}

export function ApplicationDocumentVault({ applicationId }: DocumentVaultProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newDoc, setNewDoc] = useState({ type: "resume", name: "", content: "" });

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["application-documents", applicationId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("application_documents")
        .select("*")
        .eq("application_id", applicationId)
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!applicationId,
  });

  const addDocument = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any)
        .from("application_documents")
        .insert({
          application_id: applicationId,
          user_id: user!.id,
          document_type: newDoc.type,
          file_name: newDoc.name || DOC_TYPES.find(d => d.value === newDoc.type)?.label || "Untitled",
          content_text: newDoc.content || null,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["application-documents", applicationId] });
      setDialogOpen(false);
      setNewDoc({ type: "resume", name: "", content: "" });
      toast({ title: "Document saved" });
    },
    onError: (e: any) => {
      toast({ title: "Failed to save document", description: e.message, variant: "destructive" });
    },
  });

  const deleteDocument = useMutation({
    mutationFn: async (docId: string) => {
      const { error } = await (supabase as any)
        .from("application_documents")
        .delete()
        .eq("id", docId)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["application-documents", applicationId] });
    },
  });

  const getDocMeta = (type: string) => DOC_TYPES.find(d => d.value === type) || DOC_TYPES[4];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Document Vault
          </CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                <Plus className="w-3 h-3" /> Add Document
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Document</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>Type</Label>
                  <Select value={newDoc.type} onValueChange={(v) => setNewDoc(p => ({ ...p, type: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DOC_TYPES.map(d => (
                        <SelectItem key={d.value} value={d.value}>{d.icon} {d.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Name</Label>
                  <Input
                    value={newDoc.name}
                    onChange={(e) => setNewDoc(p => ({ ...p, name: e.target.value }))}
                    placeholder={getDocMeta(newDoc.type).label}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Content</Label>
                  <Textarea
                    value={newDoc.content}
                    onChange={(e) => setNewDoc(p => ({ ...p, content: e.target.value }))}
                    placeholder="Paste your tailored content here..."
                    className="mt-1 min-h-[120px]"
                  />
                </div>
                <Button
                  onClick={() => addDocument.mutate()}
                  disabled={addDocument.isPending}
                  className="w-full"
                >
                  {addDocument.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Save Document
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map(i => <div key={i} className="h-14 rounded-lg bg-muted/30 animate-pulse" />)}
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-6">
            <FileText className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No documents yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Save your tailored resume, cover letter, or dossier notes for this application.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc: any) => {
              const meta = getDocMeta(doc.document_type);
              return (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border/40 bg-muted/5 hover:bg-muted/10 transition-colors group"
                >
                  <span className="text-lg shrink-0">{meta.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{doc.file_name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-[10px] font-mono">{meta.label}</Badge>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {format(new Date(doc.updated_at), "MMM d, yyyy")}
                      </span>
                      {doc.version > 1 && (
                        <span className="text-[10px] text-muted-foreground font-mono">v{doc.version}</span>
                      )}
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                    onClick={() => deleteDocument.mutate(doc.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
