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

// Carga varias tablas a la vez y agrupa los datos por nombre de tabla.
export async function fetchTablas(nombresTablas) {
  const resultados = await Promise.all(
    nombresTablas.map(async (tabla) => [tabla, await fetchTabla(tabla)])
  )
  return Object.fromEntries(resultados) // { empleados: [...], servicios: [...], ... }
}


// Busca la fila por su ID, guarda los cambios y devuelve los datos actualizados.
export async function UpdateTabla(nombreTabla, fila) {
  const { data, error } = await supabase.from(nombreTabla).update(fila).eq('id', fila.id).select()
  if (error) {
    console.error(`Error actualizando ${nombreTabla}:`, error)
    return null
  }
  return data
}

// Borra la fila con ese ID y devuelve lo que se ha eliminado.
export async function DeleteTabla(nombreTabla, fila) {
  const { data, error } = await supabase.from(nombreTabla).delete(fila).eq('id', fila.id).select()
  if (error) {
    console.error(`Error eliminando ${nombreTabla}:`, error)
    return null
  }
  return data
}

// Añade una fila a la tabla y devuelve los datos que se han guardado.
export async function InsertTabla(nombreTabla, fila) {
  const { data, error } = await supabase.from(nombreTabla).insert(fila).select()
  if (error) {
    console.error(`Error insertando en ${nombreTabla}:`, error)
    return null
  }
  return data
}

// Busca las filas cuyo campo coincide exactamente con el valor que le pasamos.
export async function BuscarPorCampo(nombreTabla, campo, valor) {
  const { data, error } = await supabase.from(nombreTabla).select('*').eq(campo, valor)
  if (error) {
    console.error(`Error buscando en ${nombreTabla}:`, error)
    return []
  }
  return data
}
