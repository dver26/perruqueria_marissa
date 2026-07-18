import { useAppContext } from '../utils/useAppContext'

const CreacioServei = () => {
  const { dispatch } = useAppContext()

  return (
    <>
      <button
        onClick={() =>
          dispatch({ type: 'CAMBIAR_PANTALLA', payload: 'inicio' })
        }
      >
        Tornar a Inici
      </button>
    </>
  )
}

export default CreacioServei
