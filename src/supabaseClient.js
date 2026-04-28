// 🔥 Cliente central de Supabase
// Aquí conectas tu frontend con tu backend (DB + Auth)

import { createClient } from '@supabase/supabase-js'

// 👉 Copia esto desde:
// Supabase → Settings → API

const supabaseUrl = 'https://rvzrfsumhclehoespfwk.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2enJmc3VtaGNsZWhvZXNwZndrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3MTM0MDUsImV4cCI6MjA5MjI4OTQwNX0.z2n1CeQ0lir_9opp6qm-DQJWYmuYRdoSdhLwmx4mOYg'

// 🔥 Creamos instancia global
export const supabase = createClient(supabaseUrl, supabaseKey)
