import { useParams, Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const capitalize = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1) : ''

function Store() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [store, setStore] = useState(null)
  const [products, setProducts] = useState([])

  useEffect(() => {
    fetchData()
  }, [id])

  async function fetchData() {
    const { data: storeData } = await supabase
      .from('stores')
      .select('*')
      .eq('id', id)

    const { data: productsData } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', id)

    setStore(storeData?.[0])
    setProducts(productsData || [])
  }

  function handleWhatsApp() {
    const url = `https://wa.me/${store.whatsapp_number}?text=Hola vi tu tienda en Tianko`
    window.open(url, '_blank')
  }

  if (!store) return <p>Cargando...</p>

  return (
    <div style={{ background: '#f4f4f4', minHeight: '100vh', padding: 16 }}>
      <div style={{ maxWidth: 420, margin: '0 auto' }}>

        <img src="/tianko-logo.png" alt="Tianko"
          style={{ height: 64, width: 'auto', display: 'block', margin: '0 auto 16px' }} />
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111', textAlign: 'center', margin: '0 0 16px' }}>
          {store?.name}
        </h1>

        <button
          onClick={handleWhatsApp}
          style={{
            background: '#25D366',
            color: 'white',
            padding: 12,
            width: '100%',
            borderRadius: 10,
            border: 'none',
            marginBottom: 20
          }}
        >
          Contactar vendedor
        </button>

        {products.map((p) => (
          <div key={p.id} style={{
            background: 'white',
            borderRadius: 12,
            padding: 12,
            marginBottom: 16
          }}>
            <img src={p.image_url} width="100%" />

            <h4>{capitalize(p.title)}</h4>
            <p>${p.price}</p>

            <Link to={`/producto/${p.id}`}>
              Ver producto →
            </Link>
          </div>
        ))}

        <button onClick={() => navigate('/')} style={{
          background: 'none',
          border: '1px solid #ddd',
          borderRadius: 8,
          padding: '10px 16px',
          fontSize: 14,
          cursor: 'pointer',
          marginTop: 8,
          width: '100%'
        }}>
          🛍️ Explorar todos los productos
        </button>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 12 }}>
          ¿Eres vendedor?{' '}
          <a href="/dashboard" style={{ color: '#888', textDecoration: 'underline' }}>
            Ir a mi dashboard
          </a>
        </p>

      </div>
    </div>
  )
}

export default Store