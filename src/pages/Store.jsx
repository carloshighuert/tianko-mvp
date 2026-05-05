import { useParams, Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const capitalize = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1) : ''

function Store() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [store, setStore] = useState(null)
  const [products, setProducts] = useState([])
  const [reviews, setReviews] = useState([])

  useEffect(() => {
    fetchData()
  }, [id])

  async function fetchData() {
    const [storeRes, productsRes, reviewsRes] = await Promise.all([
      supabase.from('stores').select('*').eq('id', id),
      supabase.from('products').select('*').eq('store_id', id),
      supabase.from('reviews').select('*').eq('store_id', id)
        .eq('used', true).not('rating', 'is', null)
    ])
    setStore(storeRes.data?.[0])
    setProducts(productsRes.data || [])
    setReviews(reviewsRes.data || [])
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
          style={{ height: 74, width: 'auto', display: 'block', margin: '0 auto 16px' }} />
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111', textAlign: 'center', margin: '0 0 8px' }}>
          {store?.name}
        </h1>

        {/* CALIFICACIÓN */}
        <p style={{ textAlign: 'center', fontSize: 15, color: '#555', marginBottom: 16 }}>
          {reviews.length > 0
            ? `⭐ ${(reviews.reduce((a, b) => a + b.rating, 0) / reviews.length).toFixed(1)} (${reviews.length} reseña${reviews.length !== 1 ? 's' : ''})`
            : 'Sin reseñas aún'}
        </p>

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

        {/* RESEÑAS */}
        {reviews.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 15, marginBottom: 12 }}>Reseñas de compradores</h3>
            {reviews.map(r => (
              <div key={r.id} style={{ background: '#f9f9f9', borderRadius: 10, padding: 12, marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600 }}>{r.buyer_name}</span>
                  <span>{'⭐'.repeat(r.rating)}</span>
                </div>
                {r.comment && (
                  <p style={{ color: '#555', fontSize: 13, margin: '4px 0 0' }}>{r.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}

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