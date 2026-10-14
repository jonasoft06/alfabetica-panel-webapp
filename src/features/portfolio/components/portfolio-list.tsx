"use client";

import { restrictToVerticalAxis } from "@/shared/lib/dnd";
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type Announcements, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { PortfolioListItem } from "@/contracts/portfolio";
import { Checkbox } from "@/shared/ui/checkbox";
import { Skeleton } from "@/shared/ui/skeleton";
import { DragHandle, gridTemplate, PortfolioRow } from "./portfolio-row";

export interface PortfolioListProps {
  items: PortfolioListItem[];
  canWrite: boolean;
  selectedIds: ReadonlySet<string>;
  onToggle: (id: string, checked: boolean) => void;
  onTogglePage: (checked: boolean) => void;
  onEdit: (item: PortfolioListItem) => void;
  /** When set, rows are sortable and numbered; called with the new id order. */
  onReorder?: (orderedIds: string[]) => void;
}

/** Keeps the dragged row on the list's vertical axis. */

const HEADERS = (reorder: boolean) => [reorder && "Posición", "Portada", "Título", "Estado"].filter(Boolean) as string[];

export function PortfolioList({ items, canWrite, selectedIds, onToggle, onTogglePage, onEdit, onReorder }: PortfolioListProps) {
  const reorder = !!onReorder && canWrite;
  const selectable = canWrite;
  const template = gridTemplate({ selectable, reorder });
  const selectedOnPage = items.filter((i) => selectedIds.has(i.id)).length;
  const allSelected = items.length > 0 && selectedOnPage === items.length;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const titleOf = (id: string | number) => items.find((i) => i.id === id)?.title ?? "título";
  const positionOf = (id: string | number) => items.findIndex((i) => i.id === id) + 1;
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Tomaste ${titleOf(active.id)}, posición ${positionOf(active.id)} de ${items.length}.`,
    onDragOver: ({ active, over }) => (over ? `${titleOf(active.id)} está sobre la posición ${positionOf(over.id)} de ${items.length}.` : undefined),
    onDragEnd: ({ active, over }) =>
      over ? `${titleOf(active.id)} se soltó en la posición ${positionOf(over.id)} de ${items.length}.` : `${titleOf(active.id)} volvió a su lugar.`,
    onDragCancel: ({ active }) => `Movimiento cancelado. ${titleOf(active.id)} volvió a su lugar.`,
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!onReorder || !over || active.id === over.id) return;
    const ids = items.map((i) => i.id);
    onReorder(arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id))));
  };

  const rowProps = (item: PortfolioListItem) => ({
    item,
    selectable,
    selected: selectedIds.has(item.id),
    onSelectedChange: (checked: boolean) => onToggle(item.id, checked),
    canWrite,
    onEdit,
    template,
  });

  const rows = reorder ? (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragEnd={handleDragEnd}
      accessibility={{
        announcements,
        screenReaderInstructions: {
          draggable: "Para reordenar, presiona espacio, mueve con las flechas arriba y abajo, y vuelve a presionar espacio para soltar. Escape cancela.",
        },
      }}
    >
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <ul role="rowgroup" className="divide-y">
          {items.map((item, index) => (
            <SortableRow key={item.id} position={index + 1} {...rowProps(item)} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  ) : (
    <ul role="rowgroup" className="divide-y">
      {items.map((item) => (
        <PortfolioRow key={item.id} {...rowProps(item)} />
      ))}
    </ul>
  );

  return (
    <div role="table" aria-label={reorder ? "Orden de títulos publicados" : "Listado de portafolio"}>
      <div
        role="row"
        style={{ "--cols": template } as React.CSSProperties}
        className="hidden items-center gap-4 border-b px-6 py-3 md:grid md:grid-cols-(--cols)"
      >
        {selectable && (
          <div role="columnheader">
            <Checkbox
              checked={allSelected ? true : selectedOnPage > 0 ? "indeterminate" : false}
              onCheckedChange={(v) => onTogglePage(v === true)}
              aria-label="Seleccionar todos los de esta página"
            />
          </div>
        )}
        {HEADERS(reorder).map((h) => (
          <span key={h} role="columnheader" className="eyebrow whitespace-nowrap">
            {h}
          </span>
        ))}
        <span role="columnheader" className="sr-only">
          Acciones
        </span>
      </div>
      {rows}
    </div>
  );
}

function SortableRow(props: Parameters<typeof PortfolioRow>[0] & { position: number }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: props.item.id });
  return (
    <PortfolioRow
      {...props}
      rowRef={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      dragging={isDragging}
      handle={<DragHandle ref={setActivatorNodeRef} label={`Reordenar ${props.item.title}`} {...attributes} {...listeners} />}
    />
  );
}

export function PortfolioListSkeleton() {
  return (
    <ul className="divide-y" aria-busy="true" aria-label="Cargando portafolio">
      {Array.from({ length: 7 }, (_, i) => (
        <li key={i} className="flex items-center gap-4 px-5 py-3.5 md:px-6">
          <Skeleton className="h-[48px] w-9 md:w-11" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="hidden h-5 w-24 md:block" />
        </li>
      ))}
    </ul>
  );
}
