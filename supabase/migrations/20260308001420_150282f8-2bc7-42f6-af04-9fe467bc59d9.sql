-- Allow authenticated users to insert manual signals into company_signal_scans
CREATE POLICY "Authenticated users can insert signal scans"
ON public.company_signal_scans
FOR INSERT
TO authenticated
WITH CHECK (true);
