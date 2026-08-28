import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/contexts/AuthContext'
import { PeriodProvider } from '@/contexts/PeriodContext'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import Landing from '@/pages/Landing'
import Login from '@/pages/auth/Login'
import Signup from '@/pages/auth/Signup'
import Onboarding from '@/pages/auth/Onboarding'
import Dashboard from '@/pages/Dashboard'
import Expenses from '@/pages/Expenses'
import Invoices from '@/pages/Invoices'
import Reports from '@/pages/Reports'
import Calculator from '@/pages/Calculator'
import Tax from '@/pages/Tax'
import Calendar from '@/pages/Calendar'
import Tools from '@/pages/Tools'
import Contacts from '@/pages/Contacts'
import Files from '@/pages/Files'
import Notes from '@/pages/Notes'
import Settings from '@/pages/Settings'
import Profile from '@/pages/Profile'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      retry: 1,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PeriodProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <Onboarding />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/expenses"
              element={
                <ProtectedRoute>
                  <Expenses />
                </ProtectedRoute>
              }
            />
            <Route
              path="/invoices"
              element={
                <ProtectedRoute>
                  <Invoices />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <Reports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/calculator"
              element={
                <ProtectedRoute>
                  <Calculator />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tax"
              element={
                <ProtectedRoute>
                  <Tax />
                </ProtectedRoute>
              }
            />
            <Route
              path="/calendar"
              element={
                <ProtectedRoute>
                  <Calendar />
                </ProtectedRoute>
              }
            />
            <Route path="/tools" element={<Navigate to="/tools/scheduler" replace />} />
            <Route
              path="/tools/:tab"
              element={
                <ProtectedRoute>
                  <Tools />
                </ProtectedRoute>
              }
            />
            <Route
              path="/contacts"
              element={
                <ProtectedRoute>
                  <Contacts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/files"
              element={
                <ProtectedRoute>
                  <Files />
                </ProtectedRoute>
              }
            />
            <Route path="/receipts" element={<Navigate to="/files" replace />} />
            <Route
              path="/notes"
              element={
                <ProtectedRoute>
                  <Notes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Landing />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
        </PeriodProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
