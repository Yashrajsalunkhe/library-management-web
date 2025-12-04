import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://xzwggqhrwwkqvgwmgtok.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6d2dncWhyd3drcXZnd21ndG9rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDY1NTg3MywiZXhwIjoyMDgwMjMxODczfQ.py8Mt4gM_VRl6-gNM_LNTaOZezTOGLCciHuP0mTJakM';

console.log('🔧 Fixing expenditures category constraint...\n');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixConstraint() {
  // Method 1: Try to drop the constraint directly
  console.log('Method 1: Attempting to drop constraint via raw SQL...');
  
  try {
    // First, check if we can query the table
    const { data: testData, error: testError } = await supabase
      .from('expenditures')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.log('⚠️  Cannot query expenditures:', testError.message);
    } else {
      console.log('✅ Can access expenditures table');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
  
  console.log('\n📋 MANUAL FIX REQUIRED:');
  console.log('━'.repeat(60));
  console.log('\nPlease follow these steps:\n');
  console.log('1. Go to: https://supabase.com/dashboard/project/xzwggqhrwwkqvgwmgtok/editor');
  console.log('2. Click on "SQL Editor" in the left sidebar');
  console.log('3. Click "New query"');
  console.log('4. Copy and paste the following SQL:\n');
  
  const fixSql = fs.readFileSync('fix-expenditures-constraint.sql', 'utf8');
  console.log('─'.repeat(60));
  console.log(fixSql);
  console.log('─'.repeat(60));
  console.log('\n5. Click "Run" or press Ctrl+Enter');
  console.log('6. You should see: "Dropped expenditures_category_check constraint"\n');
  console.log('After running the SQL, your expenditure form will work correctly!');
  console.log('━'.repeat(60));
}

fixConstraint();
