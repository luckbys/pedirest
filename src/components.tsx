import { Bell, ChevronDown, CircleUserRound, Clock3, Menu, RotateCcw, Wifi } from 'lucide-react'
import type { ReactNode } from 'react'
import type { OrderStatus, Role } from './types'

export const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
export const time = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })

export const statusLabel: Record<OrderStatus, string> = {
  sent: 'Novo',
  preparing: 'Em preparo',
  ready: 'Pronto',
  picked_up: 'Retirado',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
}

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand" aria-label="PediRest">
      <span className="brand-mark">P<span>•</span></span>
      {!compact && <span className="brand-name">pedi<span>rest</span></span>}
    </div>
  )
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`status-badge status-${status}`}><i />{statusLabel[status]}</span>
}

export function PageTitle({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="page-title-row">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function EmptyState({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return <div className="empty-state"><span>{icon}</span><strong>{title}</strong><p>{text}</p></div>
}

export function Shell({ role, onRoleChange, onReset, children }: {
  role: Role
  onRoleChange: (role: Role) => void
  onReset: () => void
  children: ReactNode
}) {
  const roles: { id: Role; label: string; short: string }[] = [
    { id: 'waiter', label: 'Garçom', short: 'Salão' },
    { id: 'production', label: 'Produção', short: 'Bar' },
    { id: 'cashier', label: 'Caixa', short: 'Caixa' },
    { id: 'admin', label: 'Gestão', short: 'Gestão' },
  ]

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Brand />
        <div className="venue-switch"><span>SF</span><div><small>Estabelecimento</small><strong>São Francisco</strong></div><ChevronDown size={16} /></div>
        <nav aria-label="Perfis de demonstração">
          <p>ÁREAS DE TRABALHO</p>
          {roles.map((item) => (
            <button key={item.id} className={role === item.id ? 'active' : ''} onClick={() => onRoleChange(item.id)}>
              <span className={`nav-icon nav-${item.id}`}>{item.short.slice(0, 1)}</span>
              <span><strong>{item.label}</strong><small>{item.short}</small></span>
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">
          <button onClick={onReset}><RotateCcw size={17} /> Restaurar demonstração</button>
          <div className="operator"><div className="avatar">LU</div><div><strong>Lucas Borges</strong><small>Administrador</small></div><ChevronDown size={15} /></div>
        </div>
      </aside>
      <section className="workspace">
        <header className="topbar">
          <button className="mobile-menu" aria-label="Abrir menu"><Menu /></button>
          <Brand compact />
          <div className="role-switcher">
            <small>Visualizando como</small>
            <select value={role} onChange={(event) => onRoleChange(event.target.value as Role)}>
              {roles.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </div>
          <div className="connection"><Wifi size={15} /> Em tempo real</div>
          <div className="today"><Clock3 size={16} /> Turno aberto</div>
          <button className="icon-button" aria-label="Notificações"><Bell size={19} /><i /></button>
          <CircleUserRound className="top-avatar" />
        </header>
        <main>{children}</main>
      </section>
    </div>
  )
}
