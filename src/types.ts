export type Role = 'waiter' | 'production' | 'cashier' | 'admin'
export type OrderStatus = 'sent' | 'preparing' | 'ready' | 'picked_up' | 'delivered' | 'cancelled'
export type TableStatus = 'free' | 'occupied' | 'preparing' | 'ready' | 'payment'

export interface Category {
  id: string
  name: string
  icon: string
}

export interface Product {
  id: string
  name: string
  description: string
  price: number
  categoryId: string
  sector: string
  prepMinutes: number
  available: boolean
  badge?: string
}

export interface RestaurantTable {
  id: string
  number: number
  tabNumber?: string
  status: TableStatus
  seats: number
}

export interface OrderItem {
  id: string
  productId: string
  name: string
  quantity: number
  unitPrice: number
  notes?: string
  status: OrderStatus
  sector: string
}

export interface StatusEvent {
  status: OrderStatus
  at: string
  by: string
}

export interface Order {
  id: string
  displayId: number
  idempotencyKey: string
  tableId: string
  tableNumber: number
  tabNumber: string
  waiterName: string
  status: OrderStatus
  priority: 'normal' | 'priority'
  notes?: string
  items: OrderItem[]
  createdAt: string
  updatedAt: string
  history: StatusEvent[]
}

export interface CartItem {
  product: Product
  quantity: number
  notes?: string
}
