import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yehlkbbjlhacdivjnmrf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllaGxrYmJqbGhhY2RpdmpubXJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3MDA0ODQsImV4cCI6MjA1OTI3NjQ4NH0.CIn3hl_4CaV405-k64ugE5-oWbwoSC6ZukckBB5zga8'

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,      // Automatically refresh tokens before they expire
      persistSession: true,        // Persist session in localStorage
      detectSessionInUrl: true     // Detect session from URL (for OAuth/OTP flows)
    }
});
