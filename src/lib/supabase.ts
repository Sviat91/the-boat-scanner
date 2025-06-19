
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://supabase.nodayoby.online'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImV4cCI6MTc0ODc0MDAwMH0.x6M5t5guANNwZ_Ah53D2gWDrO9tsg7RkY4vVU_ojQco'

export const supabase = createClient(supabaseUrl, supabaseKey)
