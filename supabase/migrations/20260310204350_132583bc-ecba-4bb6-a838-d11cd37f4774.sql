
-- Fix remaining permissive write policies

-- issue_signals: Only service role should insert/update (it bypasses RLS)
DROP POLICY IF EXISTS "Service role can insert issue signals" ON public.issue_signals;
DROP POLICY IF EXISTS "Service role can update issue signals" ON public.issue_signals;

-- policy_reports: Remove remaining ALL policy (read-only already exists)
DROP POLICY IF EXISTS "Auth users manage reports" ON public.policy_reports;

-- report_company_alignment: Remove remaining ALL policy (read-only already exists)  
DROP POLICY IF EXISTS "Auth users manage alignment" ON public.report_company_alignment;

-- scan_runs: Remove overly permissive service role ALL policy (service role bypasses RLS)
DROP POLICY IF EXISTS "Service role full access to scan runs" ON public.scan_runs;
