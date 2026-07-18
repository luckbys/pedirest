import { useMemo, useState } from 'react'
import { ArrowLeft, BellRing, Check, ChevronRight, CirclePlus, Minus, PackageCheck, Plus, Search, ShoppingBag, Sparkles, UsersRound, X } from 'lucide-react'
import { categories } from '../data'
import { currency, EmptyState, PageTitle, StatusBadge, time } from '../components'
import { orderTotal, waitMinutes } from '../orderMachine'
import { useStore } from '../store'
import type { CartItem, RestaurantTable } from '../types'

type WaiterScreen = 'home' | 'new-order' | 'orders'

export function WaiterView({ notify }: { notify: (message: string) => void }) {
  const { orders, tables, products, createOrder, setOrderStatus } = useStore()
  const [screen, setScreen] = useState<WaiterScreen>('home')
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null)
  const [tabNumber, setTabNumber] = useState('')
  const [category, setCategory] = useState('all')
  const [query, setQuery] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)

  const myOrders = orders.filter((order) => order.waiterName === 'Lucas' && order.status !== 'cancelled')
  const activeOrders = myOrders.filter((order) => !['delivered'].includes(order.status))
  const readyOrders = myOrders.filter((order) => order.status === 'ready')

  function beginOrder(table?: RestaurantTable) {
    const target = table ?? tables.find((item) => item.status === 'free') ?? tables[0]
    setSelectedTable(target)
    setTabNumber(target.tabNumber ?? `${1050 + target.number}`)
    setCart([])
    setScreen('new-order')
  }

  function addProduct(productId: string) {
    const product = products.find((item) => item.id === productId)
    if (!product?.available) return
    setCart((current) => {
      const found = current.find((item) => item.product.id === productId)
      return found
        ? current.map((item) => item.product.id === productId ? { ...item, quantity: item.quantity + 1 } : item)
        : [...current, { product, quantity: 1 }]
    })
  }

  function changeQuantity(productId: string, amount: number) {
    setCart((current) => current
      .map((item) => item.product.id === productId ? { ...item, quantity: item.quantity + amount } : item)
      .filter((item) => item.quantity > 0))
  }

  function sendOrder() {
    if (!selectedTable || !tabNumber || cart.length === 0) return
    const order = createOrder({ table: selectedTable, tabNumber, items: cart })
    notify(`Pedido #${order.displayId} enviado para a produção`)
    setCart([])
    setCartOpen(false)
    setScreen('orders')
  }

  if (screen === 'new-order') {
    const filtered = products.filter((product) =>
      (category === 'all' || product.categoryId === category)
      && product.name.toLowerCase().includes(query.toLowerCase()))
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)
    const cartTotal = cart.reduce((sum, item) => sum + item.quantity * item.product.price, 0)

    return (
      <div className="waiter-order-page">
        <div className="order-context">
          <button className="back-button" onClick={() => setScreen('home')}><ArrowLeft size={19} /> Voltar</button>
          <div className="context-pill"><small>MESA</small><strong>{selectedTable?.number}</strong></div>
          <div className="context-tab"><small>COMANDA</small><input aria-label="Número da comanda" value={tabNumber} onChange={(event) => setTabNumber(event.target.value)} /></div>
          <div className="context-person"><span>LU</span><div><small>GARÇOM</small><strong>Lucas</strong></div></div>
        </div>
        <PageTitle eyebrow="NOVO PEDIDO" title="O que vamos servir?" description="Toque nos produtos para adicionar ao pedido." />
        <label className="search-box"><Search size={20} /><input placeholder="Buscar bebida..." value={query} onChange={(event) => setQuery(event.target.value)} /><kbd>⌘ K</kbd></label>
        <div className="category-scroll">
          {categories.map((item) => <button key={item.id} className={category === item.id ? 'active' : ''} onClick={() => setCategory(item.id)}><span>{item.icon}</span>{item.name}</button>)}
        </div>
        <div className="product-heading"><h2>{categories.find((item) => item.id === category)?.name}</h2><span>{filtered.filter((item) => item.available).length} disponíveis</span></div>
        <div className="product-grid">
          {filtered.map((product) => {
            const quantity = cart.find((item) => item.product.id === product.id)?.quantity ?? 0
            return (
              <article key={product.id} className={`product-card ${!product.available ? 'disabled' : ''}`}>
                <div className={`product-art art-${product.categoryId}`}><span>{product.name.slice(0, 2).toUpperCase()}</span>{product.badge && <em>{product.badge}</em>}</div>
                <div className="product-info"><small>{product.sector} • {product.prepMinutes} min</small><h3>{product.name}</h3><p>{product.description}</p><strong>{currency.format(product.price)}</strong></div>
                {!product.available ? <span className="unavailable">Indisponível</span> : quantity === 0
                  ? <button className="add-product" onClick={() => addProduct(product.id)} aria-label={`Adicionar ${product.name}`}><Plus /></button>
                  : <div className="quantity-control"><button onClick={() => changeQuantity(product.id, -1)}><Minus /></button><strong>{quantity}</strong><button onClick={() => changeQuantity(product.id, 1)}><Plus /></button></div>}
              </article>
            )
          })}
        </div>
        {cartCount > 0 && <button className="floating-cart" onClick={() => setCartOpen(true)}><span><ShoppingBag size={20} /><b>{cartCount}</b></span><div><small>Ver pedido</small><strong>{currency.format(cartTotal)}</strong></div><ChevronRight /></button>}
        {cartOpen && <div className="drawer-backdrop" onClick={() => setCartOpen(false)}><aside className="cart-drawer" onClick={(event) => event.stopPropagation()}>
          <div className="drawer-head"><div><small>MESA {selectedTable?.number} • COMANDA {tabNumber}</small><h2>Revise o pedido</h2></div><button onClick={() => setCartOpen(false)}><X /></button></div>
          <div className="cart-items">{cart.map((item) => <div className="cart-row" key={item.product.id}><div><strong>{item.quantity}× {item.product.name}</strong><small>{item.product.description}</small></div><span>{currency.format(item.quantity * item.product.price)}</span><div className="quantity-control"><button onClick={() => changeQuantity(item.product.id, -1)}><Minus /></button><strong>{item.quantity}</strong><button onClick={() => changeQuantity(item.product.id, 1)}><Plus /></button></div></div>)}</div>
          <label className="order-note"><span>Observação do pedido</span><textarea placeholder="Ex.: servir junto, aniversário na mesa..." /></label>
          <div className="cart-total"><span>Total do pedido</span><strong>{currency.format(cartTotal)}</strong></div>
          <button className="primary-button wide" onClick={sendOrder}><Check size={20} /> Enviar para produção</button>
          <p className="safe-hint">O pedido será enviado uma única vez, mesmo com cliques repetidos.</p>
        </aside></div>}
      </div>
    )
  }

  if (screen === 'orders') {
    return (
      <div>
        <PageTitle eyebrow="MEUS PEDIDOS" title="Acompanhe o salão" description="Status atualizado automaticamente pela produção." action={<button className="primary-button" onClick={() => beginOrder()}><Plus size={18} /> Novo pedido</button>} />
        <div className="order-filter-tabs"><button className="active">Em andamento <b>{activeOrders.length}</b></button><button>Entregues</button><button>Todos</button></div>
        <div className="mobile-order-list">
          {activeOrders.length === 0 && <EmptyState icon={<PackageCheck />} title="Tudo entregue" text="Nenhum pedido aguardando no momento." />}
          {activeOrders.map((order) => <article className={`waiter-order-card ${order.status === 'ready' ? 'is-ready' : ''}`} key={order.id}>
            <div className="woc-top"><div className="table-circle">{order.tableNumber}</div><div><small>MESA {order.tableNumber} • #{order.displayId}</small><strong>Comanda {order.tabNumber}</strong></div><StatusBadge status={order.status} /></div>
            <div className="woc-items">{order.items.map((item) => <p key={item.id}><b>{item.quantity}×</b> {item.name}{item.notes && <small>{item.notes}</small>}</p>)}</div>
            <div className="woc-bottom"><span>{time.format(new Date(order.createdAt))} • {waitMinutes(order)} min</span><strong>{currency.format(orderTotal(order))}</strong></div>
            {order.status === 'ready' && <button className="ready-action" onClick={() => { setOrderStatus(order.id, 'picked_up', 'Lucas'); notify(`Pedido #${order.displayId} retirado`) }}><BellRing size={19} /> Confirmar retirada</button>}
            {order.status === 'picked_up' && <button className="delivery-action" onClick={() => { setOrderStatus(order.id, 'delivered', 'Lucas'); notify(`Pedido #${order.displayId} entregue na mesa`) }}><Check size={19} /> Confirmar entrega</button>}
          </article>)}
        </div>
        <MobileNav active="orders" onHome={() => setScreen('home')} onNew={() => beginOrder()} onOrders={() => setScreen('orders')} ready={readyOrders.length} />
      </div>
    )
  }

  return (
    <div className="waiter-home">
      <div className="welcome-row"><div><span className="eyebrow">SÁBADO, 18 DE JULHO</span><h1>Bom trabalho, Lucas <span>👋</span></h1><p>O salão está movimentado. Você tem <b>{activeOrders.length} pedidos</b> em andamento.</p></div><button className="primary-button desktop-new" onClick={() => beginOrder()}><Plus size={19} /> Novo pedido</button></div>
      {readyOrders.length > 0 && <section className="ready-banner"><div className="ready-pulse"><BellRing /></div><div><small>PEDIDO PRONTO PARA RETIRADA</small><h2>Mesa {readyOrders[0].tableNumber} • Comanda {readyOrders[0].tabNumber}</h2><p>{readyOrders[0].items.map((item) => `${item.quantity}× ${item.name}`).join(' · ')}</p></div><button onClick={() => setScreen('orders')}>Ver pedido <ChevronRight /></button></section>}
      <div className="metric-row">
        <article><span className="metric-icon orange"><ShoppingBag /></span><div><small>Em andamento</small><strong>{activeOrders.length}</strong><p>Seus pedidos ativos</p></div></article>
        <article><span className="metric-icon lime"><PackageCheck /></span><div><small>Prontos</small><strong>{readyOrders.length}</strong><p>Aguardando retirada</p></div></article>
        <article><span className="metric-icon cream"><Sparkles /></span><div><small>Entregues hoje</small><strong>{myOrders.filter((item) => item.status === 'delivered').length + 7}</strong><p>Bom ritmo!</p></div></article>
      </div>
      <div className="section-heading"><div><h2>Mesas do salão</h2><p>Selecione uma mesa para iniciar um pedido.</p></div><div className="legend"><span><i className="free" /> Livre</span><span><i className="busy" /> Ocupada</span><span><i className="ready" /> Pronto</span></div></div>
      <div className="table-grid">
        {tables.map((table) => <button key={table.id} className={`table-card table-${table.status}`} onClick={() => beginOrder(table)}>
          <span className="table-visual"><TableIcon /><strong>{table.number}</strong></span><span className="table-state">{table.status === 'free' ? 'Livre' : table.status === 'ready' ? 'Pedido pronto' : table.status === 'payment' ? 'Fechamento' : table.status === 'preparing' ? 'Em preparo' : 'Ocupada'}</span>
          <span className="table-meta"><UsersRound size={15} /> {table.seats} lugares</span>{table.tabNumber && <span className="tab-label">#{table.tabNumber}</span>}
          {table.status === 'free' && <CirclePlus className="table-plus" />}
        </button>)}
      </div>
      <MobileNav active="home" onHome={() => setScreen('home')} onNew={() => beginOrder()} onOrders={() => setScreen('orders')} ready={readyOrders.length} />
    </div>
  )
}

