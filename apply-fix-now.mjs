#!/usr/bin/env node

/**
 * Quick script to apply the payment cascade fix
 * Run: node apply-fix-now.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Load from .env file
const supabaseUrl = 'https://xzwggqhrwwkqvgwmgtok.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6d2dncWhyd3drcXZnd21ndG9rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDY1NTg3MywiZXhwIjoyMDgwMjMxODczfQ.py8Mt4gM_VRl6-gNM_LNTaOZezTOGLCciHuP0mTJakM';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('🚀 Applying Payment Cascade Fix...\n');

// Read the SQL file
const sql = readFileSync('./fix-payment-cascade.sql', 'utf-8');

try {
  // Execute the SQL
  const { data, error } = await supabase.rpc('exec_sql', { 
    query: sql 
  });

  if (error) {
    console.error('❌ Error:', error.message);
    console.log('\n⚠️  The exec_sql function may not exist.');
    console.log('Please apply the fix manually using Supabase Dashboard:');
    console.log('1. Go to https://app.supabase.com/project/xzwggqhrwwkqvgwmgtok/sql');
    console.log('2. Copy the contents of fix-payment-cascade.sql');
    console.log('3. Paste and click Run');
    process.exit(1);
  }

  console.log('✅ SUCCESS!');
  console.log('Payment cascade fix has been applied.');
  console.log('\nWhat changed:');
  console.log('✓ Payments will now be preserved when members are deleted');
  console.log('✓ Performance indexes have been added');
  console.log('✓ Database is now optimized');
  
} catch (err) {
  console.error('❌ Error:', err.message);
  console.log('\n📋 Manual Steps:');
  console.log('1. Go to: https://app.supabase.com/project/xzwggqhrwwkqvgwmgtok/sql');
  console.log('2. Copy contents of fix-payment-cascade.sql');
  console.log('3. Paste and click Run');
}
