BEGIN;
CREATE TABLE IF NOT EXISTS public.staff_monthly_commissions (
 staff_user_id uuid NOT NULL REFERENCES auth.users(id),
 report_month date NOT NULL CHECK (extract(day from report_month)=1),
 rate numeric(5,2) NOT NULL CHECK (rate>=0 AND rate<=100),
 PRIMARY KEY (staff_user_id,report_month)
);
ALTER TABLE public.staff_monthly_commissions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.staff_monthly_commissions FROM anon;
GRANT SELECT,INSERT,UPDATE ON public.staff_monthly_commissions TO authenticated;
DROP POLICY IF EXISTS commission_read ON public.staff_monthly_commissions;
CREATE POLICY commission_read ON public.staff_monthly_commissions FOR SELECT TO authenticated
USING (staff_user_id=auth.uid() OR EXISTS (SELECT 1 FROM public.staff_profiles s WHERE s.user_id=auth.uid() AND s.role::text IN ('super_admin','superadmin','finance')));
DROP POLICY IF EXISTS commission_insert ON public.staff_monthly_commissions;
CREATE POLICY commission_insert ON public.staff_monthly_commissions FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.staff_profiles s WHERE s.user_id=auth.uid() AND s.role::text IN ('super_admin','superadmin')));
DROP POLICY IF EXISTS commission_update ON public.staff_monthly_commissions;
CREATE POLICY commission_update ON public.staff_monthly_commissions FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.staff_profiles s WHERE s.user_id=auth.uid() AND s.role::text IN ('super_admin','superadmin')))
WITH CHECK (EXISTS (SELECT 1 FROM public.staff_profiles s WHERE s.user_id=auth.uid() AND s.role::text IN ('super_admin','superadmin')));
COMMIT;
