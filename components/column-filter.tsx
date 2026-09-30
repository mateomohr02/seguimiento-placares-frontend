"use client";

import { useMemo, useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { cn } from "cn";
import { FilterIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Filtro de columna al estilo Excel: lista de valores con checkbox + búsqueda.
// `selected === null` significa "sin filtro" (todos los valores pasan).
export function ColumnFilter({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: Set<string> | null;
  onChange: (next: Set<string> | null) => void;
}) {
  const [search, setSearch] = useState("");
  const active = selected !== null;

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? options.filter((o) => o.toLowerCase().includes(q)) : options;
  }, [options, search]);

  const isChecked = (value: string) => (selected ? selected.has(value) : true);

  function commit(next: Set<string>) {
    onChange(options.every((o) => next.has(o)) ? null : next);
  }

  function toggle(value: string) {
    const next = new Set(selected ?? options);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    commit(next);
  }

  // "Seleccionar todo" actúa sobre lo visible (como Excel al buscar).
  function toggleVisible() {
    const allVisibleChecked = visible.every(isChecked);
    const next = new Set(selected ?? options);
    for (const v of visible) {
      if (allVisibleChecked) next.delete(v);
      else next.add(v);
    }
    commit(next);
  }

  return (
    <Popover.Root onOpenChange={(open) => !open && setSearch("")}>
      <Popover.Trigger
        aria-label={`Filtrar ${label}`}
        className={cn(
          "inline-flex size-6 items-center justify-center rounded-md hover:bg-muted",
          active ? "bg-primary/10 text-primary" : "text-muted-foreground",
        )}
      >
        <FilterIcon className="size-3.5" fill={active ? "currentColor" : "none"} />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={6} align="start" className="z-50">
          <Popover.Popup className="w-60 rounded-lg border bg-popover p-2 text-popover-foreground shadow-md outline-none">
            <Input
              placeholder={`Buscar en ${label.toLowerCase()}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mb-2 h-8"
            />
            <div className="max-h-56 overflow-y-auto">
              {visible.length === 0 ? (
                <p className="px-2 py-1.5 text-sm text-muted-foreground">Sin resultados</p>
              ) : (
                <>
                  <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm font-medium hover:bg-muted">
                    <input
                      type="checkbox"
                      className="accent-primary"
                      checked={visible.every(isChecked)}
                      onChange={toggleVisible}
                    />
                    (Seleccionar todo)
                  </label>
                  {visible.map((value) => (
                    <label
                      key={value}
                      className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted"
                    >
                      <input
                        type="checkbox"
                        className="accent-primary"
                        checked={isChecked(value)}
                        onChange={() => toggle(value)}
                      />
                      <span className="truncate">{value}</span>
                    </label>
                  ))}
                </>
              )}
            </div>
            <div className="mt-2 flex justify-end border-t pt-2">
              <Button size="sm" variant="ghost" disabled={!active} onClick={() => onChange(null)}>
                Limpiar filtro
              </Button>
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
