import { describe, expect, it } from 'vitest'
import { initialOrders } from './data'
import { canTransition, orderTotal, transitionOrder } from './orderMachine'

describe('order state machine', () => {
  it('permite apenas a próxima etapa operacional', () => {
    expect(canTransition('sent', 'preparing')).toBe(true)
    expect(canTransition('sent', 'ready')).toBe(false)
    expect(canTransition('delivered', 'preparing')).toBe(false)
  })

  it('registra o histórico ao mudar o status', () => {
    const order = initialOrders.find((item) => item.status === 'sent')!
    const changed = transitionOrder(order, 'preparing', 'Produção')
    expect(changed.status).toBe('preparing')
    expect(changed.history.at(-1)?.by).toBe('Produção')
  })

  it('calcula o total da comanda', () => {
    expect(orderTotal(initialOrders[0])).toBe(49)
  })
})
