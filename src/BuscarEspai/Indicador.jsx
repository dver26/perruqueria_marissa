import { useAppContext } from '../utils/useAppContext'
import './Indicador.css'

const Indicador = ({ dataProps }) => {
  function extreureData(data) {
    const any = data.getFullYear()
    const mes = String(data.getMonth() + 1).padStart(2, '0')
    const dia = String(data.getDate()).padStart(2, '0')
    return `${any}-${mes}-${dia}`
  }

  function extreureDia(data) {
    return data.getDate()
  }

  const { state } = useAppContext()
  const { events } = state

  const data = extreureData(dataProps)

  let ple = false

  events.forEach((event) => {
    if (event.data == data) {
      ple = true
    }
  })

  return (
    <>
      <div className={`rodona ${ple ? 'plena' : 'lliure'}`}></div>
    </>
  )
}

export default Indicador
