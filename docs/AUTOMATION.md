# Lumaei — Automatización real (CJ Dropshipping)

## Cómo se lleva a cabo

```
┌─────────────┐  checkout     ┌──────────────┐
│  Cliente    │ ────────────► │  Lumaei API  │
│  checkout   │               │  /api/checkout│
└─────────────┘               └──────┬───────┘
                                     │ 1. createPendingOrder (pending_payment)
                                     │ 2. Crea Stripe Checkout Session
                                     │ 3. Guarda stripeSessionId
                                     ▼
                              ┌──────────────┐
                              │   Stripe     │  checkoutUrl
                              │  Checkout    │◄─── cliente redirigido
                              └──────┬───────┘
                                     │ pago OK
                                     ▼
                              ┌──────────────┐   firma verificada
                              │ Webhook      │   checkout.session.completed
                              │ /api/stripe/ │   → confirmPaidOrder
                              │ webhook      │
                              └──────┬───────┘
                                     ▼
                              ┌──────────────┐
                              │  CJ API      │
                              │  createOrder │  (solo si autoFulfill)
                              └──────┬───────┘
                                     │ orderId CJ / tracking
                                     ▼
                              ┌──────────────┐
                              │  Webhook CJ  │
                              │  /api/cj/    │
                              │  webhook     │
                              └──────┬───────┘
                                     ▼
                              order.shipped / delivered
```

### Capas

| Capa | Archivo | Rol |
|------|---------|-----|
| Auth | `src/lib/cj/client.ts` | API Key → access token, refresh, QPS 1/s |
| Productos CJ | `src/lib/cj/products.ts` | listV2 search + query detail + map pricing |
| Órdenes CJ | `src/lib/cj/orders.ts` | freightCalculate + createOrderV2 + payBalance |
| Catálogo local | `src/lib/products-db.ts` | `data/products.json` (fuente de verdad tienda) |
| Pedidos | `src/lib/orders-db.ts` | `data/orders.json` |
| Checkout | `src/lib/checkout.ts` | pending_payment → paid → fulfill automático |
| Stripe | `src/lib/stripe.ts` | cliente Stripe + helpers de montos |
| Webhook Stripe | `src/app/api/stripe/webhook/route.ts` | verifica firma → `confirmPaidOrder` |
| Config pública | `src/app/api/config/route.ts` | expone `{stripe, cj}` al cliente |

---

## Cómo se implementan productos reales

### Flujo de importación (manual curado — recomendado al inicio)

1. Admin → **Importar desde CJ**
2. Buscas keyword (`led sensor`, `car vacuum`, etc.)
3. CJ devuelve catálogo real (`/product/listV2`)
4. Clic **Importar** → se llama `/product/query?pid=…`
5. Se elige la variante más barata con stock (`vid`)
6. Pricing automático:
   - `costUsd` = precio variante CJ
   - `priceUsd` = (cost + shipUS) × `CJ_DEFAULT_MARKUP`
   - `priceMxn` = (cost + shipMX) × markup × tipo de cambio, redondeo psicológico
7. Se guarda en `data/products.json` con:
   - `cjProductId` (pid)
   - `cjVariantId` (vid) ← **obligatorio para crear órdenes**
   - `cjSku`
8. Aparece en `/productos` y se puede vender

### Por qué no se listan 10 000 SKUs a ciegas

- Márgenes y creativos requieren curación
- CJ tiene QPS bajo y límites diarios
- Aduana MX / tiempos de envío varían por SKU
- Import curado = control de marca Lumaei

### Sync futuro (fase 2)

- Cron nocturno: refrescar stock/precio de PIDs ya importados
- Webhook product update de CJ
- Multi-variante en PDP (tallas/colores)

---

## Setup (pasos reales)

### 1. Credenciales CJ

1. [cjdropshipping.com](https://www.cjdropshipping.com) → Apps → instalar **API**
2. Authorize API → **Add API Key** → copiar key
3. En este repo:

```bash
cp .env.example .env.local
# edita CJ_API_KEY=tu_key
```

Si ya tienes un access token JWT:

```env
CJ_ACCESS_TOKEN=eyJ...
```

(Ya existe un token de trabajo en el monorepo Lumaei `CJ.token` — **no lo subas a git**; pégalo solo en `.env.local`.)

### 2. Modo seguro primero

```env
CJ_SANDBOX=true
CJ_AUTO_PAY_BALANCE=false
```

Así las órdenes se crean en sandbox sin gastar balance.

### 3. Producción

```env
CJ_SANDBOX=false
CJ_AUTO_PAY_BALANCE=true   # solo si hay balance en CJ
```

El cliente paga en Lumaei (Stripe — pendiente).  
Lumaei paga a CJ con balance del proveedor.

### 4. Webhook tracking CJ

En panel CJ → Webhook → URL:

```
https://tu-dominio.com/api/cj/webhook
```

Eventos: order status / logistics.

### 5. Stripe (pagos del cliente)

1. [dashboard.stripe.com](https://dashboard.stripe.com) → Developers → API keys
2. Copia `sk_test_...` / `sk_live_...` a `STRIPE_SECRET_KEY`
3. Copia `pk_test_...` a `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
4. Configura el webhook en Stripe → **Webhooks → Add endpoint**:
   ```
   https://tu-dominio.com/api/stripe/webhook
   ```
   Eventos: `checkout.session.completed`, `payment_intent.payment_failed`,
   `checkout.session.expired`. Stripe te da un `whsec_...` → pégalo en
   `STRIPE_WEBHOOK_SECRET`.
5. Para pruebas locales: `stripe listen --forward-to localhost:3000/api/stripe/webhook`

**Flujo real:** el cliente paga en Stripe → el webhook firma el cobro → solo
entonces Lumaei marca el pedido `paid` y llama a CJ (`createOrderV2`).
Si el pago falla o expira, el pedido queda `pending_payment` con botón
"Pagar ahora" en `/pedido/[id]`.

---

## Pagos del cliente (implementado)

El checkout crea un pedido `pending_payment` y una Stripe Checkout Session
(MXN/USD según mercado). Al pagar, el webhook de Stripe verifica la firma y
llama a `confirmPaidOrder`, que solo entonces marca `paid` y dispara el
fulfill a CJ. Sin `STRIPE_SECRET_KEY` todo cae a modo demo (marca `paid`
sin cobrar) para probar el flujo CJ con `CJ_SANDBOX=true`.

---

## Checklist go-live

- [ ] `CJ_API_KEY` en `.env.local`
- [ ] Admin muestra **CJ conectado**
- [ ] Importar ≥5 productos reales y revisar márgenes MX
- [ ] Pedido sandbox de prueba a dirección MX
- [ ] Verificar `cjOrderId` en admin
- [ ] `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` configurados
- [ ] Webhook Stripe recibiendo `checkout.session.completed`
- [ ] Balance CJ cargado
- [ ] `CJ_SANDBOX=false` + `CJ_AUTO_PAY_BALANCE=true`
- [ ] Webhook tracking CJ en producción
