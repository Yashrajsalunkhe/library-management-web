import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testConnection() {
    console.log('Testing Supabase connection...');
    
    // Get env vars directly from .env file
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
    
    // Test 1: Check environment variables
    console.log('Environment variables:');
    console.log('VITE_SUPABASE_URL:', supabaseUrl || 'NOT SET');
    console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'SET (length: ' + supabaseAnonKey.length + ')' : 'NOT SET');
    
    if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Missing required environment variables!');
        return;
    }
    
    // Create supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Test 2: Check if supabase client is initialized
    console.log('\nSupabase client: Initialized');
    
    try {
        // Test 3: Try to fetch from different possible tables
        console.log('\nTesting table access...');
        
        // Try library_plans first
        let { data, error } = await supabase
            .from('library_plans')
            .select('*')
            .limit(1);
        
        if (error && error.code === 'PGRST205') {
            console.log('library_plans table not found, trying membership_plans...');
            const result = await supabase
                .from('membership_plans')
                .select('*')
                .limit(1);
            data = result.data;
            error = result.error;
        }
        
        if (error) {
            console.error('Database connection error:', error);
        } else {
            console.log('Database connection successful!');
            console.log('Sample data:', data);
        }
    } catch (err) {
        console.error('Connection test failed:', err);
    }
}

testConnection();
