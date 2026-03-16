/**
 * Hook to aggregate all influence data for a company into a graph structure.
 * Pulls from entity_linkages, executives, candidates, stances, court cases, etc.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";
import type { GraphNode, GraphEdge, FilterCategory } from "@/lib/influence-graph-types";

function nodeId(type: string, name: string): string {
  return `${type}::${name.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 60)}`;
}

export function useInfluenceGraphData(companyId: string | undefined, companyName: string | undefined) {
  // Fetch all data in parallel
  const { data: linkages } = useQuery({
    queryKey: ["ig-linkages", companyId],
    queryFn: async () => {
      const { data } = await (supabase as any).from("entity_linkages").select("*").eq("company_id", companyId!).order("amount", { ascending: false });
      return data || [];
    },
    enabled: !!companyId,
  });

  const { data: executives } = useQuery({
    queryKey: ["ig-execs", companyId],
    queryFn: async () => {
      const { data } = await supabase.from("company_executives").select("*").eq("company_id", companyId!);
      return data || [];
    },
    enabled: !!companyId,
  });

  const { data: candidates } = useQuery({
    queryKey: ["ig-candidates", companyId],
    queryFn: async () => {
      const { data } = await supabase.from("company_candidates").select("*").eq("company_id", companyId!).order("amount", { ascending: false });
      return data || [];
    },
    enabled: !!companyId,
  });

  const { data: stances } = useQuery({
    queryKey: ["ig-stances", companyId],
    queryFn: async () => {
      const { data } = await supabase.from("company_public_stances").select("*").eq("company_id", companyId!);
      return data || [];
    },
    enabled: !!companyId,
  });

  const { data: darkMoney } = useQuery({
    queryKey: ["ig-dark", companyId],
    queryFn: async () => {
      const { data } = await supabase.from("company_dark_money").select("*").eq("company_id", companyId!);
      return data || [];
    },
    enabled: !!companyId,
  });

  const { data: tradeAssociations } = useQuery({
    queryKey: ["ig-trade", companyId],
    queryFn: async () => {
      const { data } = await (supabase as any).from("company_trade_associations").select("*").eq("company_id", companyId!);
      return data || [];
    },
    enabled: !!companyId,
  });

  const { data: courtCases } = useQuery({
    queryKey: ["ig-court", companyId],
    queryFn: async () => {
      const { data } = await supabase.from("company_court_cases").select("*").eq("company_id", companyId!).limit(20);
      return data || [];
    },
    enabled: !!companyId,
  });

  const { data: contradictions } = useQuery({
    queryKey: ["ig-contradictions", companyId],
    queryFn: async () => {
      const { data } = await (supabase as any).from("contradiction_signals").select("*").eq("company_id", companyId!);
      return data || [];
    },
    enabled: !!companyId,
  });

  const { data: issueSignals } = useQuery({
    queryKey: ["ig-issues", companyId],
    queryFn: async () => {
      const { data } = await (supabase as any).from("issue_signals").select("*").eq("entity_id", companyId!).order("amount", { ascending: false });
      return data || [];
    },
    enabled: !!companyId,
  });

  const { data: company } = useQuery({
    queryKey: ["ig-company", companyId],
    queryFn: async () => {
      const { data } = await supabase.from("companies").select("name, parent_company, industry, is_publicly_traded, ticker, state").eq("id", companyId!).single();
      return data;
    },
    enabled: !!companyId,
  });

  const isLoading = !linkages && !executives && !candidates;

  const graph = useMemo(() => {
    if (!companyId || !companyName) return { nodes: [] as GraphNode[], edges: [] as GraphEdge[] };

    const nodesMap = new Map<string, GraphNode>();
    const edges: GraphEdge[] = [];

    // Helper to add node
    const addNode = (id: string, label: string, type: GraphNode['type'], extra?: Partial<GraphNode>) => {
      if (!nodesMap.has(id)) {
        nodesMap.set(id, { id, label, type, confidence: 'medium', ...extra });
      }
    };

    // Center node: Company
    const companyNodeId = nodeId('company', companyName);
    addNode(companyNodeId, companyName, 'company', { confidence: 'high' });

    // Parent company
    if (company?.parent_company) {
      const pid = nodeId('parent_company', company.parent_company);
      addNode(pid, company.parent_company, 'parent_company', { confidence: 'high' });
      edges.push({
        source: pid, target: companyNodeId,
        edgeType: 'owns', label: 'owns',
        confidence: 'high', isContradiction: false,
      });
    }

    // Executives
    for (const exec of (executives || []).slice(0, 15)) {
      const eid = nodeId('executive', exec.name);
      addNode(eid, exec.name, 'executive', {
        confidence: exec.verification_status === 'verified' ? 'high' : 'medium',
        metadata: { title: exec.title, donations: exec.total_donations },
        lastUpdated: exec.updated_at,
      });
      edges.push({
        source: companyNodeId, target: eid,
        edgeType: 'appointed_to', label: exec.title || 'executive',
        confidence: 'high', isContradiction: false,
      });
    }

    // PAC donations to candidates
    for (const cand of (candidates || []).slice(0, 20)) {
      const cid = nodeId('politician', cand.name);
      addNode(cid, cand.name, 'politician', {
        confidence: 'high',
        amount: cand.amount,
        metadata: { party: cand.party, state: cand.state, district: cand.district },
      });

      // PAC node
      const pacId = nodeId('pac', `${companyName} PAC`);
      addNode(pacId, `${companyName} PAC`, 'pac', { confidence: 'high' });
      // Company → PAC (only once)
      if (!edges.some(e => e.source === companyNodeId && e.target === pacId)) {
        edges.push({
          source: companyNodeId, target: pacId,
          edgeType: 'owns', label: 'operates',
          confidence: 'high', isContradiction: false,
        });
      }
      // PAC → Candidate
      edges.push({
        source: pacId, target: cid,
        edgeType: 'donated_to',
        label: `$${cand.amount?.toLocaleString() || '0'}`,
        amount: cand.amount,
        confidence: 'high', isContradiction: false,
        sourceName: 'OpenFEC',
      });
    }

    // Entity linkages (lobbying, committee oversight, revolving door, etc.)
    for (const link of (linkages || []).slice(0, 50)) {
      const targetId = nodeId(
        link.target_entity_type === 'politician' ? 'politician' :
          link.target_entity_type === 'committee' ? 'agency' :
            link.target_entity_type === 'bill' ? 'legislation' :
              link.target_entity_type === 'lobbying_firm' ? 'lobbying_firm' :
                'issue',
        link.target_entity_name
      );

      const targetType: GraphNode['type'] =
        link.target_entity_type === 'politician' ? 'politician' :
          link.target_entity_type === 'committee' ? 'agency' :
            link.target_entity_type === 'bill' ? 'legislation' :
              link.target_entity_type === 'lobbying_firm' ? 'lobbying_firm' :
                link.target_entity_type === 'trade_association' ? 'trade_association' :
                  'issue';

      addNode(targetId, link.target_entity_name, targetType, {
        confidence: link.confidence_score >= 0.7 ? 'high' : link.confidence_score >= 0.4 ? 'medium' : 'low',
        amount: link.amount,
        lastUpdated: link.created_at,
      });

      const edgeType: GraphEdge['edgeType'] =
        link.link_type === 'donation_to_member' ? 'donated_to' :
          link.link_type === 'lobbying_on_bill' ? 'lobbied_on' :
            link.link_type === 'revolving_door' ? 'appointed_to' :
              link.link_type === 'trade_association_lobbying' ? 'member_of' :
                link.link_type === 'dark_money_channel' ? 'funded_by' :
                  link.link_type === 'committee_oversight_of_contract' ? 'oversight_of' :
                    link.link_type === 'advisory_committee_appointment' ? 'appointed_to' :
                      link.link_type === 'interlocking_directorate' ? 'member_of' :
                        'member_of';

      // Determine source node based on linkage
      const sourceNode = link.source_entity_name === companyName ? companyNodeId :
        nodesMap.has(nodeId('executive', link.source_entity_name)) ? nodeId('executive', link.source_entity_name) :
          nodesMap.has(nodeId('pac', link.source_entity_name)) ? nodeId('pac', link.source_entity_name) :
            companyNodeId;

      edges.push({
        source: sourceNode,
        target: targetId,
        edgeType,
        label: link.description || edgeType,
        amount: link.amount,
        date: link.created_at,
        confidence: link.confidence_score >= 0.7 ? 'high' : link.confidence_score >= 0.4 ? 'medium' : 'low',
        isContradiction: false,
        sourceName: (link.source_citation as any)?.source_name,
        evidenceUrl: (link.source_citation as any)?.source_url,
        description: link.description,
      });
    }

    // Public stances
    for (const stance of (stances || []).slice(0, 10)) {
      const sid = nodeId('statement', stance.topic);
      addNode(sid, stance.topic, 'statement', {
        confidence: 'medium',
        metadata: { position: stance.public_position, gap: stance.gap },
      });
      edges.push({
        source: companyNodeId, target: sid,
        edgeType: 'signed',
        label: stance.public_position || 'Public stance',
        confidence: 'medium', isContradiction: false,
      });
    }

    // Dark money
    for (const dm of (darkMoney || []).slice(0, 10)) {
      const did = nodeId('dark_money', dm.name);
      addNode(did, dm.name, 'dark_money', {
        confidence: dm.confidence === 'high' ? 'high' : 'medium',
        amount: dm.estimated_amount,
        metadata: { org_type: dm.org_type, relationship: dm.relationship },
      });
      edges.push({
        source: companyNodeId, target: did,
        edgeType: 'funded_by',
        label: dm.relationship || 'connected to',
        amount: dm.estimated_amount,
        confidence: dm.confidence === 'high' ? 'high' : 'medium',
        isContradiction: false,
      });
    }

    // Trade associations
    for (const ta of (tradeAssociations || []).slice(0, 10)) {
      const taid = nodeId('trade_association', ta.association_name || ta.name || 'Unknown');
      addNode(taid, ta.association_name || ta.name || 'Trade Association', 'trade_association', { confidence: 'medium' });
      edges.push({
        source: companyNodeId, target: taid,
        edgeType: 'member_of', label: 'member of',
        confidence: 'medium', isContradiction: false,
      });
    }

    // Court cases
    for (const cc of (courtCases || []).slice(0, 10)) {
      const ccid = nodeId('lawsuit', cc.case_name);
      addNode(ccid, cc.case_name, 'lawsuit', {
        confidence: cc.confidence === 'high' ? 'high' : 'medium',
        lastUpdated: cc.date_filed,
        sourceUrl: cc.courtlistener_url,
        metadata: { nature: cc.nature_of_suit, status: cc.status, court: cc.court_name },
      });
      edges.push({
        source: companyNodeId, target: ccid,
        edgeType: 'named_in', label: cc.plaintiff_or_defendant || 'named in',
        date: cc.date_filed,
        confidence: cc.confidence === 'high' ? 'high' : 'medium',
        isContradiction: false,
        evidenceUrl: cc.courtlistener_url,
      });
    }

    // Issue signals
    const issueCategories = new Set<string>();
    for (const is of (issueSignals || []).slice(0, 20)) {
      if (issueCategories.has(is.issue_category)) continue;
      issueCategories.add(is.issue_category);
      const iid = nodeId('issue', is.issue_category);
      addNode(iid, is.issue_category?.replace(/_/g, ' ') || 'Unknown Issue', 'issue', {
        confidence: is.confidence_score >= 0.7 ? 'high' : 'medium',
        amount: is.amount,
        sourceUrl: is.source_url,
      });
      edges.push({
        source: companyNodeId, target: iid,
        edgeType: 'lobbied_on',
        label: `${is.signal_type}: ${is.description?.slice(0, 60) || ''}`,
        amount: is.amount,
        confidence: is.confidence_score >= 0.7 ? 'high' : 'medium',
        isContradiction: false,
        sourceName: 'Issue Signal Pipeline',
        evidenceUrl: is.source_url,
      });
    }

    // Contradiction edges
    for (const c of (contradictions || [])) {
      // Find matching statement and spending nodes
      const stmtId = nodeId('statement', c.topic);
      if (nodesMap.has(stmtId)) {
        // Create a contradiction edge from the statement to the company
        edges.push({
          source: stmtId, target: companyNodeId,
          edgeType: 'contradicts',
          label: `Mismatch: ${c.spending_reality?.slice(0, 80)}`,
          confidence: c.severity === 'high' ? 'high' : 'medium',
          isContradiction: true,
          description: `${c.public_statement} ↔ ${c.spending_reality}`,
        });
      }
    }

    return { nodes: Array.from(nodesMap.values()), edges };
  }, [companyId, companyName, company, linkages, executives, candidates, stances, darkMoney, tradeAssociations, courtCases, contradictions, issueSignals]);

  return { graph, isLoading };
}
