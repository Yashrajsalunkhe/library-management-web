import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xzwggqhrwwkqvgwmgtok.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6d2dncWhyd3drcXZnd21ndG9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2NTU4NzMsImV4cCI6MjA4MDIzMTg3M30.KCAzhPkUFLTKfDdfYjwfK2zWUNcRyND2uLftV2znDAU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkExistingSchema() {
  console.log('🔍 Checking existing database schema...\n');
  
  const expectedTables = [
    'profiles',
    'membership_plans', 
    'library_plans',
    'members',
    'payments',
    'attendance',
    'expenditures',
    'settings',
    'users',
    'notifications'
  ];
  
  const existingTables = [];
  const missingTables = [];
  
  for (const table of expectedTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
        
      if (error) {
        if (error.code === '42P01') {
          missingTables.push(table);
          console.log(`❌ ${table} - does not exist`);
        } else {
          console.log(`⚠️  ${table} - error: ${error.message}`);
        }
      } else {
        existingTables.push(table);
        console.log(`✅ ${table} - exists (${data.length} sample records)`);
      }
    } catch (err) {
      console.log(`💥 ${table} - error: ${err.message}`);
    }
  }
  
  console.log('\n📊 Summary:');
  console.log(`✅ Existing tables: ${existingTables.length}`);
  console.log(`❌ Missing tables: ${missingTables.length}`);
  
  if (existingTables.length > 0) {
    console.log('\n🔍 Existing tables:', existingTables.join(', '));
  }
  
  if (missingTables.length > 0) {
    console.log('\n❌ Missing tables:', missingTables.join(', '));
    console.log('\n📋 Next Steps:');
    console.log('1. Go to https://supabase.com/dashboard/project/xzwggqhrwwkqvgwmgtok');
    console.log('2. Navigate to "SQL Editor"');
    console.log('3. Create a new query');
    console.log('4. Copy and paste the contents of unified-schema.sql');
    console.log('5. Click "Run" to create missing tables');
  } else {
    console.log('\n🎉 All tables exist! Your schema is ready.');
  }
  
  // Check a specific table structure if it exists
  if (existingTables.includes('members')) {
    console.log('\n📋 Checking members table structure...');
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .limit(1);
        
      if (!error && data && data.length > 0) {
        const columns = Object.keys(data[0]);
        console.log('📝 Members columns:', columns.join(', '));
      } else {
        console.log('📝 Members table is empty');
      }
    } catch (err) {
      console.log('Error checking members structure:', err.message);
    }
  }
}

checkExistingSchema().catch(console.error);
