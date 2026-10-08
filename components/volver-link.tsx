import Link from "next/link";
import { cn } from "cn";
import { ArrowLeftIcon } from "lucide-react";

// Botón "volver" único de la app: píldora con flecha que se corre al pasar el mouse.
//  - claro:  páginas normales (fondo blanco), borde fino y fondo propio.
//  - acento: acción de retorno especial (ej. volver al escaneo), con un toque de bronce.
//  - vidrio: sobre la cámara, translúcido y desenfocado (mismo lenguaje que el historial de escaneo).
const VARIANTES = {
  claro:
    "border-border bg-background text-foreground/80 shadow-xs hover:bg-muted hover:text-foreground",
  acento: "border-gold/50 bg-gold/10 text-foreground shadow-xs hover:bg-gold/20",
  vidrio:
    "border-white/30 bg-black/30 text-white backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] [text-shadow:0_1px_2px_rgba(0,0,0,0.5)] hover:bg-black/45",
} as const;

export function VolverLink({
  href,
  children = "Volver",
  variante = "claro",
  grande = false,
  className,
  onClick,
}: {
  href: string;
  children?: React.ReactNode;
  variante?: keyof typeof VARIANTES;
  /** Altura de 44 px (barras de herramientas del visor); por defecto 40 px. */
  grande?: boolean;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "group inline-flex w-fit items-center gap-1.5 rounded-full border px-4 text-sm font-medium whitespace-nowrap transition",
        "active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        grande ? "h-11" : "h-10",
        VARIANTES[variante],
        className,
      )}
    >
      <ArrowLeftIcon className="size-4 shrink-0 transition-transform group-hover:-translate-x-0.5" aria-hidden />
      {children}
    </Link>
  );
}
