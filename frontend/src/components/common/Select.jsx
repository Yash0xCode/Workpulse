function Select({ label, id, options = [], ...props }) {
  return (
    <label className="input-group" htmlFor={id}>
      {label && <span className="input-label">{label}</span>}
      <select id={id} className="input-control" {...props}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export default Select
