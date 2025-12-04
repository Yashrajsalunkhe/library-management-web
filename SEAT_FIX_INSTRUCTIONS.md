# Fix Seat Number Isolation Issue

## Problem
The database currently has a global UNIQUE constraint on `seat_no` which prevents different users from having the same seat numbers. Additionally, there's no `user_id` column for proper multi-tenant data isolation.

## Solution
Run the SQL migration to:
1. Add `user_id` column to members and related tables
2. Remove global UNIQUE constraint on seat_no
3. Create a partial unique index that allows same seat numbers for different users
4. Update RLS policies for proper user isolation

## How to Fix

### Option 1: Using Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project
   - Navigate to **SQL Editor** from the left menu

2. **Run the Migration**
   - Open the file `fix-seat-isolation.sql`
   - Copy all its contents
   - Paste into the SQL Editor
   - Click "Run" or press Ctrl+Enter

3. **Verify the Changes**
   - Go to Table Editor > members
   - Check that `user_id` column exists
   - Check that seat numbers can now be duplicated for different users

### Option 2: Using Command Line

```bash
# Make sure you have your Supabase credentials in .env
npm install
node run-seat-fix.mjs
```

Note: The script will likely tell you to run it manually in the dashboard since Supabase JS client doesn't support executing DDL statements.

## What Gets Fixed

### Database Schema Changes
- ✅ Adds `user_id UUID` column to members, payments, attendance, expenditures, notifications tables
- ✅ Links all records to authenticated users
- ✅ Drops global UNIQUE constraint on `seat_no`
- ✅ Creates partial unique index: `idx_members_unique_active_seat`
  - Allows same seat number for different users
  - Ensures only ONE active member per seat per user

### RLS Policy Updates
- ✅ Replaces "allow all" policies with user-isolated policies
- ✅ Users can only see/modify their own data
- ✅ Proper multi-tenant isolation

## After Running the Migration

1. **Refresh your browser** to clear any cached data
2. **Try adding a member** with seat #1 - it should now work!
3. **Verify isolation** - different users can use the same seat numbers

## Rollback (if needed)

If something goes wrong, you can rollback by:

```sql
-- Remove user isolation (restore old behavior)
DROP POLICY IF EXISTS "Users can view their own members" ON public.members;
DROP POLICY IF EXISTS "Users can insert their own members" ON public.members;
DROP POLICY IF EXISTS "Users can update their own members" ON public.members;
DROP POLICY IF EXISTS "Users can delete their own members" ON public.members;

CREATE POLICY "Enable all access for authenticated users" 
ON public.members FOR ALL 
USING (auth.role() = 'authenticated');

-- Remove user_id column
ALTER TABLE public.members DROP COLUMN IF EXISTS user_id;

-- Restore global unique constraint
ALTER TABLE public.members ADD CONSTRAINT members_seat_no_key UNIQUE (seat_no);
```

## Need Help?

If you encounter any errors during migration, check:
1. You're logged in to the correct Supabase project
2. You have admin/owner permissions on the project
3. No active connections are using the tables being modified
