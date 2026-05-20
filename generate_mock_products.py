import os
from supabase import create_client, Client

SUPABASE_URL = "https://rvzrfsumhclehoespfwk.supabase.co"
SUPABASE_KEY = "[TU_SUPABASE_ANON_KEY]"  # Reemplazar con la anon key real
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

DEMO_STORE_ID = "bb5544e0-4f38-4e54-80bd-dac00dd3e67d"  # Antigüedades Miranda

products = [
    # Calzado (3)
    {
        "title": "Tenis Nike Air Max negros talla 27",
        "price": 450,
        "category": "Calzado",
        "image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop"
    },
    {
        "title": "Botas de piel café para hombre talla 26",
        "price": 600,
        "category": "Calzado",
        "image_url": "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=800&auto=format&fit=crop"
    },
    {
        "title": "Zapatillas deportivas Adidas blancas",
        "price": 380,
        "category": "Calzado",
        "image_url": "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&auto=format&fit=crop"
    },

    # Electrónicos (3)
    {
        "title": "Audífonos inalámbricos Bluetooth",
        "price": 250,
        "category": "Electrónicos",
        "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop"
    },
    {
        "title": "Bocina portátil resistente al agua",
        "price": 350,
        "category": "Electrónicos",
        "image_url": "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&auto=format&fit=crop"
    },
    {
        "title": "Smartwatch deportivo con monitor de ritmo",
        "price": 800,
        "category": "Electrónicos",
        "image_url": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop"
    },

    # Accesorios (3)
    {
        "title": "Bolsa de piel genuina para dama",
        "price": 550,
        "category": "Accesorios",
        "image_url": "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&auto=format&fit=crop"
    },
    {
        "title": "Lentes de sol polarizados unisex",
        "price": 180,
        "category": "Accesorios",
        "image_url": "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&auto=format&fit=crop"
    },
    {
        "title": "Cinturón de piel tejido café",
        "price": 200,
        "category": "Accesorios",
        "image_url": "https://images.unsplash.com/photo-1624222247344-550fb60583bb?w=800&auto=format&fit=crop"
    },

    # Deportes (3)
    {
        "title": "Mancuernas de 5kg par",
        "price": 280,
        "category": "Deportes",
        "image_url": "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&auto=format&fit=crop"
    },
    {
        "title": "Pelota de fútbol profesional talla 5",
        "price": 320,
        "category": "Deportes",
        "image_url": "https://images.unsplash.com/photo-1614632537197-38a17061c2bd?w=800&auto=format&fit=crop"
    },
    {
        "title": "Cuerda para saltar profesional",
        "price": 120,
        "category": "Deportes",
        "image_url": "https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=800&auto=format&fit=crop"
    },

    # Herramientas (3)
    {
        "title": "Juego de desarmadores 12 piezas",
        "price": 250,
        "category": "Herramientas",
        "image_url": "https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=800&auto=format&fit=crop"
    },
    {
        "title": "Taladro eléctrico con accesorios",
        "price": 900,
        "category": "Herramientas",
        "image_url": "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&auto=format&fit=crop"
    },
    {
        "title": "Caja de herramientas con 50 piezas",
        "price": 450,
        "category": "Herramientas",
        "image_url": "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&auto=format&fit=crop"
    }
]


def create_products():
    print("Creando 15 productos de ejemplo...")

    for i, product in enumerate(products, 1):
        data = {
            "title": product["title"],
            "price": product["price"],
            "category": product["category"],
            "image_url": product["image_url"],
            "store_id": DEMO_STORE_ID,
            "status": "publicado"
        }

        result = supabase.table("products").insert(data).execute()

        if result.data:
            print(f"✅ {i}/15 - {product['title']}")
        else:
            print(f"❌ Error creando: {product['title']}")

    print("\n🎉 Productos de ejemplo creados!")


if __name__ == "__main__":
    create_products()
