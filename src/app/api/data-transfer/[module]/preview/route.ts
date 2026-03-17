import { cookies } from "next/headers";
import { resolveModulePath } from "../../_lib/module-config";

type RouteContext = {
  params: Promise<{ module: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const token = (await cookies()).get("ECONOLAB_TOKEN")?.value;
  if (!token) {
    return Response.json({ errors: ["Tu sesion expiro. Inicia sesion nuevamente."] }, { status: 401 });
  }

  const { module } = await context.params;
  const modulePath = resolveModulePath(module);

  if (!modulePath) {
    return Response.json({ errors: ["Modulo de importacion no soportado."] }, { status: 404 });
  }

  const formData = await request.formData();
  const res = await fetch(`${process.env.API_URL}${modulePath}/import/preview`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
    cache: "no-store",
  });

  const json = await res.json().catch(() => ({}));
  return Response.json(json, { status: res.status });
}
