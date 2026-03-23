import { cookies } from "next/headers";

export async function GET(request: Request) {
  const token = (await cookies()).get("ECONOLAB_TOKEN")?.value;
  if (!token) {
    return Response.json({ errors: ["Tu sesion expiro. Inicia sesion nuevamente."] }, { status: 401 });
  }

  const incomingUrl = new URL(request.url);
  const backendUrl = new URL(`${process.env.API_URL}/loss-predictions/predict`);
  for (const [key, value] of incomingUrl.searchParams.entries()) {
    backendUrl.searchParams.set(key, value);
  }

  const res = await fetch(backendUrl.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  const json = await res.json().catch(() => ({}));
  return Response.json(json, { status: res.status });
}
