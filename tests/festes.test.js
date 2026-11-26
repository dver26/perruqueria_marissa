import test from 'node:test'
import assert from 'node:assert/strict'
import { crearMes, diesFestaGuardats, diesInterval, esLaborable } from '../src/utils/festes.js'

const horaris = [2, 3, 5, 6].map(dia_semana => ({ dia_semana, hora_inicio_manana: '09:00:00', hora_fin_manana: '13:00:00', hora_inicio_tarde: null, hora_fin_tarde: null }))

test('compta només laborables i exclou dilluns, diumenges i dies lliures d’horari', () => {
  assert.deepEqual(diesInterval('2026-11-23', '2026-11-29', horaris), ['2026-11-24', '2026-11-25', '2026-11-27', '2026-11-28'])
  assert.equal(esLaborable('2026-11-26', horaris), false)
  assert.equal(esLaborable('2026-11-24', []), false)
})

test('mateix inici i final és un dia; un final anterior es rebutja', () => {
  assert.deepEqual(diesInterval('2026-11-24', '2026-11-24', horaris), ['2026-11-24'])
  assert.deepEqual(diesInterval('2026-11-23', '2026-11-23', horaris), [])
  assert.throws(() => diesInterval('2026-11-25', '2026-11-24', horaris), /anterior/)
})

test('intervals travessen mesos i anys sense errors de zona horària', () => {
  const dies = diesInterval('2026-12-30', '2027-01-02', horaris)
  assert.deepEqual(dies, ['2026-12-30', '2027-01-01', '2027-01-02'])
})

test('el recompte no duplica dies i respecta el final exclusiu', () => {
  const files = [
    { fecha_inicio: '2026-11-24T00:00:00', fecha_fin: '2026-11-26T00:00:00.000000' },
    { fecha_inicio: '2026-11-25T00:00:00', fecha_fin: '2026-11-26T00:00:00' }
  ]
  assert.deepEqual([...diesFestaGuardats(files)], ['2026-11-24', '2026-11-25'])
})

test('calendari comença pel mes actual i avança fins a l’any següent', () => {
  assert.equal(crearMes('2026-11', 0).mes, '2026-11')
  const febrer = crearMes('2027-12', 2)
  assert.equal(febrer.mes, '2028-02')
  assert.equal(febrer.dies.length, 29)
  assert.ok(febrer.buits >= 0 && febrer.buits <= 6)
})
