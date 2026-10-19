import Link from "next/link";
import { getSesion } from "@/lib/auth/sesion";
import { PERMISOS, puede, type Sesion } from "@/lib/auth/permisos";
import { LogoNeostone } from "@/components/logo-neostone";
import { UsuarioMenu } from "@/components/usuario-menu";
import { NavLinks, type NavGrupo } from "@/components/nav-links";

// Barra superior de toda la app (con sesión): acceso a las planillas de Termolaminado, a la
// planificación y a los registros desde cualquier pantalla (órdenes, documentación de un pedido,
// visores…), junto al usuario. Alto fijo (--barra-h) para que las pantallas completas lo descuenten.
function gruposDe(sesion: Sesion): NavGrupo[] {
  const grupos: NavGrupo[] = [{ titulo: null, links: [{ href: "/", label: "Órdenes", exacto: true }] }];

  if (puede(sesion, PERMISOS.PLANILLAS_COMPLETAR)) {
    grupos.push({
      titulo: "Planillas",
      links: [
        { href: "/planillas/lijado", label: "Lijado" },
        { href: "/planillas/encolado", label: "Encolado" },
        { href: "/planillas/pvc", label: "PVC" },
      ],
    });
  }

  const termolaminado = [];
  if (puede(sesion, PERMISOS.DOCUMENTACION_VER) && puede(sesion, PERMISOS.PLANILLAS_VER)) {
    termolaminado.push({ href: "/planificacion", label: "Planificación" });
  }
  if (puede(sesion, PERMISOS.PLANILLAS_VER)) {
    // La trazabilidad de un pedido se abre desde Registros e Indicadores (para que la barra entre en una tablet).
    termolaminado.push({ href: "/planillas/registros", label: "Registros" }, { href: "/planillas/indicadores", label: "Indicadores" });
  }
  if (puede(sesion, PERMISOS.PLANILLAS_CONFIGURAR)) termolaminado.push({ href: "/planillas/operarios", label: "Operarios" });
  if (termolaminado.length > 0) grupos.push({ titulo: "Termolaminado", links: termolaminado });

  return grupos;
}

export async function BarraNavegacion() {
  let sesion: Sesion | null = null;
  try {
    sesion = await getSesion();
  } catch {
    // Backend caído: la barra no se muestra (el NetworkGuard ya avisa).
  }
  if (!sesion) return null;

  return (
    // Celular: dos filas (logo y usuario arriba, enlaces abajo); desde md, una sola fila.
    <header className="sticky top-0 z-40 grid h-(--barra-h) grid-cols-[auto_1fr] grid-rows-[3rem_2.75rem] items-center gap-x-3 border-b bg-background/95 px-3 backdrop-blur supports-backdrop-filter:bg-background/80 md:grid-cols-[auto_1fr_auto] md:grid-rows-1">
      <Link href="/" aria-label="Ir al inicio" className="row-start-1 shrink-0">
        <LogoNeostone className="w-24 xl:w-32" />
      </Link>
      <NavLinks grupos={gruposDe(sesion)} className="col-span-2 row-start-2 md:col-span-1 md:col-start-2 md:row-start-1" />
      <div className="col-start-2 row-start-1 justify-self-end md:col-start-3">
        <UsuarioMenu />
      </div>
    </header>
  );
}
