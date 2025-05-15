import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  '', // replace with your real project URL
  '' // replace with your real service role key (keep it secret!)
)

const deleteUser = async (userId) => {
  const { error } = await supabase.auth.admin.deleteUser(userId)
  if (error) {
    console.error('❌ Error deleting user:', error.message)
  } else {
    console.log('✅ User deleted successfully.')
  }
}

deleteUser('') //  replace this with the real user's UUID
