import { useMemo, useState } from 'react'
import { AlertTriangle, Check, CheckCheck, ChefHat, Clock3, Filter, Flame, MoreHorizontal, RefreshCw, Search, UtensilsCrossed } from 'lucide-react'
import { PageTitle, time } from '../components'
import { waitMinutes } from '../orderMachine'
import { useStore } from '../store'
import type { Order, OrderStatus } from '../types'

const columns: { status: OrderStatus; title: string; description: string }[] = [
  { status: 'sent', title: 'Novos', description: 'Aguardando aceite' },
  { status: 'preparing', title: 'Em preparo', description: 'Produção iniciada' },
  { status: 'ready', title: 'Prontos', description: 'Aguardando garçom' },
  { status: 'picked_up', title: 'Retirados', description: 'Saíram da produção' },
]

export function ProductionView({ notify }: { notify: (message: string) => void }) {
  const { orders, setOrderStatus } = useStore()
  const [sector, setSector] = useState('Todos os setores')
  const [query, setQuery] = useState('')

  const visible = useMemo(() => orders.filter((order) =>
    order.status !== 'cancelled'
    && order.status !== 'delivered'
    && (sector === 'Todos os setores' || order.items.some((item) => item.sector === sector))
    && (`${order.tableNumber} ${order.tabNumber} ${order.waiterName}`).toLowerCase().includes(query.toLowerCase())), [orders, query, sector])

  const preparing = visible.filter((order) => order.status === 'preparing').length
  const overdue = visible.filter((order) => waitMinutes(order) >= 15 && !['ready', 'picked_up'].includes(order.status)).length

  function move(order: Order, status: OrderStatus, label: string) {
    setOrderStatus(order.id, status, 'Marina · Produção')
    notify(`Pedido #${order.displayId} ${label}`)
  }

  return (
    <div className="production-page">
      <PageTitle eyebrow="PAINEL DE PRODUÇÃO" title="Fila de pedidos" description="Atualização automática • Última sincronização agora" action={<div className="production-clock"><span>10:42</span><small>18 JUL 2026</small></div>} />
      <div className="production-summary">
        <div><span className="summary-symbol new"><UtensilsCrossed /></span><p><strong>{visible.filter((order) => order.status === 'sent').length}</strong><small>Novos pedidos</small></p></div>
        <div><span className="summary-symbol prep"><Flame /></span><p><strong>{preparing}</strong><small>Em preparo</small></p></div>
        <div><span className="summary-symbol done"><CheckCheck /></span><p><strong>{visible.filter((order) => order.status === 'ready').length}</strong><small>Prontos</small></p></div>
        <div><span className="summary-symbol alert"><AlertTriangle /></span><p><strong>{overdue}</strong><small>Em atraso</small></p></div>
        <div className="average-time"><small>TEMPO MÉDIO</small><strong>08<span>min</span></strong><em>↓ 2 min hoje</em></div>
      </div>
      <div className="production-tools">
        <label className="compact-search"><Search /><input placeholder="Buscar mesa ou comanda" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <select value={sector} onChange={(event) => setSector(event.target.value)}><option>Todos os setores</option><option>Bar</option><option>Drinks</option><option>Cozinha</option></select>
        <button><Filter size={17} /> Filtros</button><button><RefreshCw size={17} /> Atualizar</button>
        <span className="live-indicator"><i /> AO VIVO</span>
      </div>
      <div className="kanban-board">
        {columns.map((column) => {
          const columnOrders = visible.filter((order) => order.status === column.status)
          return <section className={`kanban-column column-${column.status}`} key={column.status}>
            <header><div><i /><h2>{column.title}</h2><b>{columnOrders.length}</b></div><p>{column.description}</p></header>
            <div className="kanban-list">
              {columnOrders.map((order) => <ProductionCard key={order.id} order={order} onMove={move} />)}
              {columnOrders.length === 0 && <div className="kanban-empty"><ChefHat /><span>Fila vazia</span></div>}
            </div>
          </section>
        })}
      </div>
    </div>
  )
}

function ProductionCard({ order, onMove }: { order: Order; onMove: (order: Order, status: OrderStatus, label: string) => void }) {
  const waited = waitMinutes(order)
  const urgency = waited >= 20 ? 'critical' : waited >= 15 ? 'late' : waited >= 10 ? 'attention' : 'normal'
  return <article className={`production-card urgency-${urgency}`}>
    <div className="ticket-top"><span className="ticket-table"><small>MESA</small>{order.tableNumber}</span><div><strong>#{order.displayId}</strong><small>Comanda {order.tabNumber}</small></div><button><MoreHorizontal /></button></div>
    <div className="ticket-meta"><span><Clock3 /> {time.format(new Date(order.createdAt))}</span><strong>{waited} min</strong>{order.priority === 'priority' && <em>PRIORIDADE</em>}</div>
    <div className="ticket-items">
      {order.items.map((item) => <div key={item.id}><b>{item.quantity}×</b><span>{item.name}{item.notes && <small>↳ {item.notes}</small>}</span><i>{item.sector}</i></div>)}
    </div>
    <div className="ticket-footer"><span><i>{order.waiterName.slice(0, 2).toUpperCase()}</i>{order.waiterName}</span><small>{order.items.reduce((sum, item) => sum + item.quantity, 0)} itens</small></div>
    {order.status === 'sent' && <button className="ticket-action accept" onClick={() => onMove(order, 'preparing', 'aceito e iniciado')}><Flame /> Iniciar preparo</button>}
    {order.status === 'preparing' && <button className="ticket-action ready" onClick={() => onMove(order, 'ready', 'marcado como pronto')}><Check /> Marcar como pronto</button>}
    {order.status === 'ready' && <div className="awaiting"><span className="pulse-dot" /> Aguardando retirada</div>}
    {order.status === 'picked_up' && <div className="picked"><CheckCheck /> Retirado por {order.waiterName}</div>}
  </article>
}
