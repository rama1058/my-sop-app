import { createClient } from '@supabase/supabase-js';

// Ambil URL & ANON KEY dari Dashboard Supabase -> Project Settings -> API
const supabaseUrl = 'https://drupwnszxktrqiubkarn.supabase.co';
const supabaseAnonKey = 'sb_publishable_QxLXb2z6gDNqW_7zMinTbw_MJuyUs8H';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
