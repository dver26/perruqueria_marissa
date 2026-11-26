import { useAppContext } from '../context/useAppContext'
import { ACTIONS, PANTALLAS } from '../utils/consts.js'
import { useState } from 'react'
import './Editar_Client.css'
import { UpdateTabla } from '../utils/supabase.js'

// Muestra el formulario con los datos del cliente que vamos a editar.
const EditarClient = () => {

  const { state, dispatch } = useAppContext()
  const [clientEnEdicio] = useState(state.client)

  // Copia los datos del cliente al abrir el formulario.
  const [ formulari, setFormulari ] = useState(() => ({
    nombre: clientEnEdicio.nombre || '',
    apellidos: clientEnEdicio.apellidos || '',
    telefono: clientEnEdicio.telefono || '',
    email: clientEnEdicio.email || '',
    observaciones: clientEnEdicio.observaciones || '',
    fecha_alta: clientEnEdicio.fecha_alta || ''
  }))

  // Actualiza en el formulario el campo que acabamos de cambiar.
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormulari(prev => ({ ...prev, [name]: value }))
  }

  // Envía los cambios del cliente a la base de datos y vuelve al inicio.
  const handleGuardar = () => {

    const clientActualitzat = { ...clientEnEdicio, ...formulari }
    UpdateTabla('clientes', clientActualitzat)
    dispatch({ type: ACTIONS.ACTUALITZAR, payload: { client: null, pantalla: PANTALLAS.INICIO } })
   
  }

  // Vuelve al inicio sin guardar los cambios del formulario.
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
