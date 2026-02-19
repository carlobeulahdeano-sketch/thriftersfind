import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth-server'
import { UserPermissions } from '@/lib/types'

export default async function Home() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  if (user.permissions?.dashboard) {
    redirect('/dashboard')
  }

  const availablePaths = [
    { key: 'orders', path: '/orders' },
    { key: 'batches', path: '/batches' },
    { key: 'inventory', path: '/inventory' },
    { key: 'customers', path: '/customers' },
    { key: 'stations', path: '/stations' },
    { key: 'warehouses', path: '/warehouses' },
    { key: 'preOrders', path: '/pre-orders' },
    { key: 'reports', path: '/reports' },
    { key: 'sales', path: '/sales' },
    { key: 'users', path: '/users' },
    { key: 'settings', path: '/settings' },
  ];

  const firstAvailable = availablePaths.find(p => user.permissions?.[p.key as keyof UserPermissions]);

  if (firstAvailable) {
    redirect(firstAvailable.path)
  } else {
    redirect('/profile')
  }
}
