"use client";

// Drag and drop de filas de tabla con @dnd-kit (mouse, táctil y teclado). Se usa en la planificación y en la cartera de órdenes.
// El orden es optimista: se aplica al soltar y, si el backend falla, vuelve atrás y avisa (diseño.md: orden compartido).
import { useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { GripVerticalIcon } from "lucide-react";
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import { TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

/**
 * Lista ordenada de forma optimista. `items` llega en el orden del servidor; `guardar(ids)` persiste el nuevo orden y devuelve
 * un mensaje de error (o null si salió bien). El orden local se descarta cuando cambia el orden/conjunto que manda el servidor.
 */
export function useOrdenOptimista<T extends { id: string }>(items: T[], guardar: (ids: string[]) => Promise<string | null>) {
  const router = useRouter();
  const base = items.map((i) => i.id).join(",");
  const [local, setLocal] = useState<{ base: string; ids: string[] } | null>(null);
  const guardando = useRef(false);

  const mapa = new Map(items.map((i) => [i.id, i]));
  const ordenados = local && local.base === base ? local.ids.map((id) => mapa.get(id)).filter((x): x is T => x !== undefined) : items;

  async function mover(activeId: string, overId: string) {
    if (guardando.current || activeId === overId) return;
    const actuales = ordenados.map((i) => i.id);
    const desde = actuales.indexOf(activeId);
    const hasta = actuales.indexOf(overId);
    if (desde < 0 || hasta < 0) return;
    const nuevos = arrayMove(actuales, desde, hasta);
    setLocal({ base, ids: nuevos });
    guardando.current = true;
    const error = await guardar(nuevos);
    guardando.current = false;
    if (error) {
      setLocal(null);
      toast.error("No se pudo guardar el nuevo orden", { description: error });
      return;
    }
    router.refresh(); // trae el orden real del servidor (lo ven todos los usuarios)
  }

  return { ordenados, mover };
}

/** Contenedor: sensores y contexto de ordenamiento. Envuelve a las filas (no genera DOM propio, va dentro del <TableBody>). */
export function ListaOrdenable({
  ids,
  onMover,
  children,
}: {
  ids: string[];
  onMover: (activeId: string, overId: string) => void;
  children: ReactNode;
}) {
  const sensores = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    // Táctil: mantener apretada el asa un instante (así no se confunde con scrollear la tabla).
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function alSoltar(e: DragEndEvent) {
    if (e.over && e.active.id !== e.over.id) onMover(String(e.active.id), String(e.over.id));
  }

  // Los textos ocultos de dnd-kit son <div>: dentro de un <tbody> rompen la hidratación. Se llevan al <body> con
  // `accessibility.container`, que solo existe en el navegador; por eso el contexto se monta recién después de hidratar.
  const montado = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  if (!montado) return <>{children}</>;

  return (
    <DndContext
      sensors={sensores}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragEnd={alSoltar}
      accessibility={{ container: document.body }}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
}

/** Fila de tabla arrastrable por su asa. `children` recibe el asa para ponerla en la celda que quiera. */
export function FilaOrdenable({
  id,
  habilitado,
  className,
  style,
  children,
  rowProps,
}: {
  id: string;
  /** Sin permiso para reordenar no hay asa ni arrastre. */
  habilitado: boolean;
  className?: string;
  style?: CSSProperties;
  children: (asa: ReactNode) => ReactNode;
  rowProps?: React.ComponentProps<"tr">;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id, disabled: !habilitado });

  const asa = habilitado ? (
    <button
      type="button"
      ref={setActivatorNodeRef}
      {...attributes}
      {...listeners}
      aria-label="Arrastrar para reordenar (con teclado: espacio, flechas y espacio)"
      title="Arrastrar para reordenar"
      className="inline-flex size-11 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg border text-muted-foreground hover:bg-muted active:cursor-grabbing"
    >
      <GripVerticalIcon className="size-5" />
    </button>
  ) : null;

  // `rowProps.ref` (p. ej. para hacer scroll a la fila) no puede pisar al ref de dnd-kit: se combinan.
  const { ref: refExterno, ...restoProps } = (rowProps ?? {}) as React.ComponentProps<"tr"> & { ref?: React.Ref<HTMLTableRowElement> };
  const combinarRef = (nodo: HTMLTableRowElement | null) => {
    setNodeRef(nodo);
    if (typeof refExterno === "function") refExterno(nodo);
    else if (refExterno) (refExterno as React.RefObject<HTMLTableRowElement | null>).current = nodo;
  };

  return (
    <TableRow
      ref={combinarRef}
      {...restoProps}
      style={{ ...style, transform: CSS.Translate.toString(transform), transition }}
      className={cn(isDragging && "relative z-10 bg-background shadow-lg", className)}
    >
      {children(asa)}
    </TableRow>
  );
}
