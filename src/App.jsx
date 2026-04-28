// ============================================================
// 📁 App.jsx — v2
// ============================================================
// CAMBIO: agregada ruta /hub/:id para MarketHub
// ============================================================

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

import Home from './pages/Home'
import Product from './pages/Product'
import Store from './pages/Store'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import MarketHub from './pages/MarketHub'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Router>
      <Routes>

        {/* 🌍 PÚBLICO */}
        <Route path="/" element={<Home />} />
        <Route path="/producto/:id" element={<Product />} />
        <Route path="/tienda/:id" element={<Store />} />
        <Route path="/hub/:id" element={<MarketHub />} />

        {/* 🔐 AUTH */}
        <Route path="/login" element={<Login />} />

        {/* 🔥 PRIVADO */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

      </Routes>
    </Router>
  )
}

export default App
