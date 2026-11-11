import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const subpath = (path ?? []).join("/");
    const backendBase = (env.paymentApiUrl || "https://pay.timberteak.com").replace(/\/$/, "");
    const targetUrl = `${backendBase}/${subpath}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const authHeader = req.headers.get("authorization");
    if (authHeader) {
      headers["Authorization"] = authHeader;
    }

    const bodyText = await req.text();

    const response = await fetch(targetUrl, {
      method: "POST",
      headers,
      body: bodyText,
    });

    const text = await response.text();
    let data: Record<string, unknown> = {};
    try {
      data = JSON.parse(text);
    } catch {
      data = {
        error:
          response.status === 502
            ? "Payment backend is restarting or temporarily busy. Please retry in a few seconds."
            : `Backend returned error code ${response.status}`,
      };
    }
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("[api/payment proxy error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Payment backend communication error" },
      { status: 502 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const subpath = (path ?? []).join("/");
    const backendBase = (env.paymentApiUrl || "https://pay.timberteak.com").replace(/\/$/, "");
    const targetUrl = `${backendBase}/${subpath}`;

    const headers: Record<string, string> = {};
    const authHeader = req.headers.get("authorization");
    if (authHeader) {
      headers["Authorization"] = authHeader;
    }

    const response = await fetch(targetUrl, {
      method: "GET",
      headers,
    });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Payment backend communication error" },
      { status: 502 }
    );
  }
}

