// ============================================================
// 📁 MarketHub.jsx — NUEVO
// ============================================================
// Página pública de un tianguis o bazar.
// URL: /hub/:id
//
// PROPÓSITO:
//   Esta es la página que diferencia a Tianko de Facebook
//   Marketplace. Un comprador puede ver TODOS los puestos
//   de un tianguis específico, sus productos y contactar
//   directo por WhatsApp.
//
// FLUJO:
//   1. Carga el hub por ID
//   2. Carga todas las stores asociadas a ese hub
//   3. Carga los productos de cada store
//   4. Muestra vista agrupada por puesto
// ============================================================

import { useParams, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

function MarketHub() {
  const { id } = useParams()

  const [hub, setHub] = useState(null)
  const [stores, setStores] = useState([])
  const [productsByStore, setProductsByStore] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHub()
  }, [id])

  // ============================================================
  // 📦 CARGAR HUB + TIENDAS + PRODUCTOS
  // ============================================================
  async function fetchHub() {
    try {
      // 1. Datos del hub
      const { data: hubData } = await supabase
        .from('market_hubs')
        .select('*')
        .eq('id', id)
        .single()

      if (!hubData) return
      setHub(hubData)

      // 2. Tiendas asociadas a este hub via store_hubs
      const { data: storeHubsData } = await supabase
        .from('store_hubs')
        .select('*, stores(*)')
        .eq('hub_id', id)

      // deduplicate stores (a store could appear multiple times if misconfigured)
      const seen = new Set()
      const storesData = (storeHubsData || [])
        .map(sh => sh.stores)
        .filter(s => s && !seen.has(s.id) && seen.add(s.id))

      setStores(storesData)

      // 3. Productos de cada tienda
      if (storesData && storesData.length > 0) {
        const storeIds = storesData.map(s => s.id)

        const { data: productsData } = await supabase
          .from('products')
          .select('*')
          .in('store_id', storeIds)
          .neq('status', 'vendido')
          .order('created_at', { ascending: false })

        // Agrupar productos por store_id
        const grouped = {}
        productsData?.forEach(p => {
          if (!grouped[p.store_id]) grouped[p.store_id] = []
          grouped[p.store_id].push(p)
        })

        setProductsByStore(grouped)
      }

    } catch (err) {
      console.error('[fetchHub] Error:', err)
    } finally {
      setLoading(false)
    }
  }

  // ============================================================
  // 🏷️ ETIQUETA DE TIPO DE HUB
  // ============================================================
  function hubTypeLabel(type) {
    const labels = {
      tianguis: '🛒 Tianguis',
      bazar: '🏪 Bazar',
      mercado: '🏬 Mercado',
      feria: '🎪 Feria'
    }
    return labels[type] || '📍 Mercado local'
  }

  if (loading) return (
    <div style={{ padding: 20, textAlign: 'center' }}>
      <p>Cargando tianguis...</p>
    </div>
  )

  if (!hub) return (
    <div style={{ padding: 20, textAlign: 'center' }}>
      <p>No encontramos este tianguis.</p>
      <Link to="/">← Volver al inicio</Link>
    </div>
  )

  return (
    <div style={{ background: '#f4f4f4', minHeight: '100vh' }}>
      <div style={{ maxWidth: 500, margin: '0 auto', padding: 16 }}>

        <img src="/tianko-logo.png" alt="Tianko"
          style={{ height: 74, width: 'auto', display: 'block', marginBottom: 16 }} />

        {/* HEADER DEL HUB */}
        <div style={{
          background: '#000',
          color: 'white',
          borderRadius: 16,
          padding: 20,
          marginBottom: 20
        }}>
          <p style={{ margin: 0, fontSize: 13, opacity: 0.7 }}>
            {hubTypeLabel(hub.hub_type)}
          </p>
          <h1 style={{ margin: '4px 0 8px', fontSize: 24 }}>
            {hub.name}
          </h1>
          {hub.location && (
            <p style={{ margin: 0, fontSize: 14, opacity: 0.8 }}>
              📍 {hub.location}
            </p>
          )}
          {hub.schedule && (
            <p style={{ margin: '4px 0 0', fontSize: 14, opacity: 0.8 }}>
              🕐 {hub.schedule}
            </p>
          )}
          <p style={{ margin: '12px 0 0', fontSize: 13, opacity: 0.6 }}>
            {stores.length} {stores.length === 1 ? 'puesto' : 'puestos'} activos
          </p>
        </div>

        {/* LISTA DE TIENDAS CON SUS PRODUCTOS */}
        {stores.length === 0 ? (
          <div style={{
            background: 'white',
            borderRadius: 12,
            padding: 20,
            textAlign: 'center',
            color: '#999'
          }}>
            <p>Aún no hay puestos registrados en este tianguis.</p>
          </div>
        ) : (
          stores.map(store => {
            const storeProducts = productsByStore[store.id] || []

            return (
              <div key={store.id} style={{
                background: 'white',
                borderRadius: 16,
                padding: 16,
                marginBottom: 16,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
              }}>

                {/* INFO DEL PUESTO */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: 12
                }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16 }}>{store.name}</h3>
                    {store.description && (
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: '#999' }}>
                        {store.description}
                      </p>
                    )}
                  </div>

                  {/* Botón WhatsApp del puesto */}
                  {store.whatsapp_number && (
                    <button
                      onClick={() => {
                        const url = `https://wa.me/${store.whatsapp_number}?text=Hola, vi tu puesto en ${hub.name} en Tianko`
                        window.open(url, '_blank')
                      }}
                      style={{
                        background: '#25D366',
                        color: 'white',
                        border: 'none',
                        borderRadius: 8,
                        padding: '6px 12px',
                        fontSize: 13,
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      💬 WA
                    </button>
                  )}
                </div>

                {/* PRODUCTOS DEL PUESTO — scroll horizontal */}
                {storeProducts.length === 0 ? (
                  <p style={{ fontSize: 12, color: '#ccc', margin: 0 }}>
                    Sin productos publicados aún
                  </p>
                ) : (
                  <div style={{
                    display: 'flex',
                    gap: 10,
                    overflowX: 'auto',
                    paddingBottom: 4
                  }}>
                    {storeProducts.slice(0, 6).map(product => (
                      <Link
                        key={product.id}
                        to={`/producto/${product.id}`}
                        style={{ textDecoration: 'none', color: 'inherit', flexShrink: 0 }}
                      >
                        <div style={{ width: 100 }}>
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.title}
                              style={{
                                width: 100,
                                height: 100,
                                objectFit: 'cover',
                                borderRadius: 10
                              }}
                            />
                          ) : (
                            <div style={{
                              width: 100,
                              height: 100,
                              background: '#f0f0f0',
                              borderRadius: 10,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 24
                            }}>
                              📦
                            </div>
                          )}
                          <p style={{
                            margin: '4px 0 0',
                            fontSize: 12,
                            fontWeight: 'bold',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis'
                          }}>
                            {product.title}
                          </p>
                          <p style={{ margin: 0, fontSize: 12, color: '#333' }}>
                            ${product.price}
                          </p>
                        </div>
                      </Link>
                    ))}

                    {/* Ver más productos de esta tienda */}
                    {storeProducts.length > 6 && (
                      <Link
                        to={`/tienda/${store.id}`}
                        style={{ textDecoration: 'none', flexShrink: 0 }}
                      >
                        <div style={{
                          width: 100,
                          height: 100,
                          background: '#f0f0f0',
                          borderRadius: 10,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexDirection: 'column',
                          color: '#666',
                          fontSize: 12
                        }}>
                          <span style={{ fontSize: 20 }}>+{storeProducts.length - 6}</span>
                          <span>más</span>
                        </div>
                      </Link>
                    )}
                  </div>
                )}

                {/* Link a tienda completa */}
                <Link
                  to={`/tienda/${store.id}`}
                  style={{
                    display: 'block',
                    marginTop: 10,
                    fontSize: 12,
                    color: '#007bff',
                    textDecoration: 'none'
                  }}
                >
                  Ver tienda completa →
                </Link>

              </div>
            )
          })
        )}

        {/* VOLVER */}
        <Link
          to="/"
          style={{
            display: 'block',
            textAlign: 'center',
            padding: 12,
            color: '#666',
            fontSize: 14,
            textDecoration: 'none'
          }}
        >
          ← Volver al inicio
        </Link>

      </div>
    </div>
  )
}

export default MarketHub
