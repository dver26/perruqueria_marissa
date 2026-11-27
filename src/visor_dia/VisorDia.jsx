import { useState } from 'react'
import { useAppContext } from '../context/useAppContext.js'
import { ACTIONS, PANTALLAS, TORNS } from '../utils/consts.js'
import { formatDataLocal, formatFranja, formatHora, minutsDia, retallarFranja, sumarDies, teDurada } from '../utils/jornades.js'
import { useJornades } from '../utils/useJornades.js'
import ConfirmarReserva from './ConfirmarReserva.jsx'
import './VisorDia.css'

const formatData = new Intl.DateTimeFormat('ca-ES', { dateStyle: 'full' })
const pasEscala = 30
const horariTorns = {
  [TORNS.MATI]: { etiqueta: 'Matí', inici: 8 * 60, fi: 14 * 60 },
  [TORNS.TARDA]: { etiqueta: 'Tarda', inici: 14 * 60, fi: 20 * 60 },
  [TORNS.INDIFERENT]: { etiqueta: 'Tot el dia', inici: 8 * 60, fi: 20 * 60 }
}

function HorarisDia({ data, tornSeleccionat, resum }) {
  const { resultat, error } = useJornades(data, 1, tornSeleccionat)
  if (error) return <p className='visor-estat' role='alert'>No s’han pogut carregar els horaris.</p>
  if (!resultat) return <p className='visor-estat' role='status'>Carregant els horaris…</p>
  const { dies: [{ jornada }] } = resultat
  if (!jornada.length) return <p className='visor-estat'>No hi ha treballadores actives.</p>

  const franges = jornada.flatMap(({ torns, ocupades }) => [...torns, ...ocupades])
  const limits = horariTorns[tornSeleccionat]
  const primerMinut = franges.length ? Math.min(...franges.map((franja) => franja.inici)) : limits.inici
  const ultimMinut = franges.length ? Math.max(...franges.map((franja) => franja.fi)) : limits.fi
  const inici = Math.floor(primerMinut / pasEscala) * pasEscala
  const fi = Math.ceil(ultimMinut / pasEscala) * pasEscala
  const percentatge = (valor) => `${(valor - inici) / (fi - inici) * 100}%`
  const marques = Array.from({ length: (fi - inici) / pasEscala + 1 }, (_, i) => inici + i * pasEscala)
  const densitatEscala = marques.length > 17 ? 'alta' : marques.length > 11 ? 'mitjana' : 'baixa'
  const situarFranja = (franja) => ({
    '--inici-franja': percentatge(Math.max(inici, franja.inici)),
    '--fi-franja': `calc(100% - ${percentatge(Math.min(fi, franja.fi))})`
  })
  const escalaHoraria = (
    <div className='visor-escala' data-densitat={resum ? undefined : densitatEscala} aria-hidden='true'>
      {marques.map((valor) => (
        <span key={valor} style={{ top: percentatge(valor) }}
          data-minut={valor % 120}>{formatHora(valor)}</span>
      ))}
    </div>
  )

  return (
    <section className='visor-horaris' aria-label='Horaris de les treballadores'>
      {!resum && <ConfirmarReserva data={data} jornada={jornada} />}
      <div className='visor-jornada' style={{ '--columnes-visor': jornada.length }}
        tabIndex={resum ? 0 : undefined} role={resum ? 'region' : undefined}
        aria-label={resum ? 'Horari i feines del dia' : undefined}>
        <div className='visor-tauler' style={{ '--pas-escala': percentatge(inici + pasEscala), '--trams-visor': marques.length - 1 }}>
          {!resum && escalaHoraria}
          <ul className='visor-treballadores'>
            {jornada.map(({ id, nom, torns, absencies, ocupades }) => {
              const festa = absencies.some((franja) => franja.inici === 0 && franja.fi === minutsDia)
              const absenciesVisibles = absencies.map((franja) => retallarFranja(franja, inici, fi)).filter(teDurada)
              const inicials = nom.split(/\s+/).slice(0, 2).map((part) => part[0]).join('')
              const etiquetaPista = festa ? 'Dia de festa' :
                (!torns.length && !absenciesVisibles.length && !ocupades.length ? 'Sense torn' : '')

              return (
                <li className='visor-treballadora' key={id}>
                  <div className='visor-persona'>
                    <span className='visor-inicials' aria-hidden='true'>{inicials}</span>
                    <h2 title={nom}>{nom}</h2>
                  </div>
                  {resum && escalaHoraria}
                  <div className='visor-pista'>
                    {!festa && torns.map((torn, i) => (
                      <span className='visor-torn' key={i} style={situarFranja(torn)} aria-hidden='true' />
                    ))}
                    {absenciesVisibles.map((franja, i) => (
                      <span className='visor-absencia' key={i} style={situarFranja(franja)} aria-hidden='true' />
                    ))}
                    {ocupades.map((franja, i) => (
                      <span className='visor-ocupada' key={i} style={situarFranja(franja)}
                        title={`${franja.tasca ?? 'Cita'} · ${formatFranja(franja)}`} aria-hidden='true'>
                        {resum && <span className='visor-nom-tasca'>{franja.tasca ?? 'Cita'}</span>}
                      </span>
                    ))}
                    {etiquetaPista && <span className='visor-etiqueta-pista'>{etiquetaPista}</span>}
                  </div>
                  {((!festa && (torns.length > 0 || absenciesVisibles.length > 0)) || ocupades.length > 0) && (
                    <div className='visor-resum-franges'>
                      {!festa && torns.length > 0 && <span>{torns.map(formatFranja).join(' · ')}</span>}
                      {!festa && absenciesVisibles.length > 0 && (
                        <span className='visor-text-absencia'>Absència {absenciesVisibles.map(formatFranja).join(' · ')}</span>
                      )}
                      {!resum && ocupades.length > 0 && (
                        <span className='visor-text-ocupada'>Ocupat {ocupades.map(formatFranja).join(' · ')}</span>
                      )}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
        {resum && (
          <section className='visor-detall'>
            <h2>Feines del dia</h2>
            <div className='visor-feines-grups'>
              {jornada.map(({ id, nom, ocupades }) => (
                <section key={id}>
                  <h3>{nom}</h3>
                  {ocupades.length > 0 ? (
                    <ul className='visor-feines'>
                      {ocupades.map((franja, i) => (
                        <li key={i}>
                          <time>{formatFranja(franja)}</time>
                          <strong>{franja.tasca ?? 'Cita'}</strong>
                          {franja.servei && franja.servei !== franja.tasca && <span>{franja.servei}</span>}
                        </li>
                      ))}
                    </ul>
                  ) : <p>Cap feina programada.</p>}
                </section>
              ))}
            </div>
          </section>
        )}
      </div>
      <div className='visor-llegenda' aria-label='Llegenda'>
        <span><i className='visor-clau-torn' />Horari de treball</span>
        <span><i className='visor-clau-ocupada' />Cita ocupada</span>
        <span><i className='visor-clau-absencia' />Absència</span>
      </div>
    </section>
  )
}

export default function VisorDia({ resum = false }) {
  const { state, dispatch } = useAppContext()
  const [data, setData] = useState(() => (resum ? state.dataResum : state.data) ?? new Date())
  const tornSeleccionat = resum ? TORNS.INDIFERENT : (state.torn ?? TORNS.INDIFERENT)
  const tornarASetmana = resum && Boolean(state.setmanaOrigenResum)

  const tornarEnrere = () => {
    const pantallaResum = tornarASetmana ? PANTALLAS.RESUM_SETMANAL : PANTALLAS.RESUM_DIARI
    dispatch({
      type: ACTIONS.ACTUALITZAR,
      payload: resum
        ? { pantalla: pantallaResum, dataResum: data }
        : { pantalla: PANTALLAS.CALENDARI, data }
    })
  }

  return (
    <main className={`visor-dia${resum ? ' visor-diari' : ''}`}>
      <header className='visor-capcalera'>
        <button className='visor-enrere' type='button' onClick={tornarEnrere} disabled={state.guardantReserva}>
          <span aria-hidden='true'>←</span> {tornarASetmana ? 'Setmana' : 'Calendari'}
        </button>
        <div className='visor-navegacio'>
          <span className='visor-torn-seleccionat'>{resum ? 'Resum diari' : horariTorns[tornSeleccionat].etiqueta}</span>
          <button type='button' aria-label='Dia anterior' onClick={() => setData(sumarDies(data, -1))} disabled={state.guardantReserva}>‹</button>
          <button type='button' aria-label='Dia següent' onClick={() => setData(sumarDies(data, 1))} disabled={state.guardantReserva}>›</button>
        </div>
        <h1>{formatData.format(data)}</h1>
      </header>
      <HorarisDia key={formatDataLocal.format(data)} data={data} tornSeleccionat={tornSeleccionat} resum={resum} />
    </main>
  )
}
