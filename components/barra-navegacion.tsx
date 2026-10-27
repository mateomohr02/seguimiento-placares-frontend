import Link from "next/link";
import { getSesion } from "@/lib/auth/sesion";
import { PERMISOS, estacionesVisibles, puede, puedeCompletarPlanilla, type Sesion } from "@/lib/auth/permisos";
import { LogoNeostone } from "@/components/logo-neostone";
import { UsuarioMenu } from "@/components/usuario-menu";
import { NavLinks, type NavGrupo } from "@/components/nav-links";

// Barra superior de toda la app (con sesión): acceso a las planillas de Termolaminado, a la
// planificación y a los registros desde cualquier pantalla (órdenes, documentación de un pedido,
// visores…), junto al usuario. Alto fijo (--barra-h) para que las pantallas completas lo descuenten.
function gruposDe(sesion: Sesion): NavGrupo[] {
  const grupos: NavGrupo[] = [{ titulo: null, links: [{ href: "/", label: "Órdenes", exacto: true }] }];

  // Solo los tipos de planilla de las estaciones de trabajo del usuario (en el orden del proceso); si está en varias estaciones con el mismo tipo, elige en cuál al entrar. Técnica y admin ven los tres.
  const planillas = [
    { href: "/planillas/lijado", label: "Lijado", estacion: "LIJADO" },
    { href: "/planillas/encolado", label: "Encolado", estacion: "ENCOLADO" },
    { href: "/planillas/pvc", label: "PVC", estacion: "PVC" },
  ].filter((p) => puedeCompletarPlanilla(sesion, p.estacion));
  if (planillas.length > 0) grupos.push({ titulo: "Planillas", links: planillas });

  const termolaminado = [];
  if (puede(sesion, PERMISOS.DOCUMENTACION_VER) && puede(sesion, PERMISOS.PLANILLAS_VER)) {
    termolaminado.push({ href: "/planificacion", label: "Planificación" });
  }
  if (puede(sesion, PERMISOS.PLANILLAS_VER) && estacionesVisibles(sesion).length > 0) {
    // La trazabilidad de un pedido se abre desde Registros e Indicadores (para que la barra entre en una tablet).
    termolaminado.push({ href: "/planillas/registros", label: "Registros" });
  }
  if (puede(sesion, PERMISOS.PLANILLAS_INDICADORES)) termolaminado.push({ href: "/planillas/indicadores", label: "Indicadores" });
  if (puede(sesion, PERMISOS.PLANILLAS_CONFIGURAR)) termolaminado.push({ href: "/planillas/configuracion", label: "Configurar" });
  if (termolaminado.length > 0) grupos.push({ titulo: "Termolaminado", links: termolaminado });

  // Alta y baja de personas, PIN, rol y estaciones de trabajo (técnica / admin).
  if (puede(sesion, PERMISOS.USUARIOS_GESTIONAR)) grupos.push({ titulo: null, links: [{ href: "/usuarios", label: "Usuarios" }] });

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
    // Celular y tablet vertical: dos filas (logo y usuario arriba, enlaces abajo); desde lg, una sola fila.
    <header className="sticky top-0 z-40 grid h-(--barra-h) grid-cols-[auto_1fr] grid-rows-[3rem_2.75rem] items-center gap-x-3 border-b bg-background/95 px-3 backdrop-blur supports-backdrop-filter:bg-background/80 lg:grid-cols-[auto_1fr_auto] lg:grid-rows-1">
      <Link href="/" aria-label="Ir al inicio" className="row-start-1 shrink-0">
        <LogoNeostone className="w-24 xl:w-32" />
      </Link>
      <NavLinks grupos={gruposDe(sesion)} className="col-span-2 row-start-2 lg:col-span-1 lg:col-start-2 lg:row-start-1" />
      <div className="col-start-2 row-start-1 justify-self-end lg:col-start-3">
        <UsuarioMenu />
      </div>
    </header>
  );
}
