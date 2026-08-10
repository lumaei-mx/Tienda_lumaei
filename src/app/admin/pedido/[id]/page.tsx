import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getOrder, readOrders } from "@/lib/orders-db";
import { getRetryItem } from "@/lib/automation/queue";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

/**
 * Detalle admin del pedido: aquí vive TODO lo interno.
 * El comprador JAMÁS ve esto (la página pública /pedido/[id] no muestra
 * unit economics, notas ni logs de operación).
 */
export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();

  const [retry] = await Promise.all([
    getRetryItem(id).catch(() => null),
    readOrders().catch(() => [] as never[]),
  ]);

  const friendlyRef = `#${order.id.replace(/[^a-zA-Z0-9]/g, "").slice(-6)}`;
  const statusBadge =
    order.status === "pending_payment"
      ? "bg-amber-100 text-amber-900"
      : ["sent_to_cj", "shipped", "delivered"].includes(order.status)
        ? "bg-emerald-100 text-emerald-800"
        : order.status === "cancelled" || order.status === "failed"
          ? "bg-red-100 text-red-800"
          : "bg-gold/20 text-gold-dark";

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1 text-sm font-semibold text-gold-dark hover:underline"
      >
        <ArrowLeft size={14} /> Volver al panel
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="font-serif text-3xl font-semibold text-brown">
          Pedido {friendlyRef}
        </h1>
        <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${statusBadge}`}>
          {order.status}
        </span>
      </div>

      {/* Datos del cliente */}
      <section className="mt-6 rounded-2xl border border-gold/20 bg-ivory p-6">
        <h2 className="font-serif text-xl font-semibold text-brown">Cliente</h2>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wider text-brown-soft">Nombre</dt>
            <dd className="font-medium text-brown">{order.customer.name}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-brown-soft">Email</dt>
            <dd className="font-medium text-brown">{order.customer.email}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-brown-soft">Teléfono</dt>
            <dd className="font-medium text-brown">{order.customer.phone || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-brown-soft">Mercado</dt>
            <dd className="font-medium text-brown">{order.market}</dd>
          </div>
        </dl>
        <div className="mt-4 text-sm">
          <dt className="text-xs uppercase tracking-wider text-brown-soft">Dirección</dt>
          <dd className="mt-0.5 text-brown">
            {order.shippingAddress.line1}
            {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""},{" "}
            {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
            {order.shippingAddress.zip}
          </dd>
        </div>
      </section>

      {/* Items */}
      <section className="mt-6 rounded-2xl border border-gold/20 bg-ivory p-6">
        <h2 className="font-serif text-xl font-semibold text-brown">Productos</h2>
        <ul className="mt-3 divide-y divide-gold/15 text-sm">
          {order.items.map((i) => (
            <li key={i.productId} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <div>
                <p className="font-medium text-brown">
                  {i.name} × {i.qty}
                </p>
                <p className="text-xs text-brown-soft">
                  SKU {i.cjSku} · vid {i.cjVariantId || "—"} · costo ${i.costUsd.toFixed(2)}
                </p>
              </div>
              <span className="font-semibold text-brown">
                {formatMoney(i.unitPrice * i.qty)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Totales */}
      <section className="mt-6 rounded-2xl border border-gold/20 bg-ivory p-6">
        <h2 className="font-serif text-xl font-semibold text-brown">Totales</h2>
        <dl className="mt-3 space-y-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-brown-soft">Subtotal</dt>
            <dd className="font-medium text-brown">{formatMoney(order.subtotal)}</dd>
          </div>
          {order.discount ? (
            <div className="flex justify-between">
              <dt className="text-brown-soft">Descuento ({order.promoCode})</dt>
              <dd className="font-medium text-emerald-700">−{formatMoney(order.discount)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between">
            <dt className="text-brown-soft">Envío (cobrado al cliente)</dt>
            <dd className="font-medium text-brown">{formatMoney(order.shipping)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-brown-soft">Impuestos</dt>
            <dd className="font-medium text-brown">{formatMoney(order.tax)}</dd>
          </div>
          <div className="flex justify-between border-t border-gold/20 pt-2">
            <dt className="font-semibold text-brown">Total cobrado</dt>
            <dd className="font-bold text-brown">{formatMoney(order.total)}</dd>
          </div>
        </dl>
      </section>

      {/* Unit economics (solo admin) */}
      <section className="mt-6 rounded-2xl border border-gold/30 bg-cream p-6">
        <h2 className="font-serif text-xl font-semibold text-brown">
          Unit economics (estimado)
        </h2>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <div className="flex justify-between rounded-lg bg-ivory px-3 py-2">
            <dt className="text-brown-soft">COGS</dt>
            <dd className="font-medium text-brown">${order.cogsUsd.toFixed(2)}</dd>
          </div>
          <div className="flex justify-between rounded-lg bg-ivory px-3 py-2">
            <dt className="text-brown-soft">Costo envío CJ</dt>
            <dd className="font-medium text-brown">${order.shippingCostUsd.toFixed(2)}</dd>
          </div>
          <div className="flex justify-between rounded-lg bg-ivory px-3 py-2">
            <dt className="text-brown-soft">Fee de pago</dt>
            <dd className="font-medium text-brown">${order.paymentFeeUsd.toFixed(2)}</dd>
          </div>
          <div className="flex justify-between rounded-lg bg-gold/20 px-3 py-2">
            <dt className="font-semibold text-brown">Ganancia neta estimada</dt>
            <dd className="font-bold text-gold-dark">${order.estimatedProfitUsd.toFixed(2)} USD</dd>
          </div>
        </dl>
      </section>

      {/* Operación / fulfillment */}
      <section className="mt-6 rounded-2xl border border-gold/20 bg-ivory p-6">
        <h2 className="font-serif text-xl font-semibold text-brown">
          Operación · Fulfillment
        </h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-brown-soft">ID interno (CJ / base)</dt>
            <dd className="font-mono text-xs text-brown">{order.id}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-brown-soft">Provider de pago</dt>
            <dd className="font-medium text-brown">{order.paymentProvider || "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-brown-soft">Ref pago</dt>
            <dd className="font-mono text-xs text-brown">{order.paymentRef || "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-brown-soft">Email de confirmación</dt>
            <dd className="font-medium text-brown">
              {order.emailStatus === "sent" && (
                <span className="text-emerald-700">Enviado ✓</span>
              )}
              {order.emailStatus === "skipped" && (
                <span className="text-amber-700">
                  No enviado — falta GMAIL_APP_PASSWORD
                </span>
              )}
              {order.emailStatus === "error" && (
                <span className="text-red-700">
                  Error: {order.emailError || "desconocido"}
                </span>
              )}
              {!order.emailStatus && <span className="text-brown-soft">—</span>}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-brown-soft">Orden CJ</dt>
            <dd className="font-mono text-xs text-brown">{order.cjOrderId || "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-brown-soft">Tracking</dt>
            <dd className="font-medium text-brown">
              {order.trackingNumber
                ? `${order.trackingNumber}${order.trackingCarrier ? ` (${order.trackingCarrier})` : ""}`
                : "No asignado"}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-brown-soft">Auto-fulfill</dt>
            <dd className="font-medium text-brown">
              {order.autoFulfilled ? "Sí" : "No"}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-brown-soft">En cola de reintento</dt>
            <dd className="font-medium text-brown">
              {retry
                ? `Sí · intento ${retry.attempts} · ${retry.lastError || ""}`
                : "No"}
            </dd>
          </div>
        </dl>
        {order.notes && (
          <div className="mt-4 rounded-xl border border-amber-300/50 bg-amber-50 p-3 text-xs text-amber-900">
            <p className="font-semibold">Notas de operación</p>
            <p className="mt-1 whitespace-pre-line">{order.notes}</p>
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <a
            href={`/pedido/${order.id}?key=${order.accessToken || ""}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-gold/30 px-3 py-1.5 font-semibold text-brown hover:bg-cream"
          >
            Ver como cliente ↗
          </a>
        </div>
      </section>
    </div>
  );
}
