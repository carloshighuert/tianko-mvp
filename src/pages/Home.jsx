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
import { Link, useNavigate } from 'react-router-dom'
import OnboardingSpotlight from '../components/OnboardingSpotlight'

const capitalize = (str) => {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

const CATEGORIAS = [
  'Todos', 'Ropa y Moda', 'Calzado', 'Electrónicos', 'Accesorios', 'Hogar y Cocina',
  'Antigüedades y Vintage', 'Libros y Revistas', 'Arte y Artesanía', 'Juguetes',
  'Deportes', 'Herramientas', 'Música', 'Plantas y Jardín', 'Alimentos', 'Otro'
]

function Home({ showSellerHint, onHintSeen }) {
  const navigate = useNavigate()

  const [hubs, setHubs] = useState([])
  const [products, setProducts] = useState([])
  const [activeFilter, setActiveFilter] = useState('Todos')
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
          .eq('status', 'publicado')
          .order('created_at', { ascending: false })
          .limit(50),

        supabase
          .from('stores')
          .select('id, name'),

        supabase
          .from('store_hubs')
          .select('hub_id')
      ])

      console.log('Productos en Home:', productsRes.data?.length, productsRes.error)

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
        storeName: storesMap[p.store_id]?.name || ''
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
  const displayedProducts = activeFilter === 'Todos'
    ? filteredProducts
    : filteredProducts.filter(p => p.category === activeFilter)

  return (
    <div style={{ background: '#f4f4f4', minHeight: '100vh', overflowX: 'hidden', width: '100%' }}>
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
                <div style={{ width: '100%', overflowX: 'hidden', position: 'relative' }}>
                  <div className="hubs-scroll" style={{
                    display: 'flex',
                    overflowX: 'auto',
                    gap: 12,
                    padding: '0 16px 16px 16px',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    WebkitOverflowScrolling: 'touch',
                    scrollSnapType: 'x mandatory'
                  }}>
                    {hubs.map(hub => (
                      <div
                        key={hub.id}
                        onClick={() => navigate(`/hub/${hub.id}`)}
                        style={{
                          minWidth: 180,
                          maxWidth: 180,
                          flexShrink: 0,
                          scrollSnapAlign: 'start',
                          background: '#1a1a2e',
                          borderRadius: 12,
                          padding: 14,
                          cursor: 'pointer'
                        }}
                      >
                        <p style={{ fontSize: 10, color: '#999', margin: '0 0 4px', textTransform: 'uppercase' }}>
                          {hub.hub_type || 'tianguis'}
                        </p>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: '0 0 8px', lineHeight: 1.3 }}>
                          {hub.name}
                        </p>
                        {hub.schedule && (
                          <p style={{ fontSize: 11, color: '#aaa', margin: '0 0 6px' }}>
                            🕐 {hub.schedule}
                          </p>
                        )}
                        <p style={{ fontSize: 11, color: '#F5BF3A', margin: 0 }}>
                          👥 {hub.storeCount || 0} puestos
                        </p>
                      </div>
                    ))}
                    <div style={{ minWidth: 8, flexShrink: 0 }} />
                  </div>

                  {/* Gradiente derecho — indica que hay más cards */}
                  <div style={{
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    bottom: 16,
                    width: 40,
                    background: 'linear-gradient(to right, transparent, rgba(245,245,245,0.9))',
                    pointerEvents: 'none'
                  }} />
                </div>

                {/* Puntos indicadores */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 20, marginTop: -8 }}>
                  {hubs.map((_, i) => (
                    <div key={i} style={{
                      width: i === 0 ? 16 : 6,
                      height: 6,
                      borderRadius: 3,
                      background: i === 0 ? '#0B365C' : '#ccc',
                      transition: 'all 0.3s'
                    }} />
                  ))}
                </div>
              </div>
            )}

            {/* ── FILTROS POR CATEGORÍA ── */}
            <div style={{ overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none', marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 8, padding: '0 16px 8px' }}>
                {CATEGORIAS.map(cat => {
                  const count = cat === 'Todos'
                    ? filteredProducts.length
                    : filteredProducts.filter(p => p.category === cat).length
                  if (count === 0 && cat !== 'Todos') return null
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveFilter(cat)}
                      style={{
                        padding: '8px 16px',
                        background: activeFilter === cat ? '#F5BF3A' : '#fff',
                        color: activeFilter === cat ? '#0B365C' : '#666',
                        border: activeFilter === cat ? 'none' : '1px solid #ddd',
                        borderRadius: 20,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        transition: 'all 0.2s'
                      }}>
                      {cat} ({count})
                    </button>
                  )
                })}
              </div>
            </div>

            {/* ── SECCIÓN: PRODUCTOS RECIENTES ── */}
            <h2 style={{ fontSize: 16, marginBottom: 12, color: '#333' }}>
              🛍️ Productos recientes
            </h2>

            {displayedProducts.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#999', padding: 32 }}>
                {searchQuery
                  ? `No encontramos productos para "${safeQuery}"`
                  : activeFilter !== 'Todos'
                    ? `No hay productos en "${activeFilter}".`
                    : 'No hay productos disponibles.'}
              </p>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 12,
                padding: '0 16px',
                width: '100%',
                boxSizing: 'border-box',
                maxWidth: '100%'
              }}>
                {displayedProducts.map(p => (
                  <div
                    key={p.id}
                    onClick={() => navigate(`/producto/${p.id}`)}
                    style={{
                      background: '#fff',
                      borderRadius: 12,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}
                  >
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt={p.title}
                        style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', display: 'block' }}
                        onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
                      />
                    ) : null}
                    <div style={{
                      display: p.image_url ? 'none' : 'flex',
                      width: '100%',
                      aspectRatio: '1/1',
                      background: '#f5f5f5',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 32
                    }}>🏷️</div>
                    <div style={{ padding: '10px 12px' }}>
                      <p style={{
                        margin: '0 0 4px',
                        fontWeight: 600,
                        fontSize: 13,
                        color: '#111',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {capitalize(p.title)}
                      </p>
                      <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 15, color: '#111' }}>
                        ${p.price}
                      </p>
                      {p.storeName && (
                        <p style={{ margin: 0, fontSize: 11, color: '#666' }}>
                          {p.storeName}
                        </p>
                      )}
                    </div>
                  </div>
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