function TableIcon() {
  return <svg viewBox="0 0 160 92" aria-hidden="true" focusable="false">
    <path className="table-svg-stroke" d="M20 13 28 82" />
    <rect className="table-svg-solid" x="25" y="48" width="42" height="13" rx="6.5" />
    <path className="table-svg-stroke" d="M62 57v25" />
    <path className="table-svg-detail" d="M29 69h31" />
    <path className="table-svg-stroke" d="m140 13-8 69" />
    <rect className="table-svg-solid" x="93" y="48" width="42" height="13" rx="6.5" />
    <path className="table-svg-stroke" d="M98 57v25" />
    <path className="table-svg-detail" d="M100 69h31" />
    <rect className="table-svg-solid" x="55" y="28" width="50" height="12" rx="6" />
    <rect className="table-svg-solid" x="75" y="37" width="10" height="46" rx="3" />
  </svg>
}

function MobileNav({ active, onHome, onNew, onOrders, ready }: { active: string; onHome: () => void; onNew: () => void; onOrders: () => void; ready: number }) {
  return <nav className="mobile-bottom-nav"><button className={active === 'home' ? 'active' : ''} onClick={onHome}><span>⌂</span>Mesas</button><button className={active === 'orders' ? 'active' : ''} onClick={onOrders}><span>▣</span>Pedidos{ready > 0 && <b>{ready}</b>}</button><button className="mobile-fab" onClick={onNew}><Plus />Novo</button><button><span>✓</span>Prontos</button><button><span>◉</span>Perfil</button></nav>
}
