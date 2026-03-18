import { ChevronDown, FileText, Users, Landmark, Building2, Megaphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  stances: Array<{ topic: string; public_position: string; gap: string }>;
  linkages: Array<{ link_type: string; amount: number | null; description: string | null; target_entity_name: string }>;
  lobbyingRecords: Array<{ state: string; lobbying_spend?: number | null }>;
  tradeAssociations: Array<{ name: string }>;
  darkMoney: Array<{ name: string; org_type: string; estimated_amount: number | null }>;
}

function ReceiptSection({ icon: Icon, title, count, children }: { icon: any; title: string; count: number; children: React.ReactNode }) {
  return (
    <Collapsible>
      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">{title}</span>
          <Badge variant="outline" className="text-xs">{count}</Badge>
        </div>
        <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2 space-y-1.5">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function PolicyReceiptsPanel({ stances, linkages, lobbyingRecords, tradeAssociations, darkMoney }: Props) {
  const donations = linkages.filter(l => l.link_type === "donation_to_member" || l.link_type === "pac_contribution");
  const lobbyingLinks = linkages.filter(l => l.link_type === "lobbying_on_bill" || l.link_type === "lobbying_expenditure");
  const policyStances = stances.filter(s => ["Climate", "Labor", "Civil Rights", "Healthcare", "ESG", "Data Privacy", "Workers Rights", "Environment"].some(
    cat => s.topic.toLowerCase().includes(cat.toLowerCase())
  ));

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Policy & Governance Receipts</h3>
      <p className="text-xs text-muted-foreground">Documented records of corporate political activity and governance disclosures.</p>

      <div className="space-y-2">
        <ReceiptSection icon={FileText} title="Political Spending Disclosure" count={donations.length}>
          {donations.length === 0 ? (
            <p className="text-xs text-muted-foreground px-3 py-2">No documented political spending records found.</p>
          ) : (
            donations.slice(0, 10).map((d, i) => (
              <Card key={i} className="border-border/30">
                <CardContent className="p-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-foreground">{d.target_entity_name}</span>
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      {d.link_type === "pac_contribution" ? "Action" : "Action"}
                    </Badge>
                  </div>
                  {d.amount && <span className="text-xs font-mono text-muted-foreground">${d.amount.toLocaleString()}</span>}
                </CardContent>
              </Card>
            ))
          )}
        </ReceiptSection>

        <ReceiptSection icon={Users} title="Board Oversight Signals" count={linkages.filter(l => l.link_type === "revolving_door").length}>
          {linkages.filter(l => l.link_type === "revolving_door").length === 0 ? (
            <p className="text-xs text-muted-foreground px-3 py-2">No revolving door connections documented.</p>
          ) : (
            linkages.filter(l => l.link_type === "revolving_door").slice(0, 5).map((l, i) => (
              <Card key={i} className="border-border/30">
                <CardContent className="p-2.5">
                  <p className="text-xs text-foreground">{l.description || `${l.target_entity_name} — revolving door connection`}</p>
                </CardContent>
              </Card>
            ))
          )}
        </ReceiptSection>

        <ReceiptSection icon={Landmark} title="Lobbying Disclosure" count={lobbyingLinks.length + lobbyingRecords.length}>
          {lobbyingLinks.length === 0 && lobbyingRecords.length === 0 ? (
            <p className="text-xs text-muted-foreground px-3 py-2">No lobbying records found.</p>
          ) : (
            <>
              {lobbyingLinks.slice(0, 5).map((l, i) => (
                <Card key={`f-${i}`} className="border-border/30">
                  <CardContent className="p-2.5 flex items-center justify-between">
                    <span className="text-xs text-foreground">{l.description || l.target_entity_name}</span>
                    <Badge variant="outline" className="text-xs">Federal</Badge>
                  </CardContent>
                </Card>
              ))}
              {lobbyingRecords.slice(0, 5).map((l, i) => (
                <Card key={`s-${i}`} className="border-border/30">
                  <CardContent className="p-2.5 flex items-center justify-between">
                    <span className="text-xs text-foreground">{l.state} — state lobbying</span>
                    <div className="flex items-center gap-2">
                      {l.lobbying_spend && <span className="text-xs font-mono text-muted-foreground">${l.lobbying_spend.toLocaleString()}</span>}
                      <Badge variant="outline" className="text-xs">State</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </ReceiptSection>

        <ReceiptSection icon={Building2} title="Trade Association Memberships" count={tradeAssociations.length}>
          {tradeAssociations.length === 0 ? (
            <p className="text-xs text-muted-foreground px-3 py-2">No trade association memberships documented.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5 px-3 py-2">
              {tradeAssociations.map((ta, i) => (
                <Badge key={i} variant="secondary" className="text-xs gap-1">
                  {ta.name}
                  <span className="text-muted-foreground">· Association</span>
                </Badge>
              ))}
            </div>
          )}
        </ReceiptSection>

        <ReceiptSection icon={Megaphone} title="Public Policy Positions" count={policyStances.length}>
          {policyStances.length === 0 ? (
            <p className="text-xs text-muted-foreground px-3 py-2">No ESG/workforce/social policy positions on record.</p>
          ) : (
            policyStances.slice(0, 8).map((s, i) => (
              <Card key={i} className="border-border/30">
                <CardContent className="p-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-foreground">{s.topic}</span>
                      <Badge variant="outline" className="text-xs text-muted-foreground">Statement</Badge>
                    </div>
                    <Badge variant={s.gap === "aligned" ? "success" : s.gap === "direct-conflict" ? "destructive" : "outline"} className="text-xs">
                      {s.gap === "aligned" ? "Aligned" : s.gap === "direct-conflict" ? "Contradiction" : "Mixed"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{s.public_position}</p>
                </CardContent>
              </Card>
            ))
          )}
        </ReceiptSection>
      </div>

      {darkMoney.length > 0 && (
        <div className="mt-3 p-3 rounded-lg border border-destructive/20 bg-destructive/5">
          <p className="text-xs font-medium text-destructive mb-1">⚠️ Undisclosed Channels Detected</p>
          <p className="text-[11px] text-muted-foreground">
            {darkMoney.length} organization(s) linked to undisclosed spending — totaling ~${darkMoney.reduce((s, d) => s + (d.estimated_amount || 0), 0).toLocaleString()}.
          </p>
        </div>
      )}
    </div>
  );
}
