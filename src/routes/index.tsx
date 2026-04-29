import { createBrowserRouter, Navigate, Outlet } from 'react-router'
import { lazy, Suspense } from 'react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import RootLayout from '@/components/RootLayout'

const DashboardPage = lazy(() => import('@/features/dashboard/components/DashboardPage'))
const LoginPage = lazy(() => import('@/features/auth/components/LoginPage'))
const CustomersListPage = lazy(() => import('@/features/customers/components/CustomersListPage'))
const CustomerDetailPage = lazy(() => import('@/features/customers/components/CustomerDetailPage'))
const CustomerFormPage = lazy(() => import('@/features/customers/components/CustomerFormPage'))
const VehiclesListPage = lazy(() => import('@/features/vehicles/components/VehiclesListPage'))
const VehicleDetailPage = lazy(() => import('@/features/vehicles/components/VehicleDetailPage'))
const VehicleFormPage = lazy(() => import('@/features/vehicles/components/VehicleFormPage'))
const ServicesListPage = lazy(() => import('@/features/services/components/ServicesListPage'))
const ServiceDetailPage = lazy(() => import('@/features/services/components/ServiceDetailPage'))
const ServiceFormPage = lazy(() => import('@/features/services/components/ServiceFormPage'))
const RemindersPage = lazy(() => import('@/features/reminders/components/RemindersPage'))
const ReminderFormPage = lazy(() => import('@/features/reminders/components/ReminderFormPage'))
const ExpensesListPage = lazy(() => import('@/features/expenses/components/ExpensesListPage'))
const ExpenseFormPage = lazy(() => import('@/features/expenses/components/ExpenseFormPage'))
const SettingsPage = lazy(() => import('@/features/settings/components/SettingsPage'))
const PartsCatalogPage = lazy(() => import('@/features/parts-catalog/components/PartsCatalogPage'))
const InvoiceSettingsPage = lazy(() => import('@/features/settings/components/InvoiceSettingsPage'))
const BrandsModelsPage = lazy(() => import('@/features/settings/components/BrandsModelsPage'))
const PaymentsListPage = lazy(() => import('@/features/payments/components/PaymentsListPage'))
const PaymentFormPage = lazy(() => import('@/features/payments/components/PaymentFormPage'))
const ReportsPage = lazy(() => import('@/features/reports/components/ReportsPage'))
const InvoiceEditorPage = lazy(() => import('@/features/invoices/components/InvoiceEditorPage'))
const InvoicesListPage = lazy(() => import('@/features/invoices/components/InvoicesPage'))

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
        element: <SuspenseWrapper><CustomersListPage /></SuspenseWrapper>,
      },
      {
        path: 'customers/new',
        element: <SuspenseWrapper><CustomerFormPage /></SuspenseWrapper>,
      },
      {
        path: 'customers/:id',
        element: <SuspenseWrapper><CustomerDetailPage /></SuspenseWrapper>,
      },
      {
        path: 'customers/:id/edit',
        element: <SuspenseWrapper><CustomerFormPage /></SuspenseWrapper>,
      },
      {
        path: 'vehicles',
        element: <SuspenseWrapper><VehiclesListPage /></SuspenseWrapper>,
      },
      {
        path: 'vehicles/new',
        element: <SuspenseWrapper><VehicleFormPage /></SuspenseWrapper>,
      },
      {
        path: 'vehicles/:id',
        element: <SuspenseWrapper><VehicleDetailPage /></SuspenseWrapper>,
      },
      {
        path: 'vehicles/:id/edit',
        element: <SuspenseWrapper><VehicleFormPage /></SuspenseWrapper>,
      },
      {
        path: 'services',
        element: <SuspenseWrapper><ServicesListPage /></SuspenseWrapper>,
      },
      {
        path: 'services/new',
        element: <SuspenseWrapper><ServiceFormPage /></SuspenseWrapper>,
      },
      {
        path: 'services/:id',
        element: <SuspenseWrapper><ServiceDetailPage /></SuspenseWrapper>,
      },
      {
        path: 'services/:id/edit',
        element: <SuspenseWrapper><ServiceFormPage /></SuspenseWrapper>,
      },
      {
        path: 'services/:id/invoice',
        element: <SuspenseWrapper><InvoiceEditorPage /></SuspenseWrapper>,
      },
      {
        path: 'invoices',
        element: <SuspenseWrapper><InvoicesListPage /></SuspenseWrapper>,
      },
      {
        path: 'payments',
        element: <SuspenseWrapper><PaymentsListPage /></SuspenseWrapper>,
      },
      {
        path: 'payments/new',
        element: <SuspenseWrapper><PaymentFormPage /></SuspenseWrapper>,
      },
      {
        path: 'reminders',
        element: <SuspenseWrapper><RemindersPage /></SuspenseWrapper>,
      },
      {
        path: 'reminders/new',
        element: <SuspenseWrapper><ReminderFormPage /></SuspenseWrapper>,
      },
      {
        path: 'reminders/:id/edit',
        element: <SuspenseWrapper><ReminderFormPage /></SuspenseWrapper>,
      },
      {
        path: 'expenses',
        element: <SuspenseWrapper><ExpensesListPage /></SuspenseWrapper>,
      },
      {
        path: 'expenses/new',
        element: <SuspenseWrapper><ExpenseFormPage /></SuspenseWrapper>,
      },
      {
        path: 'expenses/:id/edit',
        element: <SuspenseWrapper><ExpenseFormPage /></SuspenseWrapper>,
      },
      {
        path: 'settings',
        element: <SuspenseWrapper><SettingsPage /></SuspenseWrapper>,
        children: [
          {
            path: 'parts',
            element: <SuspenseWrapper><PartsCatalogPage /></SuspenseWrapper>,
          },
          {
            path: 'brands',
            element: <SuspenseWrapper><BrandsModelsPage /></SuspenseWrapper>,
          },
          {
            path: 'invoices',
            element: <SuspenseWrapper><InvoiceSettingsPage /></SuspenseWrapper>,
          },
        ],
      },
      {
        path: 'reports',
        element: <SuspenseWrapper><ReportsPage /></SuspenseWrapper>,
      },
    ],
  },
])
