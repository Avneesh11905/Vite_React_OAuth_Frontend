import { createFileRoute, Outlet, Navigate, useLocation } from '@tanstack/react-router'
import { useAuth } from '../context/AuthContext'
import { Navbar } from '../components/navbar'

export const Route = createFileRoute('/_protected')({
  component: ProtectedLayout,
})

function ProtectedLayout() {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  // Wait for session check to finish before redirecting
  if (!isLoading && !isAuthenticated) {
    return <Navigate to="/login" search={{ redirectUrl: location.href }} />
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <div className="border-b bg-white shadow-xs">
        <Navbar />
      </div>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  )
}
