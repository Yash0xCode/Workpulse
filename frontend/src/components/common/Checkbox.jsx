function Checkbox({ id, label, ...props }) {
  return (
    <label className="checkbox" htmlFor={id}>
      <input id={id} type="checkbox" {...props} />
      <span>{label}</span>
    </label>
  )
}

export default Checkbox
