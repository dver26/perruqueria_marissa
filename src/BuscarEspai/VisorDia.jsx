import { useAppContext } from '../utils/useAppContext'
import './VisorDia.css'

const PX_PER_MIN = 2.4
const MARGE_SUPERIOR = 14 // evita que la primera marca d'hora quedi tapada

const PALETA = [
  { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af' },
  { bg: '#fdf2f8', border: '#ec4899', text: '#9d174d' },
  { bg: '#f0fdf4', border: '#16a34a', text: '#065f46' },
  { bg: '#fffbeb', border: '#d97706', text: '#92400e' },
  { bg: '#f5f3ff', border: '#7c3aed', text: '#5b21b6' },
  { bg: '#fef2f2', border: '#dc2626', text: '#991b1b' },
  { bg: '#ecfeff', border: '#0891b2', text: '#155e75' }
]

const colorPerServei = (nom) => {
  const suma = [...nom].reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return PALETA[suma % PALETA.length]
}

const formatData = (data) => {
  const any = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${any}-${mes}-${dia}`
}

const aMinuts = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

const formatHora = (minuts) => {
  const h = String(Math.floor(minuts / 60)).padStart(2, '0')
  const m = String(minuts % 60).padStart(2, '0')
  return `${h}:${m}`
}

// Assigna un "carril" a cada bloc perquè els que se superposen en el temps
// es mostrin en paral·lel, en comptes de tapar-se
const assignaCarrils = (blocs) => {
  const ordenats = [...blocs].sort((a, b) => a.iniciMin - b.iniciMin)
  const finsPerCarril = []

  const ambCarril = ordenats.map((bloc) => {
    let carril = finsPerCarril.findIndex((fi) => fi <= bloc.iniciMin)
    if (carril === -1) {
      carril = finsPerCarril.length
      finsPerCarril.push(bloc.fiMin)
    } else {
      finsPerCarril[carril] = bloc.fiMin
    }
    return { ...bloc, carril }
  })

  return { blocs: ambCarril, totalCarrils: finsPerCarril.length || 1 }
}

const VisorDia = ({ data: dataProps }) => {
  const { state, dispatch } = useAppContext()
  const { events } = state

  const handleTornar = () => {
    dispatch({
      type: 'CAMBIAR_PANTALLA',
      payload: { pantalla: 'inicio', serveiEscollit: null }
    })
  }

  if (!dataProps) return null

  const dataFormatada = formatData(dataProps)

  const totesFranges = events
    .filter((cita) => cita.data === dataFormatada)
    .flatMap((cita) =>
      cita.parts.map((part) => ({
        citaId: cita.citaId,
        servei: cita.servei,
        name: part.name,
        treballadora: part.treballadora,
        iniciMin: aMinuts(part.inici),
        fiMin: aMinuts(part.fi),
        color: colorPerServei(cita.servei)
      }))
    )

  if (totesFranges.length === 0) {
    return (
      <>
        <button className='btn-tornar' type='button' onClick={handleTornar}>
          <svg
            className='btn-tornar__icon'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <path d='M19 12H5' />
            <path d='M12 19l-7-7 7-7' />
          </svg>
          Tornar
        </button>
        <div className='visor-dia-buit'>No hi ha cites aquest dia</div>
      </>
    )
  }

  // Les franges "d'exposició" (sense treballadora) no formen columna pròpia:
  // són un espai ocupat, no una persona
  const franges = totesFranges.filter((f) => f.treballadora !== null)
  const exposicions = totesFranges.filter((f) => f.treballadora === null)

  const diaInici =
    Math.floor(Math.min(...totesFranges.map((f) => f.iniciMin)) / 60) * 60
  const diaFi =
    Math.ceil(Math.max(...totesFranges.map((f) => f.fiMin)) / 60) * 60
  const alcadaTotal = (diaFi - diaInici) * PX_PER_MIN + MARGE_SUPERIOR

  const marquesHora = []
  for (let m = diaInici; m <= diaFi; m += 60) marquesHora.push(m)

  const treballadores = [...new Set(franges.map((f) => f.treballadora))].sort()

  const { blocs: blocsExposicio } = assignaCarrils(exposicions)

  return (
    <div className='visor-dia'>
      <button className='btn-tornar' type='button' onClick={handleTornar}>
        <svg
          className='btn-tornar__icon'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
          strokeLinejoin='round'
        >
          <path d='M19 12H5' />
          <path d='M12 19l-7-7 7-7' />
        </svg>
        Tornar
      </button>
      <div className='visor-capçalera'>
        <div className='eix-hores-capçalera' />
        {treballadores.map((nom) => (
          <div key={nom} className='columna-capçalera'>
            {nom}
          </div>
        ))}
      </div>

      <div className='visor-cos' style={{ height: `${alcadaTotal}px` }}>
        <div className='eix-hores'>
          {marquesHora.map((m) => (
            <div
              key={m}
              className='marca-hora'
              style={{
                top: `${(m - diaInici) * PX_PER_MIN + MARGE_SUPERIOR}px`
              }}
            >
              {formatHora(m)}
            </div>
          ))}
        </div>

        <div className='columnes-treballadors'>
          {treballadores.map((nomColumna) => {
            const { blocs, totalCarrils } = assignaCarrils(
              franges.filter((f) => f.treballadora === nomColumna)
            )

            return (
              <div key={nomColumna} className='columna-treballadora'>
                {marquesHora.map((m) => (
                  <div
                    key={m}
                    className='linia-hora'
                    style={{
                      top: `${(m - diaInici) * PX_PER_MIN + MARGE_SUPERIOR}px`
                    }}
                  />
                ))}

                {blocs.map((bloc, i) => {
                  const top =
                    (bloc.iniciMin - diaInici) * PX_PER_MIN + MARGE_SUPERIOR
                  const alcada = (bloc.fiMin - bloc.iniciMin) * PX_PER_MIN
                  const ample = 100 / totalCarrils

                  return (
                    <div
                      key={`${bloc.citaId}-${bloc.name}-${i}`}
                      className='bloc'
                      title={`${bloc.servei} · ${bloc.name}`}
                      style={{
                        top: `${top}px`,
                        height: `${alcada - 2}px`,
                        width: `calc(${ample}% - 4px)`,
                        left: `calc(${bloc.carril * ample}% + 2px)`,
                        background: bloc.color.bg,
                        borderLeftColor: bloc.color.border,
                        color: bloc.color.text
                      }}
                    >
                      <span className='bloc-hores'>
                        {formatHora(bloc.iniciMin)}–{formatHora(bloc.fiMin)}
                      </span>
                      <span className='bloc-servei'>{bloc.servei}</span>
                      {alcada > 40 && (
                        <span className='bloc-part'>{bloc.name}</span>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>

        {/* Banda d'exposicions: espai ocupat, no una persona, per això no és una columna */}
        <div className='capa-exposicions'>
          {blocsExposicio.map((bloc, i) => {
            const top = (bloc.iniciMin - diaInici) * PX_PER_MIN + MARGE_SUPERIOR
            const alcada = (bloc.fiMin - bloc.iniciMin) * PX_PER_MIN

            return (
              <div
                key={`${bloc.citaId}-exp-${i}`}
                className='bloc-exposicio'
                title={`${bloc.servei} · Exposició`}
                style={{
                  top: `${top}px`,
                  height: `${alcada - 2}px`,
                  borderColor: bloc.color.border,
                  color: bloc.color.text
                }}
              >
                <span className='bloc-hores'>
                  {formatHora(bloc.iniciMin)}–{formatHora(bloc.fiMin)}
                </span>
                <span className='bloc-servei'>{bloc.servei} · Exposició</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default VisorDia
