import { useEffect, useState } from 'react'

import { useAppContext } from '../context/useAppContext'
import { supabase } from '../utils/supabase'
import { ACTIONS, PANTALLAS, TAULES } from '../utils/consts.js'

const ConfigCita = () => {
  const { state, dispatch } = useAppContext()
  const [tareas, setTareas] = useState([])
  const [duracions, setDuracions] = useState([])

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

  console.log(duracions)

  return (
    <>
      <button className='tornar-button' onClick={handleTornarAInici}>
        Tornar a Inici
      </button>
      <div className='container-general'>
        <h3 className='titulo'>{state.servei.nombre}</h3>
        <div className='seleccio'>
          {tareas.map((tarea) => {
            return (
              <div key={tarea.id} className='container-part'>
                {tarea.nombre}
                {duracions[tarea.id].length}
                {duracions[tarea.id].length > 1 ? (
                  <select name='' id=''>
                    {duracions[tarea.id].map((duracio) => {
                      return <option value={duracio}>{duracio} min</option>
                    })}
                  </select>
                ) : (
                  <span>Hola</span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}

export default ConfigCita
