// ============================================================
// 📁 Dashboard.jsx — v4 (FINAL MVP)
// ============================================================
// NUEVAS FUNCIONES VS v3:
//
//   1. UNIRSE A UN HUB desde el dashboard
//      El vendedor puede buscar y asociarse a un tianguis
//      sin necesidad de que un admin lo haga en Supabase.
//
//   2. MARCAR PRODUCTO COMO VENDIDO
//      Cambia el estado del producto a 'vendido'.
//      El producto deja de aparecer en Home y MarketHub.
//      Genera evento 'mark_sold' para métricas.
//
//   3. INDICADOR DE ESTADO EN PRODUCTOS
//      Los productos vendidos se muestran con badge visual.
//
// ARQUITECTURA:
//   auth.users → sellers → stores (→ hub opcional) → products
// ============================================================

import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import BulkUpload from '../components/BulkUpload'

function Dashboard() {

  // ============================================================
  // 🗂️ ESTADO: entidades
  // ============================================================
  const [user, setUser] = useState(null)
  const [seller, setSeller] = useState(null)
  const [store, setStore] = useState(null)
  const [products, setProducts] = useState([])
  const [metrics, setMetrics] = useState({ views: 0, clicks: 0 })
  const [hubs, setHubs] = useState([]) // lista de hubs disponibles

  // ============================================================
  // 🗂️ ESTADO: UX
  // ============================================================
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [savingSeller, setSavingSeller] = useState(false)
  const [savingStore, setSavingStore] = useState(false)
  const [savingHub, setSavingHub] = useState(false)
  const [showHubSelector, setShowHubSelector] = useState(false)
  const [copiedId, setCopiedId] = useState(null)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [reviewCopiedId, setReviewCopiedId] = useState(null)
  const [editingProduct, setEditingProduct] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editFile, setEditFile] = useState(null)
  const [editPreview, setEditPreview] = useState(null)
  const [savingEdit, setSavingEdit] = useState(false)
  const [savedId, setSavedId] = useState(null)

  // ============================================================
  // 🗂️ ESTADO: formularios
  // ============================================================
  const [sellerName, setSellerName] = useState('')
  const [sellerPhone, setSellerPhone] = useState('')
  const [storeName, setStoreName] = useState('')
  const [storeWhatsapp, setStoreWhatsapp] = useState('')
  const [storeDescription, setStoreDescription] = useState('')
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [selectedHubId, setSelectedHubId] = useState('')

  // ============================================================
  // 🚀 INICIALIZACIÓN
  // ============================================================
  useEffect(() => {
    init()
  }, [])

  async function init() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      setUser(user)

      const { data: sellers } = await supabase
        .from('sellers').select('*').eq('user_id', user.id).limit(1)
      const existingSeller = sellers?.[0]
      if (!existingSeller) { setLoading(false); return }
      setSeller(existingSeller)

      const { data: stores } = await supabase
        .from('stores').select('*').eq('seller_id', existingSeller.id).limit(1)
      const existingStore = stores?.[0]
      if (!existingStore) { setLoading(false); return }
      setStore(existingStore)

      await Promise.all([
        fetchProducts(existingStore.id),
        fetchMetrics(existingStore.id),
        fetchHubs()
      ])

    } catch (err) {
      console.error('[init] Error:', err)
    } finally {
      setLoading(false)
    }
  }

  // ============================================================
  // 🏪 HUBS DISPONIBLES
  // ============================================================
  async function fetchHubs() {
    const { data } = await supabase
      .from('market_hubs')
      .select('id, name, location, schedule, hub_type')
      .order('name')
    setHubs(data || [])
  }

  // ============================================================
  // 👤 CREAR SELLER
  // ============================================================
  async function handleCreateSeller() {
    if (!sellerName || !sellerPhone) { alert('Necesitamos tu nombre y teléfono'); return }
    setSavingSeller(true)
    try {
      const { data, error } = await supabase
        .from('sellers')
        .insert([{ user_id: user.id, name: sellerName, phone: sellerPhone.replace(/\D/g, '') }])
        .select().single()
      if (error) throw error
      setSeller(data)
    } catch (err) {
      console.error('[handleCreateSeller]', err)
      alert('Error al guardar. Intenta de nuevo.')
    } finally { setSavingSeller(false) }
  }

  // ============================================================
  // 🏪 CREAR STORE
  // ============================================================
  async function handleCreateStore() {
    if (!storeName || !storeWhatsapp) { alert('Nombre y WhatsApp son obligatorios'); return }
    setSavingStore(true)
    try {
      const { data, error } = await supabase
        .from('stores')
        .insert([{
          seller_id: seller.id,
          name: storeName,
          whatsapp_number: storeWhatsapp.replace(/\D/g, ''),
          description: storeDescription
        }])
        .select().single()
      if (error) throw error
      setStore(data)
      fetchHubs()
    } catch (err) {
      console.error('[handleCreateStore]', err)
      alert('Error al crear tienda. Intenta de nuevo.')
    } finally { setSavingStore(false) }
  }

  // ============================================================
  // 📍 UNIRSE A UN HUB (nuevo)
  // ============================================================
  // El vendedor selecciona a qué tianguis pertenece su puesto.
  // Actualiza hub_id en stores.
  // Si selecciona "Ninguno" → limpia el hub_id.
  async function handleJoinHub() {
    setSavingHub(true)
    try {
      const { error } = await supabase
        .from('stores')
        .update({ hub_id: selectedHubId || null })
        .eq('id', store.id)

      if (error) throw error

      // Actualizar estado local
      setStore(prev => ({ ...prev, hub_id: selectedHubId || null }))
      setShowHubSelector(false)

      const hubName = hubs.find(h => h.id === selectedHubId)?.name
      alert(hubName ? `✅ Te uniste a ${hubName}` : '✅ Saliste del tianguis')

    } catch (err) {
      console.error('[handleJoinHub]', err)
      alert('Error al unirte al tianguis. Intenta de nuevo.')
    } finally { setSavingHub(false) }
  }

  // ============================================================
  // 📦 PRODUCTOS
  // ============================================================
  async function fetchProducts(storeId) {
    const { data } = await supabase
      .from('products').select('*').eq('store_id', storeId)
      .order('created_at', { ascending: false })
    setProducts(data || [])
  }

  // ============================================================
  // ✅ MARCAR COMO VENDIDO (nuevo)
  // ============================================================
  // Cambia status del producto. Los productos vendidos
  // se filtran en Home.jsx y MarketHub.jsx.
  async function handleMarkSold(productId, currentStatus) {
    const newStatus = currentStatus === 'vendido' ? 'publicado' : 'vendido'

    try {
      const { error } = await supabase
        .from('products')
        .update({ status: newStatus })
        .eq('id', productId)

      if (error) throw error

      // Registrar evento si se marca vendido
      if (newStatus === 'vendido') {
        await supabase.from('lead_events').insert([{
          type: 'mark_sold',
          product_id: productId
        }])
      }

      // Actualizar lista local sin refetch
      setProducts(prev => prev.map(p =>
        p.id === productId ? { ...p, status: newStatus } : p
      ))

    } catch (err) {
      console.error('[handleMarkSold]', err)
      alert('Error al actualizar. Intenta de nuevo.')
    }
  }

  // ============================================================
  // 🗑️ ELIMINAR PRODUCTO
  // ============================================================
  async function handleDeleteProduct(productId) {
    if (!confirm('¿Eliminar este producto? Esta acción no se puede deshacer.')) return
    try {
      const { error } = await supabase.from('products').delete().eq('id', productId)
      if (error) throw error
      setProducts(prev => prev.filter(p => p.id !== productId))
    } catch (err) {
      console.error('[handleDeleteProduct]', err)
      alert('Error al eliminar, intenta de nuevo')
    }
  }

  // ============================================================
  // ⭐ PEDIR RESEÑA
  // ============================================================
  async function handleRequestReview(product) {
    try {
      console.log('Generando reseña para:', product.id, store.id)
      const token = Math.random().toString(36).substring(2, 15)
      console.log('Token generado:', token)

      const { data, error } = await supabase.from('reviews').insert([{
        store_id: store.id,
        product_id: product.id,
        token,
        buyer_name: 'pendiente',
        rating: null,
        used: false
      }])

      console.log('Resultado insert:', data, error)

      if (error) throw error
      const link = `https://tianko.io/resena/${token}`
      await navigator.clipboard.writeText(link)
      setReviewCopiedId(product.id)
      setTimeout(() => setReviewCopiedId(null), 3000)
    } catch (err) {
      console.error('Error completo:', err)
      alert('Error al generar el link. Intenta de nuevo.')
    }
  }

  // ============================================================
  // ✏️ EDITAR PRODUCTO
  // ============================================================
  function handleOpenEdit(product) {
    setEditingProduct(product)
    setEditTitle(product.title || '')
    setEditPrice(String(product.price || ''))
    setEditCategory(product.category || '')
    setEditFile(null)
    setEditPreview(null)
  }

  async function handleSaveEdit() {
    if (!editTitle || !editPrice) { alert('Nombre y precio son obligatorios'); return }
    if (isNaN(editPrice) || parseFloat(editPrice) <= 0) { alert('El precio debe ser mayor a $0'); return }
    setSavingEdit(true)
    try {
      let image_url = editingProduct.image_url

      if (editFile) {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
        if (!allowedTypes.includes(editFile.type)) {
          alert('Solo se permiten imágenes JPG, PNG o WEBP'); setSavingEdit(false); return
        }
        if (editFile.size > 15 * 1024 * 1024) {
          alert('La imagen es muy pesada, máximo 15MB'); setSavingEdit(false); return
        }
        const compressed = await compressImage(editFile)
        const fileName = `${store.id}/${Date.now()}.jpg`
        const { error: uploadError } = await supabase.storage
          .from('products').upload(fileName, compressed, { contentType: 'image/jpeg', upsert: false })
        if (uploadError) throw uploadError
        const { data } = supabase.storage.from('products').getPublicUrl(fileName)
        image_url = data.publicUrl
      }

      const { error } = await supabase
        .from('products')
        .update({ title: editTitle, price: parseFloat(editPrice), category: editCategory, image_url })
        .eq('id', editingProduct.id)
      if (error) throw error

      setProducts(prev => prev.map(p =>
        p.id === editingProduct.id
          ? { ...p, title: editTitle, price: parseFloat(editPrice), category: editCategory, image_url }
          : p
      ))
      const savedProductId = editingProduct.id
      setEditingProduct(null)
      setSavedId(savedProductId)
      setTimeout(() => setSavedId(null), 2500)

    } catch (err) {
      console.error('[handleSaveEdit]', err)
      alert('Error al guardar. Intenta de nuevo.')
    } finally { setSavingEdit(false) }
  }

  // ============================================================
  // 🔗 COPIAR LINK
  // ============================================================
  function handleCopyLink(productId) {
    navigator.clipboard.writeText(`https://tianko.io/producto/${productId}`)
    setCopiedId(productId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // ============================================================
  // 📊 MÉTRICAS
  // ============================================================
  async function fetchMetrics(storeId) {
    const { data: productRows } = await supabase
      .from('products').select('id').eq('store_id', storeId)
    if (!productRows?.length) return
    const ids = productRows.map(p => p.id)
    const { data: events } = await supabase
      .from('lead_events').select('type').in('product_id', ids)
    const views = events?.filter(e => e.type === 'view_product').length || 0
    const clicks = events?.filter(e => e.type === 'click_whatsapp').length || 0
    setMetrics({ views, clicks })
  }

  // ============================================================
  // 📸 PREVIEW + COMPRESIÓN + SUBIDA
  // ============================================================
  function handleFileSelect(selectedFile) {
    if (!selectedFile) return
    setFile(selectedFile)
    setPreview(URL.createObjectURL(selectedFile))
  }

  function compressImage(file, maxWidth = 1200, quality = 0.75) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const img = new Image()
        img.onload = () => {
          const ratio = Math.min(maxWidth / img.width, 1)
          const canvas = document.createElement('canvas')
          canvas.width = img.width * ratio
          canvas.height = img.height * ratio
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
          canvas.toBlob(
            (blob) => {
              if (!blob) { reject(new Error('No se pudo comprimir')); return }
              resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }))
            },
            'image/jpeg', quality
          )
        }
        img.onerror = () => reject(new Error('Error al leer imagen'))
        img.src = event.target.result
      }
      reader.onerror = () => reject(new Error('Error FileReader'))
      reader.readAsDataURL(file)
    })
  }

  async function uploadImage() {
    if (!file) return null
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
    if (!allowedTypes.includes(file.type)) {
      alert('Solo se permiten imágenes JPG, PNG o WEBP')
      return null
    }
    if (file.size > 15 * 1024 * 1024) {
      alert('La imagen es muy pesada, máximo 15MB')
      return null
    }
    try {
      const compressed = await compressImage(file)
      const fileName = `${store.id}/${Date.now()}.jpg`
      const { error } = await supabase.storage
        .from('products').upload(fileName, compressed, { contentType: 'image/jpeg', upsert: false })
      if (error) throw error
      const { data } = supabase.storage.from('products').getPublicUrl(fileName)
      return data.publicUrl
    } catch (err) {
      console.error('[uploadImage]', err)
      return null
    }
  }

  // ============================================================
  // ➕ CREAR PRODUCTO
  // ============================================================
  async function createProduct() {
    if (!title || !price) { alert('Nombre y precio son obligatorios'); return }
    if (isNaN(price) || parseFloat(price) <= 0) { alert('El precio debe ser mayor a $0'); return }
    if (uploading) return
    setUploading(true)
    try {
      const image_url = await uploadImage()
      const { error } = await supabase.from('products').insert([{
        title, price: parseFloat(price), category, image_url,
        store_id: store.id, status: 'publicado'
      }])
      if (error) throw error
      setTitle(''); setPrice(''); setCategory(''); setFile(null); setPreview(null)
      await fetchProducts(store.id)
    } catch (err) {
      console.error('[createProduct]', err)
      alert('No se pudo crear el producto. Intenta de nuevo.')
    } finally { setUploading(false) }
  }

  // ============================================================
  // 🖥️ RENDERS
  // ============================================================

  if (loading) return (
    <div style={{ padding: 20, textAlign: 'center' }}><p>Cargando tu tienda...</p></div>
  )

  // ── ONBOARDING PASO 0: bienvenida ───────────────────────────
  if (!seller && !showOnboarding) return (
    <div style={{ textAlign: 'center', padding: '40px 24px', maxWidth: 400, margin: '0 auto' }}>
      <img src="/tianko-logo.png" alt="Tianko"
        style={{ height: 80, width: 'auto', marginBottom: 24 }} />
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
        ¡Bienvenido a Tianko! 🎉
      </h2>
      <p style={{ color: '#555', fontSize: 15, marginBottom: 4 }}>
        Tu tianguis, ahora digital
      </p>
      <p style={{ color: '#777', fontSize: 14, marginBottom: 32 }}>
        En 2 minutos tendrás tu puesto listo para vender.
      </p>
      <button onClick={() => setShowOnboarding(true)} style={{
        background: '#111', color: '#fff', border: 'none', borderRadius: 12,
        padding: '14px 32px', fontSize: 16, fontWeight: 600, cursor: 'pointer', width: '100%'
      }}>
        Crear mi puesto →
      </button>
      <p style={{ marginTop: 16, fontSize: 13, color: '#999' }}>
        ¿Solo quieres explorar?{' '}
        <a href="/" style={{ color: '#666', marginLeft: 4 }}>Ver productos →</a>
      </p>
    </div>
  )

  // ── ONBOARDING PASO 1: seller ────────────────────────────────
  if (!seller) return (
    <div style={{ padding: 20, maxWidth: 400, margin: '0 auto' }}>
      <h2>¡Bienvenido a Tianko! 👋</h2>
      <p style={{ color: '#666', marginBottom: 20 }}>Primero dinos quién eres</p>
      <input placeholder="Tu nombre completo *" value={sellerName}
        onChange={(e) => setSellerName(e.target.value)}
        style={{ width: '100%', padding: 12, marginBottom: 10, fontSize: 16, boxSizing: 'border-box' }} />
      <input placeholder="Tu teléfono (10 dígitos) *" value={sellerPhone}
        onChange={(e) => setSellerPhone(e.target.value)} type="tel"
        style={{ width: '100%', padding: 12, marginBottom: 20, fontSize: 16, boxSizing: 'border-box' }} />
      <button onClick={handleCreateSeller} disabled={savingSeller}
        style={{ width: '100%', padding: 14, background: savingSeller ? '#ccc' : '#000',
          color: 'white', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 'bold' }}>
        {savingSeller ? 'Guardando...' : 'Continuar →'}
      </button>
    </div>
  )

  // ── ONBOARDING PASO 2: store ─────────────────────────────────
  if (!store) return (
    <div style={{ padding: 20, maxWidth: 400, margin: '0 auto' }}>
      <h2>Crea tu tienda 🏪</h2>
      <p style={{ color: '#666', marginBottom: 20 }}>Hola {seller.name}, solo 3 datos más</p>
      <input placeholder="Nombre de tu puesto *" value={storeName}
        onChange={(e) => setStoreName(e.target.value)}
        style={{ width: '100%', padding: 12, marginBottom: 10, fontSize: 16, boxSizing: 'border-box' }} />
      <input placeholder="WhatsApp donde te contactarán *" value={storeWhatsapp}
        onChange={(e) => setStoreWhatsapp(e.target.value)} type="tel"
        style={{ width: '100%', padding: 12, marginBottom: 10, fontSize: 16, boxSizing: 'border-box' }} />
      <input placeholder="¿Qué vendes? (opcional)" value={storeDescription}
        onChange={(e) => setStoreDescription(e.target.value)}
        style={{ width: '100%', padding: 12, marginBottom: 20, fontSize: 16, boxSizing: 'border-box' }} />
      <button onClick={handleCreateStore} disabled={savingStore}
        style={{ width: '100%', padding: 14, background: savingStore ? '#ccc' : '#000',
          color: 'white', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 'bold' }}>
        {savingStore ? 'Creando tu tienda...' : 'Crear tienda →'}
      </button>
    </div>
  )

  // ── DASHBOARD PRINCIPAL ──────────────────────────────────────
  const currentHub = hubs.find(h => h.id === store.hub_id)

  return (
    <div style={{ padding: 20, maxWidth: 500, margin: '0 auto' }}>

      {/* IDENTIDAD */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <a href="/"><img src="/tianko-logo.png" alt="Tianko" style={{ height: 74, width: 'auto', display: 'block', marginBottom: 2 }} /></a>
          <p style={{ margin: 0, fontWeight: 'bold' }}>{store.name}</p>
          <p style={{ margin: 0, color: '#666', fontSize: 13 }}>Hola, {seller.name}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href={`/tienda/${store.id}`} target="_blank" rel="noreferrer"
            style={{ background: 'white', border: '1px solid #ccc', padding: '6px 12px',
              borderRadius: 8, cursor: 'pointer', textDecoration: 'none', color: '#333', fontSize: 14 }}>
            Ver mi tienda →
          </a>
          <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/' }}
            style={{ background: 'none', border: '1px solid #ccc', padding: '6px 12px', borderRadius: 8, cursor: 'pointer' }}>
            Salir
          </button>
        </div>
      </div>

      {/* MÉTRICAS */}
      <div style={{ display: 'flex', gap: 16, padding: 16, background: '#f9f9f9', borderRadius: 12, marginBottom: 20 }}>
        {[
          { value: metrics.views, label: 'Vistas' },
          { value: metrics.clicks, label: 'Contactos WA' },
          { value: products.filter(p => p.status !== 'vendido').length, label: 'Activos' }
        ].map(m => (
          <div key={m.label} style={{ textAlign: 'center', flex: 1 }}>
            <p style={{ fontSize: 28, fontWeight: 'bold', margin: 0 }}>{m.value}</p>
            <p style={{ fontSize: 12, color: '#666', margin: 0 }}>{m.label}</p>
          </div>
        ))}
      </div>

      {/* HUB ACTUAL */}
      <div style={{ background: '#f0f0f0', borderRadius: 12, padding: 14, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ margin: 0, fontSize: 12, color: '#666' }}>Tu tianguis</p>
            <p style={{ margin: 0, fontWeight: 'bold' }}>
              {currentHub ? `📍 ${currentHub.name}` : 'Sin tianguis asignado'}
            </p>
            {currentHub?.schedule && (
              <p style={{ margin: 0, fontSize: 12, color: '#999' }}>{currentHub.schedule}</p>
            )}
          </div>
          <button
            onClick={() => { setShowHubSelector(!showHubSelector); setSelectedHubId(store.hub_id || '') }}
            style={{ background: '#000', color: 'white', border: 'none', borderRadius: 8,
              padding: '6px 12px', fontSize: 13, cursor: 'pointer' }}>
            {showHubSelector ? 'Cancelar' : currentHub ? 'Cambiar' : 'Unirme'}
          </button>
        </div>

        {/* SELECTOR DE HUB */}
        {showHubSelector && (
          <div style={{ marginTop: 12 }}>
            <select
              value={selectedHubId}
              onChange={(e) => setSelectedHubId(e.target.value)}
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ddd',
                fontSize: 15, marginBottom: 10, boxSizing: 'border-box' }}>
              <option value="">Sin tianguis (independiente)</option>
              {hubs.map(h => (
                <option key={h.id} value={h.id}>
                  {h.name} — {h.location || 'Sin ubicación'}
                </option>
              ))}
            </select>
            <button onClick={handleJoinHub} disabled={savingHub}
              style={{ width: '100%', padding: 10, background: savingHub ? '#ccc' : '#000',
                color: 'white', border: 'none', borderRadius: 8, fontSize: 14,
                fontWeight: 'bold', cursor: 'pointer' }}>
              {savingHub ? 'Guardando...' : 'Confirmar'}
            </button>
          </div>
        )}
      </div>
        <BulkUpload storeId={store.id} onComplete={() => fetchProducts(store.id)} />
      {/* FORMULARIO DE PRODUCTO */}
      <h3 style={{ marginBottom: 12 }}>Agregar producto</h3>

      {preview && (
        <img src={preview} alt="Vista previa"
          style={{ width: '100%', borderRadius: 10, maxHeight: 200, objectFit: 'cover', marginBottom: 10 }} />
      )}

      <label style={{ display: 'block', padding: 12, background: '#f0f0f0', borderRadius: 10,
        textAlign: 'center', cursor: 'pointer', marginBottom: 10, fontSize: 15 }}>
        {file ? '✅ Foto lista' : '📸 Tomar o elegir foto'}
        <input type="file" accept="image/*" capture="environment"
          onChange={(e) => handleFileSelect(e.target.files[0])} style={{ display: 'none' }} />
      </label>

      {[
        { placeholder: '¿Qué vendes? *', value: title, setValue: setTitle, type: 'text' },
        { placeholder: 'Precio $ *', value: price, setValue: setPrice, type: 'number' },
        { placeholder: 'Categoría (opcional)', value: category, setValue: setCategory, type: 'text' }
      ].map(f => (
        <input key={f.placeholder} placeholder={f.placeholder} value={f.value}
          onChange={(e) => f.setValue(e.target.value)} type={f.type}
          inputMode={f.type === 'number' ? 'decimal' : undefined}
          style={{ width: '100%', padding: 12, marginBottom: 10, fontSize: 15, boxSizing: 'border-box' }} />
      ))}

      <button onClick={createProduct} disabled={uploading}
        style={{ width: '100%', padding: 14, background: uploading ? '#ccc' : '#000',
          color: 'white', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 'bold',
          marginBottom: 30, cursor: uploading ? 'not-allowed' : 'pointer' }}>
        {uploading ? (file ? '📤 Subiendo foto...' : '💾 Guardando...') : '+ Publicar producto'}
      </button>

      {/* LISTA DE PRODUCTOS */}
      <h3 style={{ marginBottom: 12 }}>
        Mis productos ({products.filter(p => p.status !== 'vendido').length} activos)
      </h3>

      {products.length === 0 && (
        <p style={{ color: '#999', textAlign: 'center' }}>¡Agrega tu primer producto!</p>
      )}

      {products.map((p) => (
        <div key={p.id} style={{
          display: 'flex', gap: 12, background: p.status === 'vendido' ? '#f9f9f9' : '#fff',
          borderRadius: 12, padding: 12, marginBottom: 12, border: '1px solid #eee',
          alignItems: 'center', opacity: p.status === 'vendido' ? 0.6 : 1
        }}>
          <a href={`/producto/${p.id}`} target="_blank" rel="noreferrer"
            style={{ display: 'flex', gap: 12, flex: 1, alignItems: 'center',
              textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
            {p.image_url && (
              <img src={p.image_url} alt={p.title}
                style={{ width: 70, height: 70, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
            )}
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontWeight: 'bold', fontSize: 14 }}>{p.title}</p>
              <p style={{ margin: 0, color: '#333' }}>${p.price}</p>
              {p.status === 'vendido' && (
                <span style={{ fontSize: 11, background: '#e0ffe0', color: '#2e7d32',
                  padding: '2px 6px', borderRadius: 4 }}>
                  ✓ Vendido
                </span>
              )}
            </div>
          </a>

          {/* Acciones */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
            {savedId === p.id && (
              <span style={{ fontSize: 11, color: '#2e7d32', textAlign: 'center' }}>✓ Actualizado</span>
            )}
            <button
              onClick={() => handleOpenEdit(p)}
              style={{
                background: '#f0f0f0', color: '#333',
                border: 'none', borderRadius: 8, padding: '6px 10px',
                fontSize: 12, cursor: 'pointer'
              }}>
              ✏️ Editar
            </button>
            {p.status === 'vendido' ? (
              <>
                <span style={{
                  background: '#e8f5e9', color: '#2e7d32',
                  borderRadius: 6, padding: '4px 8px',
                  fontSize: 12, fontWeight: 600
                }}>
                  ✓ Vendido
                </span>
                <button
                  onClick={() => handleMarkSold(p.id, p.status)}
                  style={{
                    background: 'white', color: '#333', border: '1px solid #ccc',
                    borderRadius: 8, padding: '6px 12px', fontSize: 12,
                    cursor: 'pointer', marginTop: 4
                  }}>
                  Reactivar
                </button>
                <button
                  onClick={() => handleRequestReview(p)}
                  style={{
                    background: reviewCopiedId === p.id ? '#fff9e6' : '#fffbf0',
                    color: '#b8860b', border: '1px solid #f0d060',
                    borderRadius: 8, padding: '6px 10px', fontSize: 12, cursor: 'pointer'
                  }}>
                  {reviewCopiedId === p.id ? '✓ Link copiado' : '⭐ Pedir reseña'}
                </button>
              </>
            ) : (
              <button
                onClick={() => handleMarkSold(p.id, p.status)}
                style={{
                  background: 'white', color: '#666', border: '1px solid #ddd',
                  borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer'
                }}>
                Marcar como vendido
              </button>
            )}
            <button
              onClick={() => handleCopyLink(p.id)}
              style={{
                background: '#f0f0f0', color: '#333',
                border: 'none', borderRadius: 8, padding: '6px 10px',
                fontSize: 12, cursor: 'pointer'
              }}>
              {copiedId === p.id ? '✓ Copiado' : 'Copiar link'}
            </button>
            <button
              onClick={() => handleDeleteProduct(p.id)}
              style={{
                background: '#fff0f0', color: '#c0392b',
                border: 'none', borderRadius: 8, padding: '6px 10px',
                fontSize: 14, cursor: 'pointer'
              }}>
              🗑️
            </button>
          </div>
        </div>
      ))}

      {/* MODAL DE EDICIÓN */}
      {editingProduct && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 16
        }}>
          <div style={{
            background: '#fff', borderRadius: 16, padding: 24,
            width: '100%', maxWidth: 420, boxSizing: 'border-box'
          }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 18 }}>Editar producto</h3>

            {/* Preview imagen */}
            {(editPreview || editingProduct.image_url) && (
              <img src={editPreview || editingProduct.image_url} alt="preview"
                style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 10, marginBottom: 12 }} />
            )}

            {/* Cambiar foto */}
            <label style={{ display: 'block', padding: 10, background: '#f0f0f0', borderRadius: 10,
              textAlign: 'center', cursor: 'pointer', marginBottom: 12, fontSize: 14 }}>
              {editFile ? '✅ Nueva foto lista' : '📸 Cambiar foto'}
              <input type="file" accept="image/*" style={{ display: 'none' }}
                onChange={(e) => {
                  const f = e.target.files[0]
                  if (!f) return
                  setEditFile(f)
                  setEditPreview(URL.createObjectURL(f))
                }} />
            </label>

            <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Nombre del producto *"
              style={{ width: '100%', padding: 12, marginBottom: 10, fontSize: 15, boxSizing: 'border-box', borderRadius: 8, border: '1px solid #ddd' }} />
            <input value={editPrice} onChange={(e) => setEditPrice(e.target.value)}
              placeholder="Precio *" type="number" inputMode="decimal"
              style={{ width: '100%', padding: 12, marginBottom: 10, fontSize: 15, boxSizing: 'border-box', borderRadius: 8, border: '1px solid #ddd' }} />
            <input value={editCategory} onChange={(e) => setEditCategory(e.target.value)}
              placeholder="Categoría (opcional)"
              style={{ width: '100%', padding: 12, marginBottom: 16, fontSize: 15, boxSizing: 'border-box', borderRadius: 8, border: '1px solid #ddd' }} />

            <button onClick={handleSaveEdit} disabled={savingEdit}
              style={{ width: '100%', padding: 14, background: savingEdit ? '#ccc' : '#000',
                color: 'white', border: 'none', borderRadius: 10, fontSize: 16,
                fontWeight: 'bold', marginBottom: 10, cursor: savingEdit ? 'not-allowed' : 'pointer' }}>
              {savingEdit ? 'Guardando...' : 'Guardar cambios'}
            </button>
            <button onClick={() => setEditingProduct(null)} disabled={savingEdit}
              style={{ width: '100%', padding: 12, background: 'none', border: '1px solid #ddd',
                borderRadius: 10, fontSize: 15, cursor: 'pointer', color: '#666' }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

    </div>
  )
}

export default Dashboard
