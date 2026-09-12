import { parsePhoneNumberFromString } from 'libphonenumber-js'

export function validarEmail(email) {
// Funció per validar un email utilitzant una expressió regular
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return regex.test(email.trim())
}

export function validarTelefono(telefono, paisPorDefecto = 'ES') {
// Funció per validar un número de telèfon utilitzant la llibreria libphonenumber-js
  try {
    const phone = parsePhoneNumberFromString(telefono, paisPorDefecto)
    return phone ? phone.isValid() : false
  } catch {
    return false
  }
}