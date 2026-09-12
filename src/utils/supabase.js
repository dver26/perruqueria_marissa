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


export async function UpdateTabla(nombreTabla, fila) {
  const { data, error } = await supabase.from(nombreTabla).update(fila).eq('id', fila.id).select()
  if (error) {
    console.error(`Error actualizando ${nombreTabla}:`, error)
    return null
  }
  return data
}

export async function DeleteTabla(nombreTabla, fila) {
  const { data, error } = await supabase.from(nombreTabla).delete(fila).eq('id', fila.id).select()
  if (error) {
    console.error(`Error eliminando ${nombreTabla}:`, error)
    return null
  }
  return data
}

export async function InsertTabla(nombreTabla, fila) {
  const { data, error } = await supabase.from(nombreTabla).insert(fila).select()
  if (error) {
    console.error(`Error insertando en ${nombreTabla}:`, error)
    return null
  }
  return data
}

export async function BuscarPorCampo(nombreTabla, campo, valor) {
  const { data, error } = await supabase.from(nombreTabla).select('*').eq(campo, valor)
  if (error) {
    console.error(`Error buscando en ${nombreTabla}:`, error)
    return []
  }
  return data
}