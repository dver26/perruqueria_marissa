import { useAppContext } from '../context/useAppContext'

import Card from './Card.jsx'

import './CardGrid.css'

import { fetchTabla, DeleteTabla } from '../utils/supabase.js'

import { useEffect, useState } from 'react'

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

  useEffect(() => {
    const Taula_clients = async () => {
      const data = await fetchTabla('clientes')
      // Ara ja tenim les dades a clients, i podem utilitzar-les per renderitzar la taula o fer altres operacions
      setClients(data)
    }
    Taula_clients()
  }, [])

  useEffect(() => {
    const Taula_treballadors = async () => {
      const data = await fetchTabla('empleados')
      // Ara ja tenim les dades a treballadors, i podem utilitzar-les per renderitzar la taula o fer altres operacions
      setTreballadors(data)
    }
    Taula_treballadors()
  }, [])

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
    dispatch({ type: ACTIONS.ACTUALITZAR, payload: { client: null, treballador: null } })
    setAccionsC(false)
    setAccionsT(false)
  }

  const handleReservarHora = () => {
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

  const handleEliminar = () => {
    
    DeleteTabla('empleados', state.treballador)
    
    setTreballadors((prev) => prev.filter((t) => t.id !== state.treballador.id))

    dispatch({ type: ACTIONS.ACTUALITZAR, payload: { treballador: null } })
    
    setAccionsT(false)
  }

  const clientsFiltrats = clients.filter((client_temp) =>
    client_temp.nombre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .startsWith(
        cerca
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
      )
  )

  return (
    <div>
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
          <ul>
            {treballadors.map((treballador_temp) => (
              <li
                onClick={() => handleSeleccionarTreballador(treballador_temp)}
                key={treballador_temp.id}
              >
                {treballador_temp.nombre + ' ' + treballador_temp.apellidos}
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
          <button onClick={handleEliminar}>Eliminar</button>
          <button onClick={handleEditarT}>Editar</button>
          
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