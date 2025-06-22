
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ddhhplcdnvfzptdnenkj.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkaGhwbGNkbnZmenB0ZG5lbmtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2MDQ4MzMsImV4cCI6MjA2NjE4MDgzM30.C4Qj2vgK0fiAljqSc9iOcu9YxoqE5rc6Q_MudiMUZwc'

export const supabase = createClient(supabaseUrl, supabaseKey)
