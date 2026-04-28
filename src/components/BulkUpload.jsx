// ============================================================
// 📁 components/BulkUpload.jsx — NUEVO
// ============================================================
// PROPÓSITO:
//   Componente que permite al vendedor tomar 1 foto del puesto
//   completo y detectar múltiples productos automáticamente.
//
// FLUJO:
//   1. Vendedor toma foto del puesto
//   2. Se manda a /api/detect-products
//   3. Claude detecta los productos visibles
//   4. Vendedor ve la lista y agrega precio a cada uno
//   5. Se crean todos los productos de una vez
//
// USO:
//   <BulkUpload storeId={store.id} onComplete={fetchProducts} />
// ============================================================

import { useState } from 'react'
import { supabase } from '../supabaseClient'

function BulkUpload({ storeId, onComplete }) {

  const [step, setStep] = useState('idle') 
  // idle → analyzing → confirm → saving → done

  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [detectedProducts, setDetectedProducts] = useState([])
  const [error, setError] = useState('')

  // ============================================================
  // 🗜️ COMPRESIÓN (igual que en Dashboard)
  // ============================================================
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
              if (!blob) { reject(new Error('Error al comprimir')); return }
              resolve(new File([blob], file.name, { type: 'image/jpeg' }))
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

  // ============================================================
  // 🔄 CONVERTIR ARCHIVO A BASE64
  // ============================================================
  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        // Remover el prefijo "data:image/jpeg;base64,"
        const base64 = reader.result.split(',')[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  // ============================================================
  // 📸 SELECCIONAR FOTO Y ANALIZAR
  // ============================================================
  async function handlePhotoSelect(selectedFile) {
    if (!selectedFile) return
    setError('')
    setFile(selectedFile)
    setPreview(URL.createObjectURL(selectedFile))
    setStep('analyzing')

    try {
      // Comprimir antes de mandar a la API
      const compressed = await compressImage(selectedFile)
      const base64 = await fileToBase64(compressed)

      // Llamar al endpoint serverless
      const response = await fetch('/api/detect-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, mediaType: 'image/jpeg' })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al analizar')
      }

      if (data.products.length === 0) {
        setError('No detectamos productos en esta foto. Intenta con una foto más clara del puesto.')
        setStep('idle')
        return
      }

      // Crear lista con precios vacíos para que el vendedor llene
      setDetectedProducts(data.products.map((name, i) => ({
        id: i,
        title: name,
        price: '',
        include: true // por defecto todos incluidos
      })))

      setStep('confirm')

    } catch (err) {
      console.error('[handlePhotoSelect]', err)
      setError('No pudimos analizar la foto. Intenta de nuevo.')
      setStep('idle')
    }
  }

  // ============================================================
  // ✏️ ACTUALIZAR PRODUCTO EN LA LISTA
  // ============================================================
  function updateProduct(id, field, value) {
    setDetectedProducts(prev => prev.map(p =>
      p.id === id ? { ...p, [field]: value } : p
    ))
  }

  // ============================================================
  // ☁️ SUBIR IMAGEN AL STORAGE
  // ============================================================
  async function uploadImage() {
    if (!file) return null
    try {
      const compressed = await compressImage(file)
      const fileName = `${storeId}/${Date.now()}-bulk.jpg`
      const { error } = await supabase.storage
        .from('products')
        .upload(fileName, compressed, { contentType: 'image/jpeg' })
      if (error) throw error
      const { data } = supabase.storage.from('products').getPublicUrl(fileName)
      return data.publicUrl
    } catch (err) {
      console.error('[uploadImage]', err)
      return null
    }
  }

  // ============================================================
  // 💾 GUARDAR TODOS LOS PRODUCTOS
  // ============================================================
  async function handleSaveAll() {
    const toSave = detectedProducts.filter(p => p.include && p.price)

    if (toSave.length === 0) {
      setError('Agrega el precio a al menos un producto para continuar.')
      return
    }

    setStep('saving')

    try {
      // Subir la foto una sola vez
      const image_url = await uploadImage()

      // Crear todos los productos con la misma foto
      const inserts = toSave.map(p => ({
        title: p.title,
        price: parseFloat(p.price),
        image_url,
        store_id: storeId,
        status: 'publicado'
      }))

      const { error } = await supabase.from('products').insert(inserts)
      if (error) throw error

      setStep('done')
      onComplete() // refrescar lista de productos en Dashboard

    } catch (err) {
      console.error('[handleSaveAll]', err)
      setError('Error al guardar. Intenta de nuevo.')
      setStep('confirm')
    }
  }

  // ============================================================
  // 🔄 RESETEAR
  // ============================================================
  function handleReset() {
    setStep('idle')
    setFile(null)
    setPreview(null)
    setDetectedProducts([])
    setError('')
  }

  // ============================================================
  // 🖥️ RENDER
  // ============================================================
  return (
    <div style={{
      background: '#f0f7ff',
      borderRadius: 14,
      padding: 16,
      marginBottom: 20,
      border: '1.5px dashed #007bff'
    }}>

      {/* HEADER */}
      <div style={{ marginBottom: 12 }}>
        <p style={{ margin: 0, fontWeight: 'bold', fontSize: 15 }}>
          🤖 Publicar varios productos de una foto
        </p>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#666' }}>
          Toma una foto de tu puesto y la IA detecta los productos automáticamente
        </p>
      </div>

      {/* ── IDLE: botón de foto ── */}
      {step === 'idle' && (
        <label style={{
          display: 'block',
          padding: 14,
          background: '#007bff',
          color: 'white',
          borderRadius: 10,
          textAlign: 'center',
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: 15
        }}>
          📸 Fotografiar mi puesto completo
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => handlePhotoSelect(e.target.files[0])}
            style={{ display: 'none' }}
          />
        </label>
      )}

      {/* ── ANALYZING: cargando ── */}
      {step === 'analyzing' && (
        <div style={{ textAlign: 'center', padding: 20 }}>
          {preview && (
            <img src={preview} alt="Analizando"
              style={{ width: '100%', borderRadius: 10, maxHeight: 150,
                objectFit: 'cover', marginBottom: 12, opacity: 0.7 }} />
          )}
          <p style={{ margin: 0, color: '#007bff', fontWeight: 'bold' }}>
            🤖 Analizando tu puesto...
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#666' }}>
            Detectando productos, espera un momento
          </p>
        </div>
      )}

      {/* ── CONFIRM: lista de productos detectados ── */}
      {step === 'confirm' && (
        <div>
          {preview && (
            <img src={preview} alt="Tu puesto"
              style={{ width: '100%', borderRadius: 10, maxHeight: 150,
                objectFit: 'cover', marginBottom: 12 }} />
          )}

          <p style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 'bold' }}>
            ✅ Detectamos {detectedProducts.length} productos — agrega el precio a cada uno:
          </p>

          {detectedProducts.map(p => (
            <div key={p.id} style={{
              display: 'flex', gap: 8, alignItems: 'center',
              marginBottom: 8, background: p.include ? 'white' : '#f5f5f5',
              borderRadius: 8, padding: '8px 10px',
              border: `1px solid ${p.include ? '#ddd' : '#eee'}`
            }}>
              {/* Checkbox incluir/excluir */}
              <input
                type="checkbox"
                checked={p.include}
                onChange={(e) => updateProduct(p.id, 'include', e.target.checked)}
                style={{ flexShrink: 0 }}
              />

              {/* Nombre editable */}
              <input
                value={p.title}
                onChange={(e) => updateProduct(p.id, 'title', e.target.value)}
                style={{
                  flex: 1, border: 'none', background: 'transparent',
                  fontSize: 14, outline: 'none',
                  color: p.include ? '#000' : '#999',
                  textDecoration: p.include ? 'none' : 'line-through'
                }}
              />

              {/* Precio */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                <span style={{ fontSize: 14, color: '#666' }}>$</span>
                <input
                  placeholder="Precio"
                  value={p.price}
                  onChange={(e) => updateProduct(p.id, 'price', e.target.value)}
                  type="number"
                  inputMode="decimal"
                  disabled={!p.include}
                  style={{
                    width: 70, padding: '4px 6px', borderRadius: 6,
                    border: '1px solid #ddd', fontSize: 14,
                    background: p.include ? 'white' : '#f5f5f5'
                  }}
                />
              </div>
            </div>
          ))}

          <p style={{ fontSize: 12, color: '#666', margin: '8px 0' }}>
            💡 Puedes editar los nombres y desmarcar los que no quieras publicar
          </p>

          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <button onClick={handleReset}
              style={{ flex: 1, padding: 12, background: 'none', border: '1px solid #ddd',
                borderRadius: 10, fontSize: 14, cursor: 'pointer' }}>
              Cancelar
            </button>
            <button onClick={handleSaveAll}
              style={{ flex: 2, padding: 12, background: '#000', color: 'white',
                border: 'none', borderRadius: 10, fontSize: 14,
                fontWeight: 'bold', cursor: 'pointer' }}>
              Publicar {detectedProducts.filter(p => p.include && p.price).length} productos →
            </button>
          </div>
        </div>
      )}

      {/* ── SAVING ── */}
      {step === 'saving' && (
        <div style={{ textAlign: 'center', padding: 20 }}>
          <p style={{ margin: 0, fontWeight: 'bold', color: '#007bff' }}>
            💾 Publicando productos...
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#666' }}>
            No cierres la app
          </p>
        </div>
      )}

      {/* ── DONE ── */}
      {step === 'done' && (
        <div style={{ textAlign: 'center', padding: 16 }}>
          <p style={{ margin: 0, fontSize: 24 }}>🎉</p>
          <p style={{ margin: '8px 0 4px', fontWeight: 'bold' }}>
            ¡Productos publicados!
          </p>
          <button onClick={handleReset}
            style={{ padding: '8px 20px', background: '#007bff', color: 'white',
              border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>
            Publicar más
          </button>
        </div>
      )}

      {/* ERROR */}
      {error && (
        <p style={{ margin: '10px 0 0', padding: 10, background: '#fff0f0',
          borderRadius: 8, color: '#c0392b', fontSize: 13 }}>
          {error}
        </p>
      )}

    </div>
  )
}

export default BulkUpload
