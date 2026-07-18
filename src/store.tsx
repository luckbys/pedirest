import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { initialOrders, initialTables, products as seededProducts } from './data'
import { transitionOrder } from './orderMachine'
import type { CartItem, Order, OrderStatus, Product, RestaurantTable } from './types'

interface CreateOrderInput {
  table: RestaurantTable
  tabNumber: string
  items: CartItem[]
  notes?: string
}

interface StoreValue {
  orders: Order[]
  tables: RestaurantTable[]
  products: Product[]
  createOrder: (input: CreateOrderInput) => Order
  setOrderStatus: (orderId: string, status: OrderStatus, changedBy: string) => void
  toggleProduct: (productId: string) => void
  resetDemo: () => void
}

const StoreContext = createContext<StoreValue | null>(null)
const STORAGE_KEY = 'pedirest-demo-v1'

function makeId() {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}

function getInitialState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved) as { orders: Order[]; tables: RestaurantTable[]; products: Product[] }
  } catch {
    // Demo data is a safe fallback when browser storage is unavailable.
  }
  return { orders: initialOrders, tables: initialTables, products: seededProducts }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const initial = useMemo(getInitialState, [])
  const [orders, setOrders] = useState<Order[]>(initial.orders)
  const [tables, setTables] = useState<RestaurantTable[]>(initial.tables)
  const [products, setProducts] = useState<Product[]>(initial.products)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ orders, tables, products }))
  }, [orders, tables, products])

  function createOrder({ table, tabNumber, items, notes }: CreateOrderInput) {
    const now = new Date().toISOString()
    const displayId = Math.max(100, ...orders.map((item) => item.displayId)) + 1
    const id = makeId()
    const order: Order = {
      id,
      displayId,
      idempotencyKey: makeId(),
      tableId: table.id,
      tableNumber: table.number,
      tabNumber,
      waiterName: 'Lucas',
      status: 'sent',
      priority: 'normal',
      notes,
      items: items.map(({ product, quantity, notes: itemNotes }) => ({
        id: makeId(),
        productId: product.id,
        name: product.name,
        quantity,
        unitPrice: product.price,
        notes: itemNotes,
        status: 'sent',
        sector: product.sector,
      })),
      createdAt: now,
      updatedAt: now,
      history: [{ status: 'sent', at: now, by: 'Lucas' }],
    }
    setOrders((current) => [order, ...current])
    setTables((current) => current.map((item) => item.id === table.id
      ? { ...item, tabNumber, status: 'preparing' }
      : item))
    return order
  }

  function setOrderStatus(orderId: string, status: OrderStatus, changedBy: string) {
    setOrders((current) => current.map((order) => {
      if (order.id !== orderId) return order
      try {
        return transitionOrder(order, status, changedBy)
      } catch {
        return order
      }
    }))

    const target = orders.find((order) => order.id === orderId)
    if (target && status === 'ready') {
      setTables((current) => current.map((table) => table.id === target.tableId ? { ...table, status: 'ready' } : table))
    }
    if (target && status === 'delivered') {
      setTables((current) => current.map((table) => table.id === target.tableId ? { ...table, status: 'occupied' } : table))
    }
  }

  function toggleProduct(productId: string) {
    setProducts((current) => current.map((product) => product.id === productId
      ? { ...product, available: !product.available }
      : product))
  }

  function resetDemo() {
    setOrders(initialOrders)
    setTables(initialTables)
    setProducts(seededProducts)
  }

  return (
    <StoreContext.Provider value={{ orders, tables, products, createOrder, setOrderStatus, toggleProduct, resetDemo }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const value = useContext(StoreContext)
  if (!value) throw new Error('useStore precisa estar dentro de StoreProvider')
  return value
}
