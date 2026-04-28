import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

function Dashboard() {

  // ==============================
  // 🔥 ESTADO GLOBAL DEL DASHBOARD
  // ==============================
  // store → tienda del vendedor (dueño)
  // products → productos que ya subió
  // metrics → data de negocio (views + clicks)
  // loading → control UX mientras carga
  const [store, setStore] = useState(null)
  const [products, setProducts] = useState([])
  const [metrics, setMetrics] = useState({ views: 0, clicks: 0 })
  const [loading, setLoading] = useState(true)

  // ==============================
  // 🧾 FORMULARIO DE PRODUCTO
  // ==============================
  // Esto es el "motor" de crecimiento del marketplace
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('')

  // 📸 archivo real (desde celular)
  const [file, setFile] = useState(null)

  // ==============================
  // 🚀 INIT (CUANDO CARGA LA APP)
  // ==============================
  useEffect(() => {
    init()
  }, [])

  async function init() {
    try {
      // 🔐 1. VALIDAR USUARIO
      // Sin usuario → no hay dashboard → lo mandamos a login
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        window.location.href = '/login'
        return
      }

      // 🏪 2. TRAER TIENDA DEL USUARIO
      const { data: stores } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', user.id)

      const store = stores?.[0]
      if (!store) return

      setStore(store)

      // 📦 3. TRAER PRODUCTOS
      fetchProducts(store.id)

      // 📊 4. TRAER MÉTRICAS
      fetchMetrics(store.id)

    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // ==============================
  // 📦 PRODUCTOS DEL VENDEDOR
  // ==============================
  async function fetchProducts(storeId) {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', storeId)

    setProducts(data || [])
  }

  // ==============================
  // 📊 MÉTRICAS (NEGOCIO REAL)
  // ==============================
  async function fetchMetrics(storeId) {
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', storeId)

    const ids = products.map(p => p.id)

    const { data: events } = await supabase
      .from('lead_events')
      .select('*')
      .in('product_id', ids)

    const views = events.filter(e => e.type === 'view_product').length
    const clicks = events.filter(e => e.type === 'click_whatsapp').length

    setMetrics({ views, clicks })
  }

  // ==============================
  // 📸 SUBIR IMAGEN A STORAGE
  // ==============================
  // Este es el punto clave: convierte tu app en "real"
  async function uploadImage() {
    if (!file) return null

    const fileName = `${Date.now()}-${file.name}`

    const { error } = await supabase.storage
      .from('products')
      .upload(fileName, file)

    if (error) {
      console.error(error)
      return null
    }

    // 🔗 obtener URL pública
    const { data } = supabase.storage
      .from('products')
      .getPublicUrl(fileName)

    return data.publicUrl
  }

  // ==============================
  // 🔥 CREAR PRODUCTO
  // ==============================
  async function createProduct() {
    if (!title || !price) {
      alert('Faltan datos')
      return
    }

    // 📸 subir imagen primero
    const image_url = await uploadImage()

    const { error } = await supabase
      .from('products')
      .insert([
        {
          title,
          price,
          category,
          image_url,
          store_id: store.id
        }
      ])

    if (error) {
      alert('Error al crear producto')
      return
    }

    // 🔄 limpiar form (UX)
    setTitle('')
    setPrice('')
    setCategory('')
    setFile(null)

    // 🔄 refrescar productos
    fetchProducts(store.id)
  }

  if (loading) return <p>Cargando dashboard...</p>

  return (
    <div style={{ padding: 20, maxWidth: 500, margin: '0 auto' }}>

      {/* 🏪 IDENTIDAD DEL VENDEDOR */}
      <h2>Mi tienda</h2>
      <p>{store?.name}</p>

      {/* 📊 MÉTRICAS → VALOR PARA COBRAR */}
      <div style={{ marginBottom: 20 }}>
        <p>👀 Vistas: {metrics.views}</p>
        <p>💬 Clics: {metrics.clicks}</p>
      </div>

      {/* 🔓 LOGOUT */}
      <button
        onClick={async () => {
          await supabase.auth.signOut()
          window.location.href = '/'
        }}
        style={{ marginBottom: 20 }}
      >
        Cerrar sesión
      </button>

      {/* ==============================
          🧩 FORMULARIO DE PRODUCTO
      ============================== */}
      <h3>Agregar producto</h3>

      <input
        placeholder="Nombre"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <input
        placeholder="Precio"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      />

      <input
        placeholder="Categoría"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      />

      {/* 📸 SUBIDA REAL */}
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files[0])}
      />

      <button onClick={createProduct}>
        Crear producto
      </button>

      {/* ==============================
          📦 LISTA DE PRODUCTOS
      ============================== */}
      <h3>Mis productos</h3>

      {products.map((p) => (
        <div key={p.id}>
          <img src={p.image_url} width="100%" />
          <h4>{p.title}</h4>
          <p>${p.price}</p>
        </div>
      ))}

    </div>
  )
}

export default Dashboard