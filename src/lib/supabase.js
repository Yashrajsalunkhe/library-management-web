import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase environment variables')
    console.log('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file')
    console.log('Current URL:', supabaseUrl || 'undefined')
    console.log('Current Key:', supabaseAnonKey ? 'defined' : 'undefined')
}

// Create Supabase client with error handling
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false
    },
    db: {
        schema: 'public'
    },
    global: {
        headers: {
            'x-application-name': 'libro'
        },
    }
})

// Test connection function for debugging
export const testSupabaseConnection = async () => {
    if (!supabaseUrl || !supabaseAnonKey) {
        return { 
            success: false, 
            error: 'Missing environment variables',
            message: 'Please check your .env file for VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY'
        }
    }

    try {
        // Simple health check
        const { data, error } = await supabase
            .from('profiles')
            .select('count')
            .limit(1)
            
        if (error && error.message.includes('Failed to fetch')) {
            return {
                success: false,
                error: 'Network error',
                message: 'Cannot reach Supabase. The project may be paused or the URL is incorrect.'
            }
        }
        
        return { success: true, message: 'Connection successful' }
        
    } catch (err) {
        return {
            success: false,
            error: 'Connection failed',
            message: err.message
        }
    }
}
