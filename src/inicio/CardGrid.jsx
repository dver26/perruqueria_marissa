import { useAppContext } from '../context/useAppContext'

import Card from './Card.jsx'

import './CardGrid.css'

import {fetchTabla} from '../utils/supabase.js'

import { useEffect, useState } from 'react'

import { ACTIONS, PANTALLAS } from '../utils/consts.js'



const CardGrid = () => {

  const { state, dispatch } = useAppContext()
  // setClients és el que t'actualitza el que hi ha a clients
  const [ clients, setClients] = useState([])

  const [ panell, setPanell] = useState(false)

  const [ cerca, setCerca] = useState('')

  const [ accions, setAccions] = useState(false)

  
  useEffect(() => {

    const Taula_clients = async () => {
      const data = await fetchTabla('clientes')
      console.log('Data de clientes:', data)
      // Ara ja tenim les dades a clients, i podem utilitzar-les per renderitzar la taula o fer altres operacions
      setClients(data)
    }
    Taula_clients()
  }, [])

  useEffect(() => {
    console.log('Client actualitzat:', state.client)
  }, [state.client])


  const handleClick = () => {
    console.log('Botó Clients clicat')
    // Aquí pots afegir la lògica per canviar de pantalla o fer altres accions quan es clica el botó
    setPanell(prev => !prev) // Com !Panell Canvia l'estat de Panell per mostrar o amagar el panell de clients
    setAccions(false) 
    setCerca('') // Reseteja el camp de cerca quan s'obre el panell
  }

  const handleSeleccionarClient = (client_temp) => {
    dispatch({ type: ACTIONS.ACTUALITZAR, payload: { client: client_temp } })
    setPanell(false)
    setAccions(true)
  }

  const handleEnrere = () => {
    dispatch({ type: ACTIONS.ACTUALITZAR, payload: { client: null } })
    setAccions(false)
  }

  const handleReservarHora = () => {
    setAccions(false)
  }

  const handleEditar = () => {
    dispatch({ type: ACTIONS.ACTUALITZAR, payload: { pantalla: PANTALLAS.EDITAR_CLIENT } })
  }

  const clientsFiltrats = clients.filter(client_temp => client_temp.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").startsWith(cerca.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")))
  
return (


    <div > 
      <div className = 'botons'> 
        <button className='boto-clients' onClick={handleClick}>Clients
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
          <ul>
            {clientsFiltrats.map(client_temp => (
              <li onClick={() => handleSeleccionarClient(client_temp)} key={client_temp.id}>{client_temp.nombre + " " + client_temp.apellidos}</li>
            ))}
          </ul>
        </div>
      )}
      {accions && (
        <div className='panell-accions'>
          <div className='capçalera-panell'>
            <p>{state.client.nombre + " " + state.client.apellidos}</p>
            <div className='enrere' onClick={handleEnrere}>Enrere</div>
          </div>
          <button onClick={handleReservarHora}>Reservar Hora</button>
          <button onClick={handleEditar}>Editar</button>
        </div>
      )}  
      <div className='container-grid'>
      {
      state.servicios.map((servei) => {
        return <Card key={servei.id} id={servei.id} />
      })}
     </div>
      
    </div>

    
    
  )
}

export default CardGrid