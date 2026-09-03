import { useEffect, useState } from 'react'

import { useAppContext } from '../context/useAppContext'
import { supabase } from '../utils/supabase'

const ConfigCita = () => {
  const { state } = useAppContext()
  const [tareas, setTareas] = useState([])

  useEffect(() => {
    const getParts = async () => {
      const { data, error } = await supabase
        .from('tareas')
        .select('*')
        .eq('servicio_id', state.servei.id)

      if (error) {
        console.log(error)
        return
      }

      setTareas(data)
    }

    getParts()
  }, [])

  return (
    <>
      <button className='tornar-button'>Tornar a Inici</button>
      <div className='container-general'>
        <h3 className='titulo'>{state.servei.nombre}</h3>
        <div className='seleccio'>
          {tareas.map((tarea) => {
            return <p key={tarea.id}>{tarea.nombre}</p>
          })}
        </div>
      </div>
    </>
  )
}

export default ConfigCita
