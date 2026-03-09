import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";
import {
  Users, UserPlus, ExternalLink, Building2, Briefcase,
  Search, Plus, Loader2, MessageSquare
} from "lucide-react";

const CONTACT_TYPE_LABELS: Record<string, string> = {
  recruiter: "Recruiter",
  hiring_manager: "Hiring Manager",
  mentor: "Mentor",
  peer: "Peer",
  thought_leader: "Thought Leader",
};

const CONTACT_TYPE_COLORS: Record<string, string> = {
  recruiter: "bg-[hsl(var(--civic-blue))]/10 text-[hsl(var(--civic-blue))]",
  hiring_manager: "bg-[hsl(var(--civic-green))]/10 text-[hsl(var(--civic-green))]",
  mentor: "bg-[hsl(var(--civic-gold))]/10 text-[hsl(var(--civic-gold))]",
  peer: "bg-primary/10 text-primary",
  thought_leader: "bg-accent text-accent-foreground",
};

export function OutreachIntelligence() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newContact, setNewContact] = useState({
    name: "", company: "", title: "", profile_url: "",
    contact_type: "peer", industry: "",
  });

  // Fetch contacts
  const { data: contacts, isLoading } = useQuery({
    queryKey: ["career-contacts"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("career_contacts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      return data || [];
    },
  });

  // Fetch user's growth tracks to generate outreach suggestions
  const { data: tracks } = useQuery({
    queryKey: ["growth-tracks", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("employee_growth_tracker")
        .select("target_role, gap_analysis")
        .eq("user_id", user!.id)
        .limit(5);
      return data || [];
    },
    enabled: !!user,
  });

  const addContact = useMutation({
    mutationFn: async () => {
      if (!user || !newContact.name.trim()) throw new Error("Name is required");
      const { error } = await (supabase as any)
        .from("career_contacts")
        .insert({
          ...newContact,
          created_by: user.id,
          role_tags: tracks?.map((t: any) => t.target_role).filter(Boolean) || [],
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["career-contacts"] });
      toast.success("Contact added!");
      setNewContact({ name: "", company: "", title: "", profile_url: "", contact_type: "peer", industry: "" });
      setShowAddForm(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const targetRoles = (tracks || []).map((t: any) => t.target_role).filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Who Should I Reach Out To? */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2 font-display">
                <MessageSquare className="w-4 h-4 text-[hsl(var(--civic-blue))]" />
                Who Should I Reach Out To?
              </CardTitle>
              <CardDescription className="mt-1">
                People who can help you reach your target roles. Based on your career path and values.
              </CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={() => setShowAddForm(!showAddForm)}>
              <Plus className="w-4 h-4 mr-1" /> Add Contact
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Outreach suggestions based on target roles */}
          {targetRoles.length > 0 && (
            <div className="mb-6 p-4 rounded-lg bg-muted/50 space-y-2">
              <p className="text-sm font-medium text-foreground">💡 Outreach Strategy</p>
              <div className="space-y-1.5 text-sm text-muted-foreground">
                {targetRoles.slice(0, 3).map((role: string, i: number) => (
                  <div key={i} className="flex items-start gap-2">
                    <Briefcase className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
                    <span>
                      For <span className="font-medium text-foreground">{role}</span>: Connect with recruiters at values-aligned companies, people currently in this role, and talent leaders in your target industry.
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add contact form */}
          {showAddForm && (
            <div className="mb-6 p-4 rounded-lg border border-border space-y-3">
              <p className="text-sm font-medium text-foreground">Add a New Contact</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input placeholder="Name *" value={newContact.name} onChange={(e) => setNewContact(p => ({ ...p, name: e.target.value }))} />
                <Input placeholder="Title" value={newContact.title} onChange={(e) => setNewContact(p => ({ ...p, title: e.target.value }))} />
                <Input placeholder="Company" value={newContact.company} onChange={(e) => setNewContact(p => ({ ...p, company: e.target.value }))} />
                <Input placeholder="Industry" value={newContact.industry} onChange={(e) => setNewContact(p => ({ ...p, industry: e.target.value }))} />
                <Input placeholder="Profile URL (LinkedIn, website)" value={newContact.profile_url} onChange={(e) => setNewContact(p => ({ ...p, profile_url: e.target.value }))} />
                <Select value={newContact.contact_type} onValueChange={(v) => setNewContact(p => ({ ...p, contact_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CONTACT_TYPE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => addContact.mutate()} disabled={addContact.isPending || !newContact.name.trim()}>
                  {addContact.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Contact"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowAddForm(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {/* Contact list */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : contacts && contacts.length > 0 ? (
            <div className="space-y-2">
              {contacts.map((c: any) => (
                <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{c.name}</p>
                      <Badge className={`text-[10px] px-1.5 py-0 ${CONTACT_TYPE_COLORS[c.contact_type] || ""}`}>
                        {CONTACT_TYPE_LABELS[c.contact_type] || c.contact_type}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {[c.title, c.company, c.industry].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  {c.profile_url && (
                    <a href={c.profile_url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                      <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-primary" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={UserPlus}
              title="No contacts yet"
              description="Add recruiters, mentors, and networking targets to track your outreach. Start by adding people in roles you're targeting."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
