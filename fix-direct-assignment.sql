-- DIRECT FIX FOR USER ISOLATION - CHECK AND ASSIGN DATA
-- This script will directly check the data and fix user assignments

-- =================================================================
-- STEP 1: CHECK CURRENT DATA STATE
-- =================================================================

-- Check what users exist
SELECT 
    'USERS IN SYSTEM:' as info,
    id as user_id,
    email,
    created_at
FROM auth.users
ORDER BY created_at;

-- Check members without RLS (as service role)
SELECT 
    'MEMBERS DATA (RAW):' as info,
    id,
    name,
    user_id,
    CASE 
        WHEN user_id IS NULL THEN '⚠ NO USER_ID'
        ELSE '✓ HAS USER_ID'
    END as user_id_status
FROM public.members;

-- =================================================================
-- STEP 2: FIX DATA ASSIGNMENT
-- =================================================================

-- First, let's temporarily disable RLS to fix the data
ALTER TABLE public.members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenditures DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;

-- Assign all existing data to the first user (your original account)
DO $$
DECLARE
    first_user_id UUID;
BEGIN
    -- Get the first user ID
    SELECT id INTO first_user_id FROM auth.users ORDER BY created_at LIMIT 1;
    
    IF first_user_id IS NOT NULL THEN
        -- Update members
        UPDATE public.members 
        SET user_id = first_user_id 
        WHERE user_id IS NULL OR user_id != first_user_id;
        
        -- Update payments
        UPDATE public.payments 
        SET user_id = first_user_id 
        WHERE user_id IS NULL OR user_id != first_user_id;
        
        -- Update attendance
        UPDATE public.attendance 
        SET user_id = first_user_id 
        WHERE user_id IS NULL OR user_id != first_user_id;
        
        -- Update expenditures
        UPDATE public.expenditures 
        SET user_id = first_user_id 
        WHERE user_id IS NULL OR user_id != first_user_id;
        
        -- Update membership_plans
        UPDATE public.membership_plans 
        SET user_id = first_user_id 
        WHERE user_id IS NULL OR user_id != first_user_id;
        
        -- Update settings
        UPDATE public.settings 
        SET user_id = first_user_id 
        WHERE user_id IS NULL OR user_id != first_user_id;
        
        RAISE NOTICE 'All existing data assigned to user: %', first_user_id;
    END IF;
END $$;

-- =================================================================
-- STEP 3: RE-ENABLE RLS WITH CLEAN POLICIES
-- =================================================================

-- Re-enable RLS
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenditures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Drop all policies first
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('members', 'payments', 'attendance', 'expenditures', 'membership_plans', 'settings')
    LOOP
        EXECUTE format('DROP POLICY %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- Create simple, working policies
CREATE POLICY "user_data_policy" ON public.members FOR ALL USING (user_id = auth.uid());
CREATE POLICY "user_data_policy" ON public.payments FOR ALL USING (user_id = auth.uid());
CREATE POLICY "user_data_policy" ON public.attendance FOR ALL USING (user_id = auth.uid());
CREATE POLICY "user_data_policy" ON public.expenditures FOR ALL USING (user_id = auth.uid());
CREATE POLICY "user_data_policy" ON public.membership_plans FOR ALL USING (user_id = auth.uid());
CREATE POLICY "user_data_policy" ON public.settings FOR ALL USING (user_id = auth.uid());

-- =================================================================
-- STEP 4: VERIFY THE FIX
-- =================================================================

-- Check data assignment after fix
SELECT 
    'VERIFICATION - Members after fix:' as info,
    COUNT(*) as total_members,
    COUNT(DISTINCT user_id) as unique_users,
    array_agg(DISTINCT user_id) as user_ids
FROM public.members;

SELECT 
    'VERIFICATION - Current user can see:' as info,
    COUNT(*) as visible_members
FROM public.members;

-- Show which user owns the data
SELECT 
    'DATA OWNERSHIP:' as info,
    u.email as user_email,
    COUNT(m.id) as member_count
FROM auth.users u
LEFT JOIN public.members m ON m.user_id = u.id
GROUP BY u.id, u.email
ORDER BY u.created_at;

SELECT 'Fix completed! Now each user should only see their own data.' as final_status;