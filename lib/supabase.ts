import { createClient } from '@supabase/supabase-js';
// Publishable project settings are public by design. RLS protects every record.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://obwktteidluebaksfhju.supabase.co';
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_As7RE0LXG5Nc48SwuxQ_tg_KSm0zwqJ';
export const supabase = createClient(url, key);
