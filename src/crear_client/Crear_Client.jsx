import { useAppContext } from '../context/useAppContext'
import { ACTIONS, PANTALLAS } from '../utils/consts.js'
import './Crear_Client.css'
import { useState } from 'react'
import { InsertTabla } from '../utils/supabase.js'
import { validarEmail, validarTelefono } from '../utils/validacions.js'

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
    const [guardando, setGuardando] = useState(false)

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

        if (!validarTelefono(formulari.telefono)) {
            setError('El telèfon no és vàlid')
            return
        }

        if (formulari.email.trim() && !validarEmail(formulari.email)) {
            setError('El format de l’email no és vàlid')
            return
        }

        setError('')
        setGuardando(true)

        try {
              const resultado = await InsertTabla('clientes', formulari)

              if (!resultado) {
                  setError('No s’ha pogut crear el client. Torna-ho a provar.')
                  return
              }

              const clientNou = resultado[0]
              console.log('Client creat amb èxit:', clientNou)
              dispatch({ type: ACTIONS.ACTUALITZAR, payload: { client: clientNou, pantalla: PANTALLAS.INICIO } })
            
          } finally {
              setGuardando(false)
        }
    }

    const handleCancelar = () => {
        dispatch({ type: ACTIONS.ACTUALITZAR, payload: { client: null, pantalla: PANTALLAS.INICIO } })

    }


return (
    <div className='crear-client'>
      <h2>Crear Client</h2>

      <label>
        Nom
        <input type='text' name='nombre' value={formulari.nombre} onChange={handleChange} disabled={guardando}/>
      </label>

      <label>
        Cognoms
        <input type='text' name='apellidos' value={formulari.apellidos} onChange={handleChange} disabled={guardando}/>
      </label>

      <label>
        Telèfon
        <input type='text' name='telefono' value={formulari.telefono} onChange={handleChange} disabled={guardando}/>
      </label>

      <label>
        Email
        <input type='email' name='email' value={formulari.email} onChange={handleChange} disabled={guardando}/>
      </label>

      <label>
        Observacions
        <textarea name='observaciones' value={formulari.observaciones} onChange={handleChange} disabled={guardando}/>
      </label>

      {error && <p className="mensaje-error">{error}</p>}

      <button onClick={handleGuardar} disabled={guardando}>
      {guardando ? 'Guardant...' : 'Guardar'}
      </button>

      <button onClick={handleCancelar} disabled={guardando}>Cancelar</button>

    </div>
  )}


export default CrearClient
