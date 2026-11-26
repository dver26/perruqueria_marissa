import { normalizarTexto, normalizarTelefono, validarEmail, validarTelefono } from './validacions.js'

// Deja los datos listos para guardar y avisa si falta algo o el formato no encaja.
export function prepararPersona(formulari) {
  const nombre = normalizarTexto(formulari.nombre)
  const apellidos = normalizarTexto(formulari.apellidos)
  if (!nombre || !apellidos || !formulari.telefono.trim()) {
    throw new Error('Nom, cognoms i telèfon són obligatoris')
  }
  if (!validarTelefono(formulari.telefono)) throw new Error('El telèfon no és vàlid')
  const email = formulari.email.trim()
  if (email && !validarEmail(email)) throw new Error('El format de l’email no és vàlid')
  return { ...formulari, nombre, apellidos, telefono: normalizarTelefono(formulari.telefono), email }
}

// Compara nombres sin que las tildes, las mayúsculas o los espacios molesten.
export function textoComparable(texto) {
  return normalizarTexto(texto ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

// Busca coincidencias de nombre completo o teléfono, sin contar a quien estamos editando.
export function buscarDuplicats(persones, dades, idActual) {
  return persones.filter(persona => {
    if (idActual != null && String(persona.id) === String(idActual)) return false
    const mateixNom = textoComparable(persona.nombre) === textoComparable(dades.nombre)
      && textoComparable(persona.apellidos) === textoComparable(dades.apellidos)
    const mateixTelefon = persona.telefono
      && normalizarTelefono(persona.telefono) === dades.telefono
    return mateixNom || mateixTelefon
  })
}

// Comprueba duplicados antes de escribir y espera una respuesta real de la base de datos.
export async function guardarPersona({ tabla, dades, persona, reactivar = false, confirmat = false, consultar, insertar, actualizar }) {
  const persones = await consultar(tabla)
  if (!Array.isArray(persones)) throw new Error('No s’han pogut comprovar els duplicats. Torna-ho a provar.')
  const duplicats = buscarDuplicats(persones, dades, persona?.id)
  if (duplicats.length && !confirmat) return { duplicats }
  if (tabla === 'empleados') {
    const actiu = dades.activo ?? persona?.activo ?? true
    dades = { ...dades, activo: actiu, fecha_baja: reactivar || actiu ? null : (persona?.fecha_baja ?? null) }
  }
  const resultat = persona
    ? await actualizar(tabla, { ...persona, ...dades })
    : await insertar(tabla, dades)
  if (!resultat?.[0]?.id) throw new Error('No s’han pogut guardar les dades. Torna-ho a provar.')
  return { persona: resultat[0] }
}
