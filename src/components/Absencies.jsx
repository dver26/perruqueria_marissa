import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../utils/supabase.js'
import { absenciaIniciada, absenciaVigent, campsPerEditarAbsencia, canviarTipusAbsencia, dataLocal, formatarDataAbsencia, prepararAbsencia } from '../utils/absencies.js'
import './FormulariPersona.css'
import './Absencies.css'
import Confirmacio from './Confirmacio.jsx'

const campsBuits = { inici: '', fi: '', diesComplets: false, motiu: '' }

export default function Absencies({ treballador, onTancar, onCanvi }) {
  const [llista, setLlista] = useState([])
  const [camps, setCamps] = useState(campsBuits)
  const [editant, setEditant] = useState(null)
  const [iniciAra, setIniciAra] = useState(false)
  const [ara, setAra] = useState(dataLocal)
  const [error, setError] = useState('')
  const [ocupat, setOcupat] = useState(false)
  const [carregant, setCarregant] = useState(true)
  const [absenciaAEliminar, setAbsenciaAEliminar] = useState(null)
  const bloqueig = useRef(false)
  const formulari = useRef(null)
  const iniciBloquejat = editant && absenciaIniciada(editant, ara)
  const visibles = llista.filter(a => absenciaVigent(a, ara))
  const carregarAbsencies = useCallback(async () => {
    const { data, error } = await supabase.rpc('listar_ausencias', { p_empleado: treballador.id })
    if (error) throw error
    return data
  }, [treballador.id])

  useEffect(() => {
    const interval = window.setInterval(() => setAra(dataLocal()), 1000)
    return () => window.clearInterval(interval)
  }, [])
  useEffect(() => {
    let viu = true
    const carregar = async () => {
      if (bloqueig.current) return
      try {
        const data = await carregarAbsencies()
        if (viu && !bloqueig.current) {
          setLlista(data)
          setCarregant(false)
          if (editant && !data.some(a => a.id === editant.id)) {
            setEditant(null)
            setIniciAra(false)
            setCamps(campsBuits)
            setError('Aquesta absència ja no és vigent. S’ha actualitzat la llista.')
          }
        }
      } catch {
        if (viu) setError('No s’han pogut carregar les absències. Tanca i torna-ho a provar.')
      }
    }
    void carregar()
    const interval = window.setInterval(carregar, 30000)
    window.addEventListener('focus', carregar)
    return () => { viu = false; window.clearInterval(interval); window.removeEventListener('focus', carregar) }
  }, [carregarAbsencies, editant])

  const guardar = async event => {
    event.preventDefault()
    if (bloqueig.current) return
    bloqueig.current = true
    setOcupat(true)
    setError('')
    try {
      const iniciJaFix = editant && absenciaIniciada(editant)
      const fila = prepararAbsencia(camps, treballador.id, { original: editant, iniciAra })
      let resultat
      if (iniciAra) {
        resultat = await supabase.rpc('guardar_ausencia_ahora', { p_empleado: treballador.id,
          p_fin: fila.fecha_fin, p_motivo: fila.motivo, p_id: editant?.id ?? null }).single()
      } else {
        const consulta = editant
          ? supabase.from('ausencias_empleados').update({ motivo: fila.motivo, fecha_fin: fila.fecha_fin, dias_completos: fila.dias_completos,
            ...(!iniciJaFix ? { fecha_inicio: fila.fecha_inicio } : {}) }).eq('id', editant.id).eq('empleado_id', treballador.id)
          : supabase.from('ausencias_empleados').insert(fila)
        resultat = await consulta.select().single()
      }
      const { data, error } = resultat
      if (error) throw error
      setLlista(prev => [...prev.filter(a => a.id !== data.id), data].sort((a, b) => a.fecha_inicio.localeCompare(b.fecha_inicio)))
      setAra(dataLocal())
      setCamps(campsBuits)
      setEditant(null)
      setIniciAra(false)
      await onCanvi()
      setLlista(await carregarAbsencies())
    } catch (err) {
      setError(err.message || 'No s’ha pogut guardar l’absència.')
    }
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
      if (editant?.id === id) { setEditant(null); setIniciAra(false); setCamps(campsBuits) }
      setAbsenciaAEliminar(null)
      await onCanvi()
      setLlista(await carregarAbsencies())
    } catch (err) { setError(err.message) }
    finally { bloqueig.current = false; setOcupat(false) }
  }
  const editar = absencia => {
    setError('')
    setEditant(absencia)
    setIniciAra(false)
    setCamps(campsPerEditarAbsencia(absencia))
    formulari.current.scrollIntoView({ block: 'start' })
    formulari.current.focus()
  }
  const canvi = event => setCamps(prev => ({ ...prev, [event.target.name]: event.target.value }))
  return <section className='formulari-persona absencies-pagina' aria-label='Absències del treballador'>
    <h2>Absències: {treballador.nombre} {treballador.apellidos}</h2>
    <div className='absencies-distribucio'>
    <div className='absencies-formulari'>
    <form ref={formulari} tabIndex={-1} onSubmit={guardar}>
      <h3>{editant ? 'Editar absència' : 'Afegir absència'}</h3>
      <fieldset disabled={ocupat || carregant}>
        <label className='label-checkbox'>
          <span>Dies complets</span>
          <span className='interruptor-actiu'>
            <input type='checkbox' role='switch' aria-label='Dies complets' checked={camps.diesComplets} onChange={e => {
              setCamps(prev => canviarTipusAbsencia(iniciAra ? { ...prev, inici: ara } : prev, e.target.checked, editant))
              setIniciAra(false)
              setError('')
            }} />
            <span className='interruptor-pista' aria-hidden='true' />
          </span>
        </label>
        <div className='absencia-inici'>
          <label>Inici<input required disabled={!!iniciBloquejat} readOnly={iniciAra} type={camps.diesComplets ? 'date' : 'datetime-local'} step={camps.diesComplets ? undefined : 'any'} name='inici' value={iniciAra ? ara : camps.inici} onChange={canvi} /></label>
          {!camps.diesComplets && !iniciBloquejat && <button type='button' className='boto-inici-ara' aria-pressed={iniciAra} onClick={() => {
            const actual = dataLocal()
            setAra(actual)
            setCamps(prev => ({ ...prev, inici: actual }))
            setIniciAra(prev => !prev)
            setError('')
          }}>{iniciAra ? 'Triar data' : 'Ara'}</button>}
        </div>
        {iniciAra && <p className='absencia-avis-ara' role='status'>L’hora s’actualitza automàticament i es fixa en guardar.</p>}
        {iniciBloquejat && <p>L’absència ja ha començat: es conserva l’inici exacte i el selector de dies o hores s’aplica al final.</p>}
        <label>Final (opcional)<input type={camps.diesComplets ? 'date' : 'datetime-local'} step={camps.diesComplets ? undefined : 'any'} name='fi' value={camps.fi} onChange={canvi} aria-describedby='avis-final-absencia' /></label>
        <p id='avis-final-absencia'>Si no tries un final, hauràs de posar el treballador actiu quan estigui a punt per tornar.</p>
        <label>Motiu (opcional)<input name='motiu' maxLength={255} value={camps.motiu} onChange={canvi} /></label>
        {editant && <div className='botons-formulari'>
          <button type='button' onClick={() => { setEditant(null); setIniciAra(false); setCamps(campsBuits); setError('') }}>Cancel·lar edició</button>
        </div>}
      </fieldset>
      <div className='absencia-accions-finals'>
        <button type='submit' className='boto-confirmar-absencia' disabled={ocupat || carregant}>{ocupat ? 'Guardant…' : editant ? 'Guardar canvis' : 'Afegir absència'}</button>
        <button type='button' className='boto-tornar-absencia' disabled={ocupat} onClick={onTancar}>Tornar</button>
      </div>
    </form>
    {error && !absenciaAEliminar && <p role='alert' className='mensaje-error'>{error}</p>}
    </div>
    {absenciaAEliminar && <Confirmacio titol='Eliminar aquesta absència?' confirmar='Eliminar absència'
      ocupat={ocupat} error={error} onConfirmar={() => eliminar(absenciaAEliminar.id)}
      onCancelar={() => { setAbsenciaAEliminar(null); setError('') }}>
      <p>S’eliminarà l’absència de <strong>{treballador.nombre} {treballador.apellidos}</strong>:</p>
      <p>{formatarDataAbsencia(absenciaAEliminar.fecha_inicio)} — {formatarDataAbsencia(absenciaAEliminar.fecha_fin)}</p>
      <p>Aquesta acció no es pot desfer.</p>
    </Confirmacio>}
    <aside className='absencies-registre' aria-labelledby='absencies-registrades-titol'>
      <h3 id='absencies-registrades-titol'>Absències registrades</h3>
    {carregant ? <p>Carregant absències…</p> : <>
      {!visibles.length && <p>Cap absència actual ni futura.</p>}
      <ul className='llista-absencies'>{visibles.map(a => <li key={a.id} className={absenciaIniciada(a, ara) ? 'absencia-en-curs' : 'absencia-programada'}>
        <div className='absencia-capcalera'>
          <span className='estat-absencia'>{absenciaIniciada(a, ara) ? 'En curs' : 'Programada'}</span>
          <span className='absencia-computo'>Computable</span>
          {a.motivo && <span className='absencia-motiu'>{a.motivo}</span>}
        </div>
        <dl className='absencia-dates'>
          <dt>Inici</dt><dd>{formatarDataAbsencia(a.fecha_inicio)}</dd>
          <dt>Final</dt><dd>{formatarDataAbsencia(a.fecha_fin)}</dd>
        </dl>
        <div className='botons-formulari'>
          <button type='button' className='boto-editar-absencia' disabled={ocupat} onClick={() => editar(a)}>Editar</button>
          <button type='button' className='boto-eliminar-absencia' disabled={ocupat} onClick={() => { setError(''); setAbsenciaAEliminar(a) }}>Eliminar absència</button>
        </div>
      </li>)}</ul>
    </>}
    </aside>
    </div>
  </section>
}
