-- ============================================================================
-- CREATE ADMIN USER - INSERT QUERIES
-- ============================================================================
-- This script creates an admin user directly in your Supabase database
-- Run this AFTER setting up the schema
-- ============================================================================

-- METHOD 1: Insert directly into auth.users (Requires superuser/service role access)
-- Note: Replace 'your-secure-password-hash' with actual bcrypt hash
-- Generate hash using: https://bcrypt-generator.com/ or use Supabase Dashboard

-- Example INSERT for auth.users (if you have direct access):
-- You'll need to generate a UUID and password hash first

/*
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  gen_random_uuid(), -- Generates a new UUID
  '00000000-0000-0000-0000-000000000000', -- Default instance_id
  'admin@library.com',
  crypt('YourSecurePassword123!', gen_salt('bf')), -- Replace with your password
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"username":"admin","full_name":"System Administrator","role":"admin"}',
  false,
  'authenticated'
);
*/

-- ============================================================================
-- METHOD 2: Manual Profile Insert (If auth user already exists)
-- ============================================================================
-- If you created auth user via Supabase Dashboard, insert profile manually:
-- Replace 'your-auth-user-uuid-here' with the actual UUID from auth.users

/*
INSERT INTO public.profiles (
  id,
  username,
  full_name,
  email,
  role,
  is_active,
  created_at,
  updated_at
) VALUES (
  'your-auth-user-uuid-here', -- Get this from Supabase Dashboard → Authentication → Users
  'admin',
  'System Administrator',
  'admin@library.com',
  'admin',
  true,
  NOW(),
  NOW()
);
*/

-- ============================================================================
-- METHOD 3: Using Supabase Auth Admin API (Recommended)
-- ============================================================================
-- Use Supabase Dashboard to create user, then run this UPDATE:

-- Step 1: Go to Supabase Dashboard → Authentication → Users → Add User
--         Email: admin@library.com
--         Password: (your secure password)
--         Check "Auto Confirm User"

-- Step 2: After user is created, run this to ensure admin role:
UPDATE public.profiles 
SET 
  username = 'admin',
  full_name = 'System Administrator',
  role = 'admin',
  is_active = true
WHERE email = 'admin@library.com';

-- ============================================================================
-- QUICK INSERT TEMPLATE (Copy and modify)
-- ============================================================================
-- Get the UUID first by creating user in Supabase Dashboard, then:

/*
-- Replace 'USER_UUID_HERE' with actual UUID from Dashboard
INSERT INTO public.profiles (id, username, full_name, email, role, is_active)
VALUES (
  'USER_UUID_HERE',
  'admin',
  'System Administrator', 
  'admin@library.com',
  'admin',
  true
);
*/

-- ============================================================================
-- CREATE ADDITIONAL USERS
-- ============================================================================

-- Librarian User Profile Insert:
/*
INSERT INTO public.profiles (id, username, full_name, email, role, is_active)
VALUES (
  'LIBRARIAN_UUID_HERE',
  'librarian',
  'Head Librarian',
  'librarian@library.com',
  'librarian',
  true
);
*/

-- Staff User Profile Insert:
/*
INSERT INTO public.profiles (id, username, full_name, email, role, is_active)
VALUES (
  'STAFF_UUID_HERE',
  'staff',
  'Library Staff',
  'staff@library.com',
  'staff',
  true
);
*/

-- ============================================================================
-- VERIFY USERS
-- ============================================================================
-- Check all admin users:
SELECT 
  id,
  username,
  full_name,
  email,
  role,
  is_active,
  created_at
FROM public.profiles
WHERE role = 'admin'
ORDER BY created_at DESC;

-- Check all users by role:
SELECT 
  role,
  COUNT(*) as user_count,
  string_agg(email, ', ') as emails
FROM public.profiles
GROUP BY role;

-- ============================================================================
-- ALTERNATIVE: Complete User Setup Function
-- ============================================================================
-- Create a function to simplify user creation:

CREATE OR REPLACE FUNCTION create_user_profile(
  user_id UUID,
  user_email TEXT,
  user_username TEXT,
  user_full_name TEXT,
  user_role TEXT DEFAULT 'admin'
) RETURNS void AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, email, role, is_active)
  VALUES (user_id, user_username, user_full_name, user_email, user_role, true)
  ON CONFLICT (id) DO UPDATE
  SET username = EXCLUDED.username,
      full_name = EXCLUDED.full_name,
      role = EXCLUDED.role,
      is_active = EXCLUDED.is_active;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Use the function:
/*
SELECT create_user_profile(
  'your-user-uuid'::uuid,
  'admin@library.com',
  'admin',
  'System Administrator',
  'admin'
);
*/
