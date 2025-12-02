-- LIBRARY MANAGEMENT SYSTEM - SCHEMA FIX
-- This script safely updates the existing schema

-- Enable UUID extension (safe to run multiple times)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing policies to avoid conflicts (only if tables exist)
DO $$ 
BEGIN
    -- Drop policies only if tables exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
        DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
        DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
        DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'members' AND table_schema = 'public') THEN
        DROP POLICY IF EXISTS "Enable all for authenticated" ON public.members;
        DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.members;
        DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.members;
        DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.members;
        DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON public.members;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'library_plans' AND table_schema = 'public') THEN
        DROP POLICY IF EXISTS "Enable all for authenticated" ON public.library_plans;
        DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.library_plans;
        DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.library_plans;
        DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.library_plans;
        DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON public.library_plans;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'books' AND table_schema = 'public') THEN
        DROP POLICY IF EXISTS "Enable all for authenticated" ON public.books;
        DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.books;
        DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.books;
        DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.books;
        DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON public.books;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'book_issues' AND table_schema = 'public') THEN
        DROP POLICY IF EXISTS "Enable all for authenticated" ON public.book_issues;
        DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.book_issues;
        DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.book_issues;
        DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.book_issues;
        DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON public.book_issues;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'settings' AND table_schema = 'public') THEN
        DROP POLICY IF EXISTS "Enable all for authenticated" ON public.settings;
        DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.settings;
        DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.settings;
        DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.settings;
        DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON public.settings;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'attendance' AND table_schema = 'public') THEN
        DROP POLICY IF EXISTS "Enable all for authenticated" ON public.attendance;
        DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.attendance;
        DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.attendance;
        DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.attendance;
        DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON public.attendance;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments' AND table_schema = 'public') THEN
        DROP POLICY IF EXISTS "Enable all for authenticated" ON public.payments;
        DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.payments;
        DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.payments;
        DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.payments;
        DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON public.payments;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'expenditures' AND table_schema = 'public') THEN
        DROP POLICY IF EXISTS "Enable all for authenticated" ON public.expenditures;
        DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.expenditures;
        DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.expenditures;
        DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.expenditures;
        DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON public.expenditures;
    END IF;
END $$;

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create or update tables (using CREATE TABLE IF NOT EXISTS for safety)

-- PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  email TEXT,
  role TEXT DEFAULT 'admin',
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- LIBRARY PLANS TABLE
CREATE TABLE IF NOT EXISTS public.library_plans (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  duration_months INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  description TEXT,
  seat_access BOOLEAN DEFAULT true,
  book_limit INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add missing columns to existing tables if they don't exist
DO $$
BEGIN
    -- Check and add columns to members table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='members' AND column_name='plan_id') THEN
        ALTER TABLE public.members ADD COLUMN plan_id BIGINT REFERENCES public.library_plans(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='members' AND column_name='library_card_no') THEN
        ALTER TABLE public.members ADD COLUMN library_card_no TEXT UNIQUE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='members' AND column_name='id_document_type') THEN
        ALTER TABLE public.members ADD COLUMN id_document_type TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='members' AND column_name='id_number') THEN
        ALTER TABLE public.members ADD COLUMN id_number TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='members' AND column_name='photo_url') THEN
        ALTER TABLE public.members ADD COLUMN photo_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='members' AND column_name='birth_date') THEN
        ALTER TABLE public.members ADD COLUMN birth_date DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='members' AND column_name='city') THEN
        ALTER TABLE public.members ADD COLUMN city TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='members' AND column_name='address') THEN
        ALTER TABLE public.members ADD COLUMN address TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='members' AND column_name='seat_no') THEN
        ALTER TABLE public.members ADD COLUMN seat_no TEXT UNIQUE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='members' AND column_name='join_date') THEN
        ALTER TABLE public.members ADD COLUMN join_date DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='members' AND column_name='end_date') THEN
        ALTER TABLE public.members ADD COLUMN end_date DATE;
    END IF;
END $$;

