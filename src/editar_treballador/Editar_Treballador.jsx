import { useAppContext } from '../context/useAppContext.js'
import { ACTIONS, PANTALLAS } from '../utils/consts.js'
import { useState } from 'react'
import './Editar_Treballador.css'
import { UpdateTabla } from '../utils/supabase.js'

const EditarTreballador = () => {

  const { state, dispatch } = useAppContext()

  const [ formulari, setFormulari ] = useState({
    nombre: state.treballador.nombre || '',
    apellidos: state.treballador.apellidos || '',
    telefono: state.treballador.telefono || '',
    email: state.treballador.email || '',
    activo: state.treballador.activo ?? true
  })

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormulari(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleGuardar = () => {

    const treballadorActualitzat = { ...state.treballador, ...formulari }
    UpdateTabla('empleados', treballadorActualitzat)
    dispatch({ type: ACTIONS.ACTUALITZAR, payload: { treballador: null, pantalla: PANTALLAS.INICIO } })

  }

  const handleCancelar = () => {
    dispatch({ type: ACTIONS.ACTUALITZAR, payload: { treballador: null, pantalla: PANTALLAS.INICIO } })
  }

  return (
    <div className='editar-treballador'>
      <h2>Editar Treballador</h2>

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

      <label className='label-checkbox'>
        Actiu
        <input type='checkbox' name='activo' checked={formulari.activo} onChange={handleChange} />
      </label>

      <button onClick={handleGuardar}>Guardar</button>

      <button onClick={handleCancelar}>Cancelar</button>
    </div>
  )
}

export default EditarTreballador