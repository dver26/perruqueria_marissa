import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import './Confirmacio.css'

export default function Confirmacio({ titol, children, confirmar, ocupat = false, error, onConfirmar, onCancelar }) {
  const dialog = useRef(null)
  const cancelar = useRef(null)
  const id = useId()

  useEffect(() => {
    const element = dialog.current
    const anterior = document.activeElement
    const overflow = document.body.style.overflow
    element.showModal()
    cancelar.current.focus()
    document.body.style.overflow = 'hidden'
    return () => {
      element.close()
      document.body.style.overflow = overflow
      if (anterior?.isConnected) anterior.focus()
    }
  }, [])

  return createPortal(
    <dialog ref={dialog} className='confirmacio' aria-labelledby={`${id}-titol`} aria-describedby={`${id}-text`}
      aria-busy={ocupat} onCancel={event => { event.preventDefault(); if (!ocupat) onCancelar() }}>
      <div className='confirmacio-contingut'>
        <span className='confirmacio-etiqueta'>Confirmació</span>
        <h2 id={`${id}-titol`}>{titol}</h2>
        <div id={`${id}-text`} className='confirmacio-text'>{children}</div>
        {error && <p className='confirmacio-error' role='alert'>{error}</p>}
        <div className='confirmacio-botons'>
          <button ref={cancelar} type='button' disabled={ocupat} onClick={onCancelar}>Cancel·lar</button>
          <button type='button' className='confirmacio-acceptar' disabled={ocupat} onClick={onConfirmar}>
            {ocupat ? 'Guardant…' : confirmar}
          </button>
        </div>
      </div>
    </dialog>, document.body
  )
}
