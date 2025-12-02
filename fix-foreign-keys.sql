-- Fix foreign key relationships for Supabase schema cache
-- Run this in Supabase SQL Editor if you get relationship errors

-- Drop and recreate foreign key constraints to refresh Supabase cache
ALTER TABLE IF EXISTS public.members DROP CONSTRAINT IF EXISTS members_plan_id_fkey;
ALTER TABLE IF EXISTS public.payments DROP CONSTRAINT IF EXISTS payments_plan_id_fkey;

-- Recreate the foreign key constraints
ALTER TABLE public.members 
  ADD CONSTRAINT members_plan_id_fkey 
  FOREIGN KEY (plan_id) REFERENCES public.membership_plans(id);

ALTER TABLE public.payments 
  ADD CONSTRAINT payments_plan_id_fkey 
  FOREIGN KEY (plan_id) REFERENCES public.membership_plans(id);

-- Refresh the schema cache (Supabase should auto-detect this)
NOTIFY pgrst, 'reload schema';
