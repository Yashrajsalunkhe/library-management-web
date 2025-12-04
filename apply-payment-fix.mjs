#!/usr/bin/env node

/**
 * Apply Payment Cascade Fix to Supabase Database
 * 
 * This script applies the fix for payment deletion when members are deleted.
 * It modifies the foreign key constraint to use ON DELETE SET NULL instead of CASCADE.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase credentials');
  console.error('Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runSQL(sql, description) {
  console.log(`\n📝 ${description}...`);
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error(`❌ Error: ${error.message}`);
      return false;
    }
    
    console.log(`✅ Success`);
    return true;
  } catch (err) {
    console.error(`❌ Exception: ${err.message}`);
    return false;
  }
}

async function checkCurrentConstraint() {
  console.log('\n🔍 Checking current constraint configuration...');
  
  const query = `
    SELECT 
      conname AS constraint_name,
      pg_get_constraintdef(oid) AS definition
    FROM pg_constraint
    WHERE conname = 'payments_member_id_fkey'
      AND connamespace = 'public'::regnamespace;
  `;
  
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: query });
  
  if (error) {
    console.log('⚠️  Could not check existing constraint (table may not exist yet)');
    return null;
  }
  
  if (data && data.length > 0) {
    console.log(`Current constraint: ${data[0].definition}`);
    return data[0].definition;
  }
  
  return null;
}

async function applyFix() {
  console.log('🚀 Starting Payment Cascade Fix');
  console.log('================================');
  
  // Check current state
  await checkCurrentConstraint();
  
  // Step 1: Drop existing constraint
  const dropConstraint = `
    ALTER TABLE public.payments 
    DROP CONSTRAINT IF EXISTS payments_member_id_fkey;
  `;
  
  const step1 = await runSQL(dropConstraint, 'Dropping old constraint');
  if (!step1) {
    console.error('❌ Failed to drop constraint. Aborting.');
    process.exit(1);
  }
  
  // Step 2: Add new constraint with SET NULL
  const addConstraint = `
    ALTER TABLE public.payments 
    ADD CONSTRAINT payments_member_id_fkey 
    FOREIGN KEY (member_id) 
    REFERENCES public.members(id) 
    ON DELETE SET NULL;
  `;
  
  const step2 = await runSQL(addConstraint, 'Adding new constraint with SET NULL');
  if (!step2) {
    console.error('❌ Failed to add constraint. Database may be in inconsistent state!');
    process.exit(1);
  }
  
  // Step 3: Fix plan_id constraint
  const dropPlanConstraint = `
    ALTER TABLE public.payments 
    DROP CONSTRAINT IF EXISTS payments_plan_id_fkey;
  `;
  
  await runSQL(dropPlanConstraint, 'Dropping plan constraint');
  
  const addPlanConstraint = `
    ALTER TABLE public.payments 
    ADD CONSTRAINT payments_plan_id_fkey 
    FOREIGN KEY (plan_id) 
    REFERENCES public.membership_plans(id) 
    ON DELETE SET NULL;
  `;
  
  await runSQL(addPlanConstraint, 'Adding new plan constraint');
  
  // Step 4: Add indexes for performance
  const addIndexes = `
    CREATE INDEX IF NOT EXISTS idx_payments_member_id ON public.payments(member_id);
    CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON public.payments(payment_date DESC);
    CREATE INDEX IF NOT EXISTS idx_payments_member_date ON public.payments(member_id, payment_date DESC) 
      WHERE member_id IS NOT NULL;
  `;
  
  await runSQL(addIndexes, 'Adding performance indexes');
  
  // Verify the changes
  console.log('\n🔍 Verifying changes...');
  const newDef = await checkCurrentConstraint();
  
  if (newDef && newDef.includes('ON DELETE SET NULL')) {
    console.log('\n✅ SUCCESS!');
    console.log('================================');
    console.log('✓ Payment records will now be preserved when members are deleted');
    console.log('✓ The member_id will be set to NULL instead of deleting the payment');
    console.log('✓ Performance indexes have been added');
    console.log('\n💡 Next steps:');
    console.log('1. Test by creating a dummy member and payment, then deleting the member');
    console.log('2. Update your application code to handle NULL member_id in payments');
    console.log('3. Consider running the full optimized-schema.sql for additional improvements');
  } else {
    console.log('\n⚠️  WARNING: Could not verify constraint was set correctly');
    console.log('Please check manually in Supabase dashboard');
  }
}

// Run the fix
applyFix().catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
