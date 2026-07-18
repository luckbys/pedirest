import { useEffect, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { Shell } from './components'
import { AdminView } from './pages/AdminView'
import { CashierView } from './pages/CashierView'
import { ProductionView } from './pages/ProductionView'
import { WaiterView } from './pages/WaiterView'
import { StoreProvider, useStore } from './store'
import type { Role } from './types'

function Workspace() {
  const [role, setRole] = useState<Role>('waiter')
  const [toast, setToast] = useState('')
  const { resetDemo } = useStore()

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 3200)
    return () => window.clearTimeout(timer)
  }, [toast])

  const notify = (message: string) => setToast(message)

  return (
    <Shell role={role} onRoleChange={setRole} onReset={() => { resetDemo(); notify('Dados de demonstração restaurados') }}>
      {role === 'waiter' && <WaiterView notify={notify} />}
      {role === 'production' && <ProductionView notify={notify} />}
      {role === 'cashier' && <CashierView notify={notify} />}
      {role === 'admin' && <AdminView notify={notify} />}
      {toast && <div className="toast"><CheckCircle2 size={19} /><span>{toast}</span></div>}
    </Shell>
  )
}

export default function App() {
  return <StoreProvider><Workspace /></StoreProvider>
}
