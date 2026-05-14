import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Pitch() {
  const [metrics, setMetrics] = useState({
    vendedores: 9,
    productos: 28,
    tianguis: 5,
    clicks: 33
  })

  useEffect(() => {
    async function loadMetrics() {
      const [sellers, products, hubs, clicks] = await Promise.all([
        supabase.from('sellers').select('id', { count: 'exact', head: true }),
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('status', 'publicado'),
        supabase.from('market_hubs').select('id', { count: 'exact', head: true }),
        supabase.from('lead_events').select('id', { count: 'exact', head: true }).eq('type', 'click_whatsapp')
      ])
      setMetrics({
        vendedores: sellers.count || 9,
        productos: products.count || 28,
        tianguis: hubs.count || 5,
        clicks: clicks.count || 33
      })
    }
    loadMetrics()
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0B365C',
      color: '#fff',
      fontFamily: 'system-ui'
    }}>
      {/* HERO */}
      <section style={{
        padding: '80px 24px 60px',
        textAlign: 'center',
        maxWidth: 800,
        margin: '0 auto'
      }}>
        <img src="/tianko-logo.png" style={{ height: 80, marginBottom: 32 }} />
        <h1 style={{
          fontSize: 'clamp(32px, 6vw, 56px)',
          fontWeight: 800,
          color: '#F5BF3A',
          margin: '0 0 16px',
          lineHeight: 1.1
        }}>
          El primer marketplace<br />de IA para tianguis<br />y comercio informal
        </h1>
        <p style={{
          fontSize: 'clamp(16px, 2.5vw, 20px)',
          color: 'rgba(255,255,255,0.85)',
          margin: '0 0 40px',
          lineHeight: 1.5
        }}>
          Digitalizamos el comercio informal de México conectando<br />
          vendedores con compradores a través de WhatsApp
        </p>
      </section>

      {/* MÉTRICAS */}
      <section style={{
        padding: '40px 24px',
        background: 'rgba(255,255,255,0.05)',
        borderTop: '1px solid rgba(245,191,58,0.2)',
        borderBottom: '1px solid rgba(245,191,58,0.2)'
      }}>
        <p style={{
          textAlign: 'center',
          color: '#F5BF3A',
          fontSize: 12,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: 1.5,
          margin: '0 0 32px'
        }}>
          Tracción en menos de 30 días
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 24,
          maxWidth: 900,
          margin: '0 auto'
        }}>
          {[
            { num: metrics.vendedores, label: 'Vendedores activos' },
            { num: metrics.productos, label: 'Productos publicados' },
            { num: metrics.tianguis, label: 'Tianguis en CDMX' },
            { num: metrics.clicks, label: 'Clicks a WhatsApp' }
          ].map((m, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: 'clamp(36px, 6vw, 56px)',
                fontWeight: 800,
                color: '#F5BF3A',
                lineHeight: 1
              }}>
                {m.num}
              </div>
              <div style={{
                fontSize: 13,
                color: 'rgba(255,255,255,0.7)',
                marginTop: 8
              }}>
                {m.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* OPORTUNIDAD */}
      <section style={{
        padding: '60px 24px',
        maxWidth: 800,
        margin: '0 auto'
      }}>
        <h2 style={{
          fontSize: 28,
          fontWeight: 700,
          color: '#F5BF3A',
          textAlign: 'center',
          margin: '0 0 32px'
        }}>
          La oportunidad
        </h2>
        <div style={{
          background: 'rgba(245,191,58,0.1)',
          border: '1px solid rgba(245,191,58,0.3)',
          borderRadius: 16,
          padding: 32,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 48, fontWeight: 800, color: '#F5BF3A', marginBottom: 8 }}>
            $2.5T MXN
          </div>
          <p style={{ fontSize: 16, color: '#fff', margin: '0 0 12px' }}>
            mueve el comercio informal en México al año
          </p>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', margin: 0 }}>
            60% del empleo nacional · Cero players tech serios atendiéndolos
          </p>
        </div>
      </section>

      {/* DIFERENCIADOR */}
      <section style={{
        padding: '40px 24px 60px',
        maxWidth: 800,
        margin: '0 auto'
      }}>
        <h2 style={{
          fontSize: 28,
          fontWeight: 700,
          color: '#F5BF3A',
          textAlign: 'center',
          margin: '0 0 32px'
        }}>
          ¿Por qué Tianko?
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            {
              icon: '🤖',
              title: 'IA que reconoce productos',
              desc: 'El vendedor toma una foto de su puesto y la IA detecta, nombra y precia cada producto automáticamente'
            },
            {
              icon: '📱',
              title: 'Sin instalar nada',
              desc: 'Vendedores y compradores usan lo que ya saben: WhatsApp. Cero fricción de adopción'
            },
            {
              icon: '🛍️',
              title: 'Vista por tianguis',
              desc: 'A diferencia de Marketplace, los compradores exploran tianguis físicos digitalmente'
            },
            {
              icon: '🚀',
              title: 'Crecimiento orgánico real',
              desc: 'Vendedores escanean nuestro QR y crean sus tiendas solos. Producto-mercado fit en validación'
            }
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex',
              gap: 16,
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 12,
              padding: 20
            }}>
              <div style={{ fontSize: 32, flexShrink: 0 }}>{item.icon}</div>
              <div>
                <h3 style={{
                  fontSize: 17, fontWeight: 700,
                  color: '#F5BF3A', margin: '0 0 6px'
                }}>
                  {item.title}
                </h3>
                <p style={{
                  fontSize: 14, color: 'rgba(255,255,255,0.8)',
                  margin: 0, lineHeight: 1.5
                }}>
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CONTACTO */}
      <section style={{
        padding: '60px 24px',
        background: '#F5BF3A',
        color: '#0B365C',
        textAlign: 'center'
      }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 16px' }}>
          Hablemos
        </h2>
        <p style={{ fontSize: 16, marginBottom: 32, opacity: 0.85 }}>
          Carlos Higuera — Fundador
        </p>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          maxWidth: 320,
          margin: '0 auto'
        }}>
          <a href="https://wa.me/525624069443"
            target="_blank"
            style={{
              background: '#0B365C',
              color: '#F5BF3A',
              padding: 16,
              borderRadius: 12,
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: 15
            }}>
            💬 WhatsApp · 56 2406 9443
          </a>
          <a href="mailto:carlos@tianko.io"
            style={{
              background: 'rgba(11,54,92,0.1)',
              color: '#0B365C',
              padding: 16,
              borderRadius: 12,
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: 15,
              border: '2px solid #0B365C'
            }}>
            ✉️ carlos@tianko.io
          </a>
          <a href="/"
            style={{
              background: 'transparent',
              color: '#0B365C',
              padding: 16,
              textDecoration: 'underline',
              fontSize: 14
            }}>
            Ver el producto en vivo →
          </a>
        </div>
      </section>

      <footer style={{
        padding: 24,
        textAlign: 'center',
        color: 'rgba(255,255,255,0.4)',
        fontSize: 12,
        background: '#0B365C'
      }}>
        Tianko · El tianguis digital de México · 2026
      </footer>
    </div>
  )
}
