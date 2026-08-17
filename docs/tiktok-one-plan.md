# TikTok One — Plan operativo Lumaei

## Reglas operativas v2 (vigentes)
- **Canal primario:** WhatsApp Web (Telegram solo respaldo). Navin no responde chats entrantes aún (sin clientes); solo envía reportes al owner.
- **Cero presupuesto propio:** solo el owner autoriza el pago de productos reales ya verificados.
- **Prioridad:** integrar TikTok / TikTok One + proveedor local por país.
- **Fulfillment por país:** cliente en MX → despacho desde MX; cliente en US → despacho desde US. Modelado en `src/lib/suppliers.ts` (`shipFrom`).
- **Regla crítica de afiliados:** el precio que publica el influencer es el que aparece en la tienda (sin contradicciones PDP vs anuncio).
- **Solo productos económicos con margen real** tras comisión de influencer (15%); si no hay ganancia, no se maneja.
- **Estado TikTok Shop MX:** llegó feb/2025. Requisitos vendedor: RFC activo, INE/pasaporte, cuenta bancaria MX con CLABE, dirección fiscal MX, cuenta TikTok ≥1000 seguidores. Verificación 3-5 días. TikTok One exige verificación de empresa (entidad).

**Veredicto de investigación:** la arquitectura propuesta es la correcta (TikTok One = capa de creators → tu plataforma lumaei.com → checkout → supplier). Spark Ads SÍ sirve para escalar video ganador a tu sitio sin TikTok Shop. Confianza ~55% de poder operar TODO sin constituir sociedad; el bloqueo es la *business verification* de TikTok One, que confirma "entidad legal". TikTok Shop MX ya acepta persona física (INE + Constancia de Situación Fiscal/RFC), lo que sugiere que es posible. **Requiere confirmación de TikTok Support.**

> Owner: persona física (RFC SAES910620RC4), Tijuana, México. Sin sociedad constituida (aún).

## 1. Preguntas exactas para TikTok Support

Envíalas por el centro de ayuda de TikTok For Business / TikTok One:

1. ¿TikTok One acepta una cuenta de **persona física** (sole proprietor) verificada con INE + RFC (Constancia de Situación Fiscal), o exige obligatoriamente una **persona moral** (sociedad)?
2. Si acepta persona física: ¿qué documentos específicos pide para México? (INE, RFC, comprobante de domicilio, cuenta bancaria! ¿cuáles?)
3. Con una cuenta verificada en México: ¿puedo **contratar y pagar creators tanto en EE. UU. como en México**? ¿Qué regiones de creator pueden destinarse y en qué moneda/se hacen los pagos?
4. ¿El **Spark Opportunity Program** aplica a cuentas persona física MX, o solo a cuentas con TikTok Shop? (Fuente indica que Spark Opportunity está atado a TikTok Shop affiliates → puede NO servirnos; usaremos Spark Ads vía Ads Manager en su lugar.)
5. ¿Los modelos de pago **Base pay (flat) / Revenue share / Híbrido** están disponibles para una cuenta pequeña MX? Confirmar cuál(es) se pueden usar desde el inicio.

## 2. Flujo objetivo (creator → venta)

```
TU MARCA (lumaei.com)
        │
   TikTok One  ── buscar/seleccionar creators (US y MX)
        │         filtros: país, seguidores 10K–100K, nicho, engagement
        ├── Creator A ── video ──┐
        ├── Creator B ── video ──┤→ TikTok (orgánico / branded)
        └── Creator C ── video ──┘
                              │
                    video ganador (performance)
                              │
                   Spark Ads (TikTok Ads Manager)
                   presupuesto sobre contenido autorizado
                              │
                        tráfico → lumaei.com
                              │
                          CHECKOUT → Supplier (CJ/Zendrop/Spocket)
```

## 3. Modelo de pago recomendado (arranque)

- **Flat fee (pago fijo por video)** para los primeros creators: costo predecible, sin atar comisiones hasta validar conversión.
- Dejar **revenue share / híbrido** para cuando haya data de CAC y LTV reales.
- TikTok One contempla los 3 modelos; elegir "Base pay only" al crear el proyecto.

## 4. SOP de Spark Ads (escalado)

1. Creator publica video (autorizado por ti o via acuerdo de colaboración).
2. Creator abre el video → ajustes → **Ad Authorization** → genera Spark code.
3. Tú pegas el Spark code en **TikTok Ads Manager** → campaña Conversions/Sales con destino `lumaei.com/productos/...`.
4. Metes presupuesto solo sobre los videos que ya funcionaron orgánicamente (no escalar a ciegas).
5. Mides: views→clicks→add-to-cart→purchase con el pixel ya instalado.

> Nota: Spark Opportunity Program (autorización de videos existentes por performance) está ligado a TikTok Shop affiliates → no es nuestro caso. Usamos Spark Ads clásico vía Ads Manager.

## 5. Reclutamiento con IA (TikTok One AI Search)

Describir en lenguaje natural el perfil, p.ej.:
> "US creators, audience interested in pet + kitchen, 10K–100K followers, high engagement, strong recent video performance."

Esto alimenta tu IA de selección de creators → proyecto en TikTok One → campaña → contenido → TikTok Ads → tu plataforma.

## 6. Acciones humanas (no bloquean lo publicado)

- [ ] Abrir cuenta TikTok One como persona física y enviar las 5 preguntas a Support.
- [ ] Preparar INE + RFC (Constancia de Situación Fiscal) para la verificación.
- [ ] Decidir: si TikTok One exige persona moral, constituir sociedad (fallback).
- [ ] (Separado) RFC régimen 612/626 en SAT y CFDI a clientes MX — ver `privacidad`/compliance.

## 7. Diferenciación clave

TikTok One NO es marketplace ni es TikTok Shop. Es infraestructura de creators. Tu propiedad del cliente (email, pedido, datos) vive en lumaei.com, no en TikTok. Eso es lo que te diferencia de un front-end de dropshipping genérico: **marca propia + provenance documentada + comunidad de creators que conduce a TU plataforma**.
