import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ segments: string[] }> },
) {
  const { segments } = await params;
  const token = (await cookies()).get("ECONOLAB_TOKEN")?.value;

  if (!token) {
    return Response.json(
      { message: "Tu sesion expiro. Inicia sesion nuevamente." },
      { status: 401 },
    );
  }

  if (!process.env.API_URL) {
    return Response.json(
      { message: "API_URL no esta configurada." },
      { status: 500 },
    );
  }

  const upstreamPath = segments.join("/");
  const upstreamUrl = `${process.env.API_URL}/${upstreamPath}${request.nextUrl.search}`;

  const response = await fetch(upstreamUrl, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  const headers = new Headers();
  const contentType = response.headers.get("content-type");
  const contentDisposition = response.headers.get("content-disposition");

  if (contentType) {
    headers.set("content-type", contentType);
  }
  if (contentDisposition) {
    headers.set("content-disposition", contentDisposition);
  }

  const buffer = await response.arrayBuffer();
  return new Response(buffer, {
    status: response.status,
    headers,
  });
}
