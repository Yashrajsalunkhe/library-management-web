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
