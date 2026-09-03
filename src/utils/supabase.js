import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

export async function fetchTabla(nombreTabla) {
  // Serveix per seleccionar tot de NOMES UNA TAULA
  const { data, error } = await supabase.from(nombreTabla).select('*')
  if (error) {
    console.error(`Error cargando ${nombreTabla}:`, error)
    return null
  }
  return data
}

export async function fetchTablas(nombresTablas) {
  const resultados = await Promise.all(
    nombresTablas.map(async (tabla) => [tabla, await fetchTabla(tabla)])
  )
  return Object.fromEntries(resultados) // { empleados: [...], servicios: [...], ... }
}
