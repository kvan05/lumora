import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const orderCode = searchParams.get("orderCode") || searchParams.get("order_code");

    if (!orderCode) {
      return NextResponse.json(
        { success: false, error: "Missing required query parameter: orderCode" },
        { status: 400 }
      );
    }

    const response = await fetch(`${BACKEND_API_URL}/payment/check?orderCode=${orderCode}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error("[Next.js PayOS Check Proxy Error]:", error?.message || error);
    return NextResponse.json({ success: false, error: "Check payment proxy error" }, { status: 500 });
  }
}
