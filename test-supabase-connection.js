import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('Testing Supabase Connection...');
console.log('URL:', supabaseUrl);
console.log('Anon Key (first 20 chars):', supabaseAnonKey?.substring(0, 20) + '...');

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing environment variables');
    console.log('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file');
    process.exit(1);
}

// Test basic connectivity
async function testConnection() {
    try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        
        console.log('\n🔄 Testing connection to Supabase...');
        
        // Try a simple query to test connectivity
        const { data, error } = await supabase
            .from('profiles')
            .select('count')
            .limit(1);
            
        if (error) {
            if (error.message.includes('Failed to fetch') || error.message.includes('network')) {
                console.error('❌ Network Error: Cannot reach Supabase');
                console.log('This suggests the Supabase project URL is invalid or the project has been paused/deleted');
            } else {
                console.log('✅ Connection successful! (Table might not exist yet, but network is working)');
                console.log('Error details:', error.message);
            }
        } else {
            console.log('✅ Connection and query successful!');
            console.log('Data:', data);
        }
        
    } catch (err) {
        console.error('❌ Connection failed:', err.message);
        if (err.message.includes('Failed to fetch')) {
            console.log('\n💡 Possible solutions:');
            console.log('1. Check if your Supabase project is active');
            console.log('2. Verify the VITE_SUPABASE_URL in your .env file');
            console.log('3. Create a new Supabase project if the current one is deleted');
            console.log('4. Check your internet connection');
        }
    }
}

testConnection();
