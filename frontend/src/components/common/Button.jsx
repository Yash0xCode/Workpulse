function Button({ children, variant = 'primary', type = 'button', className = '', ...props }) {
  const variantClass = variant === 'outline' ? 'btn-outline' : 'btn-primary'

  return (
    <button type={type} className={`btn ${variantClass} ${className}`.trim()} {...props}>
      {children}
    </button>
  )
}

export default Button
