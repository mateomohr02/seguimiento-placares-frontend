import Image from "next/image";
import { cn } from "cn";

// Logo de Neostone Amoblamientos (public/logo-neostone.png). El archivo es blanco
// sobre transparente; como la app es de tema claro, se tiñe al negro carbón de la
// paleta (#1A1A1A) con filtros CSS: brightness(0) lo vuelve negro e invert(.1) lo
// sube a ese gris. Para usarlo sobre fondo oscuro, pasar `className="brightness-100 invert-0"`.
export function LogoNeostone({ className }: { className?: string }) {
  return (
    <Image
      src="/logo-neostone.png"
      alt="Neostone Amoblamientos"
      width={287}
      height={63}
      priority
      className={cn("h-auto brightness-0 invert-[.1]", className)}
    />
  );
}
