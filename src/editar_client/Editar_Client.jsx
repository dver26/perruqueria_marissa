import { useAppContext } from '../context/useAppContext'
import { ACTIONS, PANTALLAS } from '../utils/consts.js'
import { useState } from 'react'
import './Editar_Client.css'
import { UpdateTabla } from '../utils/supabase.js'

const EditarClient = () => {

  const { state, dispatch } = useAppContext()

  const [ formulari, setFormulari ] = useState({
    nombre: state.client.nombre || '',
    apellidos: state.client.apellidos || '',
    telefono: state.client.telefono || '',
    email: state.client.email || '',
    observaciones: state.client.observaciones || '',
    fecha_alta: state.client.fecha_alta || ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormulari(prev => ({ ...prev, [name]: value }))
  }

  const handleGuardar = () => {

    const clientActualitzat = { ...state.client, ...formulari }
    UpdateTabla('clientes', clientActualitzat)
    dispatch({ type: ACTIONS.ACTUALITZAR, payload: { client: null, pantalla: PANTALLAS.INICIO } })
   
  }

  const handleCancelar = () => {
  dispatch({ type: ACTIONS.ACTUALITZAR, payload: { client: null, pantalla: PANTALLAS.INICIO } })
}

  return (
    <div className='editar-client'>
      <h2>Editar Client</h2>

      <label>
        Nom
        <input type='text' name='nombre' value={formulari.nombre} onChange={handleChange} />
      </label>

      <label>
        Cognoms
        <input type='text' name='apellidos' value={formulari.apellidos} onChange={handleChange} />
      </label>

      <label>
        Telèfon
        <input type='text' name='telefono' value={formulari.telefono} onChange={handleChange} />
      </label>

      <label>
        Email
        <input type='email' name='email' value={formulari.email} onChange={handleChange} />
      </label>

      <label>
        Observacions
        <textarea name='observaciones' value={formulari.observaciones} onChange={handleChange} />
      </label>

      

      <button onClick={handleGuardar}>Guardar</button>

      <button onClick={handleCancelar}>Cancelar</button>
    </div>
  )
}

export default EditarClient