import { useMemo, useState } from 'react'
import { BarChart3, Boxes, Clock3, Package, Plus, Search, Settings2, TrendingUp, UserRoundCheck, UsersRound } from 'lucide-react'
import { currency, PageTitle } from '../components'
import { orderTotal, waitMinutes } from '../orderMachine'
import { useStore } from '../store'

export function AdminView({ notify }: { notify: (message: string) => void }) {
  const { orders, products, toggleProduct } = useStore()
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<'overview' | 'products'>('overview')
  const sales = orders.filter((order) => order.status !== 'cancelled').reduce((sum, order) => sum + orderTotal(order), 0)
  const average = Math.round(orders.filter((order) => order.status !== 'cancelled').reduce((sum, order) => sum + waitMinutes(order), 0) / Math.max(orders.length, 1))
  const productRanking = useMemo(() => {
    const ranking = new Map<string, number>()
    orders.forEach((order) => order.items.forEach((item) => ranking.set(item.name, (ranking.get(item.name) ?? 0) + item.quantity)))
    return [...ranking.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [orders])

  return (
    <div className="admin-page">
      <PageTitle eyebrow="GESTÃO" title="Visão geral do restaurante" description="Indicadores operacionais do turno atual." action={<button className="secondary-button"><Settings2 size={18} /> Configurações</button>} />
      <div className="admin-tabs"><button className={tab === 'overview' ? 'active' : ''} onClick={() => setTab('overview')}>Visão geral</button><button className={tab === 'products' ? 'active' : ''} onClick={() => setTab('products')}>Cardápio e disponibilidade</button><button>Equipe</button><button>Mesas</button></div>
      {tab === 'overview' ? <>
        <div className="admin-kpis">
          <article><span className="kpi-icon"><TrendingUp /></span><p><small>Vendas do turno</small><strong>{currency.format(sales)}</strong><em>↑ 12,4% vs. sábado passado</em></p></article>
          <article><span className="kpi-icon"><Boxes /></span><p><small>Pedidos realizados</small><strong>{orders.length + 31}</strong><em>{orders.filter((order) => !['delivered', 'cancelled'].includes(order.status)).length} em andamento</em></p></article>
          <article><span className="kpi-icon"><Clock3 /></span><p><small>Tempo médio de preparo</small><strong>{String(average).padStart(2, '0')} min</strong><em>↓ 2 min no turno</em></p></article>
          <article><span className="kpi-icon"><UserRoundCheck /></span><p><small>Equipe ativa</small><strong>8 pessoas</strong><em>3 garçons • 4 produção</em></p></article>
        </div>
        <div className="dashboard-grid">
          <section className="dashboard-panel sales-chart"><header><div><h2>Movimento do turno</h2><p>Pedidos por horário</p></div><select><option>Hoje</option><option>7 dias</option></select></header><div className="chart-area"><div className="chart-y"><span>12</span><span>9</span><span>6</span><span>3</span><span>0</span></div><div className="bars">{[3, 5, 4, 8, 6, 10, 8, 5].map((value, index) => <div key={index}><span style={{ height: `${value * 8}%` }} /><small>{10 + index}h</small></div>)}</div></div></section>
          <section className="dashboard-panel ranking"><header><div><h2>Mais pedidos</h2><p>Produtos do turno</p></div><BarChart3 /></header><ol>{productRanking.map(([name, quantity], index) => <li key={name}><b>{index + 1}</b><span><strong>{name}</strong><small>{quantity} unidades</small></span><em>{Math.round((quantity / Math.max(...productRanking.map((item) => item[1]))) * 100)}%</em></li>)}</ol></section>
          <section className="dashboard-panel team"><header><div><h2>Desempenho da equipe</h2><p>Pedidos entregues por garçom</p></div><UsersRound /></header><div className="team-list"><p><span className="avatar">LU</span><span><strong>Lucas</strong><small>11 pedidos • 9 min médio</small></span><em>4,9 ★</em></p><p><span className="avatar coral">CA</span><span><strong>Camila</strong><small>9 pedidos • 10 min médio</small></span><em>4,8 ★</em></p><p><span className="avatar blue">RA</span><span><strong>Rafael</strong><small>8 pedidos • 11 min médio</small></span><em>4,7 ★</em></p></div></section>
          <section className="dashboard-panel operation"><header><div><h2>Saúde da operação</h2><p>Alertas do turno</p></div></header><div className="health-score"><strong>94</strong><span>/100<em>Excelente</em></span></div><p><i className="ok" /> Realtime conectado</p><p><i className="ok" /> Nenhum pedido duplicado</p><p><i className="warning" /> 1 produto indisponível</p></section>
        </div>
      </> : <>
        <div className="catalog-toolbar"><label className="compact-search"><Search /><input placeholder="Buscar produto..." value={query} onChange={(event) => setQuery(event.target.value)} /></label><select><option>Todas as categorias</option></select><button className="primary-button" onClick={() => notify('Cadastro de produto será conectado ao Supabase')}><Plus /> Novo produto</button></div>
        <div className="catalog-table"><div className="catalog-head"><span>Produto</span><span>Categoria</span><span>Setor</span><span>Preço</span><span>Tempo</span><span>Disponibilidade</span></div>{products.filter((product) => product.name.toLowerCase().includes(query.toLowerCase())).map((product) => <div className="catalog-row" key={product.id}><span><i className={`catalog-icon art-${product.categoryId}`}><Package /></i><span><strong>{product.name}</strong><small>{product.description}</small></span></span><span>{product.categoryId}</span><span>{product.sector}</span><strong>{currency.format(product.price)}</strong><span>{product.prepMinutes} min</span><label className="switch"><input type="checkbox" checked={product.available} onChange={() => { toggleProduct(product.id); notify(`${product.name} ${product.available ? 'indisponível' : 'disponível'} para novos pedidos`) }} /><span /></label></div>)}</div>
      </>}
    </div>
  )
}
