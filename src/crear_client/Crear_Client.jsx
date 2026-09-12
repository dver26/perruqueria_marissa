import { useAppContext } from '../context/useAppContext'
import { ACTIONS, PANTALLAS } from '../utils/consts.js'
import './Crear_Client.css'
import { useState } from 'react'
import { InsertTabla, BuscarPorCampo } from '../utils/supabase.js'
import { validarEmail, validarTelefono, normalizarTelefono } from '../utils/validacions.js'

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
    const [clientsCoincidents, setClientsCoincidents] = useState([])
    const [mostrarModal, setMostrarModal] = useState(false)
    const [motiuDuplicat, setMotiuDuplicat] = useState('') // 'nom' o 'telefon'

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

        const telefonoNormalizado = normalizarTelefono(formulari.telefono)

        if (formulari.email.trim() && !validarEmail(formulari.email)) {
            setError('El format de l\u2019email no és vàlid')
            return
        }

        setError('')
        setGuardando(true)

        // Comprovació de nom + cognoms duplicats
        const clientsAmbMateixNom = await BuscarPorCampo('clientes', 'nombre', formulari.nombre)
        const coincidentsNom = clientsAmbMateixNom.filter(c => c.apellidos === formulari.apellidos)

        if (coincidentsNom.length > 0) {
            setClientsCoincidents(coincidentsNom)
            setMotiuDuplicat('nom')
            setMostrarModal(true)
            setGuardando(false)
            return
        }

        // Comprovació de telèfon duplicat
        const coincidentsTelefon = await BuscarPorCampo('clientes', 'telefono', telefonoNormalizado)

        if (coincidentsTelefon.length > 0) {
            setClientsCoincidents(coincidentsTelefon)
            setMotiuDuplicat('telefon')
            setMostrarModal(true)
            setGuardando(false)
            return
        }

        await guardarClientDefinitiu(telefonoNormalizado)
    }

    const guardarClientDefinitiu = async (telefonoNormalizado) => {
        setGuardando(true)
        try {
            const datosAGuardar = { ...formulari, telefono: telefonoNormalizado }
            const resultado = await InsertTabla('clientes', datosAGuardar)


            if (!resultado) {
                setError('No s\u2019ha pogut crear el client. Torna-ho a provar.')
                return
            }

            const clientNou = resultado[0]
            dispatch({ type: ACTIONS.ACTUALITZAR, payload: { client: clientNou, pantalla: PANTALLAS.INICIO } })
        } finally {
            setGuardando(false)
            setMostrarModal(false)
        }
    }

    const handleConfirmarDuplicat = () => {
        const telefonoNormalizado = normalizarTelefono(formulari.telefono)
        guardarClientDefinitiu(telefonoNormalizado)
    }

    const handleCancelarDuplicat = () => {
        setMostrarModal(false)
        setClientsCoincidents([])
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

      {mostrarModal && (
        <div className="modal-overlay">
          <div className="modal-contingut">
            {motiuDuplicat === 'nom' ? (
              <p>Ja tens un client amb el mateix nom i cognoms:</p>
            ) : (
              <p>Ja existeixen clients amb aquest número de telèfon:</p>
            )}
            <ul>
              {clientsCoincidents.map(c => (
                <li key={c.id}>{c.nombre} {c.apellidos} — {c.telefono}</li>
              ))}
            </ul>
            <p>Segur que vols crear aquest client?</p>
            <div className="modal-botons">
              <button onClick={handleConfirmarDuplicat}>Sí</button>
              <button onClick={handleCancelarDuplicat}>No</button>
            </div>
          </div>
        </div>
    )}
    </div>
  )}


export default CrearClient