import { useState } from 'react'
import { Icon } from './Icons.jsx'

/**
 * DataTable – generic sortable table component.
 *
 * Props:
 *   columns   – array of { key, label, render?, sortable?, width? }
 *   rows      – array of objects to display
 *   emptyText – string to show when rows is empty
 *   loading   – boolean, shows skeleton placeholder
 *   onRowClick – optional callback(row)
 */
function DataTable({ columns = [], rows = [], emptyText = 'No data found.', loading = false, onRowClick }) {
  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir] = useState('asc')

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sorted = [...rows].sort((a, b) => {
    if (!sortKey) return 0
    const va = a[sortKey] ?? ''
    const vb = b[sortKey] ?? ''
    if (va < vb) return sortDir === 'asc' ? -1 : 1
    if (va > vb) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={col.width ? { width: col.width } : undefined}
                className={col.sortable ? 'sortable' : ''}
                onClick={col.sortable ? () => handleSort(col.key) : undefined}
                aria-sort={sortKey === col.key ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                {col.label}
                {col.sortable && (
                  <span className="sort-indicator" aria-hidden="true">
                    {sortKey === col.key
                      ? (sortDir === 'asc' ? <Icon name="chevronUp" size={12} /> : <Icon name="chevronDown" size={12} />)
                      : <Icon name="chevronDown" size={12} style={{ opacity: 0.3 }} />}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="skeleton-row">
                  {columns.map((col) => (
                    <td key={col.key}><div className="skeleton-cell" /></td>
                  ))}
                </tr>
              ))
            : sorted.length === 0
              ? (
                  <tr>
                    <td colSpan={columns.length} className="dt-empty">{emptyText}</td>
                  </tr>
                )
              : sorted.map((row, i) => (
                  <tr
                    key={row.id ?? i}
                    className={onRowClick ? 'clickable-row' : ''}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                  >
                    {columns.map((col) => (
                      <td key={col.key}>
                        {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? '—')}
                      </td>
                    ))}
                  </tr>
                ))}
        </tbody>
      </table>
    </div>
  )
}

export default DataTable
