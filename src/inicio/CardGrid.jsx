import { useAppContext } from '../context/useAppContext'

import Card from './Card.jsx'

import './CardGrid.css'

import { fetchTabla, UpdateTabla } from '../utils/supabase.js'
import { dataLocal } from '../utils/absencies.js'
import Absencies from '../components/Absencies.jsx'
import Confirmacio from '../components/Confirmacio.jsx'
import { textoComparable } from '../utils/persones.js'

import { useCallback, useEffect, useState } from 'react'

import { ACTIONS, PANTALLAS } from '../utils/consts.js'

const CardGrid = () => {
  const { state, dispatch } = useAppContext()

  const [clients, setClients] = useState([])
  const [treballadors, setTreballadors] = useState([])
  const [panellC, setPanellC] = useState(false)
  const [panellT, setPanellT] = useState(false)
  const [cerca, setCerca] = useState('')
  const [accionsC, setAccionsC] = useState(false)
  const [accionsT, setAccionsT] = useState(false)
  const [absencies, setAbsencies] = useState(false)
  const [guardant, setGuardant] = useState(false)
  const [error, setError] = useState('')
  const [confirmarBaixa, setConfirmarBaixa] = useState(false)
  const idTreballador = state.treballador?.id

  const refrescarTreballadors = useCallback(async (vigent = () => true) => {
    const data = await fetchTabla('empleados')
    if (!vigent()) return
    if (!data) throw new Error('No s’han pogut actualitzar els treballadors.')
    setTreballadors(data)
    dispatch({ type: ACTIONS.ACTUALITZAR, payload: { empleados: data,
      ...(idTreballador ? { treballador: data.find(p => p.id === idTreballador) ?? null } : {}) } })
  }, [dispatch, idTreballador])

  useEffect(() => {
    const Taula_clients = async () => {
      const data = await fetchTabla('clientes')
      // Ara ja tenim les dades a clients, i podem utilitzar-les per renderitzar la taula o fer altres operacions
      setClients(data ?? [])
    }
    Taula_clients()
  }, [])

  useEffect(() => {
    let vigent = true
    const carregar = () => { void refrescarTreballadors(() => vigent).catch(err => { if (vigent) setError(err.message) }) }
    carregar()
    const interval = window.setInterval(carregar, 30000)
    window.addEventListener('focus', carregar)
    return () => { vigent = false; window.clearInterval(interval); window.removeEventListener('focus', carregar) }
  }, [refrescarTreballadors])

  const handleClickC = () => {
    // Aquí pots afegir la lògica per canviar de pantalla o fer altres accions quan es clica el botó
    setPanellC((prev) => !prev) // Com !Panell Canvia l'estat de Panell per mostrar o amagar el panell de clients
    setAccionsC(false)
    setAccionsT(false)
    setPanellT(false) // Assegura't que el panell de treballadors està tancat quan s'obre el panell de clients
    setCerca('') // Reseteja el camp de cerca quan s'obre el panell
  }

  const handleClickT = () => {
    // Aquí pots afegir la lògica per canviar de pantalla o fer altres accions quan es clica el botó
    setPanellT((prev) => !prev) // Com !Panell Canvia l'estat de Panell per mostrar o amagar el panell de treballadors
    setAccionsC(false)
    setAccionsT(false)
    setPanellC(false) // Assegura't que el panell de clients està tancat quan s'obre el panell de treballadors

  }

  const handleClickCC = () => {
    dispatch({
      type: ACTIONS.ACTUALITZAR,
      payload: { pantalla: PANTALLAS.CREAR_CLIENT }
    })
  }

  const handleSeleccionarClient = (client_temp) => {
    dispatch({ type: ACTIONS.ACTUALITZAR, payload: { client: client_temp } })
    setPanellC(false)
    setAccionsC(true)
  }

  const handleSeleccionarTreballador = (treballador_temp) => {
    dispatch({ type: ACTIONS.ACTUALITZAR, payload: { treballador: treballador_temp } })
    setPanellT(false)
    setAccionsT(true)
  }

  const handleEnrere = () => {
    if (guardant) return
    dispatch({ type: ACTIONS.ACTUALITZAR, payload: { client: null, treballador: null } })
    setAccionsC(false)
    setAccionsT(false)
  }

  const handleReservarHora = () => {
    const { id, nombre, apellidos } = state.client
    dispatch({ type: ACTIONS.ACTUALITZAR, payload: {
      idClientReserva: id, nomClientReserva: [nombre, apellidos].filter(Boolean).join(' ')
    } })
    setAccionsC(false)

  }

  const handleEditarC = () => {
    dispatch({
      type: ACTIONS.ACTUALITZAR,
      payload: { pantalla: PANTALLAS.EDITAR_CLIENT }
    })
  }

  const handleEditarT = () => {
    dispatch({
      type: ACTIONS.ACTUALITZAR,
      payload: { pantalla: PANTALLAS.EDITAR_TREBALLADOR }
    })
  }

  const handleBaixa = async () => {
    if (guardant) return
    setGuardant(true)
    setError('')
    try {
      const persona = state.treballador
      const data = await UpdateTabla('empleados', { id: persona.id, activo: false, fecha_baja: dataLocal() })
      if (!data?.[0]) throw new Error('No s’ha pogut guardar la baixa. Torna-ho a provar.')
      setConfirmarBaixa(false)
      setTreballadors(prev => prev.filter(p => p.id !== persona.id))
      dispatch({ type: ACTIONS.ACTUALITZAR, payload: { treballador: null, empleados: state.empleados.filter(p => p.id !== persona.id) } })
      setAccionsT(false)
    } catch (err) { setError(err.message) }
    finally { setGuardant(false) }
  }

  const handleActivar = async () => {
    if (guardant) return
    setGuardant(true)
    setError('')
    try {
      const data = await UpdateTabla('empleados', { id: state.treballador.id, activo: true })
      if (!data?.[0]) throw new Error('No s’ha pogut activar el treballador.')
      await refrescarTreballadors()
    } catch (err) { setError(err.message) }
    finally { setGuardant(false) }
  }

  // Busca también por apellidos, sin distinguir tildes ni mayúsculas.
  const clientsFiltrats = clients.filter(p => textoComparable(p.nombre + ' ' + p.apellidos).includes(textoComparable(cerca)))

  if (absencies && state.treballador) return <Absencies treballador={state.treballador} onCanvi={refrescarTreballadors} onTancar={() => setAbsencies(false)} />

  return (
    <div>
      {error && !confirmarBaixa && <p role='alert'>{error}</p>}
      {confirmarBaixa && state.treballador && <Confirmacio
        titol='Donar de baixa el treballador?'
        confirmar='Donar de baixa' ocupat={guardant} error={error}
        onConfirmar={handleBaixa} onCancelar={() => { setConfirmarBaixa(false); setError('') }}>
        <p>Vols donar de baixa <strong>{state.treballador.nombre} {state.treballador.apellidos}</strong>?</p>
        <p>Es conservaran la seva fitxa i l’historial de cites, però s’eliminaran totes les seves absències. Podràs recuperar la fitxa si torna a treballar aquí.</p>
      </Confirmacio>}
      <div className='botons'>
        <button className='boto-clients' onClick={handleClickC}>
          Clients
        </button>
        <button className='boto-treballadors' onClick={handleClickT}>
          Treballadors
        </button>
      </div>
      {panellC && (
        <div className='panell-clients'>
          <input
            type='text'
            placeholder='Cerca client...'
            value={cerca}
            onChange={(e) => setCerca(e.target.value)}
          />
          <button className='boto-crear-clients' onClick={handleClickCC}>
            Crear
          </button>
          <ul>
            {clientsFiltrats.map((client_temp) => (
              <li
                onClick={() => handleSeleccionarClient(client_temp)}
                key={client_temp.id}
              >
                {client_temp.nombre + ' ' + client_temp.apellidos}
              </li>
            ))}
          </ul>
        </div>
      )}
      {panellT && (
        <div className='panell-treballadors'>
          <button className='boto-clients' onClick={() => dispatch({ type: ACTIONS.ACTUALITZAR, payload: { pantalla: PANTALLAS.CREAR_TREBALLADOR } })}>Crear</button>
          <ul>
            {treballadors.filter(p => !p.fecha_baja).map((treballador_temp) => (
              <li
                className={!treballador_temp.activo ? 'treballador-inactiu' : undefined}
                onClick={() => handleSeleccionarTreballador(treballador_temp)}
                key={treballador_temp.id}
              >
                {treballador_temp.nombre + ' ' + treballador_temp.apellidos}
                {!treballador_temp.activo && <span className='estat-treballador'>Inactiu</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
      {accionsC && (
        <div className='panell-accions'>
          <div className='capçalera-panell'>
            <p>
              {state.client.nombre + ' ' + state.client.apellidos}
            </p>
            <div className='enrere' onClick={handleEnrere}>
              Enrere
            </div>
          </div>
          <button onClick={handleReservarHora}>Reservar Hora</button>
          <button onClick={handleEditarC}>Editar</button>

        </div>
      )}

      {accionsT && (
        <div className='panell-accions'>
          <div className='capçalera-panell'>
            <p>
              {state.treballador.nombre + ' ' + state.treballador.apellidos}
            </p>
            <div className='enrere' onClick={handleEnrere}>
              Enrere
            </div>
          </div>
          <button disabled={guardant} onClick={() => { setError(''); setConfirmarBaixa(true) }}>Donar de baixa</button>
          {!state.treballador.activo && !state.treballador.fecha_baja && <button disabled={guardant || state.treballador.en_vacaciones} onClick={handleActivar}>Posar actiu</button>}
          {state.treballador.en_vacaciones && <p className='avis-vacances'>De vacances: podràs activar-lo quan torni.</p>}
          <button disabled={guardant} onClick={() => setAbsencies(true)}>Absències</button>
          <button onClick={() => dispatch({ type: ACTIONS.ACTUALITZAR, payload: { pantalla: PANTALLAS.DIES_FESTA } })}>Dies de festa</button>
          <button onClick={handleEditarT}>Editar dades</button>
          <button onClick={() => dispatch({ type: ACTIONS.ACTUALITZAR, payload: { pantalla: PANTALLAS.HORARI_TREBALLADOR, altaHorari: false } })}>Editar horari</button>

        </div>
      )}
      <div className='container-grid'>
        {state.servicios.map((servei) => {
          return <Card key={servei.id} id={servei.id} />
        })}
      </div>
    </div>
  )
}

export default CardGrid
