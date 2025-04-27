import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://yehlkbbjlhacdivjnmrf.supabase.co', // replace with your real project URL
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllaGxrYmJqbGhhY2RpdmpubXJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzcwMDQ4NCwiZXhwIjoyMDU5Mjc2NDg0fQ.i60_S-W3ykQ6LzwCLEIuMPPMBr_PO_8CoU6AQveycOo' // replace with your real service role key (keep it secret!)
)

const deleteUser = async (userId) => {
  const { error } = await supabase.auth.admin.deleteUser(userId)
  if (error) {
    console.error('❌ Error deleting user:', error.message)
  } else {
    console.log('✅ User deleted successfully.')
  }
}

// Call the function with the user ID you want to delete
deleteUser('') // <== replace this with the real user's UUID
