import { useAppContext } from '../context/useAppContext'
import { ACTIONS, PANTALLAS } from '../utils/consts.js'
import './Crear_Client.css'
import { useState } from 'react'
import { InsertTabla } from '../utils/supabase.js'

const CrearClient = () => {
    const { dispatch } = useAppContext()

    const [ formulari, setFormulari ] = useState({
    nombre: '',
    apellidos: '',
    telefono: '',
    email: '',
    observaciones: ''
    })

    const [error, setError] = useState('')

    const handleChange = (e) => {
        const { name, value } = e.target
        setError('')
        setFormulari(prev => ({ ...prev, [name]: value }))
    }
  
    const handleGuardar = async () => {
        if (!formulari.nombre.trim() || !formulari.apellidos.trim() || !formulari.telefono.trim()) {
            setError('Nom, cognoms i telèfon són obligatoris')
            return
        }

        setError('')
        const resultado = await InsertTabla('clientes', formulari)

        if (!resultado) {
            setError('No s’ha pogut crear el client. Torna-ho a provar.')
            return
        }

        const clientNou = resultado[0]
        console.log('Client creat amb èxit:', clientNou)
        dispatch({ type: ACTIONS.ACTUALITZAR, payload: { client: clientNou, pantalla: PANTALLAS.INICIO } })
        
        }
  
    const handleCancelar = () => {
        dispatch({ type: ACTIONS.ACTUALITZAR, payload: { client: null, pantalla: PANTALLAS.INICIO } })

    }


return (
    <div className='crear-client'>
      <h2>Crear Client</h2>

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

      {error && <p className="mensaje-error">{error}</p>}

      <button onClick={handleGuardar}>Guardar</button>

      <button onClick={handleCancelar}>Cancelar</button>
    </div>
  )}


export default CrearClient
