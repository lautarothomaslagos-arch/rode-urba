import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xmtsxdzwurxygqqccgdc.supabase.co'
const supabaseAnonKey = 'sb_publishable_6E_3Tp9h6UpgInxX3B-iyg_ttvrvFvX'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
