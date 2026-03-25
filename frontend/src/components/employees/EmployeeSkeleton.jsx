function EmployeeSkeleton({ count = 4 }) {
  return (
    <div className="skeleton-grid">
      {Array.from({ length: count }).map((_, index) => (
        <div key={`skeleton-${index}`} className="skeleton-card" />
      ))}
    </div>
  )
}

export default EmployeeSkeleton
