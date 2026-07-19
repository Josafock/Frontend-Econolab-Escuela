import { cookies } from "next/headers";

export async function GET() {
  const token = (await cookies()).get("ECONOLAB_TOKEN")?.value;
  if (!token) {
    return Response.json(
      { errors: ["Tu sesion expiro. Inicia sesion nuevamente."] },
      { status: 401 },
    );
  }

  if (!process.env.API_URL) {
    return Response.json(
      { errors: ["API_URL no esta configurada en el frontend."] },
      { status: 500 },
    );
  }

  const backendUrl = new URL(
    `${process.env.API_URL}/study-clustering/analysis`,
  );

  try {
    const response = await fetch(backendUrl.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const json = await response.json().catch(() => ({}));
    return Response.json(json, { status: response.status });
  } catch {
    return Response.json(
      { errors: ["No fue posible conectar con el backend de clustering."] },
      { status: 503 },
    );
  }
}
