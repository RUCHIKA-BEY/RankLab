import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

export function Panel({ children, className = '', id }: { children: ReactNode; className?: string; id?: string }) {
  return <section id={id} className={`panel ${className}`}>{children}</section>
}

export function PanelHeading({ eyebrow, title, detail, icon: Icon, action }: { eyebrow?: string; title: string; detail?: string; icon?: LucideIcon; action?: ReactNode }) {
  return (
    <div className="panel-heading">
      <div className="heading-copy">
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <div className="heading-row">
          {Icon && <Icon size={17} strokeWidth={1.8} />}
          <h2>{title}</h2>
        </div>
        {detail && <p>{detail}</p>}
      </div>
      {action && <div className="panel-action">{action}</div>}
    </div>
  )
}

export function Badge({ children, tone = 'neutral', dot = false }: { children: ReactNode; tone?: 'neutral' | 'violet' | 'mint' | 'amber' | 'red' | 'blue'; dot?: boolean }) {
  return <span className={`badge badge-${tone}`}>{dot && <span className="badge-dot" />}{children}</span>
}

export function Metric({ label, value, detail, tone = 'neutral' }: { label: string; value: ReactNode; detail?: string; tone?: 'neutral' | 'violet' | 'mint' | 'amber' }) {
  return (
    <div className={`metric metric-${tone}`}>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      {detail && <div className="metric-detail">{detail}</div>}
    </div>
  )
}

export function Button({ children, variant = 'secondary', size = 'md', icon: Icon, className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; size?: 'sm' | 'md'; icon?: LucideIcon }) {
  return (
    <button className={`button button-${variant} button-${size} ${className}`} {...props}>
      {Icon && <Icon size={size === 'sm' ? 14 : 16} strokeWidth={1.8} />}
      <span>{children}</span>
    </button>
  )
}

export function EmptyState({ icon: Icon, title, detail }: { icon: LucideIcon; title: string; detail: string }) {
  return <div className="empty-state"><Icon size={22} /><strong>{title}</strong><p>{detail}</p></div>
}

export function MiniSpark({ values, color = '#8b7cff' }: { values: number[]; color?: string }) {
  if (!values.length) return null
  const max = Math.max(...values, 0.000001)
  const min = Math.min(...values)
  const range = Math.max(max - min, 0.000001)
  const points = values.map((value, index) => `${(index / Math.max(values.length - 1, 1)) * 100},${90 - ((value - min) / range) * 75}`).join(' ')
  return <svg className="mini-spark" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polyline points={points} fill="none" stroke={color} strokeWidth="3" vectorEffect="non-scaling-stroke" /></svg>
}
