import { useEffect, useState } from 'react'

export default function OnboardingSpotlight({ onDismiss }) {
  const [buttonPos, setButtonPos] = useState(null)

  useEffect(() => {
    document.body.style.overflow = 'hidden'

    const buttons = document.querySelectorAll('button, a')
    let targetButton = null
    buttons.forEach(btn => {
      if (btn.textContent.includes('Vender')) {
        targetButton = btn
      }
    })

    if (targetButton) {
      const rect = targetButton.getBoundingClientRect()
      setButtonPos({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        width: rect.width + 24,
        height: rect.height + 16
      })
    }

    return () => { document.body.style.overflow = '' }
  }, [])

  if (!buttonPos) return null

  return (
    <>
      {/* Overlay con hueco dinámico */}
      <div
        onClick={onDismiss}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9998,
          background: 'rgba(0,0,0,0.78)',
          maskImage: `radial-gradient(ellipse ${buttonPos.width/2}px ${buttonPos.height/2 + 8}px at ${buttonPos.x}px ${buttonPos.y}px, transparent 100%, black 101%)`,
          WebkitMaskImage: `radial-gradient(ellipse ${buttonPos.width/2}px ${buttonPos.height/2 + 8}px at ${buttonPos.x}px ${buttonPos.y}px, transparent 100%, black 101%)`,
        }}
      />

      {/* Borde brillante alrededor del botón */}
      <div style={{
        position: 'fixed',
        left: buttonPos.x - buttonPos.width/2 - 4,
        top: buttonPos.y - buttonPos.height/2 - 4,
        width: buttonPos.width + 8,
        height: buttonPos.height + 8,
        borderRadius: 100,
        border: '2px solid #F5BF3A',
        zIndex: 9999,
        animation: 'pulse 1.2s ease infinite',
        pointerEvents: 'none'
      }} />

      {/* Tooltip */}
      <div style={{
        position: 'fixed',
        top: buttonPos.y + buttonPos.height/2 + 18,
        right: Math.max(8, window.innerWidth - buttonPos.x - buttonPos.width/2 - 8),
        zIndex: 9999,
        background: '#fff',
        borderRadius: 16,
        padding: '16px 20px',
        maxWidth: Math.min(220, window.innerWidth - 24),
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        animation: 'spotlightIn 0.4s ease'
      }}>
        {/* Flecha hacia arriba */}
        <div style={{
          position: 'absolute',
          top: -10,
          right: 24,
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
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(245,191,58,0.6); }
          70% { box-shadow: 0 0 0 10px rgba(245,191,58,0); }
          100% { box-shadow: 0 0 0 0 rgba(245,191,58,0); }
        }
      `}</style>
    </>
  )
}
