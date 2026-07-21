// context/useAppContext.js
import { useContext } from 'react'
import { AppContext } from '../context/AppContext'

export function useAppContext() {
  return useContext(AppContext)
}
