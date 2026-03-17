import { cookies } from "next/headers";
import { resolveModulePath } from "../../_lib/module-config";

type RouteContext = {
  params: Promise<{ module: string }>;
};

export async function GET(_: Request, context: RouteContext) {
  const token = (await cookies()).get("ECONOLAB_TOKEN")?.value;
  if (!token) {
    return Response.json({ errors: ["Tu sesion expiro. Inicia sesion nuevamente."] }, { status: 401 });
  }

  const { module } = await context.params;
  const modulePath = resolveModulePath(module);

  if (!modulePath) {
    return Response.json({ errors: ["Modulo de exportacion no soportado."] }, { status: 404 });
  }

  const res = await fetch(`${process.env.API_URL}${modulePath}/export`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  const contentType = res.headers.get("content-type") ?? "text/csv; charset=utf-8";
  const disposition = res.headers.get("content-disposition") ?? `attachment; filename="${module}-export.csv"`;
  const body = await res.text();

  if (!res.ok) {
    try {
      return Response.json(JSON.parse(body), { status: res.status });
    } catch {
      return Response.json({ errors: ["No se pudo exportar la informacion."] }, { status: res.status });
    }
  }

  return new Response(body, {
    status: res.status,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": disposition,
    },
  });
}
