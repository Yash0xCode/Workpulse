function SocialButton({ children, ...props }) {
  return (
    <button type="button" className="btn btn-outline" {...props}>
      {children}
    </button>
  )
}

export default SocialButton
