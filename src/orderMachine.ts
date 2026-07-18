import type { Order, OrderStatus } from './types'

const transitions: Record<OrderStatus, OrderStatus[]> = {
  sent: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['picked_up'],
  picked_up: ['delivered'],
  delivered: [],
  cancelled: [],
}

export function canTransition(from: OrderStatus, to: OrderStatus) {
  return transitions[from].includes(to)
}

export function transitionOrder(order: Order, status: OrderStatus, changedBy: string): Order {
  if (!canTransition(order.status, status)) {
    throw new Error(`Transição inválida: ${order.status} → ${status}`)
  }

  const now = new Date().toISOString()
  return {
    ...order,
    status,
    updatedAt: now,
    items: order.items.map((item) => item.status === 'cancelled' ? item : { ...item, status }),
    history: [...order.history, { status, at: now, by: changedBy }],
  }
}

export function orderTotal(order: Order) {
  return order.items
    .filter((item) => item.status !== 'cancelled')
    .reduce((total, item) => total + item.quantity * item.unitPrice, 0)
}

export function waitMinutes(order: Order, now = Date.now()) {
  return Math.max(0, Math.floor((now - new Date(order.createdAt).getTime()) / 60_000))
}
