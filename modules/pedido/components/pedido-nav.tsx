"use client";

import { useEffect, useState } from "react";
import { cn } from "cn";

export interface PedidoNavItem {
  id: string;
  label: string;
  /** Texto chico a la derecha (cantidad). */
  count?: number;
  /** Marca de atención (ej. falta documentación obligatoria). */
  alerta?: boolean;
}

// Barra fija arriba del detalle de pedido para saltar entre sus secciones
// (Modulación, Documentación, Planos). Resalta la sección que se está viendo.
export function PedidoNav({ items }: { items: PedidoNavItem[] }) {
  const [activa, setActiva] = useState(items[0]?.id);

  useEffect(() => {
    const secciones = items
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => el !== null);
    if (secciones.length === 0) return;

    // Activa = la última sección cuyo borde superior ya pasó por debajo de la barra.
    function calcular() {
      const corte = 120;
      let id = secciones[0].id;
      for (const s of secciones) {
        if (s.getBoundingClientRect().top <= corte) id = s.id;
      }
      // Al llegar al final de la página, la última queda activa aunque sea corta.
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
        id = secciones[secciones.length - 1].id;
      }
      setActiva(id);
    }
    calcular();
    window.addEventListener("scroll", calcular, { passive: true });
    window.addEventListener("resize", calcular);
    return () => {
      window.removeEventListener("scroll", calcular);
      window.removeEventListener("resize", calcular);
    };
  }, [items]);

  function ir(e: React.MouseEvent, id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    history.replaceState(null, "", `#${id}`);
  }

  return (
    <nav
      aria-label="Secciones del pedido"
      className="sticky top-0 z-20 -mx-4 flex gap-1 overflow-x-auto border-b bg-background/95 px-4 py-2 backdrop-blur"
    >
      {items.map((i) => (
        <a
          key={i.id}
          href={`#${i.id}`}
          onClick={(e) => ir(e, i.id)}
          aria-current={activa === i.id ? "true" : undefined}
          className={cn(
            "flex h-11 shrink-0 items-center gap-2 rounded-lg px-4 font-medium",
            activa === i.id ? "bg-primary text-primary-foreground" : "hover:bg-muted",
          )}
        >
          {i.label}
          {i.count !== undefined && (
            <span
              className={cn(
                "rounded-full px-2 text-sm",
                activa === i.id ? "bg-primary-foreground/20" : "bg-muted text-muted-foreground",
              )}
            >
              {i.count}
            </span>
          )}
          {i.alerta && <span className="size-2.5 rounded-full bg-amber-500" aria-label="Falta documentación obligatoria" />}
        </a>
      ))}
    </nav>
  );
}
