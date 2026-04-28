import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    setLoading(false)
  }

  if (loading) return <p>Validando...</p>

  if (!user) {
    window.location.href = '/login'
    return null
  }

  return children
}

export default ProtectedRoute