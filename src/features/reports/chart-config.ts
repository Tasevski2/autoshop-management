/** Shared recharts styling props for consistent look across light/dark mode */

export const tooltipStyle = {
  contentStyle: {
    backgroundColor: 'var(--popover)',
    border: '1px solid var(--border)',
    borderRadius: '0.5rem',
    color: 'var(--popover-foreground)',
    fontSize: '0.8125rem',
  },
  labelStyle: {
    color: 'var(--popover-foreground)',
    fontWeight: 600,
    marginBottom: 2,
  },
  itemStyle: {
    color: 'var(--popover-foreground)',
  },
}

export const cursorStyle = {
  fill: 'var(--muted)',
}
