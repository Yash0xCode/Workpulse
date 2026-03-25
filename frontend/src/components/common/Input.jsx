function Input({ label, id, type = 'text', ...props }) {
  return (
    <label className="input-group" htmlFor={id}>
      {label && <span className="input-label">{label}</span>}
      <input id={id} type={type} className="input-control" {...props} />
    </label>
  )
}

export default Input
