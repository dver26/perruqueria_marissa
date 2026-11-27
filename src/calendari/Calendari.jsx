import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import caLocale from '@fullcalendar/core/locales/ca'

import './Calendari.css'
import { useAppContext } from '../context/useAppContext'
import { ACTIONS, PANTALLAS } from '../utils/consts.js'

function Calendari({ resum = false }) {
  const { state, dispatch } = useAppContext()

  // Vuelve a las opciones del servicio para poder cambiarlas.
  const handleTornarEnrere = () => {
    dispatch({
      type: ACTIONS.ACTUALITZAR,
      payload: { pantalla: resum ? PANTALLAS.INICIO : PANTALLAS.CONFIGURACIO_CITA }
    })
  }

  // Guarda el día pulsado y abre su vista de detalle.
  const handleClickData = (info) => {
    dispatch({
      type: ACTIONS.ACTUALITZAR,
      payload: resum
        ? { dataResum: info.date, pantalla: PANTALLAS.RESUM_DIA }
        : { data: info.date, pantalla: PANTALLAS.VISOR_DIA }
    })
  }

  return (
    <>
      <button className={resum ? 'tornar-button resum-calendari-enrere' : 'tornar-button'} onClick={handleTornarEnrere}>
        Tornar Enrere
      </button>
      <div className='calendari-embolcall'>
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView='dayGridMonth'
          initialDate={resum ? state.dataResum : state.data}
          locale={caLocale}
          firstDay={1}
          height='auto'
          fixedWeekCount={false}
          dateClick={(info) => handleClickData(info)}
          dayCellContent={(arg) => {
            // Muestra el número del día y marca el de hoy con una clase propia.
            return (
              <div className='celda-dia'>
                <span className={`numero-dia ${arg.isToday ? 'es-hoy' : ''}`}>
                  {arg.dayNumberText}
                </span>
              </div>
            )
          }}
        />
      </div>
    </>
  )
}

export default Calendari
