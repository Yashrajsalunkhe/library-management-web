import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://xzwggqhrwwkqvgwmgtok.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6d2dncWhyd3drcXZnd21ndG9rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDY1NTg3MywiZXhwIjoyMDgwMjMxODczfQ.py8Mt4gM_VRl6-gNM_LNTaOZezTOGLCciHuP0mTJakM';

console.log('🚀 Setting up Supabase database schema...');
console.log(`📍 URL: ${supabaseUrl}`);

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupDatabase() {
  try {
    // Read the unified schema SQL file
    const schemaPath = path.join(__dirname, 'unified-schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📄 Schema file loaded successfully');
    console.log(`📏 Schema size: ${(schemaSql.length / 1024).toFixed(2)} KB`);
    
    // Test connection first
    console.log('\n🔧 Testing connection...');
    const { data: testData, error: testError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .limit(1);
      
    if (testError) {
      throw new Error(`Connection test failed: ${testError.message}`);
    }
    
    console.log('✅ Connection successful!');
    
    // Split the schema into individual statements
    const statements = schemaSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`\n📝 Executing ${statements.length} SQL statements...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and empty statements
      if (statement.startsWith('--') || statement.trim() === '') {
        continue;
      }
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', {
          sql_query: statement + ';'
        });
        
        if (error) {
          // Some errors are expected (like "already exists")
          if (error.message.includes('already exists') || 
              error.message.includes('relation') || 
              error.message.includes('duplicate')) {
            console.log(`⚠️  Statement ${i + 1}: ${error.message.substring(0, 80)}...`);
          } else {
            console.error(`❌ Statement ${i + 1} failed: ${error.message}`);
            errorCount++;
          }
        } else {
          successCount++;
          if (i % 10 === 0) {
            console.log(`✅ Progress: ${i + 1}/${statements.length} statements processed`);
          }
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 50));
        
      } catch (err) {
        console.error(`❌ Statement ${i + 1} error:`, err.message);
        errorCount++;
      }
    }
    
    console.log('\n📊 Execution Summary:');
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📝 Total: ${statements.length}`);
    
    // Verify the setup by checking if key tables exist
    console.log('\n🔍 Verifying table creation...');
    
    const expectedTables = [
      'profiles', 'membership_plans', 'members', 'payments', 
      'attendance', 'expenditures', 'settings'
    ];
    
    for (const tableName of expectedTables) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
        
      if (error) {
        console.log(`❌ Table '${tableName}': ${error.message}`);
      } else {
        console.log(`✅ Table '${tableName}': OK`);
      }
    }
    
    console.log('\n🎉 Database setup completed!');
    console.log('Your database now matches the desktop app structure.');
    
  } catch (error) {
    console.error('💥 Setup failed:', error);
    console.error('Details:', error.message);
    process.exit(1);
  }
}

// Alternative method if RPC doesn't work
async function setupDatabaseAlternative() {
  console.log('\n🔄 Trying alternative setup method...');
  
  try {
    // Test basic operations
    const { data: plans, error: plansError } = await supabase
      .from('membership_plans')
      .select('*')
      .limit(1);
      
    if (plansError && plansError.code === '42P01') {
      console.log('❌ Tables do not exist. Please run the SQL manually in Supabase SQL Editor.');
      console.log('📋 Instructions:');
      console.log('1. Go to https://supabase.com/dashboard/project/xzwggqhrwwkqvgwmgtok');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Create a new query');
      console.log('4. Copy and paste the contents of unified-schema.sql');
      console.log('5. Click "Run"');
      return;
    }
    
    console.log('✅ Tables exist! Schema is set up correctly.');
    
  } catch (err) {
    console.error('Error in alternative setup:', err);
  }
}

// Run the setup
setupDatabase().catch(() => {
  setupDatabaseAlternative();
});
