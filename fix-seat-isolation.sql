-- Fix seat number isolation per user
-- This migration adds user_id to members table and fixes the unique constraint

-- Step 1: Add user_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'members' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.members ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        
        -- Set user_id for existing records to the first authenticated user
        -- You may need to adjust this based on your actual users
        UPDATE public.members 
        SET user_id = (SELECT id FROM auth.users LIMIT 1)
        WHERE user_id IS NULL;
        
        -- Make user_id NOT NULL after setting values
        ALTER TABLE public.members ALTER COLUMN user_id SET NOT NULL;
    END IF;
END $$;

-- Step 2: Drop the global UNIQUE constraint on seat_no
DO $$
BEGIN
    -- Drop the unique constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'members_seat_no_key' 
        AND table_name = 'members'
    ) THEN
        ALTER TABLE public.members DROP CONSTRAINT members_seat_no_key;
    END IF;
END $$;

-- Step 3: Create a partial unique index for active members per user
-- This allows the same seat number for different users
-- But ensures only one active member can have a specific seat number per user
DROP INDEX IF EXISTS idx_members_unique_active_seat;
CREATE UNIQUE INDEX idx_members_unique_active_seat 
ON public.members (user_id, seat_no) 
WHERE status = 'active' AND seat_no IS NOT NULL AND seat_no != '';

-- Step 4: Update RLS policies for proper user isolation
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.members;
DROP POLICY IF EXISTS "Users can view their own members" ON public.members;
DROP POLICY IF EXISTS "Users can insert their own members" ON public.members;
DROP POLICY IF EXISTS "Users can update their own members" ON public.members;
DROP POLICY IF EXISTS "Users can delete their own members" ON public.members;

-- Create user-isolated policies
CREATE POLICY "Users can view their own members" 
ON public.members FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own members" 
ON public.members FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own members" 
ON public.members FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own members" 
ON public.members FOR DELETE 
USING (auth.uid() = user_id);

-- Step 5: Create index on user_id for better query performance
CREATE INDEX IF NOT EXISTS idx_members_user_id ON public.members(user_id);

-- Step 6: Similarly update other tables for user isolation
-- Payments
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
UPDATE public.payments SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.payments;
DROP POLICY IF EXISTS "Users can manage their own payments" ON public.payments;
CREATE POLICY "Users can manage their own payments" ON public.payments FOR ALL USING (auth.uid() = user_id);

-- Attendance
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
UPDATE public.attendance SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.attendance;
DROP POLICY IF EXISTS "Users can manage their own attendance" ON public.attendance;
CREATE POLICY "Users can manage their own attendance" ON public.attendance FOR ALL USING (auth.uid() = user_id);

-- Expenditures
ALTER TABLE public.expenditures ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
UPDATE public.expenditures SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.expenditures;
DROP POLICY IF EXISTS "Users can manage their own expenditures" ON public.expenditures;
CREATE POLICY "Users can manage their own expenditures" ON public.expenditures FOR ALL USING (auth.uid() = user_id);

-- Notifications  
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
UPDATE public.notifications SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.notifications;
DROP POLICY IF EXISTS "Users can manage their own notifications" ON public.notifications;
CREATE POLICY "Users can manage their own notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id);

COMMENT ON COLUMN public.members.user_id IS 'Links member to the authenticated user who created it - for multi-tenant isolation';
COMMENT ON INDEX idx_members_unique_active_seat IS 'Ensures seat numbers are unique per user for active members only';
