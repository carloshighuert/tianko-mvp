// ============================================================
// 📁 api/detect-products.js — Vercel Serverless Function
// ============================================================
// PROPÓSITO:
//   Recibe una imagen en base64, la manda a Claude Vision
//   y devuelve una lista de productos detectados.
//
// SEGURIDAD:
//   La API key de Anthropic vive solo en este servidor.
//   El frontend nunca la ve — solo manda la imagen y recibe
//   la lista de productos.
//
// FLUJO:
//   Frontend → POST /api/detect-products { image: base64 }
//           ← { products: ["perfume", "bolsa", "aretes"] }
// ============================================================

export default async function handler(req, res) {

  // Solo aceptar POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { image, mediaType = 'image/jpeg' } = req.body

  if (!image) {
    return res.status(400).json({ error: 'Se requiere una imagen' })
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data: image
                }
              },
              {
                type: 'text',
                text: `Eres un asistente para vendedores de tianguis en México.
                
Analiza esta foto de un puesto de mercado o tianguis y detecta todos los productos que se pueden vender.

Responde ÚNICAMENTE con un JSON válido, sin texto adicional, sin explicaciones, sin markdown:
{
  "productos": [
    "nombre del producto 1",
    "nombre del producto 2",
    "nombre del producto 3"
  ]
}

Reglas:
- Máximo 10 productos
- Nombres cortos y descriptivos (ej: "Perfume Chanel", "Bolsa de mano café", "Aretes dorados")
- Solo productos que claramente se ven a la venta
- En español
- Si no puedes detectar productos, devuelve {"productos": []}`
              }
            ]
          }
        ]
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('[detect-products] Anthropic error:', error)
      return res.status(500).json({ error: 'Error al analizar la imagen' })
    }

    const data = await response.json()
    const text = data.content?.[0]?.text || '{}'

    // Parsear JSON de la respuesta
    let result
    try {
      // Limpiar posibles backticks o texto extra
      const clean = text.replace(/```json|```/g, '').trim()
      result = JSON.parse(clean)
    } catch {
      console.error('[detect-products] Parse error:', text)
      return res.status(500).json({ error: 'Error al procesar la respuesta' })
    }

    return res.status(200).json({
      products: result.productos || []
    })

  } catch (err) {
    console.error('[detect-products] Error:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}