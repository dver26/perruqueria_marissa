import { useEffect, useRef, useState } from 'react'
import { useAppContext } from '../context/useAppContext.js'
import { ACTIONS, PANTALLAS } from '../utils/consts.js'
import { supabase } from '../utils/supabase.js'
import { crearHorari, DIES_HORARI, prepararHorari } from '../utils/horaris.js'
import '../components/FormulariPersona.css'
import './HorariTreballador.css'

export default function HorariTreballador() {
  const { state, dispatch } = useAppContext()
  const persona = state.treballador
  const [dies, setDies] = useState(() => crearHorari())
  const [carregant, setCarregant] = useState(true)
  const [guardant, setGuardant] = useState(false)
  const [error, setError] = useState('')
  const [revisio, setRevisio] = useState(0)
  const bloqueig = useRef(false)
  const missatge = useRef(null)
  useEffect(() => {
    let viu = true
    const carregar = async () => {
      try {
        const { data, error } = await supabase.from('horarios_empleados').select('*').eq('empleado_id', persona.id)
        if (error) throw error
        if (viu) { setDies(crearHorari(data)); setCarregant(false) }
      } catch { if (viu) setError('No s’ha pogut carregar l’horari. Torna-ho a provar.') }
    }
    if (persona) void carregar()
    return () => { viu = false }
  }, [persona, revisio])

  const tornar = () => dispatch({ type: ACTIONS.ACTUALITZAR, payload: { pantalla: PANTALLAS.INICIO, treballador: null, altaHorari: false } })
  const canvi = (index, camp, valor) => {
    setDies(prev => prev.map((d, i) => i === index ? { ...d, [camp]: valor } : d))
    setError('')
  }
  const guardar = async event => {
    event.preventDefault()
    if (bloqueig.current) return
    bloqueig.current = true
    setGuardant(true)
    setError('')
    try {
      const files = prepararHorari(dies)
      const { error } = await supabase.rpc('guardar_horario_empleado', { p_empleado: persona.id, p_dias: files })
      if (error) throw error
      tornar()
    } catch (err) {
      setError(err.message || 'No s’ha pogut guardar l’horari.')
      requestAnimationFrame(() => missatge.current?.focus())
    } finally { bloqueig.current = false; setGuardant(false) }
  }
  if (!persona) return <button onClick={tornar}>Tornar a inici</button>
  return <section className='formulari-persona horari-pagina'>
    <header className='horari-capcalera'>
      <span className='horari-pas'>{state.altaHorari ? 'Pas 2 de 2 · Horari' : 'Horari setmanal'}</span>
      <h2>{persona.nombre} {persona.apellidos}</h2>
      <p>{state.altaHorari ? 'Les dades ja estan guardades. Ara configura els seus torns.' : 'Tria els torns de cada dia i ajusta les hores.'} Desactiva els dos torns els dies que no treballi.</p>
    </header>
    <form onSubmit={guardar} noValidate>
      <fieldset className='horari-dies' aria-label='Horari de dimarts a dissabte' disabled={carregant || guardant}>
        {DIES_HORARI.map(({ valor, nom }, index) => <fieldset className='horari-dia' key={valor}>
          <legend>{nom} <span className='horari-resum'>{!dies[index].mati && !dies[index].tarda ? 'Descans' : dies[index].mati && dies[index].tarda ? 'Matí i tarda' : dies[index].mati ? 'Matí' : 'Tarda'}</span></legend>
          <div className='horari-torns'>{[['mati', 'manana', 'Matí'], ['tarda', 'tarde', 'Tarda']].map(([clau, torn, titol]) => <div className={`horari-torn ${dies[index][clau] ? 'horari-torn-actiu' : ''}`} key={clau}>
            <label className='label-checkbox'>
              <span>{titol}</span><span className='interruptor-actiu'>
                <input type='checkbox' role='switch' checked={dies[index][clau]} aria-label={`${nom}: torn de ${titol.toLowerCase()}`} onChange={e => canvi(index, clau, e.target.checked)} />
                <span className='interruptor-pista' aria-hidden='true' />
              </span>
            </label>
            <div className='horari-hores'>
              <label>Entrada<input type='time' step='60' aria-label={`${nom}, ${titol}: entrada`} disabled={!dies[index][clau]} value={dies[index][`hora_inicio_${torn}`]} onChange={e => canvi(index, `hora_inicio_${torn}`, e.target.value)} /></label>
              <label>Sortida<input type='time' step='60' aria-label={`${nom}, ${titol}: sortida`} disabled={!dies[index][clau]} value={dies[index][`hora_fin_${torn}`]} onChange={e => canvi(index, `hora_fin_${torn}`, e.target.value)} /></label>
            </div>
          </div>)}</div>
        </fieldset>)}
      </fieldset>
      {carregant && !error && <p role='status'>Carregant horari…</p>}
      {error && <p ref={missatge} tabIndex={-1} className='mensaje-error' role='alert'>{error}</p>}
      {carregant && error && <button type='button' onClick={() => { setError(''); setRevisio(v => v + 1) }}>Tornar a provar</button>}
      <div className='horari-accions'>
        <button type='button' disabled={guardant} onClick={tornar}>{state.altaHorari ? 'Acabar més tard' : 'Cancel·lar'}</button>
        <button type='submit' className='boto-guardar' disabled={carregant || guardant}>{guardant ? 'Guardant…' : 'Guardar horari'}</button>
      </div>
    </form>
  </section>
}
