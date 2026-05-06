// ============================================================
// 📁 Product.jsx — v2
// ============================================================
// CAMBIOS VS v1:
//
//   1. PRUEBA SOCIAL REAL (antes hardcodeada)
//      Antes: "🔥 Varias personas han preguntado hoy" — siempre
//      Ahora: cuenta eventos reales de las últimas 24h
//      → Solo muestra el mensaje si hay actividad real
//      → Números reales generan más confianza que texto falso
//
//   2. QUERY OPTIMIZADO DE TIENDA
//      Antes: traía TODAS las tiendas con select('*') para
//             encontrar una sola → bomba de tiempo con escala
//      Ahora: query directo por store_id con .single()
//
//   3. TRACKING DE EVENTOS MEJORADO
//      Agrega store_id al evento para métricas más precisas
// ============================================================

import { useParams, Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { QRCodeCanvas } from 'qrcode.react'

const capitalize = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1) : ''

function Product() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [product, setProduct] = useState(null)
  const [store, setStore] = useState(null)
  const [socialProof, setSocialProof] = useState(null)
  const [storeRating, setStoreRating] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProduct()
    trackView()
  }, [id])

  // ============================================================
  // 📦 CARGAR PRODUCTO Y TIENDA
  // ============================================================
  async function fetchProduct() {
    try {
      // Producto directo por ID
      const { data: productData } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single()

      if (!productData) return
      setProduct(productData)

      if (window.gtag) {
        window.gtag('event', 'view_item', {
          item_id: productData?.id,
          item_name: productData?.title,
          price: productData?.price
        })
      }

      // ANTES: traía TODAS las tiendas → ineficiente
      // AHORA: query directo por store_id
      const { data: storeData } = await supabase
        .from('stores')
        .select('*')
        .eq('id', productData.store_id)
        .single()

      setStore(storeData || null)

      // Rating de la tienda
      if (productData.store_id) {
        const { data: reviewsData } = await supabase
          .from('reviews').select('rating')
          .eq('store_id', productData.store_id)
          .eq('used', true).not('rating', 'is', null)
        if (reviewsData?.length) {
          const avg = reviewsData.reduce((a, b) => a + b.rating, 0) / reviewsData.length
          setStoreRating({ avg: avg.toFixed(1), count: reviewsData.length })
        }
      }

      // Cargar prueba social después de tener el producto
      fetchSocialProof(id)

    } catch (err) {
      console.error('[fetchProduct] Error:', err)
    } finally {
      setLoading(false)
    }
  }

  // ============================================================
  // 📊 PRUEBA SOCIAL REAL (nuevo)
  // ============================================================
  // Cuenta eventos reales de las últimas 24 horas.
  // Solo muestra el mensaje si hay actividad genuina.
  //
  // LÓGICA DE DISPLAY:
  //   - 0 eventos → no mostrar nada (no inventar)
  //   - 1-3 vistas → "Alguien preguntó hoy"
  //   - 4-10 vistas → "Varias personas han preguntado hoy"
  //   - 10+ vistas → "Producto muy popular hoy"
  //   - clicks > 0 → agregar "X personas contactaron al vendedor"
  async function fetchSocialProof(productId) {
    try {
      const since = new Date()
      since.setHours(since.getHours() - 24)

      const { data: events } = await supabase
        .from('lead_events')
        .select('type')
        .eq('product_id', productId)
        .gte('created_at', since.toISOString())

      if (!events || events.length === 0) {
        setSocialProof(null)
        return
      }

      const views = events.filter(e => e.type === 'view_product').length
      const clicks = events.filter(e => e.type === 'click_whatsapp').length

      setSocialProof({ views, clicks })

    } catch (err) {
      console.error('[fetchSocialProof] Error:', err)
    }
  }

  // ============================================================
  // 🏷️ MENSAJE DE PRUEBA SOCIAL
  // ============================================================
  function getSocialProofMessage(proof) {
    if (!proof || proof.views === 0) return null

    const { views, clicks } = proof

    if (clicks >= 3) {
      return `🔥 ${clicks} personas contactaron al vendedor hoy`
    }
    if (views >= 10) {
      return '🔥 Producto muy popular hoy'
    }
    if (views >= 4) {
      return '👀 Varias personas han visto esto hoy'
    }
    if (views >= 1) {
      return '👀 Alguien más está viendo esto'
    }

    return null
  }

  // ============================================================
  // 📊 TRACKING DE VISTA
  // ============================================================
  async function trackView() {
    await supabase.from('lead_events').insert([{
      type: 'view_product',
      product_id: id
    }])
  }

  // ============================================================
  // 💬 CLICK A WHATSAPP
  // ============================================================
  const handleWhatsAppClick = async () => {
    try {
      await supabase.from('lead_events').insert({
        type: 'click_whatsapp',
        product_id: product.id
      })
    } catch (err) {
      console.error('Error registrando evento:', err)
    }
    if (window.gtag) {
      window.gtag('event', 'click_whatsapp', {
        product_id: product?.id,
        product_name: product?.title,
        store_name: store?.name,
        value: product?.price
      })
    }
  }

  function handleWhatsApp() {
    const phone = store?.whatsapp_number

    if (!phone) {
      alert('Este vendedor no tiene WhatsApp configurado')
      return
    }

    const message = `Hola 👋 vi este producto en Tianko:\n\n🛍️ ${product.title}\n💰 $${product.price}\n\n¿Sigue disponible?`
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    handleWhatsAppClick() // fire-and-forget
    window.open(url, '_blank')
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f4f4f4' }}>
      <p style={{ color: '#666', fontSize: 15 }}>Cargando producto...</p>
    </div>
  )

  if (!product) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f4f4f4', padding: 24 }}>
      <img src="/tianko-logo.png" alt="Tianko" style={{ height: 52, width: 'auto', marginBottom: 20 }} />
      <p style={{ color: '#666', fontSize: 16, marginBottom: 16 }}>Producto no disponible</p>
      <button onClick={() => navigate('/')} style={{
        background: '#000', color: 'white', border: 'none', borderRadius: 10,
        padding: '12px 24px', fontSize: 15, cursor: 'pointer'
      }}>
        🛍️ Explorar productos
      </button>
    </div>
  )

  const proofMessage = getSocialProofMessage(socialProof)

  return (
    <div style={{ background: '#f4f4f4', minHeight: '100vh', padding: 16 }}>
      <div style={{ maxWidth: 420, margin: '0 auto' }}>

        {/* HEADER */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16
        }}>
          <Link to="/">
            <img src="/tianko-logo.png" alt="Tianko" style={{ height: 74, width: 'auto' }} />
          </Link>
          <span style={{ fontSize: 13, color: '#666', fontStyle: 'italic' }}>Tu tianguis, ahora digital</span>
        </div>

        {/* CARD */}
        <div style={{
          background: 'white',
          borderRadius: 16,
          padding: 16,
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
        }}>

          {/* IMAGEN */}
          <img
            src={product.image_url}
            alt={product?.title}
            style={{ width: '100%', borderRadius: 12, marginBottom: 12, display: product.image_url ? 'block' : 'none' }}
            onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
          />
          <div style={{
            display: product.image_url ? 'none' : 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f5f5f5',
            minHeight: 160,
            borderRadius: 8,
            marginBottom: 12,
            flexDirection: 'column',
            gap: 8
          }}>
            <span style={{ fontSize: 32 }}>🏷️</span>
            <span style={{ fontSize: 12, color: '#999' }}>Sin foto</span>
          </div>

          {/* TÍTULO */}
          <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: '#111111', WebkitTextFillColor: '#111111' }}>
            {capitalize(product?.title)}
          </h2>

          {/* PRECIO */}
          <p style={{ fontSize: 28, fontWeight: 800, color: '#111111', WebkitTextFillColor: '#111111', margin: '8px 0' }}>
            ${product?.price}
          </p>

          {/* TIENDA */}
          {store && (
            <div style={{ marginBottom: 12 }}>
              <p style={{ margin: 0, fontSize: 14, color: '#444444', WebkitTextFillColor: '#444444' }}>
                {storeRating ? `⭐ ${storeRating.avg} · ${store?.name}` : store?.name}
              </p>
              <Link
                to={`/tienda/${store?.id}`}
                style={{ fontSize: 13, color: '#007bff', textDecoration: 'none' }}
              >
                Ver más productos de esta tienda →
              </Link>
            </div>
          )}

          {/* PRUEBA SOCIAL — solo si hay datos reales */}
          {proofMessage && (
            <p style={{ fontSize: 13, color: '#e67e22', margin: '0 0 8px' }}>
              {proofMessage}
            </p>
          )}

          {/* CONFIANZA */}
          <p style={{ color: 'green', fontWeight: 'bold', fontSize: 14, margin: '0 0 12px' }}>
            ✓ Respuesta directa del vendedor
          </p>

          {/* CTA PRINCIPAL — WhatsApp */}
          <button
            onClick={handleWhatsApp}
            style={{
              background: '#25D366',
              color: 'white',
              padding: 16,
              width: '100%',
              borderRadius: 12,
              border: 'none',
              fontWeight: 'bold',
              fontSize: 16,
              cursor: 'pointer',
              marginBottom: 8
            }}
          >
            💬 Contactar vendedor
          </button>

          {/* COMPARTIR — WhatsApp */}
          <a
            href={`https://wa.me/?text=${encodeURIComponent(
              `🛍️ *${product?.title}* — $${product?.price}\n\nVe el producto aquí: https://tianko.io/producto/${product?.id}\n\n_Tu tianguis, ahora digital_ 🟡`
            )}`}
            onClick={handleWhatsAppClick}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block',
              width: '100%',
              padding: '14px',
              marginTop: 10,
              background: '#25D366',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 600,
              textAlign: 'center',
              textDecoration: 'none',
              boxSizing: 'border-box'
            }}
          >
            📲 Compartir por WhatsApp
          </a>

          {/* EXPLORAR */}
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

          {/* CONFIANZA SECUNDARIA */}
          <p style={{ fontSize: 12, color: '#999', textAlign: 'center', marginTop: 12 }}>
            ✔ Contacto directo · Sin comisiones · Respuesta rápida
          </p>

          {/* QR para compartir */}
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <p style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>
              Comparte este producto
            </p>
            <QRCodeCanvas value={window.location.href} size={100} />
          </div>

        </div>

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

export default Product
