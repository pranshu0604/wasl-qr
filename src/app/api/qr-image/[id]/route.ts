import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateQRCodeBuffer } from "@/lib/qr";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const attendee = await db.findById(id);

    if (!attendee) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // NEXT_PUBLIC_APP_URL must be set in Vercel; fall back to VERCEL_URL auto-var
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

    const scanUrl = `${appUrl}/api/verify/${attendee.qrToken}`;
    const buffer = await generateQRCodeBuffer(scanUrl);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": "inline; filename=event-pass.png",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("QR image error:", error);
    return NextResponse.json({ error: "Failed to generate QR code" }, { status: 500 });
  }
}
