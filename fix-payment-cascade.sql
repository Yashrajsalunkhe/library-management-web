-- ===============================================================
-- FIX PAYMENT CASCADE DELETION ISSUE
-- ===============================================================
-- This script fixes the foreign key constraint on payments table
-- to prevent payment deletion when a member is deleted
-- 
-- SAFE TO RUN: This script can be run multiple times
-- ===============================================================

-- Step 1: Drop the existing foreign key constraint on payments.member_id
ALTER TABLE public.payments 
DROP CONSTRAINT IF EXISTS payments_member_id_fkey;

-- Step 2: Re-add the foreign key with ON DELETE SET NULL
-- This preserves payment records for accounting purposes when a member is deleted
ALTER TABLE public.payments 
ADD CONSTRAINT payments_member_id_fkey 
FOREIGN KEY (member_id) 
REFERENCES public.members(id) 
ON DELETE SET NULL;

-- Step 3: Do the same for payments.plan_id if it exists
ALTER TABLE public.payments 
DROP CONSTRAINT IF EXISTS payments_plan_id_fkey;

ALTER TABLE public.payments 
ADD CONSTRAINT payments_plan_id_fkey 
FOREIGN KEY (plan_id) 
REFERENCES public.membership_plans(id) 
ON DELETE SET NULL;

-- Step 4: Fix book_issues if the table exists
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'book_issues') THEN
    -- Drop and recreate constraints for book_issues
    ALTER TABLE public.book_issues 
    DROP CONSTRAINT IF EXISTS book_issues_member_id_fkey;
    
    ALTER TABLE public.book_issues 
    ADD CONSTRAINT book_issues_member_id_fkey 
    FOREIGN KEY (member_id) 
    REFERENCES public.members(id) 
    ON DELETE SET NULL;
    
    RAISE NOTICE 'Fixed book_issues.member_id constraint';
  END IF;
END $$;

-- Step 5: Add indexes for better performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_payments_member_id ON public.payments(member_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON public.payments(payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_payments_member_date ON public.payments(member_id, payment_date DESC) WHERE member_id IS NOT NULL;

-- Verify the changes
DO $$
DECLARE
  constraint_def TEXT;
BEGIN
  SELECT pg_get_constraintdef(oid) INTO constraint_def
  FROM pg_constraint
  WHERE conname = 'payments_member_id_fkey';
  
  RAISE NOTICE 'New constraint definition: %', constraint_def;
  
  IF constraint_def LIKE '%ON DELETE SET NULL%' THEN
    RAISE NOTICE '✓ SUCCESS: Payment records will be preserved when members are deleted';
  ELSE
    RAISE WARNING '✗ WARNING: Constraint may not be correctly set';
  END IF;
END $$;

-- Display summary
SELECT 
  'Payment Cascade Fix Applied' as status,
  'Payments will now be preservegit d with member_id set to NULL when member is deleted' as description;
