import { create } from "zustand";
import { nanoid } from "nanoid";
import { createDefaultReportTemplate } from "./reportTemplate.defaults";
import type { ReportAsset, ReportCoverPage, ReportElement, ReportPageSettings, ReportPreviewData, ReportSection, ReportTemplate, ReportTheme } from "./reports.types";

type DesignerState = {
  template: ReportTemplate;
  selectedElementId: string | null;
  activePage: "cover" | string;
  previewData: ReportPreviewData | null;
  dirty: boolean;
  setTemplate: (template: ReportTemplate) => void;
  updateTheme: (theme: Partial<ReportTheme>) => void;
  updatePage: (page: Partial<ReportPageSettings>) => void;
  updateCover: (cover: Partial<ReportCoverPage>) => void;
  addElement: (element: Omit<ReportElement, "id"> & { id?: string }) => void;
  updateElement: (elementId: string, updates: Partial<ReportElement>) => void;
  removeElement: (elementId: string) => void;
  duplicateElement: (elementId: string) => void;
  selectElement: (elementId: string | null) => void;
  addSection: (section: Omit<ReportSection, "id" | "order"> & { id?: string; order?: number }) => void;
  updateSection: (sectionId: string, updates: Partial<ReportSection>) => void;
  reorderSections: (activeId: string, overId: string) => void;
  toggleSection: (sectionId: string) => void;
  addAsset: (asset: ReportAsset) => void;
  setPreviewData: (previewData: ReportPreviewData | null) => void;
  markSaved: (template?: ReportTemplate) => void;
};

function sortSections(sections: ReportSection[]) {
  return [...sections].sort((a, b) => a.order - b.order);
}

function normalizeOrder(sections: ReportSection[]) {
  return sortSections(sections).map((section, index) => ({ ...section, order: index + 1 }));
}

function updateCoverElements(template: ReportTemplate, updater: (elements: ReportElement[]) => ReportElement[]) {
  return {
    ...template,
    coverPage: {
      ...template.coverPage,
      elements: updater(template.coverPage.elements),
    },
  };
}

export const useReportDesignerStore = create<DesignerState>((set, get) => ({
  template: createDefaultReportTemplate(),
  selectedElementId: null,
  activePage: "cover",
  previewData: null,
  dirty: false,
  setTemplate: (template) => set({ template, selectedElementId: null, activePage: "cover", dirty: false }),
  updateTheme: (theme) => set((state) => ({ template: { ...state.template, theme: { ...state.template.theme, ...theme } }, dirty: true })),
  updatePage: (page) => set((state) => ({ template: { ...state.template, page: { ...state.template.page, ...page } }, dirty: true })),
  updateCover: (cover) => set((state) => ({ template: { ...state.template, coverPage: { ...state.template.coverPage, ...cover } }, dirty: true })),
  addElement: (element) =>
    set((state) => {
      const nextElement = { ...element, id: element.id ?? nanoid() };
      return {
        template: updateCoverElements(state.template, (elements) => [...elements, nextElement]),
        selectedElementId: nextElement.id,
        activePage: nextElement.page,
        dirty: true,
      };
    }),
  updateElement: (elementId, updates) =>
    set((state) => ({
      template: updateCoverElements(state.template, (elements) =>
        elements.map((element) =>
          element.id === elementId
            ? {
                ...element,
                ...updates,
                style: updates.style ? { ...element.style, ...updates.style } : element.style,
              }
            : element,
        ),
      ),
      dirty: true,
    })),
  removeElement: (elementId) =>
    set((state) => ({
      template: updateCoverElements(state.template, (elements) => elements.filter((element) => element.id !== elementId)),
      selectedElementId: state.selectedElementId === elementId ? null : state.selectedElementId,
      dirty: true,
    })),
  duplicateElement: (elementId) =>
    set((state) => {
      const source = state.template.coverPage.elements.find((element) => element.id === elementId);
      if (!source) return state;
      const duplicate = {
        ...source,
        id: nanoid(),
        x: source.x + 20,
        y: source.y + 20,
        zIndex: source.zIndex + 1,
      };
      return {
        template: updateCoverElements(state.template, (elements) => [...elements, duplicate]),
        selectedElementId: duplicate.id,
        dirty: true,
      };
    }),
  selectElement: (elementId) => set({ selectedElementId: elementId }),
  addSection: (section) =>
    set((state) => ({
      template: {
        ...state.template,
        sections: normalizeOrder([
          ...state.template.sections,
          {
            ...section,
            id: section.id ?? nanoid(),
            order: section.order ?? state.template.sections.length + 1,
          },
        ]),
      },
      dirty: true,
    })),
  updateSection: (sectionId, updates) =>
    set((state) => ({
      template: {
        ...state.template,
        sections: normalizeOrder(state.template.sections.map((section) => (section.id === sectionId ? { ...section, ...updates, style: updates.style ? { ...section.style, ...updates.style } : section.style } : section))),
      },
      dirty: true,
    })),
  reorderSections: (activeId, overId) =>
    set((state) => {
      if (activeId === overId) return state;
      const sections = sortSections(state.template.sections);
      const activeIndex = sections.findIndex((section) => section.id === activeId);
      const overIndex = sections.findIndex((section) => section.id === overId);
      if (activeIndex < 0 || overIndex < 0) return state;
      const [active] = sections.splice(activeIndex, 1);
      sections.splice(overIndex, 0, active);
      return {
        template: { ...state.template, sections: normalizeOrder(sections) },
        dirty: true,
      };
    }),
  toggleSection: (sectionId) => {
    const section = get().template.sections.find((item) => item.id === sectionId);
    if (section) get().updateSection(sectionId, { enabled: !section.enabled });
  },
  addAsset: (asset) =>
    set((state) => ({
      template: { ...state.template, assets: [...(state.template.assets ?? []), asset] },
      dirty: true,
    })),
  setPreviewData: (previewData) => set({ previewData }),
  markSaved: (template) => set((state) => ({ template: template ?? state.template, dirty: false })),
}));
