import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials');
    console.log('Please ensure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
    try {
        console.log('🔧 Running seat isolation fix migration...\n');

        // Read the SQL file
        const sqlPath = join(__dirname, 'fix-seat-isolation.sql');
        const sql = readFileSync(sqlPath, 'utf8');

        // Execute the migration
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

        if (error) {
            // If exec_sql doesn't exist, try direct execution
            console.log('⚠️  RPC method not available, trying direct execution...\n');
            
            // Split by semicolon and execute each statement
            const statements = sql
                .split(';')
                .map(s => s.trim())
                .filter(s => s.length > 0 && !s.startsWith('--'));

            for (const statement of statements) {
                if (statement.includes('DO $$') || statement.includes('CREATE')) {
                    console.log('Executing:', statement.substring(0, 80) + '...');
                    
                    // Note: Supabase JS client doesn't support executing arbitrary SQL
                    // You need to run this through SQL editor in Supabase dashboard
                    console.log('⚠️  Please run fix-seat-isolation.sql manually in Supabase SQL Editor');
                    console.log('📋 You can find the SQL Editor at: Dashboard > SQL Editor');
                    break;
                }
            }
        } else {
            console.log('✅ Migration completed successfully!');
            console.log(data);
        }

        console.log('\n📝 Manual Steps Required:');
        console.log('1. Go to your Supabase Dashboard');
        console.log('2. Navigate to: SQL Editor');
        console.log('3. Copy the contents of fix-seat-isolation.sql');
        console.log('4. Paste and run the SQL');
        console.log('5. Verify the changes worked\n');

    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        process.exit(1);
    }
}

runMigration();
