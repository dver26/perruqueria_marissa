import { useAppContext } from '../context/useAppContext'

import Card from './Card.jsx'

import './CardGrid.css'

import { fetchTabla } from '../utils/supabase.js'

import { normalizarTexto } from '../utils/validacions.js'

import { useEffect, useState } from 'react'

import { ACTIONS, PANTALLAS } from '../utils/consts.js'

// Muestra los servicios y el panel para buscar clientes y elegir qué hacer con ellos.
const CardGrid = () => {
  const { state, dispatch } = useAppContext()

  const [clients, setClients] = useState([])
  const [panell, setPanell] = useState(false)
  const [cerca, setCerca] = useState('')
  const [accions, setAccions] = useState(false)

  // Carga la lista de clientes al entrar en esta pantalla.
  useEffect(() => {
    const Taula_clients = async () => {
      const data = await fetchTabla('clientes')
      // Ara ja tenim les dades a clients, i podem utilitzar-les per renderitzar la taula o fer altres operacions
      setClients(data)
    }
    Taula_clients()
  }, [])

  const handleClick = () => {
    // Aquí pots afegir la lògica per canviar de pantalla o fer altres accions quan es clica el botó
    setPanell((prev) => !prev) // Com !Panell Canvia l'estat de Panell per mostrar o amagar el panell de clients
    setAccions(false)
    setCerca('') // Reseteja el camp de cerca quan s'obre el panell
  }

  const handleClickT = () => {
    // Aquí pots afegir la lògica per canviar de pantalla o fer altres accions quan es clica el botó
    setPanellT((prev) => !prev) // Com !Panell Canvia l'estat de Panell per mostrar o amagar el panell de treballadors
    setAccionsC(false)
    setAccionsT(false)
    setPanellC(false) // Assegura't que el panell de clients està tancat quan s'obre el panell de treballadors
    
  }

  // Abre el formulario para crear un cliente.
  const handleClickCC = () => {
    dispatch({
      type: ACTIONS.ACTUALITZAR,
      payload: { pantalla: PANTALLAS.CREAR_CLIENT }
    })
  }

  // Guarda el cliente elegido y muestra sus acciones.
  const handleSeleccionarClient = (client_temp) => {
    dispatch({ type: ACTIONS.ACTUALITZAR, payload: { client: client_temp } })
    setPanell(false)
    setAccions(true)
  }

  // Quita la selección del cliente y cierra sus acciones.
  const handleEnrere = () => {
    dispatch({ type: ACTIONS.ACTUALITZAR, payload: { client: null } })
    setAccions(false)
  }

  // Guarda para quién será la reserva y cierra el panel de acciones.
  const handleReservarHora = () => {
    const { id, nombre, apellidos } = state.client
    const nomClientReserva = [nombre, apellidos].filter(Boolean).join(' ')
    dispatch({ type: ACTIONS.ACTUALITZAR, payload: { nomClientReserva, idClientReserva: id } })
    setAccions(false)
  }

  // Abre el formulario para editar el cliente seleccionado.
  const handleEditar = () => {
    dispatch({
      type: ACTIONS.ACTUALITZAR,
      payload: { pantalla: PANTALLAS.EDITAR_CLIENT }
    })
  }

  // Pasa el texto a minúsculas y quita las tildes para facilitar la búsqueda.
  const netejarText = (text) =>
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')

  const cercaNetejada = netejarText(normalizarTexto(cerca))

  // Busca lo escrito en el nombre y los apellidos, sin distinguir tildes ni mayúsculas.
  const clientsFiltrats = clients.filter((client_temp) => {
    const nomComplet = netejarText(
      normalizarTexto(client_temp.nombre + ' ' + client_temp.apellidos)
    )
    return nomComplet.includes(cercaNetejada)
  })

  return (
    <div>
      <div className='botons'>
        <button className='boto-clients' onClick={handleClick}>
          Clients
        </button>
      </div>
      {panell && (
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
      {accions && state.client && (
        <div className='panell-accions'>
          <div className='capçalera-panell'>
            <p>{state.client.nombre + ' ' + state.client.apellidos}</p>
            <div className='enrere' onClick={handleEnrere}>
              Enrere
            </div>
          </div>
          <button onClick={handleReservarHora}>Reservar Hora</button>
          <button onClick={handleEditar}>Editar</button>
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
