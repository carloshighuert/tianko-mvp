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
import OnboardingSpotlight from '../components/OnboardingSpotlight'

const capitalize = (str) => {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

function Home({ showSellerHint, onHintSeen }) {

  const [hubs, setHubs] = useState([])
  const [products, setProducts] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
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
      const [hubsRes, productsRes, storesRes, storeHubsRes] = await Promise.all([
        supabase
          .from('market_hubs')
          .select('*')
          .order('created_at', { ascending: false }),

        supabase
          .from('products')
          .select('*')
          .neq('status', 'vendido')
          .order('created_at', { ascending: false })
          .limit(20),

        supabase
          .from('stores')
          .select('id, name'),

        supabase
          .from('store_hubs')
          .select('hub_id')
      ])

      // Count distinct stores per hub
      const hubCounts = {}
      storeHubsRes.data?.forEach(sh => {
        hubCounts[sh.hub_id] = (hubCounts[sh.hub_id] || 0) + 1
      })

      const hubsWithCounts = (hubsRes.data || []).map(h => ({ ...h, storeCount: hubCounts[h.id] || 0 }))
      setHubs(hubsWithCounts)

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
  const safeQuery = searchQuery.replace(/[<>"']/g, '')
  const filteredProducts = products.filter(p =>
    p.title?.toLowerCase().includes(safeQuery.toLowerCase()) ||
    p.category?.toLowerCase().includes(safeQuery.toLowerCase())
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
            style={{ height: 74, width: 'auto' }}
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

        {/* ── ONBOARDING SPOTLIGHT ── */}
        {showSellerHint && (
          <OnboardingSpotlight onDismiss={onHintSeen} />
        )}

        {/* ── BUSCADOR ── */}
        <input
          className="search-input"
          placeholder="🔍 Busca productos o tianguis..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            if (window.gtag && e.target.value.length > 2) {
              window.gtag('event', 'search', { search_term: e.target.value })
            }
          }}
          style={{
            width: '100%',
            padding: 14,
            borderRadius: 12,
            border: '1.5px solid #ddd',
            fontSize: 15,
            marginBottom: 20,
            boxSizing: 'border-box',
            backgroundColor: '#ffffff',
            color: '#111111',
            WebkitTextFillColor: '#111111',
            caretColor: '#111111'
          }}
        />

        {loading ? (
          <p style={{ textAlign: 'center', color: '#999' }}>Cargando...</p>
        ) : (
          <>
            {/* ── SECCIÓN: TIANGUIS Y BAZARES ── oculta durante búsqueda */}
            {hubs.length > 0 && !searchQuery && (
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 16, marginBottom: 12, color: '#333' }}>
                  📍 Tianguis y bazares
                </h2>

                {/* Scroll horizontal de hubs */}
                <div className="hubs-scroll" style={{ display: 'flex', overflowX: 'auto', gap: 12, padding: '0 16px 8px 16px', scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch', margin: '0 -16px' }}>
                  {hubs.map(hub => (
                    <Link
                      key={hub.id}
                      to={`/hub/${hub.id}`}
                      style={{ textDecoration: 'none', flexShrink: 0 }}
                    >
                      <div style={{
                        minWidth: 'min(260px, 75vw)',
                        flexShrink: 0,
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
                        {hub.storeCount > 0 && (
                          <p style={{ margin: '4px 0 0', fontSize: 11, opacity: 0.8 }}>
                            🏪 {hub.storeCount} {hub.storeCount === 1 ? 'puesto' : 'puestos'}
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
              <p style={{ textAlign: 'center', color: '#999', padding: 32 }}>
                {searchQuery
                  ? `No encontramos productos para "${safeQuery}"`
                  : 'No hay productos disponibles.'}
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
                      <img
                        src={p.image_url}
                        alt={p.title}
                        style={{ width: '100%', height: 130, objectFit: 'cover', display: p.image_url ? 'block' : 'none' }}
                        onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
                      />
                      <div style={{
                        display: p.image_url ? 'none' : 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#f5f5f5',
                        height: 130,
                        flexDirection: 'column',
                        gap: 8
                      }}>
                        <span style={{ fontSize: 32 }}>🏷️</span>
                        <span style={{ fontSize: 12, color: '#999' }}>Sin foto</span>
                      </div>
                      <div style={{ padding: '8px 10px 10px' }}>
                        <p style={{
                          margin: 0,
                          color: '#111111',
                          fontWeight: 600,
                          fontSize: 14,
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                          textOverflow: 'ellipsis'
                        }}>
                          {capitalize(p.title)}
                        </p>
                        <p style={{ margin: '2px 0 0', color: '#111111', fontWeight: 700, fontSize: 16 }}>
                          ${p.price}
                        </p>
                        {p.store?.name && (
                          <p style={{ margin: '2px 0 0', color: '#444444', fontSize: 12 }}>
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
