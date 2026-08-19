import { NextRequest, NextResponse } from "next/server";
import { createAffiliate, listAffiliates, referralLinkFor } from "@/lib/affiliates";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { handle, name, email, code, commissionRate } = body as Record<
    string,
    string | number | undefined
  >;
  if (!name || !email || (!handle && !code)) {
    return NextResponse.json(
      { error: "Faltan datos (name, email, handle/code)." },
      { status: 400 }
    );
  }
  try {
    const aff = await createAffiliate({
      code: (code || handle) as string,
      handle: handle as string,
      name: name as string,
      email: email as string,
      commissionRate:
        typeof commissionRate === "number" ? commissionRate : undefined,
    });
    return NextResponse.json({
      ok: true,
      affiliate: aff,
      referralLink: referralLinkFor(aff.handle),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error creando afiliado" },
      { status: 400 }
    );
  }
}

export async function GET() {
  const list = await listAffiliates();
  return NextResponse.json({ affiliates: list });
}
