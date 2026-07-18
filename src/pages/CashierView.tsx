import { useMemo, useState } from 'react'
import { Banknote, ChevronRight, CircleDollarSign, CreditCard, QrCode, ReceiptText, Search, WalletCards, X } from 'lucide-react'
import { currency, PageTitle, StatusBadge, time } from '../components'
import { orderTotal } from '../orderMachine'
import { useStore } from '../store'

export function CashierView({ notify }: { notify: (message: string) => void }) {
  const { orders, tables } = useStore()
  const [query, setQuery] = useState('')
  const [selectedTab, setSelectedTab] = useState<string | null>(null)
  const [paid, setPaid] = useState<string[]>([])

  const tabs = useMemo(() => tables.filter((table) => table.tabNumber).map((table) => {
    const tabOrders = orders.filter((order) => order.tabNumber === table.tabNumber && order.status !== 'cancelled')
    return { table, orders: tabOrders, total: tabOrders.reduce((sum, order) => sum + orderTotal(order), 0) }
  }).filter((tab) => `${tab.table.number} ${tab.table.tabNumber}`.includes(query)), [orders, query, tables])

  const selected = tabs.find((tab) => tab.table.tabNumber === selectedTab)
  const openRevenue = tabs.filter((tab) => !paid.includes(tab.table.tabNumber!)).reduce((sum, tab) => sum + tab.total, 0)

  return (
    <div className="cashier-page">
      <PageTitle eyebrow="FRENTE DE CAIXA" title="Comandas abertas" description="Acompanhe consumo, pagamentos e fechamento das mesas." action={<button className="primary-button"><ReceiptText size={18} /> Nova comanda</button>} />
      <div className="cashier-kpis">
        <article><span><WalletCards /></span><div><small>Comandas abertas</small><strong>{tabs.length - paid.length}</strong><p>Agora no salão</p></div></article>
        <article><span><CircleDollarSign /></span><div><small>Consumo em aberto</small><strong>{currency.format(openRevenue)}</strong><p>Sem pagamentos</p></div></article>
        <article><span><CreditCard /></span><div><small>Recebido hoje</small><strong>{currency.format(1284.5)}</strong><p>34 pagamentos</p></div></article>
        <article><span><ReceiptText /></span><div><small>Ticket médio</small><strong>{currency.format(78.4)}</strong><p>↑ 8% esta semana</p></div></article>
      </div>
      <div className="cashier-toolbar"><label className="compact-search"><Search /><input placeholder="Buscar por mesa ou comanda..." value={query} onChange={(event) => setQuery(event.target.value)} /></label><div className="order-filter-tabs"><button className="active">Abertas <b>{tabs.length - paid.length}</b></button><button>Aguardando pagamento</button><button>Finalizadas</button></div></div>
      <div className="tabs-table">
        <div className="tabs-head"><span>Mesa / comanda</span><span>Aberta às</span><span>Pedidos</span><span>Situação</span><span>Total</span><span /></div>
        {tabs.map((tab) => {
          const isPaid = paid.includes(tab.table.tabNumber!)
          const lastStatus = tab.orders[0]?.status ?? 'sent'
          return <button className="tab-row" key={tab.table.id} onClick={() => setSelectedTab(tab.table.tabNumber!)}><span><b>{tab.table.number}</b><span><strong>Comanda {tab.table.tabNumber}</strong><small>{tab.table.seats} lugares</small></span></span><span>{tab.orders.at(-1) ? time.format(new Date(tab.orders.at(-1)!.createdAt)) : '—'}</span><span>{tab.orders.length} pedidos</span><span>{isPaid ? <em className="paid-pill">Paga</em> : <StatusBadge status={lastStatus} />}</span><strong>{currency.format(tab.total)}</strong><ChevronRight /></button>
        })}
      </div>
      {selected && <div className="drawer-backdrop" onClick={() => setSelectedTab(null)}><aside className="cashier-drawer" onClick={(event) => event.stopPropagation()}>
        <div className="drawer-head"><div><small>MESA {selected.table.number}</small><h2>Comanda {selected.table.tabNumber}</h2></div><button onClick={() => setSelectedTab(null)}><X /></button></div>
        <div className="tab-timeline"><span>Aberta hoje</span><i /><span>{selected.orders.length} pedidos</span><i /><strong>{selected.orders.filter((order) => order.status === 'delivered').length} entregues</strong></div>
        <div className="receipt-list">{selected.orders.map((order) => <div key={order.id}><header><strong>Pedido #{order.displayId}</strong><span>{time.format(new Date(order.createdAt))}</span></header>{order.items.map((item) => <p key={item.id}><span>{item.quantity}× {item.name}</span><strong>{currency.format(item.quantity * item.unitPrice)}</strong></p>)}</div>)}</div>
        <div className="receipt-summary"><p><span>Subtotal</span><strong>{currency.format(selected.total)}</strong></p><p><span>Taxa de serviço (10%)</span><strong>{currency.format(selected.total * .1)}</strong></p><p className="grand-total"><span>Total</span><strong>{currency.format(selected.total * 1.1)}</strong></p></div>
        <div className="payment-methods"><button><QrCode /> PIX</button><button><CreditCard /> Cartão</button><button><Banknote /> Dinheiro</button></div>
        <button className="primary-button wide" disabled={paid.includes(selected.table.tabNumber!)} onClick={() => { setPaid((current) => [...current, selected.table.tabNumber!]); notify(`Comanda ${selected.table.tabNumber} paga e fechada`); setSelectedTab(null) }}>{paid.includes(selected.table.tabNumber!) ? 'Comanda já paga' : 'Confirmar pagamento'}</button>
      </aside></div>}
    </div>
  )
}
