import test from 'node:test'
import assert from 'node:assert/strict'
import { crearHorari, prepararHorari } from '../src/utils/horaris.js'

test('proposa dimarts a dissabte amb els dos torns i les hores per defecte', () => {
  const dies = crearHorari()
  assert.deepEqual(dies.map(d => d.dia_semana), [2, 3, 4, 5, 6])
  assert.equal(dies[0].hora_inicio_manana, '09:00')
  assert.equal(dies[0].hora_fin_manana, '13:00')
  assert.equal(dies[0].hora_inicio_tarde, '14:00')
  assert.equal(dies[0].hora_fin_tarde, '20:00')
  assert.ok(dies.every(d => d.mati && d.tarda))
})

test('carrega les hores existents, els torns desactivats i els dies de descans', () => {
  const dies = crearHorari([{ dia_semana: 2, hora_inicio_manana: '08:30:00', hora_fin_manana: '16:00:00', hora_inicio_tarde: null, hora_fin_tarde: null }])
  assert.equal(dies[0].hora_inicio_manana, '08:30')
  assert.equal(dies[0].hora_fin_manana, '16:00')
  assert.equal(dies[0].tarda, false)
  assert.equal(dies[1].mati, false)
  const guardat = prepararHorari(dies)
  assert.equal(guardat[0].hora_inicio_tarde, null)
  assert.equal(guardat[1].hora_inicio_manana, null)
})

test('rebutja hores buides, invertides, incorrectes, torns solapats i dies duplicats', () => {
  for (const canvi of [
    { hora_inicio_manana: '' }, { hora_inicio_manana: '13:00' },
    { hora_fin_tarde: '25:00' }, { hora_inicio_tarde: '12:00' }
  ]) {
    const dies = crearHorari()
    dies[0] = { ...dies[0], ...canvi }
    assert.throws(() => prepararHorari(dies))
  }
  const dies = crearHorari()
  dies[1].dia_semana = 2
  assert.throws(() => prepararHorari(dies))
})

test('permet dies lliures i torns consecutius sense solapament', () => {
  const dies = crearHorari()
  dies[0].mati = false
  dies[0].tarda = false
  dies[1].hora_inicio_tarde = '13:00'
  assert.doesNotThrow(() => prepararHorari(dies))
})

test('no permet un horari completament buit o sense durada de treball', () => {
  const dies = crearHorari().map(d => ({ ...d, mati: false, tarda: false }))
  assert.throws(() => prepararHorari(dies), /no pot estar buit/)
  dies[0] = { ...dies[0], mati: true, hora_inicio_manana: '09:00', hora_fin_manana: '09:00' }
  assert.throws(() => prepararHorari(dies), /posterior/)
  dies[0].hora_fin_manana = '10:00'
  assert.doesNotThrow(() => prepararHorari(dies))
})
