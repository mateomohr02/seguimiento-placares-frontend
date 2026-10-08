import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Puerta de entrada (diseño.md §12): sin cookie de sesión vigente no se ve nada
// salvo /login. Solo mira que exista el token y que no haya vencido (el vencimiento
// va en el payload); la validación real (firma, usuario activo, permisos) la hace
// el backend en cada pedido. Los pedidos que no son de navegación (fetch del
// visor, Server Actions) reciben 401 JSON en vez de una redirección.
const COOKIE_SESION = "sp_sesion";

function vigente(token: string | undefined): boolean {
  if (!token) return false;
  try {
    const cuerpo = token.split(".")[0].replace(/-/g, "+").replace(/_/g, "/");
    const { exp } = JSON.parse(atob(cuerpo)) as { exp?: number };
    return typeof exp === "number" && exp > Date.now() / 1000;
  } catch {
    return false;
  }
}

export function proxy(request: NextRequest) {
  if (vigente(request.cookies.get(COOKIE_SESION)?.value)) return NextResponse.next();

  const esNavegacion =
    request.headers.get("sec-fetch-mode") === "navigate" ||
    (request.headers.get("accept") ?? "").includes("text/html");
  if (esNavegacion) return NextResponse.redirect(new URL("/login", request.url));
  return Response.json({ message: "Sesión inválida o vencida. Ingresá tu PIN." }, { status: 401 });
}

export const config = {
  // /login y /red/estado (lo consulta el comprobador de red) quedan públicos.
  matcher: ["/((?!login|red/estado|_next/static|_next/image|favicon.ico).*)"],
};
