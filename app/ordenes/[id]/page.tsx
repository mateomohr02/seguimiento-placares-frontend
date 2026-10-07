import Link from "next/link";
import { apiFetch } from "@/lib/api/api-client";
import { PedidosTable } from "@/modules/pedido/components/pedidos-table";
import type { Pedido } from "@/modules/pedido/types/pedido.types";
import type { Orden } from "@/modules/orden/types/orden.types";
import { EstadoBadge } from "@/components/estado-badge";
import { buttonVariants } from "@/components/ui/button";
import { FileTextIcon } from "lucide-react";

export default async function OrdenDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [orden, pedidos] = await Promise.all([
    apiFetch<Orden>(`/ordenes/${id}`),
    apiFetch<Pedido[]>(`/ordenes/${id}/pedidos`),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10">
      <div>
        <Link href="/" className="text-sm text-muted-foreground hover:underline">
          ← Órdenes
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-xl font-semibold">
            Orden {orden.numeroOrdenCustom} — {orden.descripcion}
          </h1>
          <EstadoBadge estado={orden.estado} />
          <Link
            href={`/ordenes/${id}/hojas-corte`}
            className={buttonVariants({ variant: "outline", className: "ml-auto h-10 px-4" })}
          >
            <FileTextIcon /> Hojas de corte
          </Link>
        </div>
      </div>

      <PedidosTable pedidos={pedidos} />
    </main>
  );
}
