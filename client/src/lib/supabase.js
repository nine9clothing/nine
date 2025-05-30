import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yehlkbbjlhacdivjnmrf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllaGxrYmJqbGhhY2RpdmpubXJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3MDA0ODQsImV4cCI6MjA1OTI3NjQ4NH0.CIn3hl_4CaV405-k64ugE5-oWbwoSC6ZukckBB5zga8'

// Suppress specific Supabase errors
const originalError = console.error;
console.error = (...args) => {
  // Check if it's the Supabase 406 error
  const message = args.join(' ');
  if (message.includes('406') && message.includes('supabase.co')) {
    return; // Don't log this error
  }
  originalError.apply(console, args);
};

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,      
      persistSession: true,       
    }
});
export default supabase; 