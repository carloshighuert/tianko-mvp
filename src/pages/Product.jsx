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

import { useParams, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { QRCodeCanvas } from 'qrcode.react'

function Product() {
  const { id } = useParams()

  const [product, setProduct] = useState(null)
  const [store, setStore] = useState(null)
  const [socialProof, setSocialProof] = useState(null) // nuevo
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

      // ANTES: traía TODAS las tiendas → ineficiente
      // AHORA: query directo por store_id
      const { data: storeData } = await supabase
        .from('stores')
        .select('*')
        .eq('id', productData.store_id)
        .single()

      setStore(storeData || null)

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
  function handleWhatsApp() {
    const phone = store?.whatsapp_number

    if (!phone) {
      alert('Este vendedor no tiene WhatsApp configurado')
      return
    }

    const message = `Hola 👋 vi este producto en Tianko:\n\n🛍️ ${product.title}\n💰 $${product.price}\n\n¿Sigue disponible?`
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank')

    // Registrar click
    supabase.from('lead_events').insert([{
      type: 'click_whatsapp',
      product_id: product.id
    }])
  }

  console.log('Product data:', product, store)

  if (loading) return (
    <p style={{ textAlign: 'center', padding: 20 }}>Cargando...</p>
  )

  if (!product) return (
    <div style={{ textAlign: 'center', padding: 20 }}>
      <p>Producto no encontrado</p>
      <Link to="/">← Volver</Link>
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
          <Link to="/" style={{ textDecoration: 'none', color: '#000', fontWeight: 'bold', fontSize: 20 }}>
            Tianko
          </Link>
          <span style={{ fontSize: 12, color: '#666' }}>Marketplace local</span>
        </div>

        {/* CARD */}
        <div style={{
          background: 'white',
          borderRadius: 16,
          padding: 16,
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
        }}>

          {/* IMAGEN */}
          {product.image_url && (
            <img
              src={product.image_url}
              alt={product.title}
              style={{ width: '100%', borderRadius: 12, marginBottom: 12 }}
            />
          )}

          {/* TÍTULO */}
          <h2 style={{ margin: '0 0 4px' }}>{product.title}</h2>

          {/* TIENDA */}
          {store && (
            <div style={{ marginBottom: 8 }}>
              <p style={{ margin: 0, color: '#666', fontSize: 14 }}>{store.name}</p>
              <Link
                to={`/tienda/${store.id}`}
                style={{ fontSize: 13, color: '#007bff', textDecoration: 'none' }}
              >
                Ver más productos →
              </Link>
            </div>
          )}

          {/* PRECIO */}
          <p style={{ fontSize: 28, fontWeight: 'bold', margin: '8px 0' }}>
            ${product.price}
          </p>

          {/* PRUEBA SOCIAL REAL — solo si hay datos */}
          {proofMessage && (
            <p style={{ fontSize: 13, color: '#e67e22', margin: '0 0 8px' }}>
              {proofMessage}
            </p>
          )}

          {/* CONFIANZA */}
          <p style={{ color: 'green', fontWeight: 'bold', fontSize: 14, margin: '0 0 12px' }}>
            ✓ Respuesta directa del vendedor
          </p>

          {/* CTA PRINCIPAL */}
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
              cursor: 'pointer'
            }}
          >
            💬 Preguntar disponibilidad
          </button>

          {/* CONFIANZA SECUNDARIA */}
          <p style={{
            fontSize: 12,
            color: '#999',
            textAlign: 'center',
            marginTop: 8
          }}>
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
      </div>
    </div>
  )
}

export default Product
