import { NextResponse } from "next/server";
import { isStripeConfigured } from "@/lib/stripe";
import { isCjConfigured } from "@/lib/cj";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    stripe: isStripeConfigured(),
    cj: isCjConfigured(),
  });
}
