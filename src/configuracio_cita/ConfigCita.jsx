import { useEffect, useState } from 'react'

import { useAppContext } from '../context/useAppContext'
import { supabase } from '../utils/supabase'
import { ACTIONS, PANTALLAS, TAULES, TORNS } from '../utils/consts.js'

import './ConfigCita.css'

const ConfigCita = () => {
  const { state, dispatch } = useAppContext()

  const [tareas, setTareas] = useState([])
  const [duracions, setDuracions] = useState([])

  const [treballadoresEscollides, setTreballadoresEscollides] = useState({})
  const [duracionsEscollides, setDuracionsEscollides] = useState({})

  useEffect(() => {
    const getPartsIDuracions = async () => {
      const { data, error } = await supabase
        .from(TAULES.TAREAS)
        .select('*')
        .eq('servicio_id', state.servei.id)

      if (error) {
        console.log('Error al importar serveis: ', error)
        return
      }

      const tareas_id = data.map((tarea) => tarea.id)

      const { data: data_duracions, error: error2 } = await supabase
        .from(TAULES.DURACIONS)
        .select('*')
        .in('tarea_id', tareas_id)

      if (error2) {
        console.log('Error al importar duracions: ', error2)
        return
      }

      const arrBrut = tareas_id.map((id_tarea) => {
        return {
          [id_tarea]: data_duracions
            .filter((duracions) => duracions.tarea_id == id_tarea)
            .map((info) => {
              return info.duracio_minuts
            })
        }
      })

      setTareas(data)
      setDuracions(Object.assign({}, ...arrBrut))
    }

    getPartsIDuracions()
  }, [])

  const handleTornarAInici = () => {
    dispatch({
      type: ACTIONS.ACTUALITZAR,
      payload: { pantalla: PANTALLAS.INICIO }
    })
  }

  const handleCanviSelector = (event, tarea) => {
    if (event.target.id == `duracio-${tarea}`) {
      setDuracionsEscollides({
        ...duracionsEscollides,
        [tarea]: event.target.value
      })
    } else if (event.target.id == `treballadora-${tarea}`) {
      setTreballadoresEscollides({
        ...treballadoresEscollides,
        [tarea]: event.target.value
      })
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    const duracionsCompletes = {}
    const treballadoresCompletes = {}

    tareas.forEach((tarea) => {
      duracionsCompletes[tarea.id] =
        duracionsEscollides[tarea.id] ?? duracions[tarea.id][0]

      if (tarea.nombre !== 'Exposició') {
        treballadoresCompletes[tarea.id] =
          treballadoresEscollides[tarea.id] ?? 'Indiferent'
      }
    })

    dispatch({
      type: ACTIONS.ACTUALITZAR,
      payload: {
        duracions: duracionsCompletes,
        treballadores: treballadoresCompletes,
        pantalla: PANTALLAS.CALENDARI
      }
    })
  }

  return (
    <>
      <button className='tornar-button' onClick={handleTornarAInici}>
        Tornar a Inici
      </button>
      <div className='container-general'>
        <h3 className='titulo'>{state.servei.nombre}</h3>
        <div className='seleccio-parts'>
          {tareas.map((tarea) => {
            return (
              <div key={tarea.id} className='container-part'>
                <p className='label'>{tarea.nombre}</p>
                <div className='seleccions'>
                  {duracions[tarea.id].length > 1 ? (
                    <select
                      onChange={(e) => handleCanviSelector(e, tarea.id)}
                      id={`duracio-${tarea.id}`}
                    >
                      {duracions[tarea.id].map((duracio, i) => {
                        return (
                          <option key={i} value={duracio}>
                            {duracio} min
                          </option>
                        )
                      })}
                    </select>
                  ) : (
                    <span>{duracions[tarea.id][0]}</span>
                  )}
                  {tarea.nombre !== 'Exposició' && (
                    <select
                      onChange={(e) => handleCanviSelector(e, tarea.id)}
                      id={`treballadora-${tarea.id}`}
                    >
                      <option value='Indiferent'>Indiferent</option>
                      {state.empleados.map((empleado) => {
                        return (
                          <option key={empleado.id} value={empleado.id}>
                            {empleado.nombre}
                          </option>
                        )
                      })}
                    </select>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        <div className='seleccio-torn'>
          <label>Torn</label>
          <div className='torn-select-wrapper'>
            <select id='torn-servei'>
              <option value={TORNS.MATI}>Matí</option>
              <option value={TORNS.TARDA}>Tarda</option>
              <option value={TORNS.INDIFERENT}>Indiferent</option>
            </select>
          </div>
        </div>

        <button onClick={(e) => handleSubmit(e)} className='submit-button'>
          Continuar
        </button>
      </div>
    </>
  )
}

export default ConfigCita