-- Create remaining tables if they don't exist
CREATE TABLE IF NOT EXISTS public.books (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT,
  isbn TEXT UNIQUE,
  category TEXT,
  total_copies INTEGER DEFAULT 1,
  available_copies INTEGER DEFAULT 1,
  shelf_location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Check if members table uses UUID or BIGINT for id
DO $$
DECLARE
    members_id_type TEXT;
BEGIN
    -- Get the data type of members.id column
    SELECT data_type INTO members_id_type 
    FROM information_schema.columns 
    WHERE table_name = 'members' AND column_name = 'id' AND table_schema = 'public';
    
    -- Create book_issues table with appropriate member_id type
    IF members_id_type = 'uuid' THEN
        CREATE TABLE IF NOT EXISTS public.book_issues (
          id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
          book_id BIGINT REFERENCES public.books(id),
          member_id UUID REFERENCES public.members(id),
          issue_date DATE DEFAULT CURRENT_DATE,
          due_date DATE,
          return_date DATE,
          status TEXT DEFAULT 'issued',
          fine_amount DECIMAL(10,2) DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        );
    ELSE
        CREATE TABLE IF NOT EXISTS public.book_issues (
          id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
          book_id BIGINT REFERENCES public.books(id),
          member_id BIGINT REFERENCES public.members(id),
          issue_date DATE DEFAULT CURRENT_DATE,
          due_date DATE,
          return_date DATE,
          status TEXT DEFAULT 'issued',
          fine_amount DECIMAL(10,2) DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        );
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.settings (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB,
  description TEXT
);

-- Create attendance and payments tables with appropriate member_id type
DO $$
DECLARE
    members_id_type TEXT;
BEGIN
    -- Get the data type of members.id column
    SELECT data_type INTO members_id_type 
    FROM information_schema.columns 
    WHERE table_name = 'members' AND column_name = 'id' AND table_schema = 'public';
    
    -- Create attendance table with appropriate member_id type
    IF members_id_type = 'uuid' THEN
        CREATE TABLE IF NOT EXISTS public.attendance (
          id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
          member_id UUID REFERENCES public.members(id),
          check_in TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          check_out TIMESTAMP WITH TIME ZONE,
          source TEXT DEFAULT 'manual',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        );
    ELSE
        CREATE TABLE IF NOT EXISTS public.attendance (
          id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
          member_id BIGINT REFERENCES public.members(id),
          check_in TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          check_out TIMESTAMP WITH TIME ZONE,
          source TEXT DEFAULT 'manual',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        );
    END IF;
    
    -- Create payments table with appropriate member_id type
    IF members_id_type = 'uuid' THEN
        CREATE TABLE IF NOT EXISTS public.payments (
          id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
          member_id UUID REFERENCES public.members(id),
          amount DECIMAL(10,2) NOT NULL,
          payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          payment_method TEXT,
          transaction_id TEXT,
          type TEXT,
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        );
    ELSE
        CREATE TABLE IF NOT EXISTS public.payments (
          id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
          member_id BIGINT REFERENCES public.members(id),
          amount DECIMAL(10,2) NOT NULL,
          payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          payment_method TEXT,
          transaction_id TEXT,
          type TEXT,
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        );
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.expenditures (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  title TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category TEXT,
  date DATE DEFAULT CURRENT_DATE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on all tables
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'library_plans' AND table_schema = 'public') THEN
        ALTER TABLE public.library_plans ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'members' AND table_schema = 'public') THEN
        ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'books' AND table_schema = 'public') THEN
        ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'book_issues' AND table_schema = 'public') THEN
        ALTER TABLE public.book_issues ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'settings' AND table_schema = 'public') THEN
        ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'attendance' AND table_schema = 'public') THEN
        ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments' AND table_schema = 'public') THEN
        ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'expenditures' AND table_schema = 'public') THEN
        ALTER TABLE public.expenditures ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create new policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Simplified policies for other tables - allow all operations for authenticated users
CREATE POLICY "Enable read access for authenticated users" ON public.members FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert access for authenticated users" ON public.members FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update access for authenticated users" ON public.members FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete access for authenticated users" ON public.members FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON public.library_plans FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert access for authenticated users" ON public.library_plans FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update access for authenticated users" ON public.library_plans FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete access for authenticated users" ON public.library_plans FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON public.books FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert access for authenticated users" ON public.books FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update access for authenticated users" ON public.books FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete access for authenticated users" ON public.books FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON public.book_issues FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert access for authenticated users" ON public.book_issues FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update access for authenticated users" ON public.book_issues FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete access for authenticated users" ON public.book_issues FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON public.settings FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert access for authenticated users" ON public.settings FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update access for authenticated users" ON public.settings FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete access for authenticated users" ON public.settings FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON public.attendance FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert access for authenticated users" ON public.attendance FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update access for authenticated users" ON public.attendance FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete access for authenticated users" ON public.attendance FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON public.payments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert access for authenticated users" ON public.payments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update access for authenticated users" ON public.payments FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete access for authenticated users" ON public.payments FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON public.expenditures FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert access for authenticated users" ON public.expenditures FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update access for authenticated users" ON public.expenditures FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete access for authenticated users" ON public.expenditures FOR DELETE USING (auth.role() = 'authenticated');

-- Create the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, email, role, avatar_url)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'admin'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample library plans (only if they don't exist)
INSERT INTO public.library_plans (name, duration_months, price, description, seat_access, book_limit) 
SELECT * FROM (VALUES
  ('Daily Reading', 0, 20.00, 'Daily reading room access only', true, 0),
  ('Monthly Reading', 1, 500.00, 'Monthly reading room access', true, 0),
  ('Student Monthly', 1, 300.00, 'Student discount - Monthly reading room', true, 0),
  ('Annual Reading', 12, 5000.00, 'Annual reading room access', true, 0),
  ('Book Borrower Monthly', 1, 800.00, 'Monthly reading room + 3 books borrowing', true, 3),
  ('Premium Annual', 12, 8000.00, 'Annual reading room + 5 books borrowing', true, 5)
) AS v(name, duration_months, price, description, seat_access, book_limit)
WHERE NOT EXISTS (
  SELECT 1 FROM public.library_plans WHERE library_plans.name = v.name
);
