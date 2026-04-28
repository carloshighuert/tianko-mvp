import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

function App() {
  const [products, setProducts] = useState([])

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    // 1. Traer productos
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('*')

    if (productsError) {
      console.error(productsError)
      return
    }

    // 2. Traer stores
    const { data: storesData, error: storesError } = await supabase
      .from('stores')
      .select('*')

    if (storesError) {
      console.error(storesError)
      return
    }

    // 3. Mapear manualmente (CONTROL TOTAL)
    const enrichedProducts = productsData.map((p) => {
      const store = storesData.find(s => s.id === p.store_id)

      return {
        ...p,
        store: store || null
      }
    })

    console.log('FINAL:', enrichedProducts)

    setProducts(enrichedProducts)
  }

  function handleWhatsApp(product) {
    const phone = product.store?.whatsapp_number

    if (!phone) {
      alert('Este vendedor no tiene WhatsApp configurado')
      return
    }

    const message = `Hola, vi este producto: ${product.title}`
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`

    window.open(url, '_blank')

    supabase.from('lead_events').insert([
      {
        type: 'click_whatsapp',
        product_id: product.id,
      },
    ])
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Tianko MVP</h1>

      {products.length === 0 && <p>No hay productos aún</p>}

      {products.map((p) => (
        <div key={p.id} style={{ marginBottom: 20 }}>
          <div style={{ border: '1px solid #ddd', padding: 10 }}>

            <img src={p.image_url} width="150" alt={p.title} />

            <h3>{p.title}</h3>

            <p style={{ fontSize: 12, color: 'gray' }}>
              {p.store?.name || 'Sin tienda'}
            </p>

            <p>${p.price}</p>

            <button
              onClick={() => handleWhatsApp(p)}
              style={{
                background: 'green',
                color: 'white',
                padding: '10px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Comprar por WhatsApp
            </button>

          </div>
        </div>
      ))}
    </div>
  )
}

export default App