import { useCallback, useEffect, useRef, useState } from 'react'
import { useAppContext } from '../context/useAppContext.js'
import { ACTIONS, PANTALLAS } from '../utils/consts.js'
import { supabase } from '../utils/supabase.js'
import { dataLocal } from '../utils/absencies.js'
import { crearMes, diesFestaGuardats, diesInterval, esLaborable } from '../utils/festes.js'
import '../components/FormulariPersona.css'
import './DiesFesta.css'
import Confirmacio from '../components/Confirmacio.jsx'

const mostrarDia = dia => dia.split('-').reverse().join('/')

export default function DiesFesta() {
  const { state, dispatch } = useAppContext()
  const persona = state.treballador
  const [avui] = useState(() => dataLocal().slice(0, 10))
  const [mesos, setMesos] = useState(3)
  const [individuals, setIndividuals] = useState(false)
  const [eliminant, setEliminant] = useState(false)
  const [confirmarEliminacio, setConfirmarEliminacio] = useState(false)
  const [inici, setInici] = useState(null)
  const [sobre, setSobre] = useState(null)
  const [horaris, setHoraris] = useState([])
  const [festius, setFestius] = useState(new Set())
  const [carregant, setCarregant] = useState(true)
  const [ocupat, setOcupat] = useState(false)
  const [error, setError] = useState('')
  const [missatge, setMissatge] = useState('')
  const [revisio, setRevisio] = useState(0)
  const bloqueig = useRef(false)
  const desplacant = useRef(false)
  const missatgeError = useRef(null)
  const carregar = useCallback(async () => {
    const [h, a] = await Promise.all([
      supabase.from('horarios_empleados').select('*').eq('empleado_id', persona.id),
      supabase.from('ausencias_empleados').select('*').eq('empleado_id', persona.id).eq('tipo', 'vacaciones')
    ])
    if (h.error || a.error) throw new Error('No s’han pogut carregar el calendari i els dies de festa.')
    return { horaris: h.data, festius: diesFestaGuardats(a.data) }
  }, [persona])

  useEffect(() => {
    let viu = true
    if (persona) carregar().then(dades => {
      if (viu) { setHoraris(dades.horaris); setFestius(dades.festius); setCarregant(false) }
    }).catch(err => { if (viu) setError(err.message) })
    return () => { viu = false }
  }, [persona, carregar, revisio])
  useEffect(() => { desplacant.current = false }, [mesos])

  const comptats = [...festius].filter(dia => esLaborable(dia, horaris)).length
  const previsio = inici && sobre && sobre >= inici ? diesInterval(inici, sobre, horaris).filter(d => !festius.has(d)).length : 0
  const potTreballar = horaris.some(h => h.dia_semana >= 2 && h.dia_semana <= 6 && (h.hora_inicio_manana < h.hora_fin_manana || h.hora_inicio_tarde < h.hora_fin_tarde))

  const triar = async dia => {
    if (bloqueig.current || carregant) return
    setError('')
    setMissatge('')
    if (eliminant) {
      if (!festius.has(dia)) return
      bloqueig.current = true
      setOcupat(true)
      try {
        const { error } = await supabase.rpc('eliminar_dia_fiesta', { p_empleado: persona.id, p_dia: dia })
        if (error) throw error
        const dades = await carregar()
        setFestius(dades.festius)
        setHoraris(dades.horaris)
        setMissatge(`Dia de festa del ${mostrarDia(dia)} eliminat.`)
      } catch (err) {
        setError(err.message || 'No s’ha pogut eliminar el dia de festa.')
        requestAnimationFrame(() => missatgeError.current?.focus())
      } finally { bloqueig.current = false; setOcupat(false) }
      return
    }
    if (!esLaborable(dia, horaris) && (individuals || !inici)) return
    if (!individuals && !inici) { setInici(dia); setSobre(dia); return }
    if (!individuals && dia < inici) {
      setError('El dia final no pot ser anterior al dia inicial. Tria un final posterior o cancel·la la selecció.')
      return
    }
    const seleccionats = individuals ? (esLaborable(dia, horaris) ? [dia] : []) : diesInterval(inici, dia, horaris)
    const nous = seleccionats.filter(d => !festius.has(d))
    if (!nous.length) {
      setMissatge(seleccionats.length ? 'Aquests dies ja són dies de festa.' : 'No hi ha cap dia laborable en aquesta selecció. Els dies de descans no compten.')
      if (!individuals) { setInici(null); setSobre(null) }
      return
    }
    bloqueig.current = true
    setOcupat(true)
    try {
      const { data: quantitat, error } = await supabase.rpc('guardar_dias_fiesta', { p_empleado: persona.id, p_dias: nous })
      if (error) throw error
      const dades = await carregar()
      setFestius(dades.festius)
      setHoraris(dades.horaris)
      setInici(null)
      setSobre(null)
      setMissatge(`${quantitat} ${quantitat === 1 ? 'dia de festa guardat' : 'dies de festa guardats'}.`)
    } catch (err) {
      setError(err.message || 'No s’han pogut guardar els dies de festa.')
      requestAnimationFrame(() => missatgeError.current?.focus())
    } finally { bloqueig.current = false; setOcupat(false) }
  }
  const tornar = () => dispatch({ type: ACTIONS.ACTUALITZAR, payload: { pantalla: PANTALLAS.INICIO, treballador: null } })
  const eliminarMes = async mes => {
    if (!eliminant || bloqueig.current || carregant) return
    bloqueig.current = true
    setOcupat(true)
    setError('')
    setMissatge('')
    try {
      const { data: quantitat, error } = await supabase.rpc('eliminar_mes_fiesta', { p_empleado: persona.id, p_mes: `${mes.mes}-01` })
      if (error) throw error
      const dades = await carregar()
      setFestius(dades.festius)
      setHoraris(dades.horaris)
      setMissatge(`${quantitat} ${quantitat === 1 ? 'dia de festa eliminat' : 'dies de festa eliminats'} de ${mes.titol}.`)
    } catch (err) {
      setError(err.message || 'No s’han pogut eliminar els dies de festa del mes.')
      requestAnimationFrame(() => missatgeError.current?.focus())
    } finally { bloqueig.current = false; setOcupat(false) }
  }
  if (!persona) return <button onClick={tornar}>Tornar a inici</button>
  return <section className='formulari-persona festes-pagina'>
    <header className='festes-capcalera'>
      <div><span className='festes-subtitol'>Vacances i dies de festa</span><h2>{persona.nombre} {persona.apellidos}</h2></div>
      <div className='festes-comptador'><strong>{comptats}</strong><span>dies laborables de festa guardats</span></div>
    </header>
    <div className='festes-controls'>
      <label className='label-checkbox'><span>Triar dies individuals</span><span className='interruptor-actiu'>
        <input type='checkbox' role='switch' checked={individuals} disabled={ocupat || eliminant} onChange={e => { setIndividuals(e.target.checked); setInici(null); setSobre(null); setError(''); setMissatge('') }} />
        <span className='interruptor-pista' aria-hidden='true' />
      </span></label>
      <label className='label-checkbox'><span>Eliminar dies</span><span className='interruptor-actiu'>
        <input type='checkbox' role='switch' checked={eliminant} disabled={ocupat || carregant} onChange={e => {
          if (e.target.checked) setConfirmarEliminacio(true)
          else { setEliminant(false); setMissatge(''); setError('') }
        }} />
        <span className='interruptor-pista' aria-hidden='true' />
      </span></label>
      <p className={eliminant ? 'festes-avis-eliminar' : undefined}>{eliminant ? 'Mode d’eliminació actiu: cada clic sobre un dia de festa l’elimina.' : individuals ? 'Un sol clic guarda un dia de festa. Pots afegir-ne diversos, un a un.' : 'Tria el dia inicial i després el final. Pots baixar pel calendari per passar de mes. El mateix dia inicial i final compta com un sol dia.'}</p>
      <p className='festes-llegenda'><span>En gris: no treballa</span><span className='festes-llegenda-festa'>En lila: dia de festa guardat</span></p>
      {inici && <div className='festes-seleccio' role='status'>Inici: <strong>{mostrarDia(inici)}</strong> · Tria el final{previsio > 0 && ` · ${previsio} dies laborables nous`}<button type='button' disabled={ocupat} onClick={() => { setInici(null); setSobre(null); setError('') }}>Cancel·lar selecció</button></div>}
    </div>
    {confirmarEliminacio && <Confirmacio titol='Activar l’eliminació de dies?' confirmar='Sí, activar' onCancelar={() => setConfirmarEliminacio(false)} onConfirmar={() => {
      setConfirmarEliminacio(false); setEliminant(true); setInici(null); setSobre(null); setError(''); setMissatge('')
    }}><p>Estàs segur que vols activar aquest mode? Cada dia de festa que cliquis s’eliminarà i el comptador s’actualitzarà. També podràs eliminar tots els dies de festa d’un mes.</p></Confirmacio>}
    {error && <p ref={missatgeError} tabIndex={-1} className='mensaje-error' role='alert'>{error}</p>}
    <p className='festes-estat' role='status'>{ocupat ? eliminant ? 'Eliminant dies de festa…' : 'Guardant dies de festa…' : missatge}</p>
    {carregant ? <p role='status'>Carregant calendari…</p> : !potTreballar && !eliminant ? <p>Cal configurar primer l’horari del treballador per saber quins dies treballa.</p> : <div className='festes-calendari' aria-label='Calendari de dies de festa' onScroll={e => {
      const el = e.currentTarget
      if (!desplacant.current && el.scrollHeight - el.scrollTop - el.clientHeight < 120) { desplacant.current = true; setMesos(n => n + 3) }
    }}>
      {Array.from({ length: mesos }, (_, index) => {
        const mes = crearMes(avui.slice(0, 7), index)
        return <section className='festes-mes' key={mes.mes} aria-label={mes.titol}>
          <div className='festes-mes-capcalera'>
            <h3>{mes.titol}</h3>
            {eliminant && <button type='button' className='festes-eliminar-mes' disabled={ocupat || ![...festius].some(dia => dia.startsWith(mes.mes))}
              aria-label={`Eliminar tots els dies de festa de ${mes.titol}`} onClick={() => eliminarMes(mes)}>Eliminar tot el mes</button>}
          </div>
          <div className='festes-setmana' aria-hidden='true'>{['Dl', 'Dt', 'Dc', 'Dj', 'Dv', 'Ds', 'Dg'].map(d => <span key={d}>{d}</span>)}</div>
          <div className='festes-dies'>
            {Array.from({ length: mes.buits }, (_, i) => <span key={`buit-${i}`} />)}
            {mes.dies.map(dia => {
              const laborable = esLaborable(dia, horaris)
              const guardat = festius.has(dia)
              const seleccionat = dia === inici || (inici && sobre && sobre >= inici && dia >= inici && dia <= sobre)
              return <button type='button' key={dia} disabled={ocupat || (eliminant ? !guardat : dia < avui || (individuals ? guardat || !laborable : !inici && !laborable))}
                className={`festes-dia${!laborable ? ' festes-descans' : ''}${guardat ? ' festes-guardat' : ''}${eliminant && guardat ? ' festes-eliminable' : ''}${seleccionat ? ' festes-triat' : ''}${dia === avui ? ' festes-avui' : ''}`}
                aria-label={`${mostrarDia(dia)}, ${laborable ? 'laborable' : 'descans'}${guardat ? ', dia de festa guardat' : ''}`}
                aria-pressed={guardat || !!seleccionat} aria-current={dia === avui ? 'date' : undefined}
                onClick={() => triar(dia)} onMouseEnter={() => { if (inici) setSobre(dia) }} onFocus={() => { if (inici) setSobre(dia) }}>
                {Number(dia.slice(8))}
              </button>
            })}
          </div>
        </section>
      })}
      <button type='button' className='festes-mesos-mes' onClick={() => setMesos(n => n + 3)}>Mostrar tres mesos més</button>
    </div>}
    {carregant && error && <button type='button' onClick={() => { setError(''); setRevisio(v => v + 1) }}>Tornar a provar</button>}
    <button type='button' disabled={ocupat} onClick={tornar}>Tornar</button>
  </section>
}
