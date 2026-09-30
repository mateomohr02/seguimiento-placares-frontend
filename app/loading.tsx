import { LoadingDots } from "@/components/loading-dots";

// Se muestra mientras cualquier página del App Router carga sus datos.
export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center text-gold">
      <LoadingDots className="gap-2 [&>span]:size-3" />
    </div>
  );
}
