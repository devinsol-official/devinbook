import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ptxn } = await request.json();

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
    const baseUrl = apiUrl.endsWith("/api") ? apiUrl.slice(0, -4) : apiUrl;
    const response = await fetch(`${baseUrl}/api/paddle/verify-transaction`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({ ptxn }),
    });

    const data = await response.json();
    console.log("Verify transaction response from backend:", data);
    return NextResponse.json(data, { status: response.status });
  } catch (err) {
    console.error("Verify transaction error:", err);
    return NextResponse.json({ error: "Failed to verify transaction" }, { status: 500 });
  }
}
