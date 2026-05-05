import { useParams, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

function Review() {
  const { token } = useParams()

  const [review, setReview] = useState(null)
  const [store, setStore] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)

  const [buyerName, setBuyerName] = useState('')
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchReview()
  }, [token])

  async function fetchReview() {
    try {
      const { data, error: queryError } = await supabase
        .from('reviews')
        .select('*')
        .eq('token', token)
        .single()

      if (queryError || !data) {
        setError('Este link de reseña no es válido.')
        return
      }

      if (data.used) {
        setError('Esta reseña ya fue enviada. ¡Gracias!')
        return
      }

      setReview(data)

      if (data.store_id) {
        const { data: storeData } = await supabase
          .from('stores')
          .select('name')
          .eq('id', data.store_id)
          .single()
        setStore(storeData)
      }
    } catch (err) {
      console.error('[fetchReview] Error:', err)
      setError('Ocurrió un error al cargar la reseña.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit() {
    if (!buyerName.trim()) {
      alert('Por favor ingresa tu nombre.')
      return
    }
    if (rating === 0) {
      alert('Por favor selecciona una calificación.')
      return
    }

    setSubmitting(true)
    try {
      const { error: updateError } = await supabase
        .from('reviews')
        .update({
          buyer_name: buyerName.trim(),
          rating,
          comment: comment.trim() || null,
          used: true
        })
        .eq('token', token)

      if (updateError) throw updateError
      setDone(true)
    } catch (err) {
      console.error('[handleSubmit] Error:', err)
      alert('Ocurrió un error al enviar tu reseña. Intenta de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f4f4f4' }}>
      <p style={{ color: '#666', fontSize: 15 }}>Cargando...</p>
    </div>
  )

  if (error) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f4f4f4', padding: 24 }}>
      <Link to="/">
        <img src="/tianko-logo.png" alt="Tianko" style={{ height: 74, width: 'auto', marginBottom: 20 }} />
      </Link>
      <p style={{ color: '#666', fontSize: 16, textAlign: 'center' }}>{error}</p>
      <Link to="/" style={{ marginTop: 16, fontSize: 14, color: '#007bff', textDecoration: 'none' }}>
        Explorar productos →
      </Link>
    </div>
  )

  if (done) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f4f4f4', padding: 24 }}>
      <Link to="/">
        <img src="/tianko-logo.png" alt="Tianko" style={{ height: 74, width: 'auto', marginBottom: 20 }} />
      </Link>
      <div style={{ background: 'white', borderRadius: 16, padding: 32, maxWidth: 380, width: '100%', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        <p style={{ fontSize: 48, margin: '0 0 12px' }}>🎉</p>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111', margin: '0 0 8px' }}>¡Gracias por tu reseña!</h2>
        <p style={{ color: '#555', fontSize: 14, margin: '0 0 20px' }}>
          Tu opinión ayuda a otros compradores a confiar en{store ? ` ${store.name}` : ' este vendedor'}.
        </p>
        <Link to="/" style={{
          display: 'inline-block',
          background: '#000',
          color: 'white',
          borderRadius: 10,
          padding: '12px 24px',
          fontSize: 15,
          textDecoration: 'none',
          fontWeight: 600
        }}>
          🛍️ Explorar productos
        </Link>
      </div>
    </div>
  )

  return (
    <div style={{ background: '#f4f4f4', minHeight: '100vh', padding: 16 }}>
      <div style={{ maxWidth: 420, margin: '0 auto' }}>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <Link to="/">
            <img src="/tianko-logo.png" alt="Tianko" style={{ height: 74, width: 'auto' }} />
          </Link>
        </div>

        <div style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>

          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111', margin: '0 0 4px', textAlign: 'center' }}>
            Deja tu reseña
          </h2>
          {store && (
            <p style={{ textAlign: 'center', fontSize: 14, color: '#555', margin: '0 0 24px' }}>
              para <strong>{store.name}</strong>
            </p>
          )}

          {/* NOMBRE */}
          <label style={{ fontSize: 13, fontWeight: 600, color: '#333', display: 'block', marginBottom: 6 }}>
            Tu nombre
          </label>
          <input
            type="text"
            value={buyerName}
            onChange={e => setBuyerName(e.target.value)}
            placeholder="Ej: María García"
            maxLength={60}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 10,
              border: '1px solid #ddd',
              fontSize: 15,
              marginBottom: 20,
              boxSizing: 'border-box',
              background: '#ffffff',
              color: '#111111',
              WebkitTextFillColor: '#111111'
            }}
          />

          {/* CALIFICACIÓN */}
          <label style={{ fontSize: 13, fontWeight: 600, color: '#333', display: 'block', marginBottom: 8 }}>
            Calificación
          </label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, justifyContent: 'center' }}>
            {[1, 2, 3, 4, 5].map(star => (
              <span
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                style={{
                  fontSize: 36,
                  cursor: 'pointer',
                  color: star <= (hoverRating || rating) ? '#F5C518' : '#ddd',
                  transition: 'color 0.1s'
                }}
              >
                ★
              </span>
            ))}
          </div>

          {/* COMENTARIO */}
          <label style={{ fontSize: 13, fontWeight: 600, color: '#333', display: 'block', marginBottom: 6 }}>
            Comentario <span style={{ fontWeight: 400, color: '#999' }}>(opcional)</span>
          </label>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="¿Cómo fue tu experiencia con este vendedor?"
            maxLength={300}
            rows={3}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 10,
              border: '1px solid #ddd',
              fontSize: 14,
              marginBottom: 20,
              boxSizing: 'border-box',
              resize: 'vertical',
              background: '#ffffff',
              color: '#111111',
              WebkitTextFillColor: '#111111',
              fontFamily: 'inherit'
            }}
          />

          {/* SUBMIT */}
          <button
            onClick={handleSubmit}
            disabled={submitting || rating === 0 || !buyerName.trim()}
            style={{
              width: '100%',
              padding: 14,
              background: rating === 0 || !buyerName.trim() ? '#ccc' : '#000',
              color: 'white',
              border: 'none',
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 700,
              cursor: rating === 0 || !buyerName.trim() ? 'not-allowed' : 'pointer'
            }}
          >
            {submitting ? 'Enviando...' : 'Enviar reseña'}
          </button>

        </div>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: '#999' }}>
          Powered by{' '}
          <Link to="/" style={{ color: '#888', textDecoration: 'underline' }}>Tianko</Link>
          {' · '}Tu tianguis, ahora digital
        </p>

      </div>
    </div>
  )
}

export default Review
