import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { Lock } from "lucide-react";
import { CheckCircle2, Clock, Package, Truck } from "lucide-react";
import { getOrder } from "@/lib/orders-db";
import { formatMoney } from "@/lib/money";
import { verifyAdminToken } from "@/lib/admin-auth";
import { PayNowButton } from "@/components/PayNowButton";
import { ClearCartOnConfirm } from "@/components/ClearCartOnConfirm";
import { t, detectLangServer } from "@/lib/i18n";

const ADMIN_COOKIE = "lumaei_admin";

export default async function PedidoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ stripe?: string; key?: string }>;
}) {
  const { id } = await params;
  const { stripe, key } = await searchParams;
  const order = await getOrder(id);
  if (!order) notFound();
  const lang = await detectLangServer();

  const store = await cookies();
  const isAdmin = await verifyAdminToken(store.get(ADMIN_COOKIE)?.value);
  const hasKey = Boolean(
    order.accessToken && key && key === order.accessToken
  );

  // El pedido es privado: solo el comprador (con su key) o el admin.
  if (!isAdmin && !hasKey) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="rounded-3xl border border-gold/20 bg-ivory p-10">
          <Lock size={28} className="mx-auto text-gold-dark" />
          <h1 className="mt-3 font-serif text-2xl font-semibold text-brown">
            {t("orderPrivate", lang)}
          </h1>
          <p className="mt-2 text-sm text-brown-soft">
            {t("orderPrivateMsg", lang)}
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-full bg-brown px-5 py-2.5 text-sm font-semibold text-ivory"
          >
            {t("backToStore", lang)}
          </Link>
        </div>
      </div>
    );
  }

  const pending = order.status === "pending_payment";
  const fromStripe = stripe === "success";

  const statusKey = (
    {
      pending_payment: "orderStatusPendingPayment",
      paid: "orderStatusPaid",
      fulfillment_queued: "orderStatusQueued",
      sent_to_cj: "orderStatusSent",
      shipped: "orderStatusShipped",
      delivered: "orderStatusDelivered",
      cancelled: "orderStatusCancelled",
      failed: "orderStatusFailed",
    } as const
  )[order.status];
  const statusLabel = statusKey ? t(statusKey, lang) : order.status;
  // Referencia amigable para el comprador; el ID interno CJ nunca se expone.
  const friendlyRef = `#${order.id.replace(/[^a-zA-Z0-9]/g, "").slice(-6)}`;

  const headline = pending
    ? fromStripe
      ? t("orderConfirming", lang)
      : t("orderPending", lang)
    : t("orderConfirmed", lang);

  const Icon = pending ? Clock : CheckCircle2;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <ClearCartOnConfirm confirmed={order.status !== "pending_payment"} />
      <div className="rounded-3xl border border-gold/25 bg-ivory p-8 shadow-sm">
        <div className="flex items-center gap-3 text-gold-dark">
          <Icon size={28} />
          <h1 className="font-serif text-3xl font-semibold text-brown">
            {headline}
          </h1>
        </div>
        <p className="mt-2 text-sm text-brown-soft">
          {isAdmin ? (
            <>
              ID: <code className="rounded bg-cream px-1.5 py-0.5">{order.id}</code>
              {order.paymentProvider && (
                <span className="ml-2 rounded-full bg-cream px-2 py-0.5 text-xs">
                  {order.paymentProvider}
                </span>
              )}
            </>
          ) : (
            <>
              {t("orderRef", lang)}:{" "}
              <code className="rounded bg-cream px-1.5 py-0.5">{friendlyRef}</code>
            </>
          )}
        </p>

        {pending && (
          <div className="mt-5 rounded-xl border border-gold/30 bg-cream p-4">
            <p className="text-sm text-brown-soft">
              {t("orderPendingMsg", lang)}
            </p>
            <div className="mt-3">
              <PayNowButton orderId={order.id} />
            </div>
          </div>
        )}

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {[
            [t("orderStatus", lang), statusLabel],
            [t("orderTotal", lang), formatMoney(order.total)],
            [t("orderRef", lang), friendlyRef],
            [t("orderTracking", lang), order.trackingNumber || t("orderPendingTracking", lang)],
          ].map(([label, value], i) => (
            <div key={label} className="rounded-xl bg-cream p-4">
              <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-brown-soft">
                {i === 2 && <Package size={12} />}
                {i === 3 && <Truck size={12} />}
                {label}
              </p>
              <p className="mt-1 font-semibold text-brown">{value}</p>
            </div>
          ))}
        </div>

        <ul className="mt-6 space-y-2 border-t border-gold/20 pt-4 text-sm">
          {order.items.map((i) => (
            <li key={i.productId} className="flex justify-between">
              <span>
                {i.name} × {i.qty}
              </span>
              <span>{formatMoney(i.unitPrice * i.qty)}</span>
            </li>
          ))}
        </ul>

        {/* La página pública es SOLO para el comprador: no muestra unit
            economics, notas ni logs de operación. Toda esa info vive en
            /admin/pedido/[id] (detalle admin). */}
        {isAdmin && (
          <div className="mt-4 rounded-xl border border-gold/30 bg-cream p-4 text-sm">
            <Link
              href={`/admin/pedido/${order.id}`}
              className="font-semibold text-gold-dark hover:underline"
            >
              Ver detalle completo (admin) →
            </Link>
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/productos"
            className="rounded-full bg-brown px-5 py-2.5 text-sm font-semibold text-ivory"
          >
            {t("keepShopping", lang)}
          </Link>
        </div>
      </div>
    </div>
  );
}
