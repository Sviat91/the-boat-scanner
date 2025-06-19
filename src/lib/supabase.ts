
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://supabase.nodayoby.online'
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseKey)
