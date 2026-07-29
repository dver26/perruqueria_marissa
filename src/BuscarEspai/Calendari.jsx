import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import caLocale from '@fullcalendar/core/locales/ca'
import './Calendari.css'

import Indicador from './Indicador.jsx'
import { useAppContext } from '../utils/useAppContext.js'

function Calendari() {
  const { state, dispatch } = useAppContext()

  const handleDateClick = (info) => {
    dispatch({
      type: 'VISOR_DIA',
      payload: { pantalla: 'visor_dia', data: info.date }
    })
  }

  return (
    <FullCalendar
      plugins={[dayGridPlugin, interactionPlugin]}
      locale={caLocale}
      initialView='dayGridMonth'
      dateClick={handleDateClick}
      dayCellContent={(arg) => (
        <div className='celda-dia'>
          <span className={`numero-dia ${arg.isToday ? 'es-hoy' : ''}`}>
            {arg.dayNumberText}
          </span>
          <Indicador dataProps={arg.date} />
        </div>
      )}
    />
  )
}

export default Calendari
