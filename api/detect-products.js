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
                text: `Eres un experto en identificar productos de segunda mano y antigüedades en tianguis mexicanos.

Analiza esta foto con MÁXIMA atención al detalle. Tu objetivo es detectar TODOS los objetos vendibles, incluso los que están parcialmente visibles o en los bordes.

REGLAS DE DETECCIÓN:
1. Recorre la imagen sistemáticamente: esquina superior izquierda → derecha → fila siguiente
2. Cada objeto físico independiente = un producto separado
3. Si dos piezas forman un SET (ej. funda + cinturón del mismo holster), cuéntalas como UN solo producto: "Pistolera con cinturón de cuero"
4. Si dos piezas son INDEPENDIENTES aunque estén juntas (ej. dos relojes), lista cada una por separado
5. No omitas objetos aunque estén parcialmente cubiertos o en orillas

REGLAS DE NOMENCLATURA:
- Sé específico con el material: "cuero", "cristal tallado", "porcelana", "madera"
- Sé específico con el tipo: "vaso chupito", "charola", "reloj de mesa", "teléfono de disco"
- Incluye color si ayuda a identificarlo: "vasito de porcelana azul cobalto"
- Incluye época si es obvio: "cámara fotográfica vintage", "radio de transistores"
- Máximo 5 palabras por nombre

Responde ÚNICAMENTE con JSON válido, sin texto adicional, sin markdown:
{
  "productos": [
    "nombre preciso del producto 1",
    "nombre preciso del producto 2"
  ]
}

Si no detectas productos: {"productos": []}`
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