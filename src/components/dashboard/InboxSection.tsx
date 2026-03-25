import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { FileText, AlertTriangle, Eye, Bell, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface InboxMessage {
  id: string;
  type: "dossier" | "alert" | "viewed" | "match" | "update";
  title: string;
  body: string;
  time: string;
  read: boolean;
}

const SAMPLE_MESSAGES: InboxMessage[] = [
  { id: "1", type: "dossier", title: "Dossier Ready", body: "Your dossier for Meridian Health Tech is ready. Review their integrity score and interview prep before your call.", time: "2 hours ago", read: false },
  { id: "2", type: "alert", title: "Integrity Alert", body: "New integrity alert: TechCorp updated their Glassdoor score from 3.2 to 2.8. Narrative gap flag triggered.", time: "5 hours ago", read: false },
  { id: "3", type: "viewed", title: "Cover Letter Viewed", body: "Your cover letter for People Operations Manager at Meridian was opened by the hiring team.", time: "1 day ago", read: false },
  { id: "4", type: "match", title: "New Aligned Role", body: "Community Health Director at Evergreen Community Health matches 96% with your values profile. Integrity score: 91.", time: "1 day ago", read: true },
  { id: "5", type: "update", title: "Application Update", body: "Canopy Financial Group moved your application to 'Interview' stage. Prep your interview kit.", time: "2 days ago", read: true },
  { id: "6", type: "alert", title: "Watchlist Signal", body: "Axiom Defense Systems: new EEOC complaint filed. Your watchlist has been updated.", time: "3 days ago", read: true },
];

const TYPE_ICONS: Record<string, { icon: typeof FileText; color: string }> = {
  dossier: { icon: FileText, color: "text-primary" },
  alert: { icon: AlertTriangle, color: "text-civic-yellow" },
  viewed: { icon: Eye, color: "text-civic-green" },
  match: { icon: Bell, color: "text-civic-blue" },
  update: { icon: CheckCircle2, color: "text-civic-green" },
};

export function InboxSection() {
  const [messages, setMessages] = useState(SAMPLE_MESSAGES);

  const markRead = (id: string) => {
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, read: true } : m));
  };

  const unreadCount = messages.filter((m) => !m.read).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Badge className="bg-primary text-primary-foreground text-xs h-5 min-w-5 flex items-center justify-center rounded-full">
              {unreadCount}
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">{unreadCount} unread</span>
        </div>
      </div>

      {messages.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/30 p-12 text-center">
          <Bell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No messages yet — your agent is watching.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {messages.map((msg) => {
            const typeInfo = TYPE_ICONS[msg.type] || TYPE_ICONS.update;
            const Icon = typeInfo.icon;
            return (
              <div
                key={msg.id}
                onClick={() => markRead(msg.id)}
                className={cn(
                  "rounded-xl border bg-card p-4 cursor-pointer transition-all duration-200 hover:border-primary/20",
                  msg.read ? "border-border/20 opacity-70" : "border-border/40 shadow-sm"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn("mt-0.5 shrink-0", typeInfo.color)}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className={cn("text-sm truncate", msg.read ? "text-muted-foreground" : "font-semibold text-foreground")}>{msg.title}</h4>
                      {!msg.read && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{msg.body}</p>
                    <p className="text-xs text-muted-foreground/50 mt-1.5">{msg.time}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
