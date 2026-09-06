import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import caLocale from '@fullcalendar/core/locales/ca'

import './Calendari.css'
import { useAppContext } from '../context/useAppContext'
import { ACTIONS, PANTALLAS } from '../utils/consts.js'

function Calendari() {
  const { dispatch } = useAppContext()

  const handleTornarEnrere = () => {
    dispatch({
      type: ACTIONS.ACTUALITZAR,
      payload: { pantalla: PANTALLAS.CONFIGURACIO_CITA }
    })
  }

  const handleClickData = (info) => {
    dispatch({
      type: ACTIONS.ACTUALITZAR,
      payload: { data: info.date, pantalla: PANTALLAS.VISOR_DIA }
    })
  }

  return (
    <>
      <button className='tornar-button' onClick={handleTornarEnrere}>
        Tornar Enrere
      </button>
      <div className='calendari-embolcall'>
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView='dayGridMonth'
          locale={caLocale}
          firstDay={1}
          height='auto'
          fixedWeekCount={false}
          dateClick={(info) => handleClickData(info)}
          dayCellContent={(arg) => {
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
