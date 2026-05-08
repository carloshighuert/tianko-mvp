import { useEffect } from 'react'

export default function OnboardingSpotlight({ onDismiss }) {

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <>
      {/* Overlay oscuro con hueco circular sobre el botón "Vender aquí" */}
      <div
        onClick={onDismiss}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9998,
          background: 'rgba(0,0,0,0.75)',
          maskImage: 'radial-gradient(circle 80px at calc(100% - 80px) 44px, transparent 60px, black 61px)',
          WebkitMaskImage: 'radial-gradient(circle 80px at calc(100% - 80px) 44px, transparent 60px, black 61px)',
        }}
      />

      {/* Tooltip con flecha apuntando al botón */}
      <div style={{
        position: 'fixed',
        top: 96,
        right: 12,
        zIndex: 9999,
        background: '#fff',
        borderRadius: 16,
        padding: '16px 20px',
        maxWidth: 220,
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        animation: 'spotlightIn 0.4s ease'
      }}>
        {/* Flecha hacia arriba */}
        <div style={{
          position: 'absolute',
          top: -10,
          right: 48,
          width: 0,
          height: 0,
          borderLeft: '10px solid transparent',
          borderRight: '10px solid transparent',
          borderBottom: '10px solid #fff'
        }} />

        <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: 15, color: '#0B365C' }}>
          ¿Quieres vender? 🛍️
        </p>
        <p style={{ margin: '0 0 14px', fontSize: 13, color: '#555', lineHeight: 1.5 }}>
          Toca aquí para crear tu tienda gratis y empezar a vender hoy mismo
        </p>
        <button
          onClick={onDismiss}
          style={{
            width: '100%',
            padding: '8px',
            background: '#0B365C',
            color: '#F5BF3A',
            border: 'none',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer'
          }}>
          Entendido ✓
        </button>
      </div>

      <style>{`
        @keyframes spotlightIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  )
}
