
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://supabase.nodayoby.online'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVuZGVmaW5lZCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQxNzcwMjAwLCJleHAiOjE5NTczNDYyMDB9.CBQNMXHmAcCGvd1VGKrG2MT26jwt8o4Y2BEF5O9_o'

export const supabase = createClient(supabaseUrl, supabaseKey)
