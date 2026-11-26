import { useRef, useState } from 'react'
import { fetchTabla, InsertTabla, UpdateTabla } from '../utils/supabase.js'
import { guardarPersona, prepararPersona } from '../utils/persones.js'
import './FormulariPersona.css'

// Comparte las comprobaciones y el aspecto de los formularios de clientes y trabajadores.
export default function FormulariPersona({ persona, treballador = false, onGuardat, onCancelar, textGuardar = 'Guardar', descripcio }) {
  const [formulari, setFormulari] = useState(() => ({
    nombre: persona?.nombre ?? '',
    apellidos: persona?.apellidos ?? '',
    telefono: persona?.telefono ?? '',
    email: persona?.email ?? '',
    ...(treballador ? { activo: persona?.activo ?? true } : { observaciones: persona?.observaciones ?? '' })
  }))
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [duplicats, setDuplicats] = useState([])
  const [anterior, setAnterior] = useState(null)
  const bloquejat = useRef(false)
  const titol = `${persona ? 'Editar' : 'Crear'} ${treballador ? 'Treballador' : 'Client'}`
  const recuperables = treballador && !persona && !anterior ? duplicats.filter(p => p.fecha_baja) : []
  const coincidenciesActuals = duplicats.filter(p => !recuperables.includes(p))

  // Recoge lo que escribimos y limpia el error anterior.
  const handleChange = ({ target: { name, value, type, checked } }) => {
    setFormulari(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    setError('')
  }

  // Valida, avisa de duplicados y sale solo cuando el guardado ha ido bien.
  const handleGuardar = async (confirmat = false) => {
    if (bloquejat.current) return
    bloquejat.current = true
    setGuardando(true)
    setError('')
    try {
      const dades = prepararPersona(formulari)
      const resultat = await guardarPersona({
        tabla: treballador ? 'empleados' : 'clientes', dades, persona: persona ?? (treballador ? anterior : null), confirmat,
        reactivar: treballador && !!anterior,
        consultar: fetchTabla, insertar: InsertTabla, actualizar: UpdateTabla
      })
      if (resultat.duplicats) {
        setDuplicats(resultat.duplicats)
        return
      }
      setDuplicats([])
      onGuardat(resultat.persona)
    } catch (err) {
      setError(err.message || 'No s’han pogut guardar les dades. Torna-ho a provar.')
      setDuplicats([])
    } finally {
      bloquejat.current = false
      setGuardando(false)
    }
  }

  // Permite guardar con el teclado además de usar el botón.
  const handleSubmit = event => {
    event.preventDefault()
    if (!duplicats.length) void handleGuardar()
  }

  const recuperar = (p, copiar) => {
    if (!treballador) return
    setAnterior(p)
    setFormulari(prev => ({
      ...(copiar ? { nombre: p.nombre, apellidos: p.apellidos, telefono: p.telefono ?? '', email: p.email ?? '' } : prev),
      activo: true
    }))
    setDuplicats([])
  }

  return (
    <form className='formulari-persona' onSubmit={handleSubmit} noValidate aria-label={titol}>
      <div className='formulari-persona-camps'>
      <h2>{titol}</h2>
      {descripcio && <p>{descripcio}</p>}
      {treballador && anterior && <p role='status'>Reactivant la fitxa anterior. Es conservarà l’historial. Revisa les dades i prem Guardar.</p>}
      <fieldset disabled={guardando || duplicats.length > 0}>
        {[
          ['nombre', 'Nom', 'text'], ['apellidos', 'Cognoms', 'text'],
          ['telefono', 'Telèfon', 'tel'], ['email', 'Email', 'email']
        ].map(([name, label, type]) => (
          <label key={name}>
            <span>{label} {name !== 'email' && <span className='obligatori' aria-hidden='true'>*</span>}</span>
            <input name={name} type={type} value={formulari[name]} onChange={handleChange} required={name !== 'email'} />
          </label>
        ))}
        {treballador ? (
          <label className='label-checkbox'>
            <span>Actiu</span>
            <span className='interruptor-actiu'>
              <input type='checkbox' role='switch' aria-label='Actiu' name='activo' checked={formulari.activo} onChange={handleChange} />
              <span className='interruptor-pista' aria-hidden='true' />
            </span>
            <span className='estat-actiu' aria-hidden='true'>{formulari.activo ? 'Activat' : 'Desactivat'}</span>
          </label>
        ) : (
          <label>Observacions
            <textarea name='observaciones' value={formulari.observaciones} onChange={handleChange} />
          </label>
        )}
      </fieldset>
      {error && <p className='mensaje-error' role='alert'>{error}</p>}
      <div className='botons-formulari'>
        <button type='button' onClick={onCancelar} disabled={guardando || duplicats.length > 0}>Cancelar</button>
        <button type='submit' className='boto-guardar' disabled={guardando || duplicats.length > 0}>
          {guardando ? 'Guardant...' : textGuardar}
        </button>
      </div>
      </div>
      {duplicats.length > 0 && (
        <div className='avis-duplicats' role='group' aria-label='Avís de duplicats'>
          {coincidenciesActuals.length > 0 && <>
          <p role='alert'>Ja hi ha {treballador ? 'treballadors' : 'clients'} amb el mateix nom i cognoms o telèfon:</p>
          <ul>{coincidenciesActuals.map(p => <li key={p.id}>{p.nombre} {p.apellidos} — {p.telefono}</li>)}</ul>
          </>}
          {recuperables.length > 0 && <>
          <p role='alert'>Aquest treballador ja havia estat aquí. Vols recuperar la seva fitxa?</p>
          <ul className='llista-recuperacio'>{recuperables.map(p => <li key={p.id}>
            {p.nombre} {p.apellidos} — {p.telefono}
            <div className='botons-recuperacio'>
              <button type='button' disabled={guardando} onClick={() => recuperar(p, true)}>Copiar dades anteriors</button>
              <button type='button' disabled={guardando} onClick={() => recuperar(p, false)}>Introduir dades manualment</button>
            </div>
          </li>)}</ul>
          </>}
          {!recuperables.length && <p>Vols guardar igualment?</p>}
          <div className='botons-formulari'>
            <button type='button' autoFocus disabled={guardando} onClick={() => setDuplicats([])}>No, revisar</button>
            {!recuperables.length && <button type='button' className='boto-guardar' disabled={guardando} onClick={() => handleGuardar(true)}>Sí, guardar</button>}
          </div>
        </div>
      )}
    </form>
  )
}
