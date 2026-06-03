import { useMemo } from "react";
import { DndContext, type DragEndEvent, closestCenter, useDraggable, useDroppable } from "@dnd-kit/core";
import { restrictToVerticalAxis, restrictToWindowEdges } from "@dnd-kit/modifiers";
import { GripVertical } from "lucide-react";
import { useReportDesignerStore } from "../reportDesigner.store";
import type { ReportSection } from "../reports.types";

function SectionRow({ section }: { section: ReportSection }) {
  const updateSection = useReportDesignerStore((state) => state.updateSection);
  const toggleSection = useReportDesignerStore((state) => state.toggleSection);
  const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({ id: section.id });
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: section.id });

  return (
    <div
      ref={setDropRef}
      className={[
        "min-w-0 rounded-lg border bg-white p-3 transition",
        isOver ? "border-ink-950" : "border-ink-200",
        isDragging ? "opacity-70" : "",
      ].join(" ")}
      style={{ transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined }}
    >
      <div className="flex min-w-0 items-start gap-2">
        <button ref={setDragRef} type="button" className="mt-1 shrink-0 rounded-md p-1 text-ink-500 hover:bg-ink-100" {...listeners} {...attributes} aria-label={`Reorder ${section.title}`}>
          <GripVertical className="h-4 w-4" aria-hidden="true" />
        </button>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex min-w-0 items-center gap-2">
            <input type="checkbox" checked={section.enabled} onChange={() => toggleSection(section.id)} className="h-4 w-4 shrink-0 accent-ink-950" />
            <input
              value={section.title}
              onChange={(event) => updateSection(section.id, { title: event.target.value })}
              className="min-h-9 min-w-0 flex-1 rounded-md border border-ink-300 px-2 py-1 text-sm font-semibold"
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              type="number"
              placeholder="Heading"
              value={section.style?.headingFontSize ?? ""}
              onChange={(event) => updateSection(section.id, { style: { headingFontSize: event.target.value ? Number(event.target.value) : undefined } })}
              className="min-h-9 min-w-0 rounded-md border border-ink-300 px-2 py-1 text-xs"
            />
            <input
              type="number"
              placeholder="Body"
              value={section.style?.bodyFontSize ?? ""}
              onChange={(event) => updateSection(section.id, { style: { bodyFontSize: event.target.value ? Number(event.target.value) : undefined } })}
              className="min-h-9 min-w-0 rounded-md border border-ink-300 px-2 py-1 text-xs"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SectionOrderEditor() {
  const templateSections = useReportDesignerStore((state) => state.template.sections);
  const sections = useMemo(() => [...templateSections].sort((a, b) => a.order - b.order), [templateSections]);
  const reorderSections = useReportDesignerStore((state) => state.reorderSections);

  function handleDragEnd(event: DragEndEvent) {
    if (event.over?.id) reorderSections(String(event.active.id), String(event.over.id));
  }

  return (
    <DndContext collisionDetection={closestCenter} modifiers={[restrictToVerticalAxis, restrictToWindowEdges]} onDragEnd={handleDragEnd}>
      <div className="grid min-w-0 gap-3">
        {sections.map((section) => (
          <SectionRow key={section.id} section={section} />
        ))}
      </div>
    </DndContext>
  );
}
