import { createClient } from '@supabase/supabase-js';

// Your Project URL
const supabaseUrl = 'https://iecoiaxzerndjxisxbju.supabase.co';

// Your Anon Key (Public)
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllY29pYXh6ZXJuZGp4aXN4Ymp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5MzUwOTIsImV4cCI6MjA4NDUxMTA5Mn0.4BLuTIYdtgqhHLdbt2Q-cC_0FdmTdW_6G1B3LxBlbdM';

export const supabase = createClient(supabaseUrl, supabaseKey);