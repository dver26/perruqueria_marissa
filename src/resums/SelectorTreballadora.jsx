export default function SelectorTreballadora({ treballadores, id, onCanvi }) {
  return (
    <label className='selector-treballadora'>
      Treballadora
      <select value={id} onChange={(event) => onCanvi(event.target.value)}>
        {treballadores.map(({ id, nom }) => <option key={id} value={id}>{nom}</option>)}
      </select>
    </label>
  )
}
