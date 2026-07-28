import { useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import caLocale from '@fullcalendar/core/locales/ca'
import './Calendari.css'

function Calendari() {
  return (
    <FullCalendar
      plugins={[dayGridPlugin, interactionPlugin]}
      locale={caLocale}
      initialView='dayGridMonth'
      dayCellContent={(arg) => (
        <div className='celda-dia'>
          <span className={`numero-dia ${arg.isToday ? 'es-hoy' : ''}`}>
            {arg.dayNumberText}
          </span>
          <span>Prova</span>
        </div>
      )}
    />
  )
}

export default Calendari
