import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const BACKEND_URL = process.env.BACKEND_URL?.replace(/\/$/, "");

function backendNotConfigured(): NextResponse {
  return NextResponse.json(
    {
      detail:
        "BACKEND_URL is not set on Vercel. Add your Railway API URL (e.g. https://your-app.up.railway.app) under Project Settings → Environment Variables, then redeploy.",
    },
    { status: 503 },
  );
}

async function proxyToBackend(
  request: NextRequest,
  pathSegments: string[],
): Promise<NextResponse> {
  if (!BACKEND_URL) {
    return backendNotConfigured();
  }

  const path = pathSegments.map(encodeURIComponent).join("/");
  const target = new URL(`${BACKEND_URL}/api/${path}`);
  target.search = request.nextUrl.search;

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("connection");

  const hasBody = !["GET", "HEAD"].includes(request.method);
  let body: ArrayBuffer | undefined;
  if (hasBody) {
    try {
      body = await request.arrayBuffer();
    } catch {
      return NextResponse.json(
        { detail: "Could not read request body." },
        { status: 400 },
      );
    }
  }

  let backendResponse: Response;
  try {
    backendResponse = await fetch(target, {
      method: request.method,
      headers,
      body: hasBody ? body : undefined,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Backend request failed";
    return NextResponse.json(
      {
        detail: `Could not reach backend at ${BACKEND_URL}. ${message}`,
      },
      { status: 502 },
    );
  }

  const responseHeaders = new Headers(backendResponse.headers);
  responseHeaders.delete("transfer-encoding");

  return new NextResponse(backendResponse.body, {
    status: backendResponse.status,
    statusText: backendResponse.statusText,
    headers: responseHeaders,
  });
}

type RouteContext = { params: Promise<{ path: string[] }> };

async function handle(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  const { path } = await context.params;
  return proxyToBackend(request, path);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const OPTIONS = handle;
