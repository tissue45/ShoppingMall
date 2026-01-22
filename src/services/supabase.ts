import { createClient } from '@supabase/supabase-js'

// Supabase 프로젝트 설정
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://toueihqbuqbmkatatonp.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvdWVpaHFidXFibWthdGF0b25wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNTAxODksImV4cCI6MjA4NDYyNjE4OX0.8kduDOHf2EBEpNjCxOeEfpGhhjBN99d-jt_sM7HZCts'

console.log('Supabase URL:', supabaseUrl)
console.log('Supabase URL type:', typeof supabaseUrl)
console.log('Supabase Key exists:', !!supabaseAnonKey)

// URL 유효성 검사
try {
  new URL(supabaseUrl)
  console.log('URL is valid')
} catch (error) {
  console.error('Invalid URL:', error)
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)