import { useEffect, useRef, useState } from 'react'
import { supabase } from '../utils/supabase.js'
import { prepararAbsencia } from '../utils/absencies.js'
import './FormulariPersona.css'
import Confirmacio from './Confirmacio.jsx'

export default function Absencies({ treballador, onTancar, onCanvi }) {
  const [llista, setLlista] = useState([])
  const [camps, setCamps] = useState({ inici: '', fi: '', diesComplets: false, motiu: '' })
  const [error, setError] = useState('')
  const [ocupat, setOcupat] = useState(false)
  const [carregant, setCarregant] = useState(true)
  const [absenciaAEliminar, setAbsenciaAEliminar] = useState(null)
  const bloqueig = useRef(false)
  useEffect(() => {
    let viu = true
    supabase.from('ausencias_empleados').select('*').eq('empleado_id', treballador.id).order('fecha_inicio')
      .then(({ data, error }) => {
        if (!viu) return
        if (error) setError('No s’han pogut carregar les absències. Tanca i torna-ho a provar.')
        else { setLlista(data); setCarregant(false) }
      }).catch(() => {
        if (viu) setError('No s’han pogut carregar les absències. Tanca i torna-ho a provar.')
      })
    return () => { viu = false }
  }, [treballador.id])

  const guardar = async event => {
    event.preventDefault()
    if (bloqueig.current) return
    bloqueig.current = true
    setOcupat(true)
    setError('')
    try {
      const fila = prepararAbsencia(camps, treballador.id)
      const { data, error } = await supabase.from('ausencias_empleados').insert(fila).select().single()
      if (error) throw error
      setLlista(prev => [...prev, data].sort((a, b) => a.fecha_inicio.localeCompare(b.fecha_inicio)))
      setCamps({ inici: '', fi: '', diesComplets: false, motiu: '' })
      await onCanvi()
    } catch (err) { setError(err.message || 'No s’ha pogut guardar l’absència.') }
    finally { bloqueig.current = false; setOcupat(false) }
  }

  const eliminar = async id => {
    if (bloqueig.current) return
    bloqueig.current = true
    setOcupat(true)
    setError('')
    try {
      const { data, error } = await supabase.from('ausencias_empleados').delete().eq('id', id).eq('empleado_id', treballador.id).select('id').single()
      if (error || !data) throw new Error('No s’ha pogut eliminar l’absència.')
      setLlista(prev => prev.filter(a => a.id !== id))
      setAbsenciaAEliminar(null)
      await onCanvi()
    } catch (err) { setError(err.message) }
    finally { bloqueig.current = false; setOcupat(false) }
  }
  const canvi = event => setCamps(prev => ({ ...prev, [event.target.name]: event.target.value }))
  return <section className='formulari-persona' aria-label='Absències del treballador'>
    <h2>Absències: {treballador.nombre} {treballador.apellidos}</h2>
    <form onSubmit={guardar}>
      <fieldset disabled={ocupat || carregant}>
        <label className='label-checkbox'>
          <span>Dies complets</span>
          <span className='interruptor-actiu'>
            <input type='checkbox' role='switch' aria-label='Dies complets' checked={camps.diesComplets} onChange={e => setCamps(prev => ({ ...prev, diesComplets: e.target.checked, inici: '', fi: '' }))} />
            <span className='interruptor-pista' aria-hidden='true' />
          </span>
        </label>
        <label>Inici<input required type={camps.diesComplets ? 'date' : 'datetime-local'} name='inici' value={camps.inici} onChange={canvi} /></label>
        <label>Final (opcional)<input type={camps.diesComplets ? 'date' : 'datetime-local'} name='fi' value={camps.fi} onChange={canvi} aria-describedby='avis-final-absencia' /></label>
        <p id='avis-final-absencia'>Si no tries un final, hauràs de posar el treballador actiu quan estigui a punt per tornar.</p>
        <label>Motiu (opcional)<input name='motiu' maxLength={255} value={camps.motiu} onChange={canvi} /></label>
        <button type='submit'>{ocupat ? 'Guardant…' : 'Afegir absència'}</button>
      </fieldset>
    </form>
    {error && !absenciaAEliminar && <p role='alert' className='mensaje-error'>{error}</p>}
    {absenciaAEliminar && <Confirmacio titol='Eliminar aquesta absència?' confirmar='Eliminar absència'
      ocupat={ocupat} error={error} onConfirmar={() => eliminar(absenciaAEliminar.id)}
      onCancelar={() => { setAbsenciaAEliminar(null); setError('') }}>
      <p>S’eliminarà l’absència de <strong>{treballador.nombre} {treballador.apellidos}</strong>:</p>
      <p>{absenciaAEliminar.fecha_inicio.replace('T', ' ')} — {absenciaAEliminar.fecha_fin?.replace('T', ' ') ?? 'Sense data final'}</p>
      <p>Aquesta acció no es pot desfer.</p>
    </Confirmacio>}
    {carregant ? <p>Carregant absències…</p> : <>
      <h3>Absències registrades</h3>
      {!llista.length && <p>Cap absència registrada.</p>}
      <ul>{llista.map(a => <li key={a.id}>
        <p>{a.fecha_inicio.replace('T', ' ')} — {a.fecha_fin?.replace('T', ' ') ?? 'Sense data final'}{a.motivo && ` · ${a.motivo}`}</p>
        <button type='button' disabled={ocupat} onClick={() => { setError(''); setAbsenciaAEliminar(a) }}>Eliminar absència</button>
      </li>)}</ul>
    </>}
    <button type='button' disabled={ocupat} onClick={onTancar}>Tornar</button>
  </section>
}
