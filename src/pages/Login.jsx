// ============================================================
// 📁 Login.jsx — v2 (SMS OTP)
// ============================================================
// CAMBIO CRÍTICO vs v1:
//   Antes: email + password → fricción alta para tianguistas
//   Ahora: teléfono + código SMS → flujo natural en móvil
//
// FLUJO:
//   1. Usuario ingresa su número de teléfono
//   2. Supabase (vía Twilio Verify) envía SMS con código de 6 dígitos
//   3. Usuario ingresa el código
//   4. Supabase verifica y crea sesión automáticamente
//   5. Redirige al dashboard
//
// MODO PRUEBA (sin gastar crédito Twilio):
//   Número: 5215624069443 → código siempre: 123456
//   Configurado en Supabase → Auth → Providers → Phone → Test numbers
//
// FORMATO DE TELÉFONO:
//   Supabase requiere formato E.164: +521XXXXXXXXXX para México
//   El código formatea automáticamente al enviar
// ============================================================

import { useState } from 'react'
import { supabase } from '../supabaseClient'

function Login() {

  // ============================================================
  // 🗂️ ESTADO
  // ============================================================
  const [phone, setPhone] = useState('')         // número del usuario
  const [otp, setOtp] = useState('')             // código SMS
  const [step, setStep] = useState('phone')      // 'phone' | 'otp'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // ============================================================
  // 📱 FORMATEAR TELÉFONO A E.164
  // ============================================================
  // Supabase requiere formato internacional: +521XXXXXXXXXX
  // El usuario escribe: 5624069443 (10 dígitos)
  // Resultado: +525624069443
  //
  // Nota: en México el código es +52, pero para números móviles
  // Twilio/Supabase a veces requiere +521 — probamos con +52 primero.
  function formatPhone(raw) {
    const digits = raw.replace(/\D/g, '') // solo números

    // Si ya viene con código de país (12 dígitos con 52)
    if (digits.startsWith('52') && digits.length === 12) {
      return `+${digits}`
    }

    // Si son 10 dígitos → agregar +52
    if (digits.length === 10) {
      return `+52${digits}`
    }

    // Si son 11 dígitos empezando con 1 (algunos números MX)
    if (digits.length === 11 && digits.startsWith('1')) {
      return `+52${digits}`
    }

    return `+${digits}` // fallback
  }

  // ============================================================
  // 📤 PASO 1: ENVIAR SMS
  // ============================================================
  async function handleSendOTP() {
    setError('')

    const digits = phone.replace(/\D/g, '')
    if (digits.length < 10) {
      setError('Ingresa tu número de 10 dígitos')
      return
    }

    setLoading(true)

    try {
      const formattedPhone = formatPhone(phone)

      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone
      })

      if (error) throw error

      // Avanzar al paso de verificación
      setStep('otp')

    } catch (err) {
      console.error('[handleSendOTP] Error:', err)

      // Mensajes de error en español para el vendedor
      if (err.message?.includes('invalid')) {
        setError('Número de teléfono inválido. Verifica e intenta de nuevo.')
      } else if (err.message?.includes('rate')) {
        setError('Demasiados intentos. Espera un momento.')
      } else {
        setError('No se pudo enviar el código. Intenta de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  // ============================================================
  // ✅ PASO 2: VERIFICAR CÓDIGO
  // ============================================================
  async function handleVerifyOTP() {
    setError('')

    if (otp.length !== 6) {
      setError('El código tiene 6 dígitos')
      return
    }

    setLoading(true)

    try {
      const formattedPhone = formatPhone(phone)

      const { error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: otp,
        type: 'sms'
      })

      if (error) throw error

      // Sesión creada → ir al dashboard
      window.location.href = '/dashboard'

    } catch (err) {
      console.error('[handleVerifyOTP] Error:', err)

      if (err.message?.includes('expired')) {
        setError('El código expiró. Pide uno nuevo.')
      } else if (err.message?.includes('invalid')) {
        setError('Código incorrecto. Verifica e intenta de nuevo.')
      } else {
        setError('No se pudo verificar. Intenta de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  // ============================================================
  // ↩️ VOLVER AL PASO DE TELÉFONO
  // ============================================================
  function handleBack() {
    setStep('phone')
    setOtp('')
    setError('')
  }

  // ============================================================
  // 🖥️ RENDER
  // ============================================================
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f9f9f9',
      padding: 20
    }}>
      <div style={{
        width: '100%',
        maxWidth: 380,
        background: 'white',
        borderRadius: 20,
        padding: 32,
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)'
      }}>

        {/* LOGO / MARCA */}
        <img
          src="/tianko-logo.png"
          alt="Tianko"
          style={{ height: 90, width: 'auto', marginBottom: 20, display: 'block', margin: '0 auto 20px' }}
          onError={(e) => console.log('Logo error:', e.target.src)}
        />
        <p style={{ textAlign: 'center', color: '#666', marginBottom: 32, fontSize: 14 }}>
          {step === 'phone'
            ? 'Ingresa tu número para entrar o registrarte'
            : `Código enviado a ${phone}`
          }
        </p>

        {/* ── PASO 1: TELÉFONO ── */}
        {step === 'phone' && (
          <>
            <label style={{ fontSize: 13, color: '#444', fontWeight: '600' }}>
              Número de teléfono
            </label>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              border: '1.5px solid #ddd',
              borderRadius: 12,
              marginTop: 8,
              marginBottom: 20,
              overflow: 'hidden'
            }}>
              {/* Prefijo fijo México */}
              <span style={{
                padding: '14px 12px',
                background: '#f5f5f5',
                color: '#444',
                fontSize: 15,
                borderRight: '1px solid #ddd',
                whiteSpace: 'nowrap'
              }}>
                🇲🇽 +52
              </span>

              <input
                placeholder="10 dígitos"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                type="tel"
                inputMode="numeric"
                maxLength={10}
                style={{
                  flex: 1,
                  padding: '14px 12px',
                  border: 'none',
                  outline: 'none',
                  fontSize: 18,
                  letterSpacing: 1
                }}
              />
            </div>

            <button
              onClick={handleSendOTP}
              disabled={loading}
              style={{
                width: '100%',
                padding: 16,
                background: loading ? '#ccc' : '#000',
                color: 'white',
                border: 'none',
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Enviando código...' : 'Recibir código SMS →'}
            </button>
          </>
        )}

        {/* ── PASO 2: CÓDIGO OTP ── */}
        {step === 'otp' && (
          <>
            <label style={{ fontSize: 13, color: '#444', fontWeight: '600' }}>
              Código de 6 dígitos
            </label>

            <input
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              type="tel"
              inputMode="numeric"
              maxLength={6}
              autoFocus
              style={{
                width: '100%',
                padding: 16,
                marginTop: 8,
                marginBottom: 20,
                border: '1.5px solid #ddd',
                borderRadius: 12,
                fontSize: 28,
                textAlign: 'center',
                letterSpacing: 8,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />

            <button
              onClick={handleVerifyOTP}
              disabled={loading}
              style={{
                width: '100%',
                padding: 16,
                background: loading ? '#ccc' : '#000',
                color: 'white',
                border: 'none',
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginBottom: 12
              }}
            >
              {loading ? 'Verificando...' : 'Entrar →'}
            </button>

            {/* Reenviar / volver */}
            <button
              onClick={handleBack}
              style={{
                width: '100%',
                padding: 12,
                background: 'none',
                border: '1px solid #ddd',
                borderRadius: 12,
                fontSize: 14,
                color: '#666',
                cursor: 'pointer'
              }}
            >
              ← Cambiar número
            </button>
          </>
        )}

        {/* ERROR */}
        {error && (
          <p style={{
            marginTop: 16,
            padding: 12,
            background: '#fff0f0',
            borderRadius: 8,
            color: '#c0392b',
            fontSize: 14,
            textAlign: 'center'
          }}>
            {error}
          </p>
        )}

      </div>
    </div>
  )
}

export default Login
