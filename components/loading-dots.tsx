import { cn } from "cn";

// Tres puntos que crecen y se achican en sucesión (keyframes en globals.css).
export function LoadingDots({ className }: { className?: string }) {
  return (
    <span role="status" aria-label="Cargando" className={cn("inline-flex items-center gap-1", className)}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="loading-dot inline-block size-1.5 rounded-full bg-current"
          style={{ animationDelay: `${i * 0.16}s` }}
        />
      ))}
    </span>
  );
}
