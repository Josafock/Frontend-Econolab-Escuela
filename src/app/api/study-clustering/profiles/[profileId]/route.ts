import { cookies } from "next/headers";

type RouteContext = {
  params: Promise<{ profileId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
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

  const { profileId } = await context.params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body.displayName !== "string") {
    return Response.json(
      { errors: ["El nombre del perfil es obligatorio."] },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(
      `${process.env.API_URL}/study-clustering/profiles/${encodeURIComponent(profileId)}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ displayName: body.displayName }),
        cache: "no-store",
      },
    );

    const json = await response.json().catch(() => ({}));
    return Response.json(json, { status: response.status });
  } catch {
    return Response.json(
      { errors: ["No fue posible actualizar el nombre del perfil."] },
      { status: 503 },
    );
  }
}
