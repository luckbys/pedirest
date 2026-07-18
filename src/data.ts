import type { Category, Order, Product, RestaurantTable } from './types'

export const categories: Category[] = [
  { id: 'all', name: 'Todos', icon: '✦' },
  { id: 'beer', name: 'Cervejas', icon: '◐' },
  { id: 'soft', name: 'Refrigerantes', icon: '◉' },
  { id: 'juice', name: 'Sucos', icon: '◇' },
  { id: 'drink', name: 'Drinks', icon: '✺' },
  { id: 'water', name: 'Águas', icon: '◌' },
]

export const products: Product[] = [
  { id: 'p1', name: 'Heineken', description: 'Long neck • 330 ml', price: 12, categoryId: 'beer', sector: 'Bar', prepMinutes: 2, available: true, badge: 'Mais pedido' },
  { id: 'p2', name: 'Original', description: 'Garrafa • 600 ml', price: 16, categoryId: 'beer', sector: 'Bar', prepMinutes: 2, available: true },
  { id: 'p3', name: 'Coca-Cola', description: 'Lata • 350 ml', price: 7, categoryId: 'soft', sector: 'Bar', prepMinutes: 1, available: true },
  { id: 'p4', name: 'Guaraná', description: 'Lata • 350 ml', price: 7, categoryId: 'soft', sector: 'Bar', prepMinutes: 1, available: true },
  { id: 'p5', name: 'Suco de laranja', description: 'Natural • 400 ml', price: 11, categoryId: 'juice', sector: 'Cozinha', prepMinutes: 5, available: true },
  { id: 'p6', name: 'Limão & hortelã', description: 'Natural • 400 ml', price: 12, categoryId: 'juice', sector: 'Cozinha', prepMinutes: 5, available: true },
  { id: 'p7', name: 'Caipirinha', description: 'Limão • Cachaça', price: 22, categoryId: 'drink', sector: 'Drinks', prepMinutes: 7, available: true, badge: 'Favorito' },
  { id: 'p8', name: 'Gin tônica', description: 'Gin • Tônica • Limão', price: 26, categoryId: 'drink', sector: 'Drinks', prepMinutes: 8, available: true },
  { id: 'p9', name: 'Água mineral', description: 'Sem gás • 500 ml', price: 5, categoryId: 'water', sector: 'Bar', prepMinutes: 1, available: true },
  { id: 'p10', name: 'Água com gás', description: 'Garrafa • 500 ml', price: 6, categoryId: 'water', sector: 'Bar', prepMinutes: 1, available: false },
]

export const initialTables: RestaurantTable[] = [
  { id: 't1', number: 1, tabNumber: '1042', status: 'occupied', seats: 4 },
  { id: 't2', number: 2, tabNumber: '1043', status: 'preparing', seats: 4 },
  { id: 't3', number: 3, status: 'free', seats: 2 },
  { id: 't4', number: 4, tabNumber: '1044', status: 'ready', seats: 6 },
  { id: 't5', number: 5, status: 'free', seats: 4 },
  { id: 't6', number: 6, tabNumber: '1045', status: 'payment', seats: 8 },
  { id: 't7', number: 7, status: 'free', seats: 2 },
  { id: 't8', number: 8, tabNumber: '1046', status: 'occupied', seats: 4 },
]

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString()

export const initialOrders: Order[] = [
  {
    id: 'ord-104', displayId: 104, idempotencyKey: 'demo-104', tableId: 't4', tableNumber: 4, tabNumber: '1044', waiterName: 'Lucas', status: 'ready', priority: 'normal',
    items: [
      { id: 'i104-1', productId: 'p7', name: 'Caipirinha', quantity: 2, unitPrice: 22, status: 'ready', sector: 'Drinks', notes: 'Uma sem açúcar' },
      { id: 'i104-2', productId: 'p9', name: 'Água mineral', quantity: 1, unitPrice: 5, status: 'ready', sector: 'Bar' },
    ],
    createdAt: minutesAgo(14), updatedAt: minutesAgo(1),
    history: [{ status: 'sent', at: minutesAgo(14), by: 'Lucas' }, { status: 'preparing', at: minutesAgo(11), by: 'Marina' }, { status: 'ready', at: minutesAgo(1), by: 'Marina' }],
  },
  {
    id: 'ord-103', displayId: 103, idempotencyKey: 'demo-103', tableId: 't2', tableNumber: 2, tabNumber: '1043', waiterName: 'Lucas', status: 'preparing', priority: 'priority',
    items: [
      { id: 'i103-1', productId: 'p1', name: 'Heineken', quantity: 3, unitPrice: 12, status: 'preparing', sector: 'Bar' },
      { id: 'i103-2', productId: 'p8', name: 'Gin tônica', quantity: 1, unitPrice: 26, status: 'preparing', sector: 'Drinks', notes: 'Pouco gelo' },
    ],
    createdAt: minutesAgo(18), updatedAt: minutesAgo(9),
    history: [{ status: 'sent', at: minutesAgo(18), by: 'Lucas' }, { status: 'preparing', at: minutesAgo(9), by: 'Marina' }],
  },
  {
    id: 'ord-102', displayId: 102, idempotencyKey: 'demo-102', tableId: 't1', tableNumber: 1, tabNumber: '1042', waiterName: 'Camila', status: 'sent', priority: 'normal',
    items: [
      { id: 'i102-1', productId: 'p3', name: 'Coca-Cola', quantity: 2, unitPrice: 7, status: 'sent', sector: 'Bar', notes: 'Uma sem gelo' },
      { id: 'i102-2', productId: 'p5', name: 'Suco de laranja', quantity: 1, unitPrice: 11, status: 'sent', sector: 'Cozinha' },
    ],
    createdAt: minutesAgo(6), updatedAt: minutesAgo(6),
    history: [{ status: 'sent', at: minutesAgo(6), by: 'Camila' }],
  },
  {
    id: 'ord-101', displayId: 101, idempotencyKey: 'demo-101', tableId: 't8', tableNumber: 8, tabNumber: '1046', waiterName: 'Rafael', status: 'delivered', priority: 'normal',
    items: [{ id: 'i101-1', productId: 'p2', name: 'Original', quantity: 2, unitPrice: 16, status: 'delivered', sector: 'Bar' }],
    createdAt: minutesAgo(42), updatedAt: minutesAgo(30),
    history: [{ status: 'sent', at: minutesAgo(42), by: 'Rafael' }, { status: 'delivered', at: minutesAgo(30), by: 'Rafael' }],
  },
]
