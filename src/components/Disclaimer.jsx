import { useState } from 'react'

function Disclaimer() {
  const [visible, setVisible] = useState(
    () => localStorage.getItem('tianko_disclaimer_accepted') !== 'true'
  )

  if (!visible) return null

  function handleAccept() {
    localStorage.setItem('tianko_disclaimer_accepted', 'true')
    localStorage.setItem('tianko_show_seller_hint', 'true')
    setVisible(false)
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.55)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16
    }}>
      <div style={{
        background: 'white',
        borderRadius: 16,
        maxWidth: 420,
        width: '100%',
        padding: 24,
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)'
      }}>
        <img src="/tianko-logo.png" alt="Tianko" style={{ height: 48, marginBottom: 16 }} />
        <h3 style={{ marginBottom: 12, fontSize: 18, color: '#111' }}>Bienvenido a Tianko</h3>
        <p style={{ fontSize: 14, color: '#444', lineHeight: 1.6, marginBottom: 12 }}>
          Tianko es una plataforma digital que conecta vendedores
          de tianguis y bazares con compradores. Somos un escaparate
          digital — no somos parte de ninguna transacción entre
          vendedor y comprador.
        </p>
        <p style={{ fontSize: 14, color: '#444', lineHeight: 1.6, marginBottom: 12 }}>
          <strong>Responsabilidad del vendedor:</strong> Cada vendedor
          es responsable de los productos que publica. Queda estrictamente
          prohibida la venta de artículos ilegales, robados, falsificados,
          armas, sustancias controladas o cualquier producto que infrinja
          derechos de terceros.
        </p>
        <p style={{ fontSize: 14, color: '#444', lineHeight: 1.6, marginBottom: 20 }}>
          <strong>Tianko no se hace responsable</strong> por el contenido
          publicado por los vendedores, la calidad de los productos,
          ni por las transacciones realizadas fuera de la plataforma.
        </p>
        <button onClick={handleAccept} style={{
          width: '100%', padding: 14, background: '#111',
          color: '#fff', border: 'none', borderRadius: 12,
          fontSize: 15, fontWeight: 600, cursor: 'pointer'
        }}>
          Entendido — Explorar Tianko
        </button>
        <p style={{ fontSize: 11, color: '#999', textAlign: 'center', marginTop: 12 }}>
          Al continuar aceptas nuestros términos de uso y confirmas
          que tienes al menos 18 años.
        </p>
      </div>
    </div>
  )
}

export default Disclaimer
