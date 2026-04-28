import { useParams, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

function Store() {
  const { id } = useParams()

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

        <h2 style={{ textAlign: 'center' }}>{store.name}</h2>

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

            <h4>{p.title}</h4>
            <p>${p.price}</p>

            <Link to={`/producto/${p.id}`}>
              Ver producto →
            </Link>
          </div>
        ))}

      </div>
    </div>
  )
}

export default Store