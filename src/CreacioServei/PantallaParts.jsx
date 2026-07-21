import { useAppContext } from '../utils/useAppContext'
import Form from './Form.jsx'
import styles from './PantallaParts.module.css'

const PantallaParts = () => {
  const { state, dispatch } = useAppContext()

  console.log(state.serveiEscollit)

  return (
    <>
      <div className={styles.contenidor}>
        <button
          className={styles.tancar}
          aria-label='Tornar a inici'
          onClick={() =>
            dispatch({
              type: 'CAMBIAR_PANTALLA',
              payload: { pantalla: 'inicio', serveiEscollit: null }
            })
          }
        >
          ×
        </button>
        <Form />
      </div>
    </>
  )
}

export default PantallaParts
