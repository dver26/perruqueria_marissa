import test from 'node:test'
import assert from 'node:assert/strict'
import { buscarDuplicats, guardarPersona, prepararPersona } from '../src/utils/persones.js'

const dades = { nombre: 'Anna', apellidos: 'Garcia', telefono: '+34612345678', email: '' }

test('capitalitza noms i cognoms abans de guardar clients i treballadors', () => {
  for (const camps of [{ observaciones: 'Client' }, { activo: true }]) {
    const resultat = prepararPersona({ ...dades, ...camps, nombre: '  àlex   joan ', apellidos: 'pérez-puig d’àvila McDonald' })
    assert.equal(resultat.nombre, 'Àlex Joan')
    assert.equal(resultat.apellidos, 'Pérez-Puig D’Àvila McDonald')
    assert.deepEqual(prepararPersona(resultat), resultat)
  }
})

test('normalitza espais, telèfon i correu sense perdre Actiu o observacions', () => {
  assert.deepEqual(prepararPersona({ ...dades, nombre: '  Anna   Maria ', telefono: '612 34 56 78', email: ' anna@example.com ', activo: false, observaciones: 'Nota' }), {
    ...dades, nombre: 'Anna Maria', email: 'anna@example.com', activo: false, observaciones: 'Nota'
  })
})

test('rebutja camps obligatoris buits, telèfons i correus incorrectes', () => {
  for (const canvi of [{ nombre: ' ' }, { apellidos: '' }, { telefono: '' }, { telefono: '123' }, { telefono: 'Truca al 612345678' }, { email: 'incorrecte@' }]) {
    assert.throws(() => prepararPersona({ ...dades, ...canvi }))
  }
  assert.doesNotThrow(() => prepararPersona(dades))
})

test('troba duplicats de nom amb accents o espais i telèfons amb format antic', () => {
  const persones = [
    { id: 1, nombre: ' ÀNNA ', apellidos: '  Garcia ', telefono: '699999999' },
    { id: 2, nombre: 'Una', apellidos: 'Altra', telefono: '612 34 56 78' },
    { id: 3, nombre: 'Diferent', apellidos: 'Persona', telefono: null }
  ]
  assert.deepEqual(buscarDuplicats(persones, dades).map(p => p.id), [1, 2])
  assert.deepEqual(buscarDuplicats(persones, dades, '1').map(p => p.id), [2])
})

test('avisa de duplicats sense escriure fins que es confirma', async () => {
  let escrits = 0
  const opcions = {
    tabla: 'empleados', dades, consultar: async () => [{ ...dades, id: 1 }],
    insertar: async () => { escrits++; return [{ ...dades, id: 2 }] }
  }
  assert.equal((await guardarPersona(opcions)).duplicats.length, 1)
  assert.equal(escrits, 0)
  assert.equal((await guardarPersona({ ...opcions, confirmat: true })).persona.id, 2)
  assert.equal(escrits, 1)
})

test('si falla la consulta de duplicats no intenta guardar', async () => {
  await assert.rejects(guardarPersona({ tabla: 'empleados', dades, consultar: async () => null, insertar: () => assert.fail('No ha de guardar') }), /duplicats/)
})

test('editar conserva altres camps i no es confon amb un duplicat propi', async () => {
  const persona = { ...dades, id: 4, activo: false, fecha_alta: '2026-01-01' }
  const resultat = await guardarPersona({
    tabla: 'empleados', dades: { ...dades, nombre: 'Anna Maria' }, persona,
    consultar: async () => [persona],
    actualizar: async (tabla, fila) => {
      assert.equal(tabla, 'empleados')
      assert.equal(fila.activo, false)
      assert.equal(fila.fecha_alta, '2026-01-01')
      return [fila]
    }
  })
  assert.equal(resultat.persona.nombre, 'Anna Maria')
})

test('no dona per bo un guardat que retorna error o cap fila', async () => {
  for (const resposta of [null, []]) {
    for (const persona of [undefined, { ...dades, id: 4 }]) {
      await assert.rejects(guardarPersona({ tabla: 'clientes', dades, persona, consultar: async () => [], insertar: async () => resposta, actualizar: async () => resposta }), /guardar/)
    }
  }
})

test('els errors de xarxa arriben al formulari per poder mostrar-los', async () => {
  await assert.rejects(guardarPersona({ tabla: 'empleados', dades, consultar: async () => { throw new Error('Sense connexió') } }), /Sense connexió/)
})

test('reactivar conserva ID i alta originals del treballador', async () => {
  const tabla = 'empleados'
  const anterior = { ...dades, id: 'anterior', activo: false, fecha_alta: '2020-01-01', fecha_baja: '2025-01-01' }
  const resultat = await guardarPersona({ tabla, persona: anterior, dades: { ...dades, activo: true },
    consultar: async () => [anterior], insertar: () => assert.fail('Ha de reutilitzar la fitxa'), actualizar: async (_, fila) => [fila] })
  assert.equal(resultat.persona.id, 'anterior')
  assert.equal(resultat.persona.fecha_alta, '2020-01-01')
  assert.equal(resultat.persona.fecha_baja, null)
  assert.equal(resultat.persona.activo, true)
})

test('desactivar no dona de baixa el treballador', async () => {
  let persona = { ...dades, id: 'a', activo: true }
  const guardar = () => guardarPersona({ tabla: 'empleados', persona, dades: { ...dades, activo: false }, consultar: async () => [persona], actualizar: async (_, fila) => [fila] })
  persona = (await guardar()).persona
  assert.equal(persona.activo, false)
  assert.equal(persona.fecha_baja, null)
  assert.equal((await guardar()).persona.fecha_baja, null)
})

test('la baixa existent es conserva si el treballador continua inactiu', async () => {
  const persona = { ...dades, id: 'a', activo: false, fecha_baja: '2026-01-01' }
  const resultat = await guardarPersona({ tabla: 'empleados', persona, dades: { ...dades, activo: false }, consultar: async () => [persona], actualizar: async (_, fila) => [fila] })
  assert.equal(resultat.persona.fecha_baja, '2026-01-01')
})

test('recuperar un treballador inactiu treu la baixa i conserva la fitxa', async () => {
  const persona = { ...dades, id: 'a', activo: false, fecha_baja: '2026-01-01' }
  const resultat = await guardarPersona({ tabla: 'empleados', persona, reactivar: true, dades: { ...dades, activo: false }, consultar: async () => [persona], actualizar: async (_, fila) => [fila] })
  assert.equal(resultat.persona.id, 'a')
  assert.equal(resultat.persona.activo, false)
  assert.equal(resultat.persona.fecha_baja, null)
})

test('crear i editar clients no afegeix camps de baixa', async () => {
  for (const persona of [undefined, { ...dades, id: 'client', fecha_alta: '2020-01-01' }]) {
    const escriure = async (tabla, fila) => {
      assert.equal(tabla, 'clientes')
      assert.equal(Object.hasOwn(fila, 'activo'), false)
      assert.equal(Object.hasOwn(fila, 'fecha_baja'), false)
      return [{ ...fila, id: 'client' }]
    }
    await guardarPersona({ tabla: 'clientes', dades, persona, consultar: async () => persona ? [persona] : [], insertar: escriure, actualizar: escriure })
  }
})
