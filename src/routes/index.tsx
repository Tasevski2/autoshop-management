import { createBrowserRouter, Navigate, Outlet } from 'react-router'
import { lazy, Suspense } from 'react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import RootLayout from '@/components/RootLayout'

const DashboardPage = lazy(() => import('@/features/dashboard/components/DashboardPage'))
const LoginPage = lazy(() => import('@/features/auth/components/LoginPage'))

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>
}

function AuthGate() {
  const { user, loading } = useAuth()

  if (loading) return null

  if (!user) {
    return (
      <SuspenseWrapper>
        <LoginPage />
      </SuspenseWrapper>
    )
  }

  return <RootLayout />
}

function GuestOnly() {
  const { user, loading } = useAuth()

  if (loading) return null
  if (user) return <Navigate to="/" replace />

  return <Outlet />
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <GuestOnly />,
    children: [
      {
        index: true,
        element: (
          <SuspenseWrapper>
            <LoginPage />
          </SuspenseWrapper>
        ),
      },
    ],
  },
  {
    path: '/',
    element: <AuthGate />,
    children: [
      {
        index: true,
        element: (
          <SuspenseWrapper>
            <DashboardPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'customers',
        element: <SuspenseWrapper><div className="text-2xl font-bold">Customers</div></SuspenseWrapper>,
      },
      {
        path: 'customers/:id',
        element: <SuspenseWrapper><div>Customer Detail</div></SuspenseWrapper>,
      },
      {
        path: 'vehicles',
        element: <SuspenseWrapper><div className="text-2xl font-bold">Vehicles</div></SuspenseWrapper>,
      },
      {
        path: 'vehicles/:id',
        element: <SuspenseWrapper><div>Vehicle Detail</div></SuspenseWrapper>,
      },
      {
        path: 'services',
        element: <SuspenseWrapper><div className="text-2xl font-bold">Services</div></SuspenseWrapper>,
      },
      {
        path: 'invoices',
        element: <SuspenseWrapper><div className="text-2xl font-bold">Invoices</div></SuspenseWrapper>,
      },
      {
        path: 'reminders',
        element: <SuspenseWrapper><div className="text-2xl font-bold">Reminders</div></SuspenseWrapper>,
      },
      {
        path: 'expenses',
        element: <SuspenseWrapper><div className="text-2xl font-bold">Expenses</div></SuspenseWrapper>,
      },
      {
        path: 'parts',
        element: <SuspenseWrapper><div className="text-2xl font-bold">Parts Catalog</div></SuspenseWrapper>,
      },
      {
        path: 'reports',
        element: <SuspenseWrapper><div className="text-2xl font-bold">Reports</div></SuspenseWrapper>,
      },
    ],
  },
])
