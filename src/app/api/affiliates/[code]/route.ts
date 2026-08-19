import { NextRequest, NextResponse } from "next/server";
import { getAffiliate, referralLinkFor } from "@/lib/affiliates";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const aff = await getAffiliate(code);
  if (!aff)
    return NextResponse.json({ error: "Afiliado no encontrado" }, { status: 404 });
  return NextResponse.json({ affiliate: aff, referralLink: referralLinkFor(aff.handle) });
}
