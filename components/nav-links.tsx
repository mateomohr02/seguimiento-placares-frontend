"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";

export interface NavLink {
  href: string;
  label: string;
  /** Solo es la página activa si la ruta coincide exacta (ej. "/" no debe marcar todo). */
  exacto?: boolean;
}

export interface NavGrupo {
  titulo: string | null;
  links: NavLink[];
}

// Enlaces de la barra de navegación; el de la página actual se resalta. Se desplazan
// horizontalmente si no entran (celulares).
export function NavLinks({ grupos, className }: { grupos: NavGrupo[]; className?: string }) {
  const pathname = usePathname();
  const activo = (l: NavLink) => (l.exacto ? pathname === l.href : pathname === l.href || pathname.startsWith(`${l.href}/`));

  return (
    <nav aria-label="Principal" className={cn("flex min-w-0 items-center gap-1 overflow-x-auto py-1 [scrollbar-width:none]", className)}>
      {grupos.map((g, i) => (
        <div key={g.titulo ?? i} className={cn("flex shrink-0 items-center gap-1", i > 0 && "border-l pl-2 ml-1")}>
          {g.titulo && <span className="hidden text-xs font-medium text-muted-foreground uppercase xl:inline">{g.titulo}</span>}
          {g.links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={activo(l) ? "page" : undefined}
              className={cn(
                "inline-flex h-10 items-center rounded-lg px-2.5 text-sm font-medium whitespace-nowrap transition active:scale-[0.98]",
                activo(l) ? "bg-primary text-primary-foreground" : "text-foreground/80 hover:bg-muted hover:text-foreground",
              )}
            >
              {l.label}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );
}
