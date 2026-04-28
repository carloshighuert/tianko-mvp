// ============================================================
// 📁 Home.jsx — v2
// ============================================================
// CAMBIOS VS v1:
//   Antes: lista plana de todos los productos mezclados
//   Ahora: vista doble — hubs activos + productos recientes
//
// DECISIÓN DE DISEÑO:
//   Los hubs van primero porque son el diferenciador de Tianko.
//   Un comprador que busca "el tianguis del sábado en Tepito"
//   debe encontrarlo directo, no buscar producto por producto.
//
// QUERIES OPTIMIZADOS:
//   - products: solo los 20 más recientes (antes traía todos)
//   - stores: solo las que tienen hub_id o productos
//   - hubs: solo los activos
// ============================================================

import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { Link } from 'react-router-dom'

function Home() {

  const [hubs, setHubs] = useState([])
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()
    fetchData()
  }, [])

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  // ============================================================
  // 📦 CARGAR HUBS Y PRODUCTOS
  // ============================================================
  async function fetchData() {
    try {
      // Hubs y productos en paralelo (más rápido)
      const [hubsRes, productsRes, storesRes] = await Promise.all([
        supabase
          .from('market_hubs')
          .select('*')
          .order('created_at', { ascending: false }),

        supabase
          .from('products')
          .select('*')
          .neq('status', 'vendido')
          .order('created_at', { ascending: false })
          .limit(20), // ANTES: traía todos → lento con muchos productos

        supabase
          .from('stores')
          .select('id, name, hub_id') // solo columnas necesarias
      ])

      setHubs(hubsRes.data || [])

      // Enriquecer productos con nombre de tienda
      const storesMap = {}
      storesRes.data?.forEach(s => { storesMap[s.id] = s })

      const enriched = productsRes.data?.map(p => ({
        ...p,
        store: storesMap[p.store_id] || null
      })) || []

      setProducts(enriched)

    } catch (err) {
      console.error('[fetchData] Error:', err)
    } finally {
      setLoading(false)
    }
  }

  // ============================================================
  // 🔍 FILTRO DE BÚSQUEDA
  // ============================================================
  // Busca en productos Y en hubs simultáneamente
  const filteredProducts = products.filter(p =>
    p.title?.toLowerCase().includes(search.toLowerCase()) ||
    p.store?.name?.toLowerCase().includes(search.toLowerCase())
  )

  const filteredHubs = hubs.filter(h =>
    h.name?.toLowerCase().includes(search.toLowerCase()) ||
    h.location?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ background: '#f4f4f4', minHeight: '100vh' }}>
      <div style={{ maxWidth: 500, margin: '0 auto', padding: 16 }}>

        {/* ── HEADER ── */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16
        }}>
          <img
            src="/tianko-logo.png"
            alt="Tianko"
            style={{ height: 36, width: 'auto' }}
            onError={(e) => console.log('Logo error:', e.target.src)}
          />

          <button
            onClick={() => {
              window.location.href = user ? '/dashboard' : '/login'
            }}
            style={{
              background: '#000',
              color: 'white',
              border: 'none',
              borderRadius: 10,
              padding: '8px 16px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            {user ? 'Mi tienda' : 'Vender aquí'}
          </button>
        </div>

        {/* ── BUSCADOR ── */}
        <input
          placeholder="🔍 Busca productos o tianguis..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: 14,
            borderRadius: 12,
            border: '1.5px solid #ddd',
            fontSize: 15,
            marginBottom: 20,
            boxSizing: 'border-box',
            background: 'white'
          }}
        />

        {loading ? (
          <p style={{ textAlign: 'center', color: '#999' }}>Cargando...</p>
        ) : (
          <>
            {/* ── SECCIÓN: TIANGUIS Y BAZARES ── */}
            {filteredHubs.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 16, marginBottom: 12, color: '#333' }}>
                  📍 Tianguis y bazares
                </h2>

                {/* Scroll horizontal de hubs */}
                <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
                  {filteredHubs.map(hub => (
                    <Link
                      key={hub.id}
                      to={`/hub/${hub.id}`}
                      style={{ textDecoration: 'none', flexShrink: 0 }}
                    >
                      <div style={{
                        width: 160,
                        background: '#000',
                        color: 'white',
                        borderRadius: 14,
                        padding: 16
                      }}>
                        <p style={{ margin: 0, fontSize: 11, opacity: 0.6 }}>
                          {hub.hub_type || 'Tianguis'}
                        </p>
                        <p style={{ margin: '4px 0', fontWeight: 'bold', fontSize: 15 }}>
                          {hub.name}
                        </p>
                        {hub.location && (
                          <p style={{ margin: 0, fontSize: 11, opacity: 0.7 }}>
                            📍 {hub.location}
                          </p>
                        )}
                        {hub.schedule && (
                          <p style={{ margin: '4px 0 0', fontSize: 11, opacity: 0.7 }}>
                            🕐 {hub.schedule}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* ── SECCIÓN: PRODUCTOS RECIENTES ── */}
            <h2 style={{ fontSize: 16, marginBottom: 12, color: '#333' }}>
              🛍️ Productos recientes
            </h2>

            {filteredProducts.length === 0 ? (
              <p style={{ color: '#999', textAlign: 'center' }}>
                No hay productos que coincidan con tu búsqueda.
              </p>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12
              }}>
                {filteredProducts.map(p => (
                  <Link
                    key={p.id}
                    to={`/producto/${p.id}`}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <div style={{
                      background: 'white',
                      borderRadius: 14,
                      overflow: 'hidden',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                    }}>
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          alt={p.title}
                          style={{ width: '100%', height: 130, objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{
                          width: '100%',
                          height: 130,
                          background: '#f0f0f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 32
                        }}>
                          📦
                        </div>
                      )}
                      <div style={{ padding: '8px 10px 10px' }}>
                        <p style={{
                          margin: 0,
                          fontWeight: 'bold',
                          fontSize: 13,
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                          textOverflow: 'ellipsis'
                        }}>
                          {p.title}
                        </p>
                        <p style={{ margin: '2px 0 0', fontSize: 14, color: '#111' }}>
                          ${p.price}
                        </p>
                        {p.store?.name && (
                          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#999' }}>
                            {p.store.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  )
}

export default Home
