import { useState } from 'react'
import { useAppContext } from '../context/useAppContext.js'
import { ACTIONS, PANTALLAS, TORNS } from '../utils/consts.js'
import { formatDataLocal, formatFranja, frangesLliures, sumarDies } from '../utils/jornades.js'
import { useJornades } from '../utils/useJornades.js'
import SelectorTreballadora from './SelectorTreballadora.jsx'
import './Resums.css'

const formatSetmana = new Intl.DateTimeFormat('ca-ES', { day: 'numeric', month: 'long', year: 'numeric' })
const formatDia = new Intl.DateTimeFormat('ca-ES', { weekday: 'long' })
const formatDiaCurt = new Intl.DateTimeFormat('ca-ES', { day: 'numeric', month: 'short' })
const formatDiaComplet = new Intl.DateTimeFormat('ca-ES', { dateStyle: 'full' })

function dillunsActual() {
  const avui = new Date()
  return sumarDies(avui, -((avui.getDay() + 6) % 7))
}

function formatDurada(minuts) {
  const hores = Math.floor(minuts / 60)
  const partMinuts = minuts % 60
  if (!hores) return `${partMinuts} min`
  return partMinuts ? `${hores} h ${partMinuts} min` : `${hores} h`
}

function Setmana({ dilluns, idTreballadora, onCanviTreballadora, onObrirDia }) {
  const { resultat, error } = useJornades(dilluns, 7, TORNS.INDIFERENT)
  if (error) return <p className='visor-estat' role='alert'>No s’han pogut carregar els horaris.</p>
  if (!resultat) return <p className='visor-estat' role='status'>Carregant la setmana…</p>
  if (!resultat.treballadores.length) return <p className='visor-estat'>No hi ha treballadores actives.</p>

  const treballadora = resultat.treballadores.find(({ id }) => id === idTreballadora) ?? resultat.treballadores[0]
  const avui = formatDataLocal.format(new Date())

  return (
    <section className='resum-setmana-contingut' aria-label='Hores lliures de la setmana'>
      <SelectorTreballadora treballadores={resultat.treballadores} id={treballadora.id} onCanvi={onCanviTreballadora} />
      <ul className='resum-setmana-dies'>
        {resultat.dies.map(({ data, jornada }) => {
          const iso = formatDataLocal.format(data)
          const horari = jornada.find(({ id }) => id === treballadora.id)
          const lliures = frangesLliures(horari)
          const minutsLliures = lliures.reduce((total, { inici, fi }) => total + fi - inici, 0)

          return (
            <li key={iso} className='resum-setmana-dia' aria-current={iso === avui ? 'date' : undefined}>
              <h2>{formatDia.format(data)}</h2>
              <time dateTime={iso}>{formatDiaCurt.format(data)}</time>
              {horari.torns.length > 0 ? (
                <>
                  <p className='resum-setmana-total'>{formatDurada(minutsLliures)} <span>lliures</span></p>
                  {lliures.length > 0 ? (
                    <ul className='resum-setmana-franges' aria-label='Franges lliures'>
                      {lliures.map((franja) => <li key={franja.inici}>{formatFranja(franja)}</li>)}
                    </ul>
                  ) : <p className='resum-setmana-buit'>Cap franja lliure</p>}
                </>
              ) : <p className='resum-setmana-buit'>Sense torn</p>}
              <button className='resum-setmana-obrir' type='button'
                aria-label={`Obrir el resum de ${formatDiaComplet.format(data)}`} onClick={() => onObrirDia(data)}>
                <span aria-hidden='true'>↗</span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export default function ResumSetmanal() {
  const { state, dispatch } = useAppContext()
  const [dilluns, setDilluns] = useState(() => state.setmanaOrigenResum ?? dillunsActual())

  function tornarAInici() {
    dispatch({ type: ACTIONS.ACTUALITZAR, payload: { pantalla: PANTALLAS.INICIO } })
  }

  function canviarTreballadora(idTreballadoraResum) {
    dispatch({ type: ACTIONS.ACTUALITZAR, payload: { idTreballadoraResum } })
  }

  function obrirDia(dataResum) {
    dispatch({
      type: ACTIONS.ACTUALITZAR,
      payload: { pantalla: PANTALLAS.RESUM_DIA, dataResum, setmanaOrigenResum: dilluns }
    })
  }

  return (
    <main className='visor-dia resum-setmanal'>
      <header className='visor-capcalera'>
        <button className='visor-enrere' type='button' onClick={tornarAInici}><span aria-hidden='true'>←</span> Inici</button>
        <div className='visor-navegacio'>
          <span className='visor-torn-seleccionat'>Resum setmanal</span>
          <button type='button' aria-label='Setmana anterior' onClick={() => setDilluns((data) => sumarDies(data, -7))}>‹</button>
          <button type='button' aria-label='Setmana següent' onClick={() => setDilluns((data) => sumarDies(data, 7))}>›</button>
        </div>
        <h1>{formatSetmana.formatRange(dilluns, sumarDies(dilluns, 6))}</h1>
      </header>
      <Setmana key={formatDataLocal.format(dilluns)} dilluns={dilluns}
        idTreballadora={state.idTreballadoraResum} onCanviTreballadora={canviarTreballadora} onObrirDia={obrirDia} />
    </main>
  )
}
