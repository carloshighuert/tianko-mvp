// ============================================================
// 📁 App.jsx — v2
// ============================================================
// CAMBIO: agregada ruta /hub/:id para MarketHub
// ============================================================

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useState } from 'react'

import Home from './pages/Home'
import Product from './pages/Product'
import Store from './pages/Store'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import MarketHub from './pages/MarketHub'
import Review from './pages/Review'
import Admin from './pages/Admin'
import Pitch from './pages/Pitch'
import ProtectedRoute from './components/ProtectedRoute'
import Disclaimer from './components/Disclaimer'

function App() {
  const [showSellerHint, setShowSellerHint] = useState(false)

  return (
    <Router>
      <Disclaimer onAccept={() => setShowSellerHint(true)} />
      <Routes>

        {/* 🌍 PÚBLICO */}
        <Route path="/" element={<Home showSellerHint={showSellerHint} onHintSeen={() => setShowSellerHint(false)} />} />
        <Route path="/producto/:id" element={<Product />} />
        <Route path="/tienda/:id" element={<Store />} />
        <Route path="/hub/:id" element={<MarketHub />} />
        <Route path="/resena/:token" element={<Review />} />
        <Route path="/pitch" element={<Pitch />} />

        {/* 🔐 AUTH */}
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<Admin />} />

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
