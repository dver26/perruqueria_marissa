import test from 'node:test'
import assert from 'node:assert/strict'
import { dataLocal, prepararAbsencia } from '../src/utils/absencies.js'

test('dies complets inclouen l’últim dia, fins i tot en canvis de mes o any', () => {
  assert.deepEqual(prepararAbsencia({ inici: '2026-12-31', fi: '2026-12-31', diesComplets: true, motiu: ' Vacances ' }, 'a'), {
    empleado_id: 'a', fecha_inicio: '2026-12-31T00:00:00', fecha_fin: '2027-01-01T00:00:00', motivo: 'Vacances'
  })
  for (const [inici, fi] of [['', ''], ['2026-12-02', '2026-12-01']]) {
    assert.throws(() => prepararAbsencia({ inici, fi, diesComplets: true, motiu: '' }, 'a'))
  }
  assert.throws(() => prepararAbsencia({ inici: '2026-12-01T10:00', fi: '2026-12-01T10:00', diesComplets: false, motiu: '' }, 'a'))
})

test('hores del saló independents de la zona del navegador, amb horari d’estiu', () => {
  assert.equal(dataLocal(new Date('2026-01-01T10:00:00Z')), '2026-01-01T11:00:00')
  assert.equal(dataLocal(new Date('2026-07-01T10:00:00Z')), '2026-07-01T12:00:00')
})

test('permet absències sense final, per hores i dies complets', () => {
  for (const diesComplets of [true, false]) {
    const absencia = prepararAbsencia({ inici: diesComplets ? '2026-12-01' : '2026-12-01T10:30', fi: '', diesComplets, motiu: '' }, 'a')
    assert.equal(absencia.fecha_fin, null)
    assert.equal(absencia.fecha_inicio, diesComplets ? '2026-12-01T00:00:00' : '2026-12-01T10:30:00')
  }
})
