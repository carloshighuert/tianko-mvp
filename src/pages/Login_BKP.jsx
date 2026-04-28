import { useState } from 'react'
import { supabase } from '../supabaseClient'

function Login() {
  // 🔥 Estados del formulario
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  // 🔐 LOGIN
  async function handleLogin() {
    setLoading(true)

    // 🔥 Supabase Auth
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      alert(error.message)
      setLoading(false)
      return
    }

    // 👉 Redirige al dashboard
    window.location.href = '/dashboard'
  }

  return (
    <div style={{ padding: 20, maxWidth: 400, margin: '0 auto' }}>
      <h2>Login Vendedor</h2>

      {/* 📧 EMAIL */}
      <input
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
        style={{ width: '100%', marginBottom: 10, padding: 10 }}
      />

      {/* 🔑 PASSWORD */}
      <input
        type="password"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
        style={{ width: '100%', marginBottom: 10, padding: 10 }}
      />

      {/* 🔥 BOTÓN */}
      <button
        onClick={handleLogin}
        style={{
          width: '100%',
          padding: 12,
          background: 'black',
          color: 'white'
        }}
      >
        {loading ? 'Entrando...' : 'Iniciar sesión'}
      </button>
    </div>
  )
}

export default Login