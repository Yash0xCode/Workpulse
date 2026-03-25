function AuthLayout({ visual, children }) {
  return (
    <main className="auth-shell">
      <section className="auth-visual">{visual}</section>
      <section className="auth-form-panel">{children}</section>
    </main>
  )
}

export default AuthLayout
