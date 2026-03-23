import { useState } from "react";
import { usePageSEO } from "@/hooks/use-page-seo";
import { Helmet } from "react-helmet-async";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Briefcase, Bell, AlertTriangle, FileText, Calendar, CheckCircle2,
  Circle, Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface Notification {
  id: string;
  type: "aligned_role" | "status_update" | "interview" | "dossier_ready" | "integrity_alert";
  title: string;
  body: string;
  time: string;
  read: boolean;
  company?: string;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: "1", type: "aligned_role", title: "New aligned role found", body: "Senior Product Manager at Patagonia — 94% aligned with your values profile.", time: "12 minutes ago", read: false, company: "Patagonia" },
  { id: "2", type: "integrity_alert", title: "Narrative Gap detected", body: "Salesforce, where you applied last week, received a new layoff signal despite stated growth commitments.", time: "2 hours ago", read: false, company: "Salesforce" },
  { id: "3", type: "dossier_ready", title: "Dossier ready for review", body: "Your intelligence dossier for Khan Academy is complete and ready for review.", time: "5 hours ago", read: false, company: "Khan Academy" },
  { id: "4", type: "status_update", title: "Application status changed", body: "Your application for ML Engineer at Salesforce moved to 'Under Review'.", time: "1 day ago", read: true, company: "Salesforce" },
  { id: "5", type: "interview", title: "Interview preparation available", body: "Your Interview Kit for Patagonia is ready — 10 practice questions tailored to your values.", time: "1 day ago", read: true, company: "Patagonia" },
  { id: "6", type: "aligned_role", title: "New aligned role found", body: "Curriculum Designer at Khan Academy — 91% aligned. Remote-first, mission-driven.", time: "2 days ago", read: true, company: "Khan Academy" },
  { id: "7", type: "integrity_alert", title: "Company score updated", body: "NVIDIA's work-life balance score dropped from 3.4 to 3.2 based on new Glassdoor data.", time: "3 days ago", read: true, company: "NVIDIA" },
  { id: "8", type: "status_update", title: "Application submitted", body: "Your agent submitted your application for Operations Coordinator at Best Friends Animal Society.", time: "4 days ago", read: true, company: "Best Friends" },
];

const ICON_MAP = {
  aligned_role: Briefcase,
  status_update: CheckCircle2,
  interview: Calendar,
  dossier_ready: FileText,
  integrity_alert: AlertTriangle,
};

const COLOR_MAP = {
  aligned_role: "text-primary",
  status_update: "text-emerald-400",
  interview: "text-blue-400",
  dossier_ready: "text-violet-400",
  integrity_alert: "text-amber-400",
};

export default function Inbox() {
  usePageSEO({ title: "Inbox — Who Do I Work For?" });
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-background">
      <Helmet><title>Inbox — Who Do I Work For?</title></Helmet>
      <div className="border-b border-border/30 bg-muted/20 px-6 py-2">
        <p className="text-xs text-muted-foreground italic text-center">You deserve to know exactly who you work for.</p>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-5">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground font-display flex items-center gap-2">
              Inbox
              {unreadCount > 0 && (
                <Badge className="bg-primary text-primary-foreground text-xs px-2 py-0.5">{unreadCount}</Badge>
              )}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Your career intelligence activity feed.</p>
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllRead} className="text-xs text-muted-foreground">
              Mark all read
            </Button>
          )}
        </div>

        <div className="space-y-2">
          {notifications.map((n, i) => {
            const Icon = ICON_MAP[n.type];
            const iconColor = COLOR_MAP[n.type];
            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, duration: 0.35 }}
              >
                <Card
                  className={cn(
                    "transition-all duration-200 cursor-pointer",
                    !n.read ? "border-primary/20 bg-primary/[0.02]" : "border-border/40"
                  )}
                  onClick={() => markAsRead(n.id)}
                >
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className={cn("mt-0.5 shrink-0", iconColor)}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={cn("text-sm font-medium", n.read ? "text-foreground/70" : "text-foreground")}>
                          {n.title}
                        </p>
                        {!n.read && <Circle className="w-2 h-2 fill-primary text-primary shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.body}</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">{n.time}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
