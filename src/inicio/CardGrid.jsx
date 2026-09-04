import { useAppContext } from '../context/useAppContext'

import Card from './Card.jsx'

import './CardGrid.css'

import {fetchTabla} from '../utils/supabase.js'

import { useEffect, useState } from 'react'



const CardGrid = () => {

  const { state } = useAppContext()
  // setClients és el que t'actualitza el que hi ha a clients
  const [ clients, setClients] = useState([])

  useEffect(() => {

    const Taula_clients = async () => {
      const data = await fetchTabla('clientes')
      console.log('Data de clientes:', data)
      // Ara ja tenim les dades a clients, i podem utilitzar-les per renderitzar la taula o fer altres operacions
      setClients(data)
    }
    Taula_clients()
  }, [])

  const handleClick = () => {
    console.log('Botó Clients clicat')
    // Aquí pots afegir la lògica per canviar de pantalla o fer altres accions quan es clica el botó
  }

  
return (


    <div > 
      <div className = 'botons'> 
        <button className='boto-clients' onClick={handleClick}>Clients

        </button>

      </div>
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
