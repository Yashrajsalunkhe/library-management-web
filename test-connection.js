import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xzwggqhrwwkqvgwmgtok.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6d2dncWhyd3drcXZnd21ndG9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2NTU4NzMsImV4cCI6MjA4MDIzMTg3M30.KCAzhPkUFLTKfDdfYjwfK2zWUNcRyND2uLftV2znDAU';

console.log('🔧 Testing new Supabase connection...');
console.log(`📍 URL: ${supabaseUrl}`);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
      
    if (error) {
      if (error.code === '42P01') {
        console.log('✅ Connection successful!');
        console.log('📝 Note: Tables don\'t exist yet (this is expected)');
        console.log('🔨 You need to run the schema setup.');
      } else {
        console.log('❌ Connection error:', error.message);
      }
    } else {
      console.log('✅ Connection and query successful!');
      console.log('📊 Data:', data);
    }
    
    // Test auth
    const { data: authData, error: authError } = await supabase.auth.getUser();
    console.log('\n🔐 Auth test:');
    if (authError) {
      console.log('📝 No user logged in (expected for API test)');
    } else {
      console.log('✅ Auth working, user:', authData);
    }
    
  } catch (err) {
    console.error('💥 Test failed:', err.message);
  }
}

testConnection();
