# Expenditures Category Constraint Fix

## Problem
The expenditures table has a restrictive check constraint (`expenditures_category_check`) that is preventing the application from adding new expenditures. The error you're seeing is:

```
API Error: new row for relation "expenditures" violates check constraint "expenditures_category_check"
```

## Solution
The constraint needs to be dropped to allow flexible category values. Your application uses these categories:
- Utilities
- Maintenance
- Office Supplies
- Rent
- Insurance
- Equipment
- Marketing
- Staff
- Other

## How to Fix

### Step 1: Open Supabase SQL Editor
1. Go to: https://supabase.com/dashboard/project/xzwggqhrwwkqvgwmgtok/editor
2. Click on **SQL Editor** in the left sidebar
3. Click **New query**

### Step 2: Run the Fix SQL
Copy and paste this SQL and click **Run**:

```sql
-- Fix expenditures category constraint
-- This removes or updates the restrictive check constraint on category field

-- Step 1: Drop the restrictive category check constraint if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'expenditures_category_check' 
        AND table_name = 'expenditures'
    ) THEN
        ALTER TABLE public.expenditures DROP CONSTRAINT expenditures_category_check;
        RAISE NOTICE 'Dropped expenditures_category_check constraint';
    END IF;
END $$;

-- Step 2: Optionally add a more flexible constraint or none at all
-- (Currently leaving it open - any text value is allowed for category)

-- Step 3: Verify the column exists and is of correct type
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'expenditures' AND column_name = 'category'
    ) THEN
        ALTER TABLE public.expenditures ADD COLUMN category TEXT NOT NULL DEFAULT 'Other';
        RAISE NOTICE 'Added category column';
    END IF;
END $$;

COMMENT ON COLUMN public.expenditures.category IS 'Expenditure category - flexible text field, no restrictions';
```

### Step 3: Verify
After running the SQL, you should see a success message. Then:
1. Go back to your application
2. Try adding a new expenditure
3. It should now work without the constraint error!

## Files
- `fix-expenditures-constraint.sql` - The fix SQL script
- `run-expenditure-fix.mjs` - Helper script (shows instructions)

## Alternative: Command Line (if you have psql)
If you have direct PostgreSQL access, you can also run:
```bash
psql YOUR_DATABASE_URL -f fix-expenditures-constraint.sql
```
