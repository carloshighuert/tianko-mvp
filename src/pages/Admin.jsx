import { useEffect, useRef, useState } from 'react'
import { supabase } from '../supabaseClient'
import BulkUpload from '../components/BulkUpload'

const ADMIN_PASS = 'tianko2026'

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #ddd',
  fontSize: 15,
  marginBottom: 10,
  boxSizing: 'border-box',
  background: '#ffffff',
  color: '#111111',
  WebkitTextFillColor: '#111111'
}

const btnPrimary = {
  width: '100%',
  padding: 12,
  background: '#111',
  color: 'white',
  border: 'none',
  borderRadius: 10,
  fontSize: 15,
  fontWeight: 700,
  cursor: 'pointer'
}

const sectionTitle = { fontSize: 16, fontWeight: 700, margin: '0 0 14px', color: '#111' }

const DAYS = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo']

function HubSelectorWidget({ hubs, list, onUpdate, onRemove, onAdd }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <p style={{ fontWeight: 600, fontSize: 14, color: '#333', margin: '0 0 8px' }}>
        ¿En qué tianguis tiene puesto?
      </p>
      {list.map((sh, index) => (
        <div key={index} style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          <select value={sh.hub_id} onChange={e => onUpdate(index, 'hub_id', e.target.value)}
            style={{ flex: 2, padding: 8, borderRadius: 8, border: '1px solid #ddd', fontSize: 14 }}>
            <option value="">Selecciona tianguis</option>
            {hubs.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
          <select value={sh.day_of_week} onChange={e => onUpdate(index, 'day_of_week', e.target.value)}
            style={{ flex: 1, padding: 8, borderRadius: 8, border: '1px solid #ddd', fontSize: 14 }}>
            <option value="">Día</option>
            {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <button onClick={() => onRemove(index)}
            style={{ padding: '8px 10px', background: '#fee', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
            ✕
          </button>
        </div>
      ))}
      <button onClick={onAdd}
        style={{ padding: '8px 16px', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>
        + Agregar tianguis
      </button>
    </div>
  )
}

// ── Compresión de imagen ─────────────────────────────────────────
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

// ────────────────────────────────────────────────────────────────
// Tab 1: Tiendas
// ────────────────────────────────────────────────────────────────
function TabTiendas({ hubs }) {
  const isCreatingRef = useRef(false)
  const [sellerName, setSellerName] = useState('')
  const [sellerPhone, setSellerPhone] = useState('')
  const [storeName, setStoreName] = useState('')
  const [storeDesc, setStoreDesc] = useState('')
  const [selectedHubs, setSelectedHubs] = useState([])
  const [saving, setSaving] = useState(false)
  const [creatingStore, setCreatingStore] = useState(false)
  const [result, setResult] = useState(null)
  const [stores, setStores] = useState([])
  const [loadingStores, setLoadingStores] = useState(true)

  const [editingId, setEditingId] = useState(null)
  const [editStoreName, setEditStoreName] = useState('')
  const [editStoreDesc, setEditStoreDesc] = useState('')
  const [editStoreWA, setEditStoreWA] = useState('')
  const [editHubs, setEditHubs] = useState([])
  const [savingEdit, setSavingEdit] = useState(false)

  useEffect(() => { fetchStores() }, [])

  async function fetchStores() {
    const { data } = await supabase
      .from('stores')
      .select('id, name, description, whatsapp_number, seller_id, sellers(name)')
      .order('created_at', { ascending: false })
    setStores(data || [])
    setLoadingStores(false)
  }

  const updateSelectedHub = (i, field, val) => {
    const u = [...selectedHubs]; u[i] = { ...u[i], [field]: val }; setSelectedHubs(u)
  }
  const updateEditHub = (i, field, val) => {
    const u = [...editHubs]; u[i] = { ...u[i], [field]: val }; setEditHubs(u)
  }

  async function startEditStore(s) {
    setEditingId(s.id)
    setEditStoreName(s.name || '')
    setEditStoreDesc(s.description || '')
    setEditStoreWA(s.whatsapp_number || '')
    const { data } = await supabase.from('store_hubs').select('*').eq('store_id', s.id)
    setEditHubs(data?.map(sh => ({ hub_id: sh.hub_id, day_of_week: sh.day_of_week || '' })) || [])
  }

  function cancelEditStore() { setEditingId(null) }

  async function handleSaveEditStore(storeId) {
    if (!editStoreName.trim()) { alert('Nombre es obligatorio'); return }
    setSavingEdit(true)
    try {
      const { error } = await supabase
        .from('stores')
        .update({ name: editStoreName.trim(), description: editStoreDesc.trim() || null, whatsapp_number: editStoreWA.replace(/\D/g, '') })
        .eq('id', storeId)
      if (error) throw error
      await supabase.from('store_hubs').delete().eq('store_id', storeId)
      for (const sh of editHubs) {
        if (sh.hub_id) await supabase.from('store_hubs').insert({ store_id: storeId, hub_id: sh.hub_id, day_of_week: sh.day_of_week || null })
      }
      setEditingId(null)
      fetchStores()
    } catch (err) {
      console.error('[handleSaveEditStore]', err)
      alert(`Error: ${err.message}`)
    } finally { setSavingEdit(false) }
  }

  async function handleDeleteStore(s) {
    if (!confirm(`¿Eliminar tienda "${s.name}" y todos sus productos? Esta acción no se puede deshacer.`)) return
    try {
      await supabase.from('store_hubs').delete().eq('store_id', s.id)
      await supabase.from('products').delete().eq('store_id', s.id)
      await supabase.from('stores').delete().eq('id', s.id)
      if (s.seller_id) await supabase.from('sellers').delete().eq('id', s.seller_id)
      fetchStores()
    } catch (err) {
      console.error('[handleDeleteStore]', err)
      alert(`Error: ${err.message}`)
    }
  }

  async function handleCreate() {
    console.log('=== INICIO handleCreateStore ===', Date.now())
    if (isCreatingRef.current) {
      console.log('BLOQUEADO - ya está creando')
      return
    }
    isCreatingRef.current = true
    if (!sellerName.trim() || !sellerPhone.trim() || !storeName.trim()) {
      isCreatingRef.current = false
      alert('Nombre del vendedor, teléfono y nombre de tienda son obligatorios')
      return
    }
    setCreatingStore(true)
    setSaving(true)
    setResult(null)
    try {
      const phone = sellerPhone.replace(/\D/g, '').slice(-10)

      let sellerId = null
      const { data: existingSellers } = await supabase
        .from('sellers')
        .select('id')
        .eq('phone', phone)
        .limit(1)

      if (existingSellers && existingSellers.length > 0) {
        sellerId = existingSellers[0].id
        console.log('Seller existente reutilizado:', sellerId)
      } else {
        const { data: newSeller, error: sellerError } = await supabase
          .from('sellers')
          .insert({ name: sellerName.trim(), phone, user_id: null })
          .select()
          .single()
        if (sellerError) {
          if (sellerError.code === '23505') {
            console.log('Constraint violado - buscando seller existente')
            const { data: existing } = await supabase
              .from('sellers')
              .select('id')
              .eq('phone', phone)
              .single()
            sellerId = existing.id
          } else {
            throw sellerError
          }
        } else {
          sellerId = newSeller.id
          console.log('Nuevo seller creado:', sellerId)
        }
      }

      console.log('Insertando store...', storeName)
      const { data: newStore, error: storeErr } = await supabase
        .from('stores')
        .insert([{ name: storeName.trim(), description: storeDesc.trim() || null, whatsapp_number: phone, seller_id: sellerId }])
        .select().single()
      if (storeErr) throw storeErr
      console.log('Store creada:', newStore)

      for (const sh of selectedHubs) {
        if (sh.hub_id) await supabase.from('store_hubs').insert({ store_id: newStore.id, hub_id: sh.hub_id, day_of_week: sh.day_of_week || null })
      }

      setResult({ storeId: newStore.id, storeName: newStore.name })
      setSellerName(''); setSellerPhone(''); setStoreName(''); setStoreDesc(''); setSelectedHubs([])
      fetchStores()
    } catch (err) {
      console.error('[TabTiendas] handleCreate:', err)
      alert(`Error: ${err.message}`)
    } finally {
      setSaving(false)
      setCreatingStore(false)
      isCreatingRef.current = false
      console.log('=== FIN handleCreateStore ===', Date.now())
    }
  }

  return (
    <div>
      <div style={{ background: 'white', borderRadius: 12, padding: 18, marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <p style={sectionTitle}>Crear tienda para vendedor</p>

        <input style={inputStyle} placeholder="Nombre del vendedor *"
          value={sellerName} onChange={e => setSellerName(e.target.value)} />
        <input style={inputStyle} placeholder="Teléfono/WhatsApp del vendedor * (10 dígitos)"
          value={sellerPhone} onChange={e => setSellerPhone(e.target.value)} type="tel" />
        <input style={inputStyle} placeholder="Nombre de la tienda *"
          value={storeName} onChange={e => setStoreName(e.target.value)} />
        <input style={inputStyle} placeholder="Descripción (opcional)"
          value={storeDesc} onChange={e => setStoreDesc(e.target.value)} />

        <HubSelectorWidget hubs={hubs} list={selectedHubs}
          onUpdate={updateSelectedHub}
          onRemove={i => setSelectedHubs(selectedHubs.filter((_, idx) => idx !== i))}
          onAdd={() => setSelectedHubs([...selectedHubs, { hub_id: '', day_of_week: '' }])} />

        <button type="button" style={{ ...btnPrimary, opacity: creatingStore ? 0.6 : 1 }} onClick={handleCreate} disabled={creatingStore}>
          {creatingStore ? 'Creando...' : 'Crear tienda →'}
        </button>

        {result && (
          <div style={{ marginTop: 12, padding: 12, background: '#f0fff4', borderRadius: 8, border: '1px solid #25D366' }}>
            <p style={{ margin: 0, fontWeight: 700, color: '#1a7a3c' }}>✓ Tienda creada</p>
            <a href={`/tienda/${result.storeId}`} target="_blank" rel="noreferrer"
              style={{ fontSize: 13, color: '#007bff' }}>
              Ver /tienda/{result.storeId} →
            </a>
          </div>
        )}
      </div>

      {/* Lista de tiendas */}
      <div style={{ background: 'white', borderRadius: 12, padding: 18, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <p style={sectionTitle}>Tiendas existentes ({stores.length})</p>
        {loadingStores ? <p style={{ color: '#999', fontSize: 14 }}>Cargando...</p> : (
          stores.map(s => (
            <div key={s.id} style={{ padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
              {editingId === s.id ? (
                <div>
                  <input style={{ ...inputStyle, marginBottom: 8 }} placeholder="Nombre *" value={editStoreName} onChange={e => setEditStoreName(e.target.value)} />
                  <input style={{ ...inputStyle, marginBottom: 8 }} placeholder="Descripción" value={editStoreDesc} onChange={e => setEditStoreDesc(e.target.value)} />
                  <input style={{ ...inputStyle, marginBottom: 8 }} placeholder="WhatsApp" value={editStoreWA} onChange={e => setEditStoreWA(e.target.value)} type="tel" />
                  <HubSelectorWidget hubs={hubs} list={editHubs}
                    onUpdate={updateEditHub}
                    onRemove={i => setEditHubs(editHubs.filter((_, idx) => idx !== i))}
                    onAdd={() => setEditHubs([...editHubs, { hub_id: '', day_of_week: '' }])} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={cancelEditStore} style={{ flex: 1, padding: 10, background: 'none', border: '1px solid #ddd', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>Cancelar</button>
                    <button onClick={() => handleSaveEditStore(s.id)} disabled={savingEdit}
                      style={{ flex: 2, padding: 10, background: '#111', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 700, opacity: savingEdit ? 0.6 : 1 }}>
                      {savingEdit ? 'Guardando...' : 'Guardar'}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: '#111' }}>{s.name}</p>
                    <p style={{ margin: 0, fontSize: 12, color: '#666' }}>{s.sellers?.name}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <a href={`/tienda/${s.id}`} target="_blank" rel="noreferrer"
                      style={{ fontSize: 12, color: '#007bff', whiteSpace: 'nowrap' }}>Ver →</a>
                    <button onClick={() => startEditStore(s)}
                      style={{ background: 'none', border: '1px solid #ddd', borderRadius: 6, padding: '2px 8px', fontSize: 12, color: '#555', cursor: 'pointer' }}>✏️</button>
                    <button onClick={() => handleDeleteStore(s)}
                      style={{ background: 'none', border: '1px solid #fcc', borderRadius: 6, padding: '2px 8px', fontSize: 12, color: '#c0392b', cursor: 'pointer' }}>🗑️</button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────
// Tab 2: Productos
// ────────────────────────────────────────────────────────────────
function TabProductos({ hubs }) {
  const [stores, setStores] = useState([])
  const [selectedStoreId, setSelectedStoreId] = useState('')
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [products, setProducts] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(true)

  const [editingProductId, setEditingProductId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [newImage, setNewImage] = useState(null)
  const [newImagePreview, setNewImagePreview] = useState(null)
  const [savingEdit, setSavingEdit] = useState(false)

  useEffect(() => {
    fetchStores()
    fetchRecentProducts()
  }, [])

  async function fetchStores() {
    const { data } = await supabase
      .from('stores')
      .select('id, name, sellers(name)')
      .order('name')
    setStores(data || [])
  }

  async function fetchRecentProducts() {
    const { data: productsData, error: prodError } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)

    console.log('Productos:', productsData, prodError)

    const { data: storesData } = await supabase
      .from('stores')
      .select('id, name')

    const productsWithStore = productsData?.map(p => ({
      ...p,
      storeName: storesData?.find(s => s.id === p.store_id)?.name || 'Sin tienda'
    }))

    setProducts(productsWithStore || [])
    setLoadingProducts(false)
  }

  function startEditProduct(p) {
    setEditingProductId(p.id)
    setEditTitle(p.title || '')
    setEditPrice(String(p.price || ''))
    setEditCategory(p.category || '')
    setNewImage(null)
    setNewImagePreview(null)
  }

  function cancelEditProduct() { setEditingProductId(null) }

  async function handleSaveEditProduct(p) {
    if (!editTitle.trim() || !editPrice) { alert('Título y precio son obligatorios'); return }
    if (isNaN(editPrice) || parseFloat(editPrice) <= 0) { alert('El precio debe ser mayor a $0'); return }
    setSavingEdit(true)
    try {
      let imageUrl = p.image_url

      console.log('1. newImage existe:', !!newImage)

      if (newImage) {
        const fileName = `${p.store_id}/admin-${Date.now()}.jpg`
        console.log('2. Subiendo archivo:', fileName)

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('products')
          .upload(fileName, newImage, { contentType: 'image/jpeg', upsert: true })

        console.log('3. Upload result:', uploadData, uploadError)

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('products')
            .getPublicUrl(fileName)

          console.log('4. URL pública:', urlData?.publicUrl)
          imageUrl = urlData?.publicUrl
        }
      }

      console.log('5. imageUrl final:', imageUrl)

      const { error: updateError } = await supabase
        .from('products')
        .update({ title: editTitle.trim(), price: parseFloat(editPrice), category: editCategory.trim() || null, image_url: imageUrl })
        .eq('id', p.id)

      console.log('6. Update result:', updateError)

      if (updateError) throw updateError

      setProducts(prev => prev.map(item =>
        item.id === p.id
          ? { ...item, title: editTitle.trim(), price: parseFloat(editPrice), category: editCategory.trim() || null, image_url: imageUrl, storeName: item.storeName }
          : item
      ))

      setEditingProductId(null)
      setNewImage(null)
      setNewImagePreview(null)
    } catch (err) {
      console.error('[handleSaveEditProduct]', err)
      alert(`Error: ${err.message}`)
    } finally { setSavingEdit(false) }
  }

  async function handleDeleteProduct(p) {
    if (!confirm(`¿Eliminar "${p.title}"?`)) return
    try {
      const { error } = await supabase.from('products').delete().eq('id', p.id)
      if (error) throw error
      fetchRecentProducts()
    } catch (err) {
      console.error('[handleDeleteProduct]', err)
      alert(`Error: ${err.message}`)
    }
  }

  function handleFileSelect(f) {
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  async function uploadImage(storeId) {
    if (!file) return null
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
    if (!allowedTypes.includes(file.type)) { alert('Solo JPG, PNG o WEBP'); return null }
    if (file.size > 15 * 1024 * 1024) { alert('Máximo 15MB'); return null }
    try {
      const compressed = await compressImage(file)
      const fileName = `${storeId}/${Date.now()}.jpg`
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

  async function handleCreate() {
    if (!selectedStoreId) { alert('Selecciona una tienda'); return }
    if (!title.trim() || !price) { alert('Título y precio son obligatorios'); return }
    if (isNaN(price) || parseFloat(price) <= 0) { alert('El precio debe ser mayor a $0'); return }
    setSaving(true)
    try {
      const image_url = await uploadImage(selectedStoreId)
      const { data: newProduct, error: productError } = await supabase
        .from('products')
        .insert([{
          title: title.trim(),
          price: parseFloat(price),
          category: category.trim() || null,
          image_url,
          store_id: selectedStoreId,
          status: 'publicado'
        }])
        .select()
        .single()
      if (productError) {
        if (productError.code === '23505') {
          console.log('Producto duplicado bloqueado por constraint')
        } else {
          throw productError
        }
      } else {
        setTitle(''); setPrice(''); setCategory(''); setFile(null); setPreview(null)
        fetchRecentProducts()
        alert('✓ Producto publicado')
      }
    } catch (err) {
      console.error('[TabProductos] handleCreate:', err)
      alert(`Error: ${err.message}`)
    } finally { setSaving(false) }
  }

  return (
    <div>
      {/* Formulario producto individual */}
      <div style={{ background: 'white', borderRadius: 12, padding: 18, marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <p style={sectionTitle}>Subir producto</p>

        <select
          value={selectedStoreId}
          onChange={e => setSelectedStoreId(e.target.value)}
          style={{ ...inputStyle, appearance: 'auto' }}
        >
          <option value="">Seleccionar tienda *</option>
          {stores.map(s => (
            <option key={s.id} value={s.id}>
              {s.name}{s.sellers?.name ? ` (${s.sellers.name})` : ''}
            </option>
          ))}
        </select>

        {/* Foto */}
        <label style={{
          display: 'block', padding: '10px 12px', borderRadius: 8, border: '1px dashed #aaa',
          textAlign: 'center', cursor: 'pointer', marginBottom: 10, fontSize: 14, color: '#555'
        }}>
          {preview
            ? <img src={preview} alt="preview" style={{ width: '100%', maxHeight: 140, objectFit: 'cover', borderRadius: 6 }} />
            : '📷 Seleccionar foto del producto'}
          <input type="file" accept="image/*" onChange={e => handleFileSelect(e.target.files[0])} style={{ display: 'none' }} />
        </label>

        <input style={inputStyle} placeholder="Título *" value={title} onChange={e => setTitle(e.target.value)} />
        <input style={inputStyle} placeholder="Precio *" value={price} onChange={e => setPrice(e.target.value)} type="number" inputMode="decimal" />
        <input style={inputStyle} placeholder="Categoría (opcional)" value={category} onChange={e => setCategory(e.target.value)} />

        <button style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }} onClick={handleCreate} disabled={saving}>
          {saving ? 'Publicando...' : 'Publicar producto →'}
        </button>
      </div>

      {/* BulkUpload — requiere tienda seleccionada */}
      <div style={{ background: 'white', borderRadius: 12, padding: 18, marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <p style={sectionTitle}>Subir desde foto de puesto (IA)</p>
        {selectedStoreId
          ? <BulkUpload storeId={selectedStoreId} onComplete={fetchRecentProducts} />
          : <p style={{ color: '#999', fontSize: 14, margin: 0 }}>Selecciona una tienda arriba para usar la carga masiva con IA.</p>
        }
      </div>

      {/* Lista últimos productos */}
      <div style={{ background: 'white', borderRadius: 12, padding: 18, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <p style={sectionTitle}>Últimos 20 productos</p>
        {loadingProducts ? <p style={{ color: '#999', fontSize: 14 }}>Cargando...</p> : (
          products.map(p => (
            <div key={p.id} style={{ marginBottom: 8 }}>
              {/* Card siempre visible */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px', background: '#f9f9f9', borderRadius: 8 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', minWidth: 0 }}>
                  {p.image_url && (
                    <img src={p.image_url} alt={p.title}
                      style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
                  )}
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: '#111',
                      overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{p.title}</p>
                    <p style={{ margin: 0, color: '#666', fontSize: 12 }}>${p.price} · {p.storeName}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 8 }}>
                  <a href={`/producto/${p.id}`} target="_blank" rel="noreferrer"
                    style={{ color: '#2563eb', fontSize: 13, textDecoration: 'none', padding: '6px 8px' }}>Ver →</a>
                  <button onClick={() => startEditProduct(p)}
                    style={{ padding: '6px 10px', background: '#fff', border: '1px solid #ccc', borderRadius: 8, cursor: 'pointer', fontSize: 16 }}>✏️</button>
                  <button onClick={() => handleDeleteProduct(p)}
                    style={{ padding: '6px 10px', background: '#fee2e2', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 16 }}>🗑️</button>
                </div>
              </div>

              {/* Formulario inline debajo del card */}
              {editingProductId === p.id && (
                <div style={{ marginTop: 6, padding: 12, background: 'white', borderRadius: 8, border: '1px solid #e0e0e0' }}>
                  {p.image_url && !newImagePreview && (
                    <img src={p.image_url} alt="actual"
                      style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }} />
                  )}
                  <label style={{
                    display: 'block', padding: '10px', background: '#f5f5f5',
                    borderRadius: 8, textAlign: 'center', cursor: 'pointer',
                    border: '1px dashed #ddd', marginBottom: newImagePreview ? 8 : 12,
                    fontSize: 13, color: '#555'
                  }}>
                    📷 {newImagePreview ? 'Cambiar foto' : 'Subir nueva foto'}
                    <input type="file" accept="image/*" style={{ display: 'none' }}
                      onChange={async e => {
                        const f = e.target.files[0]
                        if (!f) return
                        const compressed = await compressImage(f)
                        setNewImage(compressed)
                        setNewImagePreview(URL.createObjectURL(f))
                      }} />
                  </label>
                  {newImagePreview && (
                    <img src={newImagePreview} alt="nueva"
                      style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8, marginBottom: 12 }} />
                  )}
                  <input style={{ ...inputStyle, marginBottom: 8 }} placeholder="Título *" value={editTitle} onChange={e => setEditTitle(e.target.value)} />
                  <input style={{ ...inputStyle, marginBottom: 8 }} placeholder="Precio *" value={editPrice} onChange={e => setEditPrice(e.target.value)} type="number" inputMode="decimal" />
                  <input style={{ ...inputStyle, marginBottom: 8 }} placeholder="Categoría" value={editCategory} onChange={e => setEditCategory(e.target.value)} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={cancelEditProduct}
                      style={{ flex: 1, padding: 10, background: 'none', border: '1px solid #ddd', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>
                      Cancelar
                    </button>
                    <button onClick={() => handleSaveEditProduct(p)} disabled={savingEdit}
                      style={{ flex: 2, padding: 10, background: '#111', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 700, opacity: savingEdit ? 0.6 : 1 }}>
                      {savingEdit ? 'Guardando...' : 'Guardar'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────
// Tab 3: Hubs
// ────────────────────────────────────────────────────────────────
function TabHubs({ hubs, onHubsChange }) {
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [schedule, setSchedule] = useState('')
  const [hubType, setHubType] = useState('tianguis')
  const [saving, setSaving] = useState(false)

  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editLocation, setEditLocation] = useState('')
  const [editSchedule, setEditSchedule] = useState('')
  const [editType, setEditType] = useState('tianguis')
  const [savingEdit, setSavingEdit] = useState(false)

  async function handleDeleteHub(hub) {
    if (!confirm(`¿Eliminar el tianguis "${hub.name}"?`)) return
    try {
      const { error } = await supabase.from('market_hubs').delete().eq('id', hub.id)
      if (error) throw error
      await onHubsChange()
    } catch (err) {
      console.error('[handleDeleteHub]', err)
      alert(`Error: ${err.message}`)
    }
  }

  async function handleCreate() {
    if (!name.trim() || !location.trim() || !schedule.trim()) {
      alert('Nombre, ubicación y horario son obligatorios')
      return
    }
    setSaving(true)
    try {
      const { data: newHub, error: hubError } = await supabase
        .from('market_hubs')
        .insert({ name: name.trim(), location: location.trim(), schedule: schedule.trim(), hub_type: hubType })
        .select()
        .single()
      if (hubError) {
        if (hubError.code === '23505') {
          console.log('Hub duplicado bloqueado por constraint')
        } else {
          throw hubError
        }
      } else {
        setName(''); setLocation(''); setSchedule(''); setHubType('tianguis')
        await onHubsChange()
      }
    } catch (err) {
      console.error('[TabHubs] handleCreate:', err)
      alert(`Error: ${err.message}`)
    } finally { setSaving(false) }
  }

  function startEdit(hub) {
    setEditingId(hub.id)
    setEditName(hub.name)
    setEditLocation(hub.location)
    setEditSchedule(hub.schedule)
    setEditType(hub.hub_type || 'tianguis')
  }

  function cancelEdit() { setEditingId(null) }

  async function handleSaveEdit(hubId) {
    if (!editName.trim() || !editLocation.trim() || !editSchedule.trim()) {
      alert('Todos los campos son obligatorios')
      return
    }
    setSavingEdit(true)
    try {
      const { error } = await supabase
        .from('market_hubs')
        .update({ name: editName.trim(), location: editLocation.trim(), schedule: editSchedule.trim(), hub_type: editType })
        .eq('id', hubId)
      if (error) throw error
      setEditingId(null)
      await onHubsChange()
    } catch (err) {
      console.error('[TabHubs] handleSaveEdit:', err)
      alert(`Error: ${err.message}`)
    } finally { setSavingEdit(false) }
  }

  return (
    <div>
      {/* Formulario nuevo hub */}
      <div style={{ background: 'white', borderRadius: 12, padding: 18, marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <p style={sectionTitle}>Crear tianguis / bazar</p>

        <input style={inputStyle} placeholder="Nombre del tianguis *" value={name} onChange={e => setName(e.target.value)} />
        <input style={inputStyle} placeholder="Ubicación / dirección *" value={location} onChange={e => setLocation(e.target.value)} />
        <input style={inputStyle} placeholder='Horario * (ej: "Sábados 9am - 6pm")' value={schedule} onChange={e => setSchedule(e.target.value)} />

        <select value={hubType} onChange={e => setHubType(e.target.value)} style={{ ...inputStyle, appearance: 'auto' }}>
          <option value="tianguis">Tianguis</option>
          <option value="bazar">Bazar</option>
          <option value="mercado">Mercado</option>
        </select>

        <button style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }} onClick={handleCreate} disabled={saving}>
          {saving ? 'Creando...' : 'Crear tianguis →'}
        </button>
      </div>

      {/* Lista de hubs con edición */}
      <div style={{ background: 'white', borderRadius: 12, padding: 18, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <p style={sectionTitle}>Tianguis existentes ({hubs.length})</p>
        {hubs.map(h => (
          <div key={h.id} style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
            {editingId === h.id ? (
              <div>
                <input style={{ ...inputStyle, marginBottom: 8 }} value={editName} onChange={e => setEditName(e.target.value)} placeholder="Nombre *" />
                <input style={{ ...inputStyle, marginBottom: 8 }} value={editLocation} onChange={e => setEditLocation(e.target.value)} placeholder="Ubicación *" />
                <input style={{ ...inputStyle, marginBottom: 8 }} value={editSchedule} onChange={e => setEditSchedule(e.target.value)} placeholder="Horario *" />
                <select value={editType} onChange={e => setEditType(e.target.value)} style={{ ...inputStyle, appearance: 'auto', marginBottom: 8 }}>
                  <option value="tianguis">Tianguis</option>
                  <option value="bazar">Bazar</option>
                  <option value="mercado">Mercado</option>
                </select>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={cancelEdit} style={{ flex: 1, padding: 10, background: 'none', border: '1px solid #ddd', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>
                    Cancelar
                  </button>
                  <button onClick={() => handleSaveEdit(h.id)} disabled={savingEdit}
                    style={{ flex: 2, padding: 10, background: '#111', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 700, opacity: savingEdit ? 0.6 : 1 }}>
                    {savingEdit ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: '#111' }}>
                    {h.name}
                    <span style={{ marginLeft: 6, fontSize: 11, background: '#f0f0f0', borderRadius: 4, padding: '1px 6px', color: '#666' }}>
                      {h.hub_type || 'tianguis'}
                    </span>
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: '#666' }}>{h.location}</p>
                  <p style={{ margin: '1px 0 0', fontSize: 12, color: '#888' }}>{h.schedule}</p>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button onClick={() => startEdit(h)}
                    style={{ background: 'none', border: '1px solid #ddd', borderRadius: 7, padding: '5px 10px', cursor: 'pointer', fontSize: 13, color: '#555', whiteSpace: 'nowrap' }}>
                    ✏️ Editar
                  </button>
                  <button onClick={() => handleDeleteHub(h)}
                    style={{ background: 'none', border: '1px solid #fcc', borderRadius: 7, padding: '5px 10px', cursor: 'pointer', fontSize: 13, color: '#c0392b', whiteSpace: 'nowrap' }}>
                    🗑️
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────
// Panel principal Admin
// ────────────────────────────────────────────────────────────────
function Admin() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('isAdmin') === 'true')
  const [pass, setPass] = useState('')
  const [passError, setPassError] = useState(false)
  const [activeTab, setActiveTab] = useState('tiendas')
  const [hubs, setHubs] = useState([])

  useEffect(() => {
    if (authed) fetchHubs()
  }, [authed])

  async function fetchHubs() {
    const { data } = await supabase
      .from('market_hubs')
      .select('id, name, location, schedule, hub_type')
      .order('name')
    setHubs(data || [])
  }

  function handleLogin() {
    if (pass === ADMIN_PASS) {
      sessionStorage.setItem('isAdmin', 'true')
      setAuthed(true)
      setPassError(false)
    } else {
      setPassError(true)
    }
  }

  function handleLogout() {
    sessionStorage.removeItem('isAdmin')
    setAuthed(false)
    setPass('')
  }

  // ── Pantalla de contraseña ───────────────────────────────────
  if (!authed) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f4f4f4', padding: 24 }}>
      <img src="/tianko-logo.png" alt="Tianko" style={{ height: 74, width: 'auto', marginBottom: 24 }} />
      <div style={{ background: 'white', borderRadius: 16, padding: 28, width: '100%', maxWidth: 340, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        <p style={{ margin: '0 0 16px', fontWeight: 700, fontSize: 17, color: '#111', textAlign: 'center' }}>
          Panel Admin
        </p>
        <input
          type="password"
          placeholder="Contraseña admin"
          value={pass}
          onChange={e => { setPass(e.target.value); setPassError(false) }}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          style={{ ...inputStyle, marginBottom: passError ? 6 : 12 }}
        />
        {passError && (
          <p style={{ margin: '0 0 12px', fontSize: 13, color: '#c0392b' }}>Contraseña incorrecta</p>
        )}
        <button style={btnPrimary} onClick={handleLogin}>Entrar</button>
      </div>
    </div>
  )

  // ── Panel autenticado ────────────────────────────────────────
  const tabs = [
    { key: 'tiendas', label: 'Tiendas' },
    { key: 'productos', label: 'Productos' },
    { key: 'hubs', label: 'Hubs' }
  ]

  return (
    <div style={{ background: '#f4f4f4', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid #eee', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href="/"><img src="/tianko-logo.png" alt="Tianko" style={{ height: 44, width: 'auto' }} /></a>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>Panel Admin</span>
        </div>
        <button onClick={handleLogout}
          style={{ background: 'none', border: '1px solid #ddd', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: '#555' }}>
          Salir
        </button>
      </div>

      {/* Tabs */}
      <div style={{ background: 'white', borderBottom: '1px solid #eee', display: 'flex', padding: '0 20px' }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === t.key ? '2px solid #111' : '2px solid transparent',
              padding: '12px 16px',
              fontSize: 14,
              fontWeight: activeTab === t.key ? 700 : 400,
              color: activeTab === t.key ? '#111' : '#666',
              cursor: 'pointer'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div style={{ maxWidth: 540, margin: '0 auto', padding: 16 }}>
        {activeTab === 'tiendas' && <TabTiendas hubs={hubs} />}
        {activeTab === 'productos' && <TabProductos hubs={hubs} />}
        {activeTab === 'hubs' && <TabHubs hubs={hubs} onHubsChange={fetchHubs} />}
      </div>

    </div>
  )
}

export default Admin
