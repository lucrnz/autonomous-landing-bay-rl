import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleRequest(request, params, "GET");
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleRequest(request, params, "POST");
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleRequest(request, params, "PUT");
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleRequest(request, params, "DELETE");
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleRequest(request, params, "PATCH");
}

async function handleRequest(
  request: NextRequest,
  params: Promise<{ path: string[] }>,
  method: string
) {
  try {
    // Get the path from params
    const resolvedParams = await params;
    const path = resolvedParams.path.join("/");
    const url = `${PYTHON_API_URL}/${path}`;

    // Get the JWT token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get("jwt_token")?.value;

    // Build headers
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    // Attach token as Authorization header if it exists
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Get the request body if it exists
    let body: string | undefined;
    if (method !== "GET" && method !== "DELETE") {
      try {
        const requestBody: unknown = await request.json();
        body = JSON.stringify(requestBody);
      } catch {
        // No body or invalid JSON
        body = undefined;
      }
    }

    // Forward the request to Python backend
    const response = await fetch(url, {
      method,
      headers,
      body,
    });

    // Get response data
    const data = await response.text();
    let jsonData;
    try {
      jsonData = JSON.parse(data);
    } catch {
      jsonData = data;
    }

    // Return response with same status code
    return NextResponse.json(jsonData, { status: response.status });
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
