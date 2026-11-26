import test from 'node:test'
import assert from 'node:assert/strict'
import { absenciaIniciada, absenciaVigent, campsPerEditarAbsencia, canviarTipusAbsencia, dataLocal, prepararAbsencia as prepararAbsenciaReal } from '../src/utils/absencies.js'

const ara = '2026-11-26T12:00:00'
const prepararAbsencia = (camps, id, opcions = {}) => prepararAbsenciaReal(camps, id, { ara, ...opcions })

test('dies complets inclouen l’últim dia, fins i tot en canvis de mes o any', () => {
  assert.deepEqual(prepararAbsencia({ inici: '2026-12-31', fi: '2026-12-31', diesComplets: true, motiu: ' Vacances ' }, 'a'), {
    empleado_id: 'a', fecha_inicio: '2026-12-31T00:00:00', fecha_fin: '2027-01-01T00:00:00', dias_completos: true, motivo: 'Vacances'
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

test('amaga les completades i conserva les actuals i futures, incloses les obertes', () => {
  const ara = '2026-12-01T10:30:00'
  const actual = { fecha_inicio: '2026-12-01T10:00:00', fecha_fin: '2026-12-01T11:00:00' }
  assert.equal(absenciaVigent(actual, ara), true)
  assert.equal(absenciaIniciada(actual, ara), true)
  assert.equal(absenciaVigent({ ...actual, fecha_fin: ara }, ara), false)
  assert.equal(absenciaVigent({ ...actual, fecha_fin: `${ara}.000000` }, ara), false)
  const futura = { fecha_inicio: '2026-12-02T10:00:00', fecha_fin: null }
  assert.equal(absenciaVigent(futura, ara), true)
  assert.equal(absenciaIniciada(futura, ara), false)
  assert.equal(absenciaIniciada({ ...actual, fecha_inicio: `${ara}.000000` }, ara), true)
})

test('editar conserva segons i precisió de les dates i permet treure el final', () => {
  const absencia = { fecha_inicio: '2026-12-01T10:30:45.123456', fecha_fin: '2026-12-01T11:45:32', motivo: 'Visita' }
  const camps = campsPerEditarAbsencia(absencia)
  assert.deepEqual(prepararAbsencia(camps, 'a'), { empleado_id: 'a', dias_completos: false, ...absencia })
  assert.equal(prepararAbsencia({ ...camps, fi: '' }, 'a').fecha_fin, null)
  assert.equal(campsPerEditarAbsencia({ ...absencia, fecha_fin: null }).fi, '')
})

test('editar dies complets conserva el dia final inclusiu i el tipus d’absència', () => {
  for (const fi of ['', '2027-01-03']) {
    const camps = { inici: '2026-12-31', fi, diesComplets: true, motiu: 'Vacances' }
    const fila = prepararAbsencia(camps, 'a')
    assert.deepEqual(campsPerEditarAbsencia(fila), camps)
    assert.equal(fila.dias_completos, true)
  }
})

test('crear i editar absències futures rebutja inicis passats', () => {
  const camps = { inici: '2026-11-25T10:00', fi: '', diesComplets: false, motiu: '' }
  const futura = { fecha_inicio: '2026-11-27T10:00:00', fecha_fin: null }
  assert.throws(() => prepararAbsencia(camps, 'a'), /anterior/)
  assert.throws(() => prepararAbsencia(camps, 'a', { original: futura }), /anterior/)
  assert.throws(() => prepararAbsencia({ ...camps, inici: '2026-11-25', diesComplets: true }, 'a'), /anterior/)
  assert.doesNotThrow(() => prepararAbsencia({ ...camps, inici: '2026-11-26', diesComplets: true }, 'a'))
})

test('canviar dies i hores conserva les dates i els límits inclusius del final', () => {
  const camps = { inici: '2026-12-01T10:30', fi: '2026-12-03T00:00', diesComplets: false, motiu: 'Visita' }
  const dies = canviarTipusAbsencia(camps, true, null, ara)
  assert.equal(dies.inici, '2026-12-01')
  assert.equal(dies.fi, '2026-12-02')
  const hores = canviarTipusAbsencia(dies, false, null, ara)
  assert.equal(hores.fi, '2026-12-03T00:00:00')
  assert.equal(hores.motiu, 'Visita')
  assert.equal(canviarTipusAbsencia({ ...camps, fi: '' }, true, null, ara).fi, '')
})

test('canviar el tipus d’una absència activa conserva l’inici exacte', () => {
  const original = { fecha_inicio: '2026-11-26T10:15:32', fecha_fin: null, dias_completos: false }
  const camps = { ...campsPerEditarAbsencia(original), fi: '2026-11-27T17:00' }
  const dies = canviarTipusAbsencia(camps, true, original, ara)
  const guardat = prepararAbsencia(dies, 'a', { original })
  assert.equal(guardat.fecha_inicio, original.fecha_inicio)
  assert.equal(guardat.fecha_fin, '2026-11-28T00:00:00')
  assert.equal(guardat.dias_completos, true)
  assert.equal(canviarTipusAbsencia(dies, false, original, ara).inici, original.fecha_inicio)
})

test('Ara ignora l’hora antiga del formulari i utilitza el moment de guardar', () => {
  const camps = { inici: '2026-11-26T11:59:50', fi: '', diesComplets: false, motiu: 'Visita' }
  assert.throws(() => prepararAbsencia(camps, 'a'), /anterior/)
  assert.equal(prepararAbsencia(camps, 'a', { iniciAra: true }).fecha_inicio, ara)
  assert.equal(prepararAbsencia({ ...camps, inici: '' }, 'a', { iniciAra: true }).fecha_inicio, ara)
  assert.throws(() => prepararAbsencia({ ...camps, fi: '2026-11-26T11:59:59' }, 'a', { iniciAra: true }), /posterior/)
})

test('Ara permet avançar una absència futura però no canviar-ne una ja iniciada', () => {
  const camps = { inici: '2026-11-27T10:00', fi: '', diesComplets: false, motiu: '' }
  const futura = { fecha_inicio: '2026-11-27T10:00:00', fecha_fin: null }
  assert.equal(prepararAbsencia(camps, 'a', { original: futura, iniciAra: true }).fecha_inicio, ara)
  assert.throws(() => prepararAbsencia(camps, 'a', { original: { ...futura, fecha_inicio: '2026-11-26T10:00:00' }, iniciAra: true }), /ja ha començat/)
})
