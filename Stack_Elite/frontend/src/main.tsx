import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './components/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Tenants from './pages/Tenants'
import Inventory from './pages/Inventory'
import Leads from './pages/Leads'
import Scheduling from './pages/Scheduling'
import Settings from './pages/Settings'
import FunilAvancado from './pages/FunilAvancado'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rota pública */}
          <Route path="/login" element={<Login />} />

          {/* Rotas protegidas — redirecionam para /login se não autenticado */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard"  element={<Dashboard />} />
            <Route path="tenants"    element={<Tenants />} />
            <Route path="inventory"  element={<Inventory />} />
            <Route path="leads"      element={<Leads />} />
            <Route path="scheduling" element={<Scheduling />} />
            <Route path="funnel"     element={<FunilAvancado />} />
            <Route path="settings"   element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>,
)

