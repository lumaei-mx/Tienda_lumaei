# Lumaei — Tienda online

Tienda en línea **100% automatizada** con Next.js + CJ Dropshipping.  
Marca: **le lumaei** · paleta crema / oro / café.

| Mercado | Rol | Moneda | Impuesto |
|---------|-----|--------|----------|
| **México** | Primario | MXN | IVA 16% |
| **USA** | Secundario | USD | Tax ~7% |

## Arranque

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

- Catálogo: `/productos`
- Carrito / checkout demo: `/carrito` → `/checkout`
- Admin + unit economics: `/admin`

## Investigación de productos (MX primero)

Criterios usados:

1. Liviano (&lt;700g) → envío CJ barato a México  
2. Ticket $199–$499 MXN (impulso, poco fricción)  
3. Margen neto estimado ≥45% después de COGS + ship + fee pago  
4. Demostrable en TikTok/Reels (UGC fácil)  
5. Catálogo amplio en CJ Dropshipping  
6. Baja complejidad de tallas/variantes  

### Nicho ganador: gadgets hogar + cocina + auto

| Producto | Precio MXN | COGS+ship est. USD | Margen MX est. | Por qué MX |
|----------|------------|--------------------|----------------|------------|
| Organizador giratorio 360° | $349 | ~$8.0 | ~55%+ | Organización viral, kitchen TikTok |
| Picadora manual 5 cuchillas | $299 | ~$6.8 | ~55%+ | Meal prep, ticket bajo |
| LED sensor closet | $279 | ~$5.9 | ~60%+ | Liviano, alto volumen |
| Aspiradora portátil auto | $499 | ~$11.6 | ~50%+ | Rideshare/auto fuerte en MX |
| Soporte magnético celular | $249 | ~$5.0 | ~60%+ | Accesorio auto masivo |
| Parches granos 72 pzas | $199 | ~$3.7 | ~65%+ | Recompra beauty |
| Cepillo steamer mascotas | $449 | ~$9.7 | ~50%+ | Pet parents MX creciendo |
| Dispensador jabón sensor | $389 | ~$8.1 | ~55%+ | Hogar premium accesible |

### Unit economics ejemplo (MX)

**LED sensor — venta $279 MXN (~$16.2 USD)**

| Concepto | USD |
|----------|-----|
| Precio | 16.20 |
| COGS CJ | 3.40 |
| Envío a MX | 2.50 |
| Fee pago 3.6% | 0.58 |
| **Profit neto** | **~9.72** |
| **Margen** | **~60%** |
| Break-even ROAS ads | ~1.7x |

Con CAC Meta Ads MX de $6–8 USD por compra, queda **$1.7–3.7 USD** por orden. Escala con creativos UGC y bundles (LED + organizador).

### USA (secundario)

Mismos SKUs en USD con envío CJ más barato. Usa el toggle **US** en el header. No compitas en precio con Amazon: apunta a bundles y creativos, no a cold traffic caro al inicio.

## Automatización CJ

```
Cliente paga → order.paid → fulfillOrder() → CJ createOrder
                                     ↓
                         Webhook /api/cj/webhook → tracking
```

1. Copia `.env.example` → `.env.local`
2. Pega `CJ_API_KEY` de developers.cjdropshipping.com
3. Sustituye `cjSku` / `cjProductId` en `src/data/products.ts` por VIDs reales
4. Configura webhook de tracking a `https://tu-dominio.com/api/cj/webhook`

Sin API key el sistema **simula** el fulfillment (ideal para probar el flujo).

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind
- Zustand (carrito persistente)
- JSON file DB para pedidos (`data/orders.json`)
- Cliente CJ en `src/lib/cj.ts`

## Próximos pasos recomendados

1. Conectar Stripe MX (SPEI/cards) + Stripe US  
2. Sync catálogo real desde API CJ  
3. WhatsApp notificaciones (pedido + guía)  
4. Pixel Meta + eventos Purchase  
5. Warehouse CJ USA/MX si el volumen justifica velocidad  

## Checklist al elegir más productos en CJ

- [ ] Peso &lt; 700g  
- [ ] Rating proveedor ≥ 4.5  
- [ ] Stock estable  
- [ ] Fotos/video propios o derechos claros  
- [ ] Margen neto MX ≥ 45% con ads  
- [ ] No requiere certificación compleja (FDA/etc.)  
- [ ] Fácil de devolver/reemplazar  
