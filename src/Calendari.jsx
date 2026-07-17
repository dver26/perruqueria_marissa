import { useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction' // opcional: click y drag

function Calendari() {
  const [eventos, setEventos] = useState([
    { title: 'Reunión CVC', date: '2026-07-20' },
    { title: 'Entrega proyecto React', date: '2026-07-25' }
  ])

  const handleDateClick = (info) => {
    const titulo = prompt('Nombre del evento:')
    if (titulo) {
      setEventos([...eventos, { title: titulo, date: info.dateStr }])
    }
  }

  return (
    <FullCalendar
      plugins={[dayGridPlugin, interactionPlugin]}
      initialView='dayGridMonth'
      events={eventos}
      dateClick={handleDateClick}
    />
  )
}

export default Calendari
