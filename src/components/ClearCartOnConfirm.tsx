"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/cart-store";

/**
 * Limpia el carrito cuando el pedido ya está confirmado (pagado o más allá).
 * El checkout NO vacía el carrito antes de pagar: si el cliente cancela en
 * Stripe conserva sus productos; se vacían solo al confirmar el pago.
 */
export function ClearCartOnConfirm({ confirmed }: { confirmed: boolean }) {
  const clear = useCart((s) => s.clear);
  useEffect(() => {
    if (confirmed) clear();
  }, [confirmed, clear]);
  return null;
}
