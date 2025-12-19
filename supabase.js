// File: supabase.js
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage'; // ADD THIS
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oksfvuvcyoaxekugjqya.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rc2Z2dXZjeW9heGVrdWdqcXlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwOTA2OTcsImV4cCI6MjA4MTY2NjY5N30.jMSNJeQh0CiFwqsPne9shr3T1PzEZCwvJ7SM9_MswsQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: AsyncStorage, // THIS IS CRUCIAL FOR REACT NATIVE
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});