import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para las tablas de la base de datos
export interface User {
  id: string
  username: string
  name: string
  email: string
  created_at: string
}

export interface Patient {
  id: string
  user_id: string
  name: string
  age: number
  gender: string
  contact_info: string
  created_at: string
}

export interface Prediction {
  id: string
  patient_id: string
  prediction_date: string
  prediction_class: string
  confidence_score: number
  model_used: string
  created_at: string
}

export interface AuthUser {
  id: string
  email: string
  user_metadata: {
    username: string
    name: string
  }
} 