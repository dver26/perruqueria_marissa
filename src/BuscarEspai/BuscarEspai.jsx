import Calendari from './Calendari'
import { useAppContext } from '../utils/useAppContext'

import './BuscarEspai.css'

const BuscarEspai = () => {
  const { state, dispatch } = useAppContext()
  const { serveis, serveiEscollit, duracions } = state

  console.clear()
  console.log(Object.entries(duracions))

  return (
    <>
      <Calendari />
    </>
  )
}

export default BuscarEspai
