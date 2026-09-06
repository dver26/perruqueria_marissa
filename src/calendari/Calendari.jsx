import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import caLocale from '@fullcalendar/core/locales/ca'
import './Calendari.css'

function Calendari() {
  return (
    <div className='calendari-embolcall'>
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView='dayGridMonth'
        locale={caLocale}
        firstDay={1}
        height='auto'
        fixedWeekCount={false}
        dateClick={() => console.log('hola')}
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
  )
}

export default Calendari
